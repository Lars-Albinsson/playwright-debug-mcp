import { getPage } from '../browser.js';
import type { ToolResult } from '../types.js';

// State management inspection tools for Redux, Zustand, React Query, and Context

export interface GetReduxStateParams {
  path?: string;
  actionsLimit?: number;
}

export interface GetZustandStoresParams {
  storeName?: string;
}

export interface GetReactQueryCacheParams {
  queryKey?: string;
  status?: 'all' | 'success' | 'error' | 'loading';
}

export interface GetContextValuesParams {
  contextName?: string;
}

// Redux inspection script
const REDUX_BRIDGE = `
window.__STATE_DEBUG__ = window.__STATE_DEBUG__ || {};

window.__STATE_DEBUG__.getReduxState = function(path, actionsLimit = 20) {
  const result = {
    found: false,
    store: null,
    state: null,
    actions: [],
    middleware: []
  };

  // Try to find Redux store
  const store = window.__REDUX_DEVTOOLS_EXTENSION__
    ? window.__REDUX_DEVTOOLS_EXTENSION__.store
    : window.store || window.__REDUX_STORE__ || window.__store__;

  // Also try React DevTools global hook
  if (!store && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook.stores && hook.stores.size > 0) {
      const firstStore = hook.stores.values().next().value;
      if (firstStore && firstStore.getState) {
        result.found = true;
        result.store = 'Found via React DevTools hook';
        try {
          const state = firstStore.getState();
          result.state = path ? getNestedValue(state, path) : state;
        } catch (e) {
          result.state = '[Error reading state]';
        }
      }
    }
  }

  // Try common global patterns
  const globalPatterns = ['store', '__REDUX_STORE__', '__store__', 'reduxStore'];
  for (const pattern of globalPatterns) {
    if (window[pattern] && typeof window[pattern].getState === 'function') {
      result.found = true;
      result.store = 'Found at window.' + pattern;
      try {
        const state = window[pattern].getState();
        result.state = path ? getNestedValue(state, path) : sanitizeDeep(state, 4);
      } catch (e) {
        result.state = '[Error reading state]';
      }
      break;
    }
  }

  // Try to get action history from Redux DevTools
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    try {
      const devTools = window.__REDUX_DEVTOOLS_EXTENSION__;
      if (devTools.liftedStore) {
        const liftedState = devTools.liftedStore.getState();
        if (liftedState.actionsById) {
          const actionIds = Object.keys(liftedState.actionsById).slice(-actionsLimit);
          result.actions = actionIds.map(id => ({
            id,
            type: liftedState.actionsById[id].action.type,
            payload: sanitizeDeep(liftedState.actionsById[id].action.payload, 2)
          }));
        }
      }
    } catch (e) {
      result.actions = [];
    }
  }

  return result;

  function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  function sanitizeDeep(value, depth = 3) {
    if (depth <= 0) return '[max depth]';
    if (value === null || value === undefined) return value;
    if (typeof value === 'function') return '[function]';
    if (typeof value === 'symbol') return '[symbol]';
    if (value instanceof HTMLElement) return '[HTMLElement]';
    if (Array.isArray(value)) {
      if (value.length > 20) return '[Array(' + value.length + ')]';
      return value.slice(0, 20).map(v => sanitizeDeep(v, depth - 1));
    }
    if (typeof value === 'object') {
      if (value.$$typeof) return '[React Element]';
      const result = {};
      const keys = Object.keys(value).slice(0, 30);
      for (const key of keys) {
        try {
          result[key] = sanitizeDeep(value[key], depth - 1);
        } catch (e) {
          result[key] = '[error]';
        }
      }
      return result;
    }
    return value;
  }
};
`;

