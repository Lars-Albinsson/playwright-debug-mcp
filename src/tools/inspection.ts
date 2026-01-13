import { getPage } from '../browser.js';
import type { ToolResult } from '../types.js';

export interface GetDomParams {
  selector?: string;
  depth?: number;
}

export interface GetElementParams {
  selector: string;
}

export interface GetTextContentParams {
  selector: string;
}

export interface ScreenshotParams {
  selector?: string;
  fullPage?: boolean;
}

export interface EvaluateJsParams {
  code: string;
}

// DOM summarizer script to inject
const DOM_SUMMARIZER = `
(function summarizeDOM(root, depth, maxDepth) {
  if (!root || depth > maxDepth) return { truncated: true };

  // Skip script, style, and other non-visual elements
  const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH'];
  if (skipTags.includes(root.tagName)) return null;

  const node = {
    tag: root.tagName?.toLowerCase(),
  };

  // Add id if present
  if (root.id) node.id = root.id;

  // Add relevant classes (limit to avoid noise)
  if (root.className && typeof root.className === 'string') {
    const classes = root.className.trim().split(/\\s+/).slice(0, 5);
    if (classes.length && classes[0]) node.classes = classes;
  }

  // Add text content if it's a leaf node or has direct text
  const directText = Array.from(root.childNodes)
    .filter(n => n.nodeType === 3)
    .map(n => n.textContent?.trim())
    .filter(Boolean)
    .join(' ');
  if (directText) {
    node.text = directText.slice(0, 100) + (directText.length > 100 ? '...' : '');
  }

  // Add interesting attributes
  const interestingAttrs = ['href', 'src', 'data-testid', 'aria-label', 'role', 'type', 'name', 'placeholder', 'value', 'alt', 'title'];
  const attrs = {};
  for (const attr of interestingAttrs) {
    const val = root.getAttribute?.(attr);
    if (val) {
      attrs[attr] = val.slice(0, 100);
    }
  }
  if (Object.keys(attrs).length) node.attributes = attrs;

  // Add children
  const children = Array.from(root.children || [])
    .map(c => summarizeDOM(c, depth + 1, maxDepth))
    .filter(Boolean)
    .slice(0, 30); // Limit children to avoid huge outputs

  if (children.length) {
    node.children = children;
    node.childCount = root.children?.length;
  }

  return node;
})
`;

// Get summarized DOM tree
export async function getDom(params: GetDomParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();
    const depth = params.depth ?? 6;
    const selector = params.selector || 'body';

    const dom = await page.evaluate(
      ({ summarizer, selector, maxDepth }) => {
        const fn = new Function('root', 'depth', 'maxDepth', `return ${summarizer}(root, depth, maxDepth)`);
        const root = document.querySelector(selector);
        if (!root) return { error: `Element not found: ${selector}` };
        return fn(root, 0, maxDepth);
      },
      { summarizer: DOM_SUMMARIZER, selector, maxDepth: depth }
    );

    return {
      success: true,
      data: dom,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get detailed info about a specific element
export async function getElement(params: GetElementParams): Promise<ToolResult> {
  try {
    const page = await getPage();

    const element = await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      if (!el) return { error: `Element not found: ${selector}` };

      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);

      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        classes: el.className ? el.className.split(' ').filter(Boolean) : [],
        text: el.textContent?.slice(0, 500),
        innerHTML: el.innerHTML.slice(0, 1000),
        attributes: Object.fromEntries(
          Array.from(el.attributes).map((a) => [a.name, a.value])
        ),
        boundingBox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        computedStyle: {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position,
          zIndex: styles.zIndex,
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: styles.fontSize,
        },
        isVisible: rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden' && styles.display !== 'none',
      };
    }, params.selector);

    return {
      success: true,
      data: element,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get text content of elements matching selector
export async function getTextContent(params: GetTextContentParams): Promise<ToolResult> {
  try {
    const page = await getPage();

    const texts = await page.evaluate((selector) => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).map((el, i) => ({
        index: i,
        text: el.textContent?.trim().slice(0, 500),
        tag: el.tagName.toLowerCase(),
      }));
    }, params.selector);

    return {
      success: true,
      data: {
        count: texts.length,
        elements: texts,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Take a screenshot
export async function screenshot(params: ScreenshotParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();

    let buffer: Buffer;
    if (params.selector) {
      const element = page.locator(params.selector);
      buffer = await element.screenshot({ type: 'png' });
    } else {
      buffer = await page.screenshot({
        fullPage: params.fullPage ?? false,
        type: 'png',
      });
    }

    return {
      success: true,
      data: {
        type: 'image',
        mimeType: 'image/png',
        base64: buffer.toString('base64'),
        size: buffer.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Evaluate arbitrary JavaScript
export async function evaluateJs(params: EvaluateJsParams): Promise<ToolResult> {
  try {
    const page = await getPage();

    const result = await page.evaluate((code) => {
      try {
        // Use indirect eval to run in global scope
        const fn = new Function(code);
        return fn();
      } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
      }
    }, params.code);

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
