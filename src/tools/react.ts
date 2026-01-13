import { getPage } from '../browser.js';
import type { ToolResult } from '../types.js';

export interface GetReactTreeParams {
  depth?: number;
  selector?: string;
}

export interface FindComponentParams {
  name: string;
  props?: Record<string, unknown>;
}

export interface GetComponentStateParams {
  name: string;
  index?: number;
}

export interface CollectComponentInstancesParams {
  name?: string;
  maxInstances?: number;
}

// React bridge script to inject
const REACT_BRIDGE = `
window.__REACT_DEBUG__ = {
  // Find React fiber from DOM element
  findFiber: function(element) {
    const keys = Object.keys(element);
    const fiberKey = keys.find(k =>
      k.startsWith('__reactFiber$') ||
      k.startsWith('__reactInternalInstance$')
    );
    return fiberKey ? element[fiberKey] : null;
  },

  // Get component name from fiber
  getComponentName: function(fiber) {
    if (!fiber) return null;
    if (!fiber.type) return null;
    if (typeof fiber.type === 'string') return fiber.type;
    return fiber.type.displayName || fiber.type.name || 'Anonymous';
  },

  // Sanitize props for serialization
  sanitizeValue: function(value, depth = 0) {
    if (depth > 3) return '[max depth]';
    if (value === null || value === undefined) return value;
    if (typeof value === 'function') return '[function]';
    if (typeof value === 'symbol') return '[symbol]';
    if (value instanceof HTMLElement) return '[HTMLElement]';
    if (value instanceof Event) return '[Event]';
    if (Array.isArray(value)) {
      if (value.length > 10) return '[Array(' + value.length + ')]';
      return value.slice(0, 10).map(v => this.sanitizeValue(v, depth + 1));
    }
    if (typeof value === 'object') {
      if (value.$$typeof) return '[React Element]';
      const result = {};
      const keys = Object.keys(value).slice(0, 20);
      for (const key of keys) {
        try {
          result[key] = this.sanitizeValue(value[key], depth + 1);
        } catch (e) {
          result[key] = '[error]';
        }
      }
      return result;
    }
    return value;
  },

  // Extract hooks from fiber
  extractHooks: function(fiber) {
    if (!fiber.memoizedState) return null;

    const hooks = [];
    let hook = fiber.memoizedState;
    let index = 0;

    while (hook && index < 20) {
      const hookInfo = { index };

      // Try to determine hook type and value
      if (hook.queue !== undefined) {
        // useState or useReducer
        hookInfo.type = 'state';
        hookInfo.value = this.sanitizeValue(hook.memoizedState);
      } else if (hook.memoizedState && typeof hook.memoizedState === 'object') {
        if (hook.memoizedState.current !== undefined) {
          hookInfo.type = 'ref';
          hookInfo.value = this.sanitizeValue(hook.memoizedState.current);
        } else if (Array.isArray(hook.memoizedState)) {
          hookInfo.type = 'memo/callback';
          hookInfo.value = '[memoized]';
        } else {
          hookInfo.type = 'effect';
          hookInfo.value = '[effect]';
        }
      }

      if (hookInfo.type) hooks.push(hookInfo);
      hook = hook.next;
      index++;
    }

    return hooks.length ? hooks : null;
  },

  // Walk fiber tree
  walkFiber: function(fiber, depth, maxDepth, filter) {
    if (!fiber || depth > maxDepth) return null;

    const name = this.getComponentName(fiber);

    // Skip HTML elements unless at root
    if (typeof fiber.type === 'string' && depth > 0) {
      // Still walk children to find React components
      let child = fiber.child;
      const results = [];
      while (child) {
        const childResult = this.walkFiber(child, depth, maxDepth, filter);
        if (childResult) results.push(childResult);
        child = child.sibling;
      }
      return results.length === 1 ? results[0] : results.length ? results : null;
    }

    // Skip if filter specified and doesn't match
    if (filter && name && !name.toLowerCase().includes(filter.toLowerCase())) {
      let child = fiber.child;
      const results = [];
      while (child) {
        const childResult = this.walkFiber(child, depth, maxDepth, filter);
        if (childResult) {
          if (Array.isArray(childResult)) results.push(...childResult);
          else results.push(childResult);
        }
        child = child.sibling;
      }
      return results.length === 1 ? results[0] : results.length ? results : null;
    }

    const node = { name };

    // Add props (sanitized)
    if (fiber.memoizedProps) {
      const props = this.sanitizeValue(fiber.memoizedProps);
      if (props && Object.keys(props).length > 0) {
        // Remove children from props to reduce noise
        delete props.children;
        if (Object.keys(props).length > 0) {
          node.props = props;
        }
      }
    }

    // Add hooks/state
    const hooks = this.extractHooks(fiber);
    if (hooks) {
      node.hooks = hooks;
    }

    // Get children
    let child = fiber.child;
    const children = [];
    while (child) {
      const childResult = this.walkFiber(child, depth + 1, maxDepth, filter);
      if (childResult) {
        if (Array.isArray(childResult)) children.push(...childResult);
        else children.push(childResult);
      }
      child = child.sibling;
    }

    if (children.length) {
      node.children = children;
    }

    return node;
  },

  // Get React tree starting from root
  getTree: function(maxDepth = 10, filter = null) {
    // Try to find React root
    const rootCandidates = document.querySelectorAll('[data-reactroot], #root, #app, #__next');

    for (const root of rootCandidates) {
      const fiber = this.findFiber(root);
      if (fiber) {
        // Walk up to find the root fiber
        let rootFiber = fiber;
        while (rootFiber.return) {
          rootFiber = rootFiber.return;
        }

        const tree = this.walkFiber(rootFiber, 0, maxDepth, filter);
        if (tree) return { success: true, tree };
      }
    }

    // Try alternative method - look for any React fiber
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const fiber = this.findFiber(el);
      if (fiber) {
        let rootFiber = fiber;
        while (rootFiber.return) {
          rootFiber = rootFiber.return;
        }

        const tree = this.walkFiber(rootFiber, 0, maxDepth, filter);
        if (tree) return { success: true, tree };
      }
    }

    return {
      success: false,
      error: 'Could not find React root. Is this a React application?'
    };
  },

  // Find components by name
  findComponents: function(name, maxResults = 10) {
    const results = [];

    const searchFiber = (fiber, path = []) => {
      if (!fiber || results.length >= maxResults) return;

      const componentName = this.getComponentName(fiber);
      if (componentName && componentName.toLowerCase().includes(name.toLowerCase())) {
        results.push({
          name: componentName,
          path: [...path, componentName].join(' > '),
          props: this.sanitizeValue(fiber.memoizedProps),
          hooks: this.extractHooks(fiber),
        });
      }

      let child = fiber.child;
      while (child) {
        searchFiber(child, [...path, componentName || 'anonymous']);
        child = child.sibling;
      }
    };

    // Find root and search
    const root = document.querySelector('[data-reactroot], #root, #app, #__next');
    if (root) {
      const fiber = this.findFiber(root);
      if (fiber) {
        let rootFiber = fiber;
        while (rootFiber.return) {
          rootFiber = rootFiber.return;
        }
        searchFiber(rootFiber);
      }
    }

    return results;
  },

  // Get state for a specific component
  getComponentState: function(name, index = 0) {
    const components = this.findComponents(name, index + 1);
    if (components.length <= index) {
      return { error: 'Component not found at index ' + index };
    }
    return components[index];
  },

  // Get DOM node associated with a fiber
  getFiberDOMNode: function(fiber) {
    // Walk down to find the first DOM node
    let node = fiber;
    while (node) {
      if (node.stateNode instanceof HTMLElement) {
        return node.stateNode;
      }
      // For function components, check child
      if (node.child) {
        const childDOM = this.getFiberDOMNode(node.child);
        if (childDOM) return childDOM;
      }
      break;
    }
    return null;
  },

  // Collect all instances of components matching a name
  collectComponentInstances: function(componentName, maxInstances = 20) {
    const instanceMap = new Map(); // fiber.type -> instances array
    const typeNameMap = new Map(); // fiber.type -> name

    const collectFiber = (fiber, path = []) => {
      if (!fiber) return;

      const name = this.getComponentName(fiber);

      // Check if this is a function/class component (not DOM element)
      if (fiber.type && typeof fiber.type !== 'string') {
        const matchesSearch = !componentName ||
          (name && name.toLowerCase().includes(componentName.toLowerCase()));

        if (matchesSearch) {
          // Use fiber.type as the unique key for grouping
          const typeKey = fiber.type;

          if (!instanceMap.has(typeKey)) {
            instanceMap.set(typeKey, []);
            typeNameMap.set(typeKey, name);
          }

          const instances = instanceMap.get(typeKey);
          if (instances.length < maxInstances) {
            // Get the DOM node for this component
            const domNode = this.getFiberDOMNode(fiber);

            // Get rendered HTML (limited to avoid huge outputs)
            let renderedHTML = null;
            if (domNode) {
              const html = domNode.outerHTML;
              renderedHTML = html.length > 5000
                ? html.substring(0, 5000) + '... [truncated]'
                : html;
            }

            // Get minified source via type.toString()
            let source = null;
            try {
              const sourceStr = fiber.type.toString();
              // Limit source size
              source = sourceStr.length > 3000
                ? sourceStr.substring(0, 3000) + '... [truncated]'
                : sourceStr;
            } catch (e) {
              source = '[could not extract source]';
            }

            instances.push({
              path: [...path, name].join(' > '),
              props: this.sanitizeValue(fiber.memoizedProps),
              hooks: this.extractHooks(fiber),
              renderedHTML,
              source: instances.length === 0 ? source : '[same as first instance]',
            });
          }
        }
      }

      // Recurse into children
      let child = fiber.child;
      while (child) {
        collectFiber(child, [...path, name || 'anonymous']);
        child = child.sibling;
      }
    };

    // Find root and collect
    const rootCandidates = document.querySelectorAll('[data-reactroot], #root, #app, #__next');

    for (const root of rootCandidates) {
      const fiber = this.findFiber(root);
      if (fiber) {
        let rootFiber = fiber;
        while (rootFiber.return) {
          rootFiber = rootFiber.return;
        }
        collectFiber(rootFiber);
        break;
      }
    }

    // Fallback: search all elements
    if (instanceMap.size === 0) {
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const fiber = this.findFiber(el);
        if (fiber) {
          let rootFiber = fiber;
          while (rootFiber.return) {
            rootFiber = rootFiber.return;
          }
          collectFiber(rootFiber);
          break;
        }
      }
    }

    // Convert Map to array of component types with their instances
    const results = [];
    for (const [typeKey, instances] of instanceMap) {
      const name = typeNameMap.get(typeKey);
      results.push({
        componentName: name,
        instanceCount: instances.length,
        instances: instances,
      });
    }

    // Sort by instance count (most common first)
    results.sort((a, b) => b.instanceCount - a.instanceCount);

    return results;
  }
};
`;