// Zustand inspection script
const ZUSTAND_BRIDGE = `
window.__STATE_DEBUG__ = window.__STATE_DEBUG__ || {};

window.__STATE_DEBUG__.getZustandStores = function(storeName) {
  const results = [];

  // Zustand stores are typically attached to window or module scope
  // They can be found through React fiber inspection
  const findZustandStores = (fiber, path = []) => {
    if (!fiber) return;

    // Check for Zustand store in hooks
    let hook = fiber.memoizedState;
    while (hook) {
      // Zustand uses useSyncExternalStore which has a specific pattern
      if (hook.memoizedState && typeof hook.memoizedState === 'object') {
        const state = hook.memoizedState;
        // Zustand stores have getState, setState, subscribe
        if (state.getState && state.setState && state.subscribe) {
          const name = getComponentName(fiber) || 'Unknown';
          if (!storeName || name.toLowerCase().includes(storeName.toLowerCase())) {
            try {
              results.push({
                componentPath: path.join(' > '),
                storeName: name,
                state: sanitizeDeep(state.getState(), 3),
                hasDevtools: !!state.devtools
              });
            } catch (e) {
              results.push({
                componentPath: path.join(' > '),
                storeName: name,
                state: '[Error reading store]',
                error: e.message
              });
            }
          }
        }
      }
      hook = hook.next;
    }

    // Recurse children
    let child = fiber.child;
    while (child) {
      findZustandStores(child, [...path, getComponentName(fiber) || 'anonymous']);
      child = child.sibling;
    }
  };

  function getComponentName(fiber) {
    if (!fiber || !fiber.type) return null;
    if (typeof fiber.type === 'string') return fiber.type;
    return fiber.type.displayName || fiber.type.name || null;
  }

  function sanitizeDeep(value, depth = 3) {
    if (depth <= 0) return '[max depth]';
    if (value === null || value === undefined) return value;
    if (typeof value === 'function') return '[function]';
    if (typeof value === 'symbol') return '[symbol]';
    if (Array.isArray(value)) {
      return value.slice(0, 20).map(v => sanitizeDeep(v, depth - 1));
    }
    if (typeof value === 'object') {
      if (value.$$typeof) return '[React Element]';
      const result = {};
      const keys = Object.keys(value).slice(0, 30);
      for (const key of keys) {
        try {
          result[key] = sanitizeDeep(value[key], depth - 1);
        } catch (e) {
          result[key] = '[error]';
        }
      }
      return result;
    }
    return value;
  }

  // Also check for globally exposed stores
  const globalPatterns = ['useStore', 'useBearStore', 'useAppStore', 'useUserStore'];
  for (const key of Object.keys(window)) {
    if (key.startsWith('use') && key.endsWith('Store')) {
      try {
        const store = window[key];
        if (store && store.getState) {
          results.push({
            componentPath: 'window.' + key,
            storeName: key,
            state: sanitizeDeep(store.getState(), 3),
            isGlobal: true
          });
        }
      } catch (e) {}
    }
  }

  // Find via React fiber
  const root = document.querySelector('#root, #app, #__next, [data-reactroot]');
  if (root) {
    const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$'));
    if (fiberKey) {
      let fiber = root[fiberKey];
      while (fiber.return) fiber = fiber.return;
      findZustandStores(fiber);
    }
  }

  return results;
};
`;

