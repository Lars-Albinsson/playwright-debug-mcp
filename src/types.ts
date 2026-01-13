import type { Browser, Page, BrowserContext } from 'playwright';

// Console log entry captured from page
export interface ConsoleEntry {
  level: string;
  text: string;
  location?: {
    url?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
  timestamp: number;
}

// Network request entry
export interface NetworkEntry {
  id: string;
  method: string;
  url: string;
  status?: number;
  contentType?: string;
  timing?: {
    startTime: number;
    domainLookupStart: number;
    domainLookupEnd: number;
    connectStart: number;
    connectEnd: number;
    requestStart: number;
    responseStart: number;
    responseEnd: number;
  };
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  timestamp: number;
  failureReason?: string;
}

// Application state
export interface AppState {
  browser: Browser | null;
  context: BrowserContext | null;
  page: Page | null;
  consoleLogs: ConsoleEntry[];
  networkLogs: NetworkEntry[];
}

// Tool result types
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Navigation tool parameters
export interface NavigateParams {
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

export interface ClickParams {
  selector: string;
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  timeout?: number;
}

export interface FillParams {
  selector: string;
  value: string;
  timeout?: number;
}

export interface SelectParams {
  selector: string;
  value: string | string[];
  timeout?: number;
}

export interface ScrollParams {
  selector?: string;
  x?: number;
  y?: number;
}

export interface WaitForParams {
  selector?: string;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
  timeout?: number;
  url?: string;
}

export interface HoverParams {
  selector: string;
  timeout?: number;
}

export interface TypeParams {
  selector: string;
  text: string;
  delay?: number;
  timeout?: number;
}
