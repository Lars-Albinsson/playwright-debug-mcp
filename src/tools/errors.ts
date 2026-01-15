import { getPage } from '../browser.js';
import { getConsoleLogs } from '../state.js';
import type { ToolResult } from '../types.js';

// Advanced error detection tools for hydration errors, error boundaries, and memory leaks

// Error detection bridge script
const ERROR_BRIDGE = `
window.__ERROR_DEBUG__ = window.__ERROR_DEBUG__ || {
  hydrationErrors: [],
  boundaryErrors: []
};

// Detect hydration errors from console
window.__ERROR_DEBUG__.findHydrationErrors = function() {
  const hydrationPatterns = [
    /hydrat/i,
    /server.*client.*mismatch/i,
    /text content does not match/i,
    /did not match/i,
    /expected server html/i,
    /suspense boundary/i,
    /there was an error while hydrating/i,
    /minified react error #418/i,
    /minified react error #423/i,
    /minified react error #425/i
  ];

  const errors = [];

  // Check console for hydration errors
  if (window.__consoleLogs) {
    for (const log of window.__consoleLogs) {
      if (log.level === 'error' || log.level === 'warn') {
        for (const pattern of hydrationPatterns) {
          if (pattern.test(log.text)) {
            errors.push({
              type: 'console',
              level: log.level,
              message: log.text.substring(0, 500),
              timestamp: log.timestamp
            });
            break;
          }
        }
      }
    }
  }

  // Check for SSR markers that indicate potential issues
  const ssrMarkers = {
    hasDataReactRoot: !!document.querySelector('[data-reactroot]'),
    hasNextData: !!document.getElementById('__NEXT_DATA__'),
    hasNuxtData: !!window.__NUXT__,
    hasRemixContext: !!window.__remixContext
  };

  // Look for common hydration issue patterns in DOM
  const domIssues = [];

  // Check for duplicate IDs (common hydration issue)
  const allIds = document.querySelectorAll('[id]');
  const idMap = new Map();
  for (const el of allIds) {
    const id = el.id;
    if (idMap.has(id)) {
      domIssues.push({
        type: 'duplicate-id',
        id: id,
        count: (idMap.get(id) || 1) + 1
      });
    }
    idMap.set(id, (idMap.get(id) || 0) + 1);
  }

  // Check for browser-only elements that might cause hydration mismatch
  const browserOnlyElements = document.querySelectorAll('[data-client-only], [suppressHydrationWarning]');
  if (browserOnlyElements.length > 0) {
    domIssues.push({
      type: 'client-only-markers',
      count: browserOnlyElements.length,
      note: 'These elements have hydration suppression'
    });
  }

  return {
    errors,
    ssrMarkers,
    domIssues,
    isSSR: ssrMarkers.hasDataReactRoot || ssrMarkers.hasNextData || ssrMarkers.hasRemixContext,
    summary: errors.length > 0
      ? 'Found ' + errors.length + ' potential hydration error(s)'
      : 'No hydration errors detected in console'
  };
};

// Find error boundaries and their caught errors
window.__ERROR_DEBUG__.findErrorBoundaries = function() {
  const boundaries = [];

  const searchFiber = (fiber, path = []) => {
    if (!fiber) return;

    const name = getComponentName(fiber);

    // Check if this is an error boundary (has componentDidCatch or getDerivedStateFromError)
    if (fiber.type && typeof fiber.type !== 'string') {
      const isClassComponent = fiber.type.prototype &&
        (fiber.type.prototype.componentDidCatch || fiber.type.getDerivedStateFromError);

      // Also check for function component error boundaries (rare but possible with hooks)
      const hasErrorState = fiber.memoizedState && fiber.memoizedState.error !== undefined;

      if (isClassComponent || hasErrorState) {
        const boundaryInfo = {
          name: name || 'ErrorBoundary',
          path: path.join(' > '),
          hasError: false,
          error: null,
          errorInfo: null
        };

        // Check if boundary has caught an error
        if (fiber.memoizedState) {
          const state = fiber.memoizedState;
          if (state.error) {
            boundaryInfo.hasError = true;
            boundaryInfo.error = state.error.message || String(state.error);
            boundaryInfo.errorStack = state.error.stack?.substring(0, 500);
          }
          if (state.hasError) {
            boundaryInfo.hasError = true;
          }
        }

        boundaries.push(boundaryInfo);
      }
    }

    // Recurse
    let child = fiber.child;
    while (child) {
      searchFiber(child, [...path, name || 'anonymous']);
      child = child.sibling;
    }
  };

  // Find root and search
  const root = document.querySelector('#root, #app, #__next, [data-reactroot]');
  if (root) {
    const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$'));
    if (fiberKey) {
      let fiber = root[fiberKey];
      while (fiber.return) fiber = fiber.return;
      searchFiber(fiber);
    }
  }

  function getComponentName(fiber) {
    if (!fiber || !fiber.type) return null;
    if (typeof fiber.type === 'string') return null;
    return fiber.type.displayName || fiber.type.name || null;
  }

  return {
    boundaries,
    activeBoundaries: boundaries.filter(b => b.hasError),
    summary: boundaries.length === 0
      ? 'No error boundaries found in the component tree'
      : boundaries.filter(b => b.hasError).length + ' of ' + boundaries.length + ' error boundaries have caught errors'
  };
};

// Detect potential memory leaks
window.__ERROR_DEBUG__.detectMemoryLeaks = function() {
  const issues = [];

  // Check for detached DOM nodes (potential leak)
  const detachedNodes = [];
  if (window.performance && performance.memory) {
    issues.push({
      type: 'memory-info',
      usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    });
  }

  // Check for large number of event listeners
  const elementsWithManyListeners = [];
  const checkElement = (el) => {
    // This is an approximation - getEventListeners is only available in DevTools
    const listenerCount = el._listeners ? Object.keys(el._listeners).length : 0;
    if (listenerCount > 10) {
      elementsWithManyListeners.push({
        element: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : ''),
        listenerCount
      });
    }
  };

  // Check for timers/intervals that might not be cleaned up
  const timerInfo = {
    note: 'Cannot directly count active timers, but checking for common patterns'
  };

  // Check for large DOM
  const domSize = document.querySelectorAll('*').length;
  if (domSize > 1500) {
    issues.push({
      type: 'large-dom',
      nodeCount: domSize,
      warning: 'Large DOM can cause memory issues and slow performance',
      suggestion: 'Consider virtualization for long lists'
    });
  }

  // Check for multiple React roots (potential issue)
  const reactRoots = document.querySelectorAll('[data-reactroot], #root, #app, #__next');
  if (reactRoots.length > 1) {
    issues.push({
      type: 'multiple-react-roots',
      count: reactRoots.length,
      warning: 'Multiple React roots can lead to memory leaks if not properly managed'
    });
  }

  // Check for iframes that might hold references
  const iframes = document.querySelectorAll('iframe');
  if (iframes.length > 0) {
    issues.push({
      type: 'iframes',
      count: iframes.length,
      note: 'Iframes can hold memory if not properly cleaned up'
    });
  }

  // Check for WebSocket connections
  let wsCount = 0;
  try {
    // This is a heuristic - can't directly count WebSockets
    if (window.WebSocket) {
      issues.push({
        type: 'websocket-check',
        note: 'WebSockets should be closed when components unmount'
      });
    }
  } catch (e) {}

  // Check for global variables that look like they might be accumulating
  const suspiciousGlobals = [];
  for (const key of Object.keys(window)) {
    try {
      const value = window[key];
      if (Array.isArray(value) && value.length > 1000) {
        suspiciousGlobals.push({
          name: key,
          type: 'array',
          size: value.length
        });
      }
      if (value instanceof Map && value.size > 1000) {
        suspiciousGlobals.push({
          name: key,
          type: 'map',
          size: value.size
        });
      }
      if (value instanceof Set && value.size > 1000) {
        suspiciousGlobals.push({
          name: key,
          type: 'set',
          size: value.size
        });
      }
    } catch (e) {}
  }

  if (suspiciousGlobals.length > 0) {
    issues.push({
      type: 'large-globals',
      items: suspiciousGlobals,
      warning: 'Large global collections may indicate a memory leak'
    });
  }

  // Check console for out-of-memory warnings
  const oomWarnings = [];
  if (window.__consoleLogs) {
    for (const log of window.__consoleLogs) {
      if (log.text && (
        log.text.includes('out of memory') ||
        log.text.includes('allocation failed') ||
        log.text.includes('heap') ||
        log.text.includes('memory')
      )) {
        oomWarnings.push(log.text.substring(0, 200));
      }
    }
  }

  if (oomWarnings.length > 0) {
    issues.push({
      type: 'memory-warnings',
      warnings: oomWarnings
    });
  }

  return {
    issues,
    summary: issues.length === 0
      ? 'No obvious memory leak indicators found'
      : 'Found ' + issues.length + ' potential memory-related issues',
    suggestions: [
      'Use React DevTools Profiler to identify components that re-render frequently',
      'Check for useEffect cleanup functions',
      'Ensure event listeners are removed on unmount',
      'Consider using WeakMap/WeakSet for caching'
    ]
  };
};
`;