// React Query inspection script
const REACT_QUERY_BRIDGE = `
window.__STATE_DEBUG__ = window.__STATE_DEBUG__ || {};

window.__STATE_DEBUG__.getReactQueryCache = function(queryKeyFilter, statusFilter = 'all') {
  const results = {
    found: false,
    queries: [],
    mutations: [],
    cacheStats: {}
  };

  // Try to find React Query client
  // Common patterns: window.__REACT_QUERY_CLIENT__, exposed via devtools
  const findQueryClient = () => {
    // Check global
    if (window.__REACT_QUERY_CLIENT__) return window.__REACT_QUERY_CLIENT__;
    if (window.queryClient) return window.queryClient;

    // Check React Query DevTools
    if (window.__REACT_QUERY_DEVTOOLS_GLOBAL_STORE__) {
      const store = window.__REACT_QUERY_DEVTOOLS_GLOBAL_STORE__;
      if (store.getState) {
        const state = store.getState();
        if (state.client) return state.client;
      }
    }

    // Try to find via React context
    const root = document.querySelector('#root, #app, #__next, [data-reactroot]');
    if (root) {
      const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$'));
      if (fiberKey) {
        let fiber = root[fiberKey];
        while (fiber) {
          if (fiber.memoizedState && fiber.memoizedState.memoizedState) {
            const ctx = fiber.memoizedState.memoizedState;
            if (ctx && ctx.queryClient) return ctx.queryClient;
          }
          fiber = fiber.return;
        }
      }
    }

    return null;
  };

  const client = findQueryClient();

  if (client && client.getQueryCache) {
    results.found = true;

    try {
      const cache = client.getQueryCache();
      const allQueries = cache.getAll();

      results.cacheStats = {
        totalQueries: allQueries.length,
        stale: allQueries.filter(q => q.isStale()).length,
        fetching: allQueries.filter(q => q.state.fetchStatus === 'fetching').length,
        fresh: allQueries.filter(q => !q.isStale()).length
      };

      for (const query of allQueries) {
        const queryKey = JSON.stringify(query.queryKey);

        // Apply filters
        if (queryKeyFilter && !queryKey.toLowerCase().includes(queryKeyFilter.toLowerCase())) {
          continue;
        }

        const status = query.state.status;
        if (statusFilter !== 'all') {
          if (statusFilter === 'loading' && status !== 'pending') continue;
          if (statusFilter === 'success' && status !== 'success') continue;
          if (statusFilter === 'error' && status !== 'error') continue;
        }

        results.queries.push({
          queryKey: query.queryKey,
          status: query.state.status,
          fetchStatus: query.state.fetchStatus,
          isStale: query.isStale(),
          dataUpdatedAt: query.state.dataUpdatedAt
            ? new Date(query.state.dataUpdatedAt).toISOString()
            : null,
          data: sanitizeDeep(query.state.data, 2),
          error: query.state.error ? String(query.state.error) : null,
        });
      }

      // Get mutations
      const mutationCache = client.getMutationCache();
      if (mutationCache) {
        const allMutations = mutationCache.getAll();
        results.mutations = allMutations.slice(-10).map(m => ({
          mutationKey: m.options.mutationKey,
          status: m.state.status,
          submittedAt: m.state.submittedAt
            ? new Date(m.state.submittedAt).toISOString()
            : null,
          variables: sanitizeDeep(m.state.variables, 2),
          error: m.state.error ? String(m.state.error) : null,
        }));
      }
    } catch (e) {
      results.error = e.message;
    }
  }

  function sanitizeDeep(value, depth = 2) {
    if (depth <= 0) return '[max depth]';
    if (value === null || value === undefined) return value;
    if (typeof value === 'function') return '[function]';
    if (Array.isArray(value)) {
      if (value.length > 10) return '[Array(' + value.length + ')]';
      return value.slice(0, 10).map(v => sanitizeDeep(v, depth - 1));
    }
    if (typeof value === 'object') {
      const result = {};
      const keys = Object.keys(value).slice(0, 20);
      for (const key of keys) {
        try {
          result[key] = sanitizeDeep(value[key], depth - 1);
        } catch (e) {
          result[key] = '[error]';
        }
      }
      return result;
    }
    return value;
  }

  return results;
};
`;

