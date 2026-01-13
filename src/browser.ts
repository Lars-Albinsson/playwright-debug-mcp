import { chromium, type Page, type Request } from 'playwright';
import { state } from './state.js';
import type { ConsoleEntry, NetworkEntry } from './types.js';

// Configuration
const BROWSER_HEADLESS = process.env.BROWSER_HEADLESS === 'true';
const CAPTURE_BODY_TYPES = ['application/json', 'text/plain', 'text/html', 'application/x-www-form-urlencoded'];
const MAX_BODY_SIZE = 50000; // 50KB max for request/response bodies

let networkIdCounter = 0;
function generateNetworkId(): string {
  return `req_${++networkIdCounter}`;
}

// Check if we should capture the body based on content type
function shouldCaptureBody(contentType?: string): boolean {
  if (!contentType) return false;
  return CAPTURE_BODY_TYPES.some(type => contentType.includes(type));
}

// Safely get request post data
function getRequestBody(request: Request): string | undefined {
  try {
    const postData = request.postData();
    if (postData && postData.length <= MAX_BODY_SIZE) {
      return postData;
    } else if (postData) {
      return `[Body too large: ${postData.length} bytes]`;
    }
  } catch {
    // Ignore errors getting post data
  }
  return undefined;
}

// Attach event listeners to capture console and network
function attachPageListeners(page: Page): void {
  // Console capture
  page.on('console', (msg) => {
    const entry: ConsoleEntry = {
      level: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: Date.now(),
    };
    state.addConsoleLog(entry);
  });

  // Page errors
  page.on('pageerror', (error) => {
    const entry: ConsoleEntry = {
      level: 'error',
      text: `${error.name}: ${error.message}\n${error.stack || ''}`,
      timestamp: Date.now(),
    };
    state.addConsoleLog(entry);
  });

  // Network request finished
  page.on('requestfinished', async (request) => {
    try {
      const response = await request.response();
      const contentType = response?.headers()['content-type'];

      // Build the entry
      const entry: NetworkEntry = {
        id: generateNetworkId(),
        method: request.method(),
        url: request.url(),
        status: response?.status(),
        contentType,
        timing: request.timing(),
        requestHeaders: request.headers(),
        responseHeaders: response?.headers(),
        requestBody: getRequestBody(request),
        timestamp: Date.now(),
      };

      // Capture response body for API requests (JSON, text)
      if (response && shouldCaptureBody(contentType)) {
        try {
          const body = await response.text();
          if (body.length <= MAX_BODY_SIZE) {
            entry.responseBody = body;
          } else {
            entry.responseBody = `[Body too large: ${body.length} bytes]`;
          }
        } catch {
          // Body might not be available
        }
      }

      state.addNetworkLog(entry);
    } catch {
      // Request may have been aborted
    }
  });

  // Network request failed
  page.on('requestfailed', (request) => {
    const failure = request.failure();
    const entry: NetworkEntry = {
      id: generateNetworkId(),
      method: request.method(),
      url: request.url(),
      status: 0,
      requestHeaders: request.headers(),
      requestBody: getRequestBody(request),
      failureReason: failure?.errorText || 'Unknown failure',
      timestamp: Date.now(),
    };
    state.addNetworkLog(entry);
  });
}

// Launch browser and create initial page
export async function launchBrowser(): Promise<void> {
  if (state.browser) {
    return; // Already launched
  }

  state.browser = await chromium.launch({
    headless: BROWSER_HEADLESS,
  });

  state.context = await state.browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  state.page = await state.context.newPage();
  attachPageListeners(state.page);
}

// Get the current page, launching browser if needed
export async function getPage(): Promise<Page> {
  if (!state.page) {
    await launchBrowser();
  }
  return state.page!;
}

// Create a new page in the current context
export async function newPage(): Promise<Page> {
  if (!state.context) {
    await launchBrowser();
  }
  const page = await state.context!.newPage();
  attachPageListeners(page);
  state.page = page;
  return page;
}

// Close the browser
export async function closeBrowser(): Promise<void> {
  if (state.browser) {
    await state.browser.close();
    state.reset();
  }
}

// Graceful shutdown
export async function shutdown(): Promise<void> {
  await closeBrowser();
}
