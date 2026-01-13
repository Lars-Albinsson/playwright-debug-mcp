import { state } from '../state.js';
import type { ToolResult } from '../types.js';

export interface GetNetworkParams {
  filter?: string;
  method?: string;
  status?: 'success' | 'error' | 'all';
  last?: number;
}

export interface GetRequestDetailParams {
  id?: string;
  url?: string;
}

// Get network logs
export async function getNetwork(params: GetNetworkParams = {}): Promise<ToolResult> {
  try {
    let logs = state.networkLogs;

    // Filter by URL pattern
    if (params.filter) {
      const filterLower = params.filter.toLowerCase();
      logs = logs.filter((log) => log.url.toLowerCase().includes(filterLower));
    }

    // Filter by method
    if (params.method) {
      const methodUpper = params.method.toUpperCase();
      logs = logs.filter((log) => log.method === methodUpper);
    }

    // Filter by status
    if (params.status === 'success') {
      logs = logs.filter((log) => log.status && log.status >= 200 && log.status < 400);
    } else if (params.status === 'error') {
      logs = logs.filter((log) => !log.status || log.status >= 400);
    }

    // Limit to last N entries
    if (params.last) {
      logs = logs.slice(-params.last);
    }

    // Format for readability - summarize
    const formatted = logs.map((log) => ({
      id: log.id,
      method: log.method,
      url: log.url.length > 150 ? log.url.slice(0, 150) + '...' : log.url,
      status: log.status || 'failed',
      failureReason: log.failureReason,
      contentType: log.contentType,
      hasRequestBody: !!log.requestBody,
      hasResponseBody: !!log.responseBody,
      duration: log.timing
        ? Math.round(log.timing.responseEnd - log.timing.requestStart) + 'ms'
        : undefined,
      timestamp: new Date(log.timestamp).toISOString(),
    }));

    return {
      success: true,
      data: {
        count: formatted.length,
        total: state.networkLogs.length,
        requests: formatted,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get detailed request/response for a specific request
export async function getRequestDetail(params: GetRequestDetailParams): Promise<ToolResult> {
  try {
    // Find the request in our logs
    let networkEntry;
    if (params.id) {
      networkEntry = state.networkLogs.find((log) => log.id === params.id);
    } else if (params.url) {
      // Find most recent request matching URL
      const matches = state.networkLogs.filter((log) =>
        log.url.includes(params.url!)
      );
      networkEntry = matches[matches.length - 1];
    }

    if (!networkEntry) {
      return {
        success: false,
        error: 'Request not found. Use get_network to list available requests.',
      };
    }

    // Parse JSON response body for readability
    let parsedResponseBody = networkEntry.responseBody;
    if (parsedResponseBody && networkEntry.contentType?.includes('application/json')) {
      try {
        parsedResponseBody = JSON.stringify(JSON.parse(parsedResponseBody), null, 2);
      } catch {
        // Keep original if not valid JSON
      }
    }

    // Parse JSON request body for readability
    let parsedRequestBody = networkEntry.requestBody;
    if (parsedRequestBody) {
      try {
        parsedRequestBody = JSON.stringify(JSON.parse(parsedRequestBody), null, 2);
      } catch {
        // Keep original if not valid JSON
      }
    }

    return {
      success: true,
      data: {
        id: networkEntry.id,
        method: networkEntry.method,
        url: networkEntry.url,
        status: networkEntry.status || 'failed',
        failureReason: networkEntry.failureReason,
        contentType: networkEntry.contentType,
        timing: networkEntry.timing
          ? {
              total: Math.round(networkEntry.timing.responseEnd - networkEntry.timing.requestStart) + 'ms',
              dns: Math.round(networkEntry.timing.domainLookupEnd - networkEntry.timing.domainLookupStart) + 'ms',
              connect: Math.round(networkEntry.timing.connectEnd - networkEntry.timing.connectStart) + 'ms',
              ttfb: Math.round(networkEntry.timing.responseStart - networkEntry.timing.requestStart) + 'ms',
            }
          : undefined,
        requestHeaders: networkEntry.requestHeaders,
        responseHeaders: networkEntry.responseHeaders,
        requestBody: parsedRequestBody,
        responseBody: parsedResponseBody,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Clear network logs
export async function clearNetwork(): Promise<ToolResult> {
  try {
    state.clearNetworkLogs();
    return {
      success: true,
      data: { cleared: true },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
