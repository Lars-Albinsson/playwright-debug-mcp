import { getPage } from '../browser.js';
import type { ToolResult } from '../types.js';

// Accessibility tools for auditing and ARIA tree inspection

export interface AuditAccessibilityParams {
  selector?: string;
  includeWarnings?: boolean;
  rules?: string[];
}

export interface GetAriaTreeParams {
  selector?: string;
  maxDepth?: number;
}

// Lightweight accessibility audit (without axe-core dependency)
const A11Y_AUDIT_BRIDGE = `
window.__A11Y_DEBUG__ = window.__A11Y_DEBUG__ || {};

window.__A11Y_DEBUG__.audit = function(rootSelector, includeWarnings = true) {
  const root = rootSelector ? document.querySelector(rootSelector) : document.body;
  if (!root) return { error: 'Root element not found' };

  const issues = [];
  const warnings = [];
  const passes = [];

  // Check images for alt text
  const images = root.querySelectorAll('img');
  for (const img of images) {
    if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-labelledby')) {
      if (img.getAttribute('role') !== 'presentation' && img.getAttribute('aria-hidden') !== 'true') {
        issues.push({
          type: 'missing-alt',
          severity: 'critical',
          element: describeElement(img),
          message: 'Image missing alternative text',
          fix: 'Add alt attribute or aria-label'
        });
      }
    }
  }

  // Check form inputs for labels
  const inputs = root.querySelectorAll('input, select, textarea');
  for (const input of inputs) {
    if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') continue;

    const hasLabel = input.id && document.querySelector('label[for="' + input.id + '"]');
    const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
    const hasTitle = input.getAttribute('title');
    const hasPlaceholder = input.getAttribute('placeholder');

    if (!hasLabel && !hasAriaLabel && !hasTitle) {
      issues.push({
        type: 'missing-label',
        severity: 'critical',
        element: describeElement(input),
        message: 'Form input missing accessible label',
        fix: 'Add <label> element with for attribute, or aria-label'
      });
    } else if (hasPlaceholder && !hasLabel && !hasAriaLabel) {
      warnings.push({
        type: 'placeholder-only-label',
        severity: 'warning',
        element: describeElement(input),
        message: 'Input relies only on placeholder for labeling',
        fix: 'Placeholders disappear on input; add a persistent label'
      });
    }
  }

  // Check buttons for accessible names
  const buttons = root.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
  for (const button of buttons) {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute('aria-label') || button.getAttribute('aria-labelledby');
    const hasTitle = button.getAttribute('title');
    const hasValue = button.getAttribute('value');

    if (!hasText && !hasAriaLabel && !hasTitle && !hasValue) {
      issues.push({
        type: 'missing-button-label',
        severity: 'critical',
        element: describeElement(button),
        message: 'Button has no accessible name',
        fix: 'Add text content, aria-label, or title'
      });
    }
  }

  // Check links for accessible names
  const links = root.querySelectorAll('a[href]');
  for (const link of links) {
    const hasText = link.textContent?.trim();
    const hasAriaLabel = link.getAttribute('aria-label') || link.getAttribute('aria-labelledby');
    const hasTitle = link.getAttribute('title');
    const hasImage = link.querySelector('img[alt]');

    if (!hasText && !hasAriaLabel && !hasTitle && !hasImage) {
      issues.push({
        type: 'missing-link-text',
        severity: 'critical',
        element: describeElement(link),
        message: 'Link has no accessible name',
        fix: 'Add link text or aria-label'
      });
    }

    // Check for generic link text
    const genericTexts = ['click here', 'read more', 'learn more', 'here', 'more'];
    if (hasText && genericTexts.includes(hasText.toLowerCase())) {
      warnings.push({
        type: 'generic-link-text',
        severity: 'warning',
        element: describeElement(link),
        message: 'Link text "' + hasText + '" is not descriptive',
        fix: 'Use descriptive text that explains the link destination'
      });
    }
  }

  // Check for heading structure
  const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  let h1Count = 0;
  for (const heading of headings) {
    const level = parseInt(heading.tagName[1]);
    if (level === 1) h1Count++;
    if (level > lastLevel + 1 && lastLevel > 0) {
      warnings.push({
        type: 'skipped-heading-level',
        severity: 'warning',
        element: describeElement(heading),
        message: 'Heading level skipped from h' + lastLevel + ' to h' + level,
        fix: 'Use sequential heading levels for proper document structure'
      });
    }
    lastLevel = level;
  }

  if (h1Count === 0) {
    warnings.push({
      type: 'missing-h1',
      severity: 'warning',
      element: 'document',
      message: 'Page has no h1 heading',
      fix: 'Add an h1 heading that describes the page content'
    });
  } else if (h1Count > 1) {
    warnings.push({
      type: 'multiple-h1',
      severity: 'warning',
      element: 'document',
      message: 'Page has ' + h1Count + ' h1 headings',
      fix: 'Use only one h1 per page for main content title'
    });
  }

  // Check for color contrast issues (basic)
  const textElements = root.querySelectorAll('p, span, div, a, button, label, h1, h2, h3, h4, h5, h6');
  let lowContrastCount = 0;
  for (const el of Array.from(textElements).slice(0, 50)) {
    const style = window.getComputedStyle(el);
    const color = style.color;
    const bg = style.backgroundColor;

    if (color && bg && bg !== 'rgba(0, 0, 0, 0)') {
      const contrast = getContrastRatio(color, bg);
      if (contrast < 4.5 && contrast > 0) {
        lowContrastCount++;
      }
    }
  }

  if (lowContrastCount > 5) {
    warnings.push({
      type: 'low-contrast',
      severity: 'warning',
      element: 'multiple elements',
      message: lowContrastCount + ' elements may have insufficient color contrast',
      fix: 'Ensure text has at least 4.5:1 contrast ratio (3:1 for large text)'
    });
  }

  // Check for keyboard accessibility
  const focusableElements = root.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const nonFocusableInteractives = root.querySelectorAll(
    '[onclick]:not(a):not(button):not([tabindex]), [role="button"]:not([tabindex])'
  );

  for (const el of nonFocusableInteractives) {
    if (!el.getAttribute('tabindex')) {
      issues.push({
        type: 'non-focusable-interactive',
        severity: 'serious',
        element: describeElement(el),
        message: 'Interactive element is not keyboard accessible',
        fix: 'Add tabindex="0" and keyboard event handlers'
      });
    }
  }

  // Check ARIA usage
  const ariaElements = root.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]');
  for (const el of ariaElements) {
    const role = el.getAttribute('role');
    const labelledby = el.getAttribute('aria-labelledby');
    const describedby = el.getAttribute('aria-describedby');

    // Check if referenced elements exist
    if (labelledby) {
      const referenced = document.getElementById(labelledby);
      if (!referenced) {
        issues.push({
          type: 'invalid-aria-reference',
          severity: 'serious',
          element: describeElement(el),
          message: 'aria-labelledby references non-existent ID: ' + labelledby,
          fix: 'Ensure the referenced element exists'
        });
      }
    }

    if (describedby) {
      const referenced = document.getElementById(describedby);
      if (!referenced) {
        issues.push({
          type: 'invalid-aria-reference',
          severity: 'serious',
          element: describeElement(el),
          message: 'aria-describedby references non-existent ID: ' + describedby,
          fix: 'Ensure the referenced element exists'
        });
      }
    }
  }

  // Check for skip links
  const skipLink = root.querySelector('a[href^="#"]:first-child, [role="navigation"] a[href^="#"]:first-child');
  if (!skipLink) {
    warnings.push({
      type: 'missing-skip-link',
      severity: 'warning',
      element: 'document',
      message: 'No skip navigation link found',
      fix: 'Add a skip link at the beginning of the page to bypass repetitive content'
    });
  }

  // Check for landmarks
  const hasMain = root.querySelector('main, [role="main"]');
  const hasNav = root.querySelector('nav, [role="navigation"]');
  if (!hasMain) {
    warnings.push({
      type: 'missing-main-landmark',
      severity: 'warning',
      element: 'document',
      message: 'No main landmark found',
      fix: 'Add <main> element or role="main" to the primary content area'
    });
  }

  function describeElement(el) {
    let desc = el.tagName.toLowerCase();
    if (el.id) desc += '#' + el.id;
    if (el.className && typeof el.className === 'string') {
      desc += '.' + el.className.split(' ').slice(0, 2).join('.');
    }
    return desc;
  }

  function getContrastRatio(color1, color2) {
    try {
      const rgb1 = parseRgb(color1);
      const rgb2 = parseRgb(color2);
      if (!rgb1 || !rgb2) return 0;

      const l1 = getLuminance(rgb1);
      const l2 = getLuminance(rgb2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    } catch (e) {
      return 0;
    }
  }

  function parseRgb(color) {
    const match = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return null;
  }

  function getLuminance(rgb) {
    const [r, g, b] = rgb.map(v => {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const result = {
    violations: issues,
    warnings: includeWarnings ? warnings : [],
    passes: [],
    summary: {
      critical: issues.filter(i => i.severity === 'critical').length,
      serious: issues.filter(i => i.severity === 'serious').length,
      warnings: warnings.length
    }
  };

  return result;
};

// Get ARIA accessibility tree
window.__A11Y_DEBUG__.getAriaTree = function(rootSelector, maxDepth = 10) {
  const root = rootSelector ? document.querySelector(rootSelector) : document.body;
  if (!root) return { error: 'Root element not found' };

  const tree = buildAriaTree(root, 0, maxDepth);
  return { tree };

  function buildAriaTree(element, depth, maxDepth) {
    if (depth > maxDepth) return null;

    const role = getRole(element);
    const name = getAccessibleName(element);
    const state = getAriaState(element);

    // Skip elements with no semantic value
    if (!role && !name && element.tagName !== 'BODY') {
      // Still check children
      const children = getAriaChildren(element, depth, maxDepth);
      if (children && children.length === 1) return children[0];
      if (children && children.length > 0) {
        return {
          role: 'group',
          children
        };
      }
      return null;
    }

    const node = {};
    if (role) node.role = role;
    if (name) node.name = name;
    if (Object.keys(state).length > 0) node.state = state;

    // Add element reference for debugging
    node.element = element.tagName.toLowerCase() +
      (element.id ? '#' + element.id : '') +
      (element.className && typeof element.className === 'string' ? '.' + element.className.split(' ')[0] : '');

    // Get children
    const children = getAriaChildren(element, depth, maxDepth);
    if (children && children.length > 0) {
      node.children = children;
    }

    return node;
  }

  function getAriaChildren(element, depth, maxDepth) {
    const children = [];
    for (const child of element.children) {
      if (child.getAttribute('aria-hidden') === 'true') continue;
      if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE' || child.tagName === 'NOSCRIPT') continue;

      const childNode = buildAriaTree(child, depth + 1, maxDepth);
      if (childNode) {
        if (Array.isArray(childNode)) {
          children.push(...childNode);
        } else {
          children.push(childNode);
        }
      }
    }
    return children.length > 0 ? children : null;
  }

  function getRole(element) {
    // Explicit ARIA role
    const explicitRole = element.getAttribute('role');
    if (explicitRole) return explicitRole;

    // Implicit roles based on tag
    const tag = element.tagName.toLowerCase();
    const roleMap = {
      'a': element.href ? 'link' : null,
      'article': 'article',
      'aside': 'complementary',
      'button': 'button',
      'dialog': 'dialog',
      'footer': 'contentinfo',
      'form': 'form',
      'h1': 'heading',
      'h2': 'heading',
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading',
      'header': 'banner',
      'img': 'img',
      'input': getInputRole(element),
      'li': 'listitem',
      'main': 'main',
      'nav': 'navigation',
      'ol': 'list',
      'option': 'option',
      'progress': 'progressbar',
      'section': element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') ? 'region' : null,
      'select': 'combobox',
      'table': 'table',
      'tbody': 'rowgroup',
      'td': 'cell',
      'textarea': 'textbox',
      'th': 'columnheader',
      'thead': 'rowgroup',
      'tr': 'row',
      'ul': 'list'
    };

    return roleMap[tag] || null;
  }

  function getInputRole(input) {
    const type = input.type || 'text';
    const typeRoleMap = {
      'button': 'button',
      'checkbox': 'checkbox',
      'email': 'textbox',
      'number': 'spinbutton',
      'radio': 'radio',
      'range': 'slider',
      'search': 'searchbox',
      'submit': 'button',
      'tel': 'textbox',
      'text': 'textbox',
      'url': 'textbox'
    };
    return typeRoleMap[type] || 'textbox';
  }

  function getAccessibleName(element) {
    // aria-labelledby
    const labelledby = element.getAttribute('aria-labelledby');
    if (labelledby) {
      const labels = labelledby.split(' ').map(id => {
        const el = document.getElementById(id);
        return el ? el.textContent?.trim() : '';
      }).filter(Boolean);
      if (labels.length > 0) return labels.join(' ');
    }

    // aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // For images, use alt
    if (element.tagName === 'IMG') {
      return element.alt || null;
    }

    // For inputs, check associated label
    if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
      if (element.id) {
        const label = document.querySelector('label[for="' + element.id + '"]');
        if (label) return label.textContent?.trim();
      }
      // Check for wrapping label
      const parentLabel = element.closest('label');
      if (parentLabel) {
        const text = parentLabel.textContent?.replace(element.value || '', '').trim();
        if (text) return text;
      }
    }

    // For buttons and links, use text content
    if (element.tagName === 'BUTTON' || element.tagName === 'A') {
      const text = element.textContent?.trim();
      if (text) return text.substring(0, 100);
    }

    // title attribute
    const title = element.getAttribute('title');
    if (title) return title;

    return null;
  }

  function getAriaState(element) {
    const state = {};

    const stateAttrs = [
      'aria-checked',
      'aria-disabled',
      'aria-expanded',
      'aria-hidden',
      'aria-invalid',
      'aria-pressed',
      'aria-selected',
      'aria-busy',
      'aria-current',
      'aria-haspopup',
      'aria-level',
      'aria-valuemin',
      'aria-valuemax',
      'aria-valuenow'
    ];

    for (const attr of stateAttrs) {
      const value = element.getAttribute(attr);
      if (value !== null) {
        const key = attr.replace('aria-', '');
        state[key] = value === 'true' ? true : value === 'false' ? false : value;
      }
    }

    // Add native states
    if (element.disabled) state.disabled = true;
    if (element.checked) state.checked = true;
    if (element.required) state.required = true;
    if (element.readOnly) state.readonly = true;

    // For headings, add level
    const match = element.tagName.match(/^H(\\d)$/);
    if (match) {
      state.level = parseInt(match[1]);
    }

    return state;
  }
};
`;

