import { getPage } from '../browser.js';
import type {
  NavigateParams,
  ClickParams,
  FillParams,
  SelectParams,
  ScrollParams,
  WaitForParams,
  HoverParams,
  TypeParams,
  ToolResult,
} from '../types.js';

// Navigate to a URL
export async function navigate(params: NavigateParams): Promise<ToolResult> {
  try {
    const page = await getPage();
    const response = await page.goto(params.url, {
      waitUntil: params.waitUntil || 'load',
    });

    return {
      success: true,
      data: {
        url: page.url(),
        title: await page.title(),
        status: response?.status(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Click on an element
export async function click(params: ClickParams): Promise<ToolResult> {
  try {
    const page = await getPage();
    await page.click(params.selector, {
      button: params.button || 'left',
      clickCount: params.clickCount || 1,
      timeout: params.timeout || 30000,
    });

    return {
      success: true,
      data: {
        selector: params.selector,
        clicked: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Fill a form field
export async function fill(params: FillParams): Promise<ToolResult> {
  try {
    const page = await getPage();
    await page.fill(params.selector, params.value, {
      timeout: params.timeout || 30000,
    });

    return {
      success: true,
      data: {
        selector: params.selector,
        value: params.value,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Select from a dropdown
export async function select(params: SelectParams): Promise<ToolResult> {
  try {
    const page = await getPage();
    const values = Array.isArray(params.value) ? params.value : [params.value];
    const selected = await page.selectOption(params.selector, values, {
      timeout: params.timeout || 30000,
    });

    return {
      success: true,
      data: {
        selector: params.selector,
        selected,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Scroll the page or an element
export async function scroll(params: ScrollParams): Promise<ToolResult> {
  try {
    const page = await getPage();

    if (params.selector) {
      // Scroll element into view
      await page.locator(params.selector).scrollIntoViewIfNeeded();
    } else {
      // Scroll page by coordinates
      await page.evaluate(({ x, y }) => {
        window.scrollBy(x || 0, y || 0);
      }, { x: params.x, y: params.y });
    }

    return {
      success: true,
      data: {
        scrolled: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Wait for a condition
export async function waitFor(params: WaitForParams): Promise<ToolResult> {
  try {
    const page = await getPage();
    const timeout = params.timeout || 30000;

    if (params.url) {
      // Wait for URL
      await page.waitForURL(params.url, { timeout });
      return {
        success: true,
        data: {
          url: page.url(),
        },
      };
    }

    if (params.selector) {
      // Wait for element
      await page.waitForSelector(params.selector, {
        state: params.state || 'visible',
        timeout,
      });
      return {
        success: true,
        data: {
          selector: params.selector,
          state: params.state || 'visible',
        },
      };
    }

    return {
      success: false,
      error: 'Must provide either selector or url parameter',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Hover over an element
export async function hover(params: HoverParams): Promise<ToolResult> {
  try {
    const page = await getPage();
    await page.hover(params.selector, {
      timeout: params.timeout || 30000,
    });

    return {
      success: true,
      data: {
        selector: params.selector,
        hovered: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Type text (with optional delay between keystrokes)
export async function type(params: TypeParams): Promise<ToolResult> {
  try {
    const page = await getPage();
    await page.locator(params.selector).pressSequentially(params.text, {
      delay: params.delay || 0,
      timeout: params.timeout || 30000,
    });

    return {
      success: true,
      data: {
        selector: params.selector,
        text: params.text,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Go back in history
export async function goBack(): Promise<ToolResult> {
  try {
    const page = await getPage();
    await page.goBack();

    return {
      success: true,
      data: {
        url: page.url(),
        title: await page.title(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Go forward in history
export async function goForward(): Promise<ToolResult> {
  try {
    const page = await getPage();
    await page.goForward();

    return {
      success: true,
      data: {
        url: page.url(),
        title: await page.title(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Reload the page
export async function reload(): Promise<ToolResult> {
  try {
    const page = await getPage();
    await page.reload();

    return {
      success: true,
      data: {
        url: page.url(),
        title: await page.title(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