// Ensure React bridge is injected
async function ensureReactBridge(page: Awaited<ReturnType<typeof getPage>>): Promise<void> {
  const hasReactDebug = await page.evaluate(() => !!window.__REACT_DEBUG__);
  if (!hasReactDebug) {
    await page.evaluate(REACT_BRIDGE);
  }
}

// Get React component tree
export async function getReactTree(params: GetReactTreeParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensureReactBridge(page);

    const depth = params.depth ?? 8;

    const result = await page.evaluate((maxDepth) => {
      return window.__REACT_DEBUG__.getTree(maxDepth);
    }, depth);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: result.tree,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Find React components by name
export async function findComponent(params: FindComponentParams): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensureReactBridge(page);

    const results = await page.evaluate((name) => {
      return window.__REACT_DEBUG__.findComponents(name);
    }, params.name);

    return {
      success: true,
      data: {
        count: results.length,
        components: results,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get state/props for a specific component
export async function getComponentState(params: GetComponentStateParams): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensureReactBridge(page);

    const result = await page.evaluate(
      ({ name, index }) => {
        return window.__REACT_DEBUG__.getComponentState(name, index);
      },
      { name: params.name, index: params.index ?? 0 }
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

// Collect all instances of a component type with props->HTML mapping
export async function collectComponentInstances(params: CollectComponentInstancesParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensureReactBridge(page);

    const results = await page.evaluate(
      ({ name, maxInstances }) => {
        return window.__REACT_DEBUG__.collectComponentInstances(name, maxInstances);
      },
      { name: params.name, maxInstances: params.maxInstances ?? 20 }
    );

    if (!results || results.length === 0) {
      return {
        success: true,
        data: {
          message: params.name
            ? `No components found matching "${params.name}"`
            : 'No React components found on the page',
          components: [],
        },
      };
    }

    return {
      success: true,
      data: {
        totalComponentTypes: results.length,
        components: results,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Declare global type for React debug
declare global {
  interface Window {
    __REACT_DEBUG__: {
      getTree: (maxDepth: number) => { success: boolean; tree?: unknown; error?: string };
      findComponents: (name: string, maxResults?: number) => Array<{
        name: string;
        path: string;
        props: unknown;
        hooks: unknown;
      }>;
      getComponentState: (name: string, index: number) => { error?: string } & Record<string, unknown>;
      collectComponentInstances: (name?: string, maxInstances?: number) => Array<{
        componentName: string;
        instanceCount: number;
        instances: Array<{
          path: string;
          props: unknown;
          hooks: unknown;
          renderedHTML: string | null;
          source: string | null;
        }>;
      }>;
    };
  }
}
