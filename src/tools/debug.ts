import { getPage } from '../browser.js';
import { state } from '../state.js';
import type { ToolResult } from '../types.js';

export interface ExplainErrorParams {
  index?: number;
  search?: string;
}

// Get comprehensive error context for debugging
export async function explainError(params: ExplainErrorParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();

    // Find the error
    const errors = state.consoleLogs.filter((log) => log.level === 'error');

    let error;
    if (params.search) {
      error = errors.find((e) => e.text.toLowerCase().includes(params.search!.toLowerCase()));
    } else {
      const index = params.index ?? errors.length - 1; // Default to most recent
      error = errors[index];
    }

    if (!error) {
      return {
        success: false,
        error: 'No error found. Check get_console for available errors.',
      };
    }

    // Get recent network requests around the error time
    const errorTime = error.timestamp;
    const recentNetwork = state.networkLogs
      .filter((req) => Math.abs(req.timestamp - errorTime) < 5000) // Within 5 seconds
      .map((req) => ({
        method: req.method,
        url: req.url.slice(0, 100),
        status: req.status,
        timestamp: new Date(req.timestamp).toISOString(),
      }));

    // Get failed network requests
    const failedRequests = state.networkLogs
      .filter((req) => !req.status || req.status >= 400)
      .slice(-5)
      .map((req) => ({
        method: req.method,
        url: req.url.slice(0, 100),
        status: req.status || 'failed',
      }));

    // Try to get React component tree (simplified)
    let reactContext = null;
    try {
      const hasReact = await page.evaluate(() => !!window.__REACT_DEBUG__);
      if (hasReact) {
        reactContext = await page.evaluate(() => {
          try {
            const tree = window.__REACT_DEBUG__.getTree(3);
            return tree.success ? tree.tree : null;
          } catch {
            return null;
          }
        });
      }
    } catch {
      // React debug not available
    }

    // Get current page state
    const pageState = {
      url: page.url(),
      title: await page.title(),
    };

    // Parse error for common patterns
    const analysis = analyzeError(error.text);

    return {
      success: true,
      data: {
        error: {
          message: error.text,
          location: error.location,
          timestamp: new Date(error.timestamp).toISOString(),
        },
        analysis,
        context: {
          page: pageState,
          recentNetworkRequests: recentNetwork,
          failedNetworkRequests: failedRequests,
          reactTree: reactContext,
        },
        suggestions: generateSuggestions(error.text, failedRequests),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Analyze error text for common patterns
function analyzeError(errorText: string): Record<string, unknown> {
  const analysis: Record<string, unknown> = {};

  // Check for common error types
  if (errorText.includes('TypeError')) {
    analysis.type = 'TypeError';
    analysis.category = 'Runtime error - likely null/undefined access';
  } else if (errorText.includes('ReferenceError')) {
    analysis.type = 'ReferenceError';
    analysis.category = 'Variable or function not defined';
  } else if (errorText.includes('SyntaxError')) {
    analysis.type = 'SyntaxError';
    analysis.category = 'Code syntax issue';
  } else if (errorText.includes('NetworkError') || errorText.includes('Failed to fetch')) {
    analysis.type = 'NetworkError';
    analysis.category = 'Network request failed - check CORS or endpoint';
  } else if (errorText.includes('CORS')) {
    analysis.type = 'CORSError';
    analysis.category = 'Cross-Origin Resource Sharing blocked';
  } else if (errorText.includes('ChunkLoadError')) {
    analysis.type = 'ChunkLoadError';
    analysis.category = 'Failed to load code chunk - possible deployment issue';
  }

  // Check for React-specific errors
  if (errorText.includes('React')) {
    analysis.framework = 'React';

    if (errorText.includes('Invalid hook call')) {
      analysis.reactError = 'hooks-violation';
      analysis.hint = 'Hooks must be called inside function components, not conditionally';
    } else if (errorText.includes('Cannot update a component')) {
      analysis.reactError = 'state-update-during-render';
      analysis.hint = 'Component is updating state during render - use useEffect';
    } else if (errorText.includes('Maximum update depth exceeded')) {
      analysis.reactError = 'infinite-loop';
      analysis.hint = 'Infinite re-render loop detected - check useEffect dependencies';
    } else if (errorText.includes('Each child in a list')) {
      analysis.reactError = 'missing-key';
      analysis.hint = 'Add unique key prop to list items';
    }
  }

  // Check for Lambda/API patterns
  if (errorText.includes('502') || errorText.includes('503') || errorText.includes('504')) {
    analysis.serverError = true;
    analysis.hint = 'Server/Lambda error - check CloudWatch logs';
  }

  if (errorText.includes('401') || errorText.includes('403')) {
    analysis.authError = true;
    analysis.hint = 'Authentication/Authorization issue - check tokens';
  }

  return analysis;
}

// Generate debugging suggestions
function generateSuggestions(
  errorText: string,
  failedRequests: Array<{ method: string; url: string; status: string | number }>
): string[] {
  const suggestions: string[] = [];

  // Network-related suggestions
  if (failedRequests.length > 0) {
    suggestions.push('Check the failed network requests - they may have caused this error');

    const corsFailure = failedRequests.some((r) => r.status === 0 || r.status === 'failed');
    if (corsFailure) {
      suggestions.push('Request failed with no status - likely CORS issue. Check API Gateway CORS settings.');
    }

    const serverError = failedRequests.some((r) => typeof r.status === 'number' && r.status >= 500);
    if (serverError) {
      suggestions.push('Server returned 5xx error - check Lambda logs in CloudWatch');
    }
  }

  // Error-specific suggestions
  if (errorText.includes('undefined') || errorText.includes('null')) {
    suggestions.push('Add null checks or optional chaining (?.) to handle missing data');
  }

  if (errorText.includes('fetch') || errorText.includes('network')) {
    suggestions.push('Use get_network tool to inspect the failing request details');
  }

  if (errorText.includes('React')) {
    suggestions.push('Use get_react_tree to inspect component state at time of error');
  }

  if (suggestions.length === 0) {
    suggestions.push('Use evaluate_js to inspect application state');
    suggestions.push('Take a screenshot to see the current UI state');
  }

  return suggestions;
}

// Get a summary of the current debugging state
export async function getDebugSummary(): Promise<ToolResult> {
  try {
    const page = await getPage();

    const errorCount = state.consoleLogs.filter((l) => l.level === 'error').length;
    const warnCount = state.consoleLogs.filter((l) => l.level === 'warn').length;
    const failedNetworkCount = state.networkLogs.filter(
      (r) => !r.status || r.status >= 400
    ).length;

    return {
      success: true,
      data: {
        page: {
          url: page.url(),
          title: await page.title(),
        },
        console: {
          total: state.consoleLogs.length,
          errors: errorCount,
          warnings: warnCount,
        },
        network: {
          total: state.networkLogs.length,
          failed: failedNetworkCount,
        },
        recentErrors: state.consoleLogs
          .filter((l) => l.level === 'error')
          .slice(-3)
          .map((e) => e.text.slice(0, 100)),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
