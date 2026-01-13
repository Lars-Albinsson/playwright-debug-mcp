import { state } from '../state.js';
import type { ToolResult } from '../types.js';

export interface GetConsoleParams {
  level?: 'log' | 'info' | 'warn' | 'error' | 'debug';
  last?: number;
  search?: string;
}

// Get console logs
export async function getConsole(params: GetConsoleParams = {}): Promise<ToolResult> {
  try {
    let logs = state.consoleLogs;

    // Filter by level
    if (params.level) {
      logs = logs.filter((log) => log.level === params.level);
    }

    // Filter by search term
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      logs = logs.filter((log) => log.text.toLowerCase().includes(searchLower));
    }

    // Limit to last N entries
    if (params.last) {
      logs = logs.slice(-params.last);
    }

    // Format for readability
    const formatted = logs.map((log) => ({
      level: log.level,
      text: log.text.length > 1000 ? log.text.slice(0, 1000) + '...' : log.text,
      location: log.location?.url
        ? `${log.location.url}:${log.location.lineNumber}:${log.location.columnNumber}`
        : undefined,
      timestamp: new Date(log.timestamp).toISOString(),
    }));

    return {
      success: true,
      data: {
        count: formatted.length,
        total: state.consoleLogs.length,
        logs: formatted,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Clear console logs
export async function clearConsole(): Promise<ToolResult> {
  try {
    state.clearConsoleLogs();
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