// React Context inspection script
const CONTEXT_BRIDGE = `
window.__STATE_DEBUG__ = window.__STATE_DEBUG__ || {};

window.__STATE_DEBUG__.getContextValues = function(contextNameFilter) {
  const contexts = [];
  const seen = new Set();

  const extractContexts = (fiber, path = []) => {
    if (!fiber) return;

    // Check if this fiber provides a context
    if (fiber.type && fiber.type._context) {
      const ctx = fiber.type._context;
      const displayName = ctx.displayName || ctx._currentValue?.constructor?.name || 'UnnamedContext';

      if (!contextNameFilter || displayName.toLowerCase().includes(contextNameFilter.toLowerCase())) {
        const key = displayName + '-' + path.join('/');
        if (!seen.has(key)) {
          seen.add(key);
          contexts.push({
            name: displayName,
            path: path.join(' > '),
            value: sanitizeDeep(ctx._currentValue, 3),
            provider: getComponentName(fiber)
          });
        }
      }
    }

    // Check for context consumer pattern
    if (fiber.dependencies && fiber.dependencies.firstContext) {
      let dep = fiber.dependencies.firstContext;
      while (dep) {
        if (dep.context) {
          const displayName = dep.context.displayName || 'UnnamedContext';
          if (!contextNameFilter || displayName.toLowerCase().includes(contextNameFilter.toLowerCase())) {
            const key = displayName + '-consumer-' + path.join('/');
            if (!seen.has(key)) {
              seen.add(key);
              contexts.push({
                name: displayName,
                path: path.join(' > '),
                value: sanitizeDeep(dep.context._currentValue, 3),
                consumer: getComponentName(fiber)
              });
            }
          }
        }
        dep = dep.next;
      }
    }

    // Check memoizedState for useContext hooks
    let hook = fiber.memoizedState;
    let hookIndex = 0;
    while (hook && hookIndex < 30) {
      // useContext stores context value directly
      if (hook.memoizedState && hook.memoizedState._context) {
        const ctx = hook.memoizedState._context;
        const displayName = ctx.displayName || 'UnnamedContext';
        if (!contextNameFilter || displayName.toLowerCase().includes(contextNameFilter.toLowerCase())) {
          const key = displayName + '-hook-' + path.join('/') + '-' + hookIndex;
          if (!seen.has(key)) {
            seen.add(key);
            contexts.push({
              name: displayName,
              path: path.join(' > '),
              value: sanitizeDeep(ctx._currentValue, 3),
              hook: 'useContext',
              component: getComponentName(fiber)
            });
          }
        }
      }
      hook = hook.next;
      hookIndex++;
    }

    // Recurse
    let child = fiber.child;
    while (child) {
      extractContexts(child, [...path, getComponentName(fiber) || 'anonymous']);
      child = child.sibling;
    }
  };

  function getComponentName(fiber) {
    if (!fiber || !fiber.type) return null;
    if (typeof fiber.type === 'string') return fiber.type;
    return fiber.type.displayName || fiber.type.name || null;
  }

  function sanitizeDeep(value, depth = 3) {
    if (depth <= 0) return '[max depth]';
    if (value === null || value === undefined) return value;
    if (typeof value === 'function') return '[function]';
    if (typeof value === 'symbol') return '[symbol]';
    if (Array.isArray(value)) {
      return value.slice(0, 20).map(v => sanitizeDeep(v, depth - 1));
    }
    if (typeof value === 'object') {
      if (value.$$typeof) return '[React Element]';
      const result = {};
      const keys = Object.keys(value).slice(0, 30);
      for (const key of keys) {
        try {
          result[key] = sanitizeDeep(value[key], depth - 1);
        } catch (e) {
          result[key] = '[error]';
        }
      }
      return result;
    }
    return value;
  }

  // Find root and traverse
  const root = document.querySelector('#root, #app, #__next, [data-reactroot]');
  if (root) {
    const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$'));
    if (fiberKey) {
      let fiber = root[fiberKey];
      while (fiber.return) fiber = fiber.return;
      extractContexts(fiber);
    }
  }

  // Dedupe by name and value
  const uniqueContexts = [];
  const valueMap = new Map();
  for (const ctx of contexts) {
    const key = ctx.name + JSON.stringify(ctx.value);
    if (!valueMap.has(key)) {
      valueMap.set(key, true);
      uniqueContexts.push(ctx);
    }
  }

  return uniqueContexts;
};
`;

// Ensure state debug bridge is injected
async function ensureStateBridge(page: Awaited<ReturnType<typeof getPage>>): Promise<void> {
  const hasStateBridge = await page.evaluate(() => !!window.__STATE_DEBUG__);
  if (!hasStateBridge) {
    await page.evaluate(REDUX_BRIDGE);
    await page.evaluate(ZUSTAND_BRIDGE);
    await page.evaluate(REACT_QUERY_BRIDGE);
    await page.evaluate(CONTEXT_BRIDGE);
  }
}