// Ensure accessibility bridge is injected
async function ensureA11yBridge(page: Awaited<ReturnType<typeof getPage>>): Promise<void> {
  const hasA11yBridge = await page.evaluate(() => !!window.__A11Y_DEBUG__?.audit);
  if (!hasA11yBridge) {
    await page.evaluate(A11Y_AUDIT_BRIDGE);
  }
}

// Run accessibility audit
export async function auditAccessibility(params: AuditAccessibilityParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensureA11yBridge(page);

    const result = await page.evaluate(
      ({ selector, includeWarnings }) => {
        return window.__A11Y_DEBUG__.audit(selector, includeWarnings);
      },
      { selector: params.selector, includeWarnings: params.includeWarnings ?? true }
    );

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Add overall assessment
    const totalIssues = result.summary.critical + result.summary.serious;
    let assessment = 'Good';
    if (totalIssues > 10) assessment = 'Poor';
    else if (totalIssues > 5) assessment = 'Needs Improvement';
    else if (totalIssues > 0) assessment = 'Acceptable';

    return {
      success: true,
      data: {
        ...result,
        assessment,
        note: 'This is a lightweight audit. For comprehensive testing, use axe-core or WAVE.',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get ARIA accessibility tree
export async function getAriaTree(params: GetAriaTreeParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensureA11yBridge(page);

    const result = await page.evaluate(
      ({ selector, maxDepth }) => {
        return window.__A11Y_DEBUG__.getAriaTree(selector, maxDepth);
      },
      { selector: params.selector, maxDepth: params.maxDepth ?? 10 }
    );

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

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
    __A11Y_DEBUG__: {
      audit: (rootSelector?: string, includeWarnings?: boolean) => {
        violations: Array<{
          type: string;
          severity: string;
          element: string;
          message: string;
          fix: string;
        }>;
        warnings: Array<{
          type: string;
          severity: string;
          element: string;
          message: string;
          fix: string;
        }>;
        passes: unknown[];
        summary: {
          critical: number;
          serious: number;
          warnings: number;
        };
        error?: string;
      };
      getAriaTree: (rootSelector?: string, maxDepth?: number) => {
        tree?: {
          role?: string;
          name?: string;
          state?: Record<string, unknown>;
          element?: string;
          children?: unknown[];
        };
        error?: string;
      };
    };
  }
}