// Ensure error bridge is injected
async function ensureErrorBridge(page: Awaited<ReturnType<typeof getPage>>): Promise<void> {
  const hasErrorBridge = await page.evaluate(() => !!window.__ERROR_DEBUG__?.findHydrationErrors);
  if (!hasErrorBridge) {
    await page.evaluate(ERROR_BRIDGE);

    // Also inject console logs reference
    const logs = getConsoleLogs();
    await page.evaluate((logs) => {
      window.__consoleLogs = logs;
    }, logs);
  }
}

// Find hydration errors
export async function findHydrationErrors(): Promise<ToolResult> {
  try {
    const page = await getPage();

    // Update console logs in page context
    const logs = getConsoleLogs();
    await page.evaluate((logs) => {
      window.__consoleLogs = logs;
    }, logs);

    await ensureErrorBridge(page);

    const result = await page.evaluate(() => {
      return window.__ERROR_DEBUG__.findHydrationErrors();
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Find error boundaries
export async function getErrorBoundaries(): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensureErrorBridge(page);

    const result = await page.evaluate(() => {
      return window.__ERROR_DEBUG__.findErrorBoundaries();
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Detect memory leaks
export async function detectMemoryLeaks(): Promise<ToolResult> {
  try {
    const page = await getPage();

    // Update console logs in page context
    const logs = getConsoleLogs();
    await page.evaluate((logs) => {
      window.__consoleLogs = logs;
    }, logs);

    await ensureErrorBridge(page);

    const result = await page.evaluate(() => {
      return window.__ERROR_DEBUG__.detectMemoryLeaks();
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Declare global types
declare global {
  interface Window {
    __consoleLogs?: Array<{ level: string; text: string; timestamp: string }>;
    __ERROR_DEBUG__: {
      hydrationErrors: unknown[];
      boundaryErrors: unknown[];
      findHydrationErrors: () => {
        errors: Array<{
          type: string;
          level: string;
          message: string;
          timestamp: string;
        }>;
        ssrMarkers: {
          hasDataReactRoot: boolean;
          hasNextData: boolean;
          hasNuxtData: boolean;
          hasRemixContext: boolean;
        };
        domIssues: Array<{
          type: string;
          id?: string;
          count?: number;
          note?: string;
        }>;
        isSSR: boolean;
        summary: string;
      };
      findErrorBoundaries: () => {
        boundaries: Array<{
          name: string;
          path: string;
          hasError: boolean;
          error: string | null;
          errorInfo: string | null;
          errorStack?: string;
        }>;
        activeBoundaries: Array<unknown>;
        summary: string;
      };
      detectMemoryLeaks: () => {
        issues: Array<{
          type: string;
          [key: string]: unknown;
        }>;
        summary: string;
        suggestions: string[];
      };
    };
    __NUXT__?: unknown;
    __remixContext?: unknown;
  }
}
