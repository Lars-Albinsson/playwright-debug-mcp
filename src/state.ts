import type { Browser, Page, BrowserContext } from 'playwright';
import type { AppState, ConsoleEntry, NetworkEntry } from './types.js';

// Configuration from environment
const MAX_CONSOLE_ENTRIES = parseInt(process.env.MAX_CONSOLE_ENTRIES || '200', 10);
const MAX_NETWORK_ENTRIES = parseInt(process.env.MAX_NETWORK_ENTRIES || '100', 10);

// Circular buffer implementation
class CircularBuffer<T> {
  private buffer: T[] = [];
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  push(item: T): void {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(item);
  }

  getAll(): T[] {
    return [...this.buffer];
  }

  getLast(n: number): T[] {
    return this.buffer.slice(-n);
  }

  clear(): void {
    this.buffer = [];
  }

  get length(): number {
    return this.buffer.length;
  }
}

// Shared application state
class State implements AppState {
  browser: Browser | null = null;
  context: BrowserContext | null = null;
  page: Page | null = null;

  private _consoleLogs = new CircularBuffer<ConsoleEntry>(MAX_CONSOLE_ENTRIES);
  private _networkLogs = new CircularBuffer<NetworkEntry>(MAX_NETWORK_ENTRIES);

  get consoleLogs(): ConsoleEntry[] {
    return this._consoleLogs.getAll();
  }

  get networkLogs(): NetworkEntry[] {
    return this._networkLogs.getAll();
  }

  addConsoleLog(entry: ConsoleEntry): void {
    this._consoleLogs.push(entry);
  }

  addNetworkLog(entry: NetworkEntry): void {
    this._networkLogs.push(entry);
  }

  getRecentConsoleLogs(n: number): ConsoleEntry[] {
    return this._consoleLogs.getLast(n);
  }

  getRecentNetworkLogs(n: number): NetworkEntry[] {
    return this._networkLogs.getLast(n);
  }

  clearConsoleLogs(): void {
    this._consoleLogs.clear();
  }

  clearNetworkLogs(): void {
    this._networkLogs.clear();
  }

  reset(): void {
    this.browser = null;
    this.context = null;
    this.page = null;
    this._consoleLogs.clear();
    this._networkLogs.clear();
  }
}

// Singleton instance
export const state = new State();

// Helper function to get console logs for injection into page context
export function getConsoleLogs(): Array<{ level: string; text: string; timestamp: string }> {
  return state.consoleLogs.map(entry => ({
    level: entry.level,
    text: entry.text,
    timestamp: new Date(entry.timestamp).toISOString(),
  }));
}