// Get Redux state
export async function getReduxState(params: GetReduxStateParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensureStateBridge(page);

    const result = await page.evaluate(
      ({ path, actionsLimit }) => {
        return window.__STATE_DEBUG__.getReduxState(path, actionsLimit);
      },
      { path: params.path, actionsLimit: params.actionsLimit ?? 20 }
    );

    if (!result.found) {
      return {
        success: true,
        data: {
          message: 'No Redux store found. The app may not use Redux, or the store is not exposed globally.',
          suggestions: [
            'Check if the app uses Redux DevTools extension',
            'Look for window.store or window.__REDUX_STORE__',
            'The store might be encapsulated and not globally accessible'
          ]
        },
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

// Get Zustand stores
export async function getZustandStores(params: GetZustandStoresParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensureStateBridge(page);

    const results = await page.evaluate(
      (storeName) => {
        return window.__STATE_DEBUG__.getZustandStores(storeName);
      },
      params.storeName
    );

    if (results.length === 0) {
      return {
        success: true,
        data: {
          message: 'No Zustand stores found.',
          suggestions: [
            'The app may not use Zustand',
            'Stores might be created with vanilla store (not React)',
            'Try checking React component state for store data'
          ]
        },
      };
    }

    return {
      success: true,
      data: {
        storeCount: results.length,
        stores: results,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get React Query cache
export async function getReactQueryCache(params: GetReactQueryCacheParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensureStateBridge(page);

    const result = await page.evaluate(
      ({ queryKey, status }) => {
        return window.__STATE_DEBUG__.getReactQueryCache(queryKey, status);
      },
      { queryKey: params.queryKey, status: params.status ?? 'all' }
    );

    if (!result.found) {
      return {
        success: true,
        data: {
          message: 'No React Query client found.',
          suggestions: [
            'The app may not use React Query/TanStack Query',
            'Try looking for SWR or other data fetching libraries',
            'Check network requests instead for API data'
          ]
        },
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

// Get React Context values
export async function getContextValues(params: GetContextValuesParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensureStateBridge(page);

    const results = await page.evaluate(
      (contextName) => {
        return window.__STATE_DEBUG__.getContextValues(contextName);
      },
      params.contextName
    );

    if (results.length === 0) {
      return {
        success: true,
        data: {
          message: params.contextName
            ? `No contexts found matching "${params.contextName}"`
            : 'No React contexts found on the page',
          suggestions: [
            'The app may use different state management',
            'Context values might be primitives (hard to detect)',
            'Try searching for specific context names'
          ]
        },
      };
    }

    return {
      success: true,
      data: {
        contextCount: results.length,
        contexts: results,
      },
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
    __STATE_DEBUG__: {
      getReduxState: (path?: string, actionsLimit?: number) => {
        found: boolean;
        store: string | null;
        state: unknown;
        actions: Array<{ id: string; type: string; payload: unknown }>;
        middleware: string[];
      };
      getZustandStores: (storeName?: string) => Array<{
        componentPath: string;
        storeName: string;
        state: unknown;
        isGlobal?: boolean;
        hasDevtools?: boolean;
        error?: string;
      }>;
      getReactQueryCache: (queryKeyFilter?: string, statusFilter?: string) => {
        found: boolean;
        queries: Array<{
          queryKey: unknown;
          status: string;
          fetchStatus: string;
          isStale: boolean;
          dataUpdatedAt: string | null;
          data: unknown;
          error: string | null;
        }>;
        mutations: Array<{
          mutationKey: unknown;
          status: string;
          submittedAt: string | null;
          variables: unknown;
          error: string | null;
        }>;
        cacheStats: {
          totalQueries: number;
          stale: number;
          fetching: number;
          fresh: number;
        };
        error?: string;
      };
      getContextValues: (contextName?: string) => Array<{
        name: string;
        path: string;
        value: unknown;
        provider?: string;
        consumer?: string;
        component?: string;
        hook?: string;
      }>;
    };
    __REDUX_DEVTOOLS_EXTENSION__?: {
      store?: { getState: () => unknown };
      liftedStore?: { getState: () => { actionsById: Record<string, { action: { type: string; payload: unknown } }> } };
    };
    __REACT_QUERY_CLIENT__?: unknown;
    queryClient?: unknown;
    __REACT_QUERY_DEVTOOLS_GLOBAL_STORE__?: { getState: () => { client?: unknown } };
    store?: { getState: () => unknown };
    __REDUX_STORE__?: { getState: () => unknown };
    __store__?: { getState: () => unknown };
  }
}
