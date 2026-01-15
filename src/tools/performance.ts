import { getPage } from '../browser.js';
import type { ToolResult } from '../types.js';

// Performance debugging tools for render tracking, slow components, and Web Vitals

export interface GetRenderCountParams {
  componentName?: string;
  threshold?: number;
}

export interface GetSlowComponentsParams {
  threshold?: number;
  limit?: number;
}

// Performance monitoring bridge script
const PERFORMANCE_BRIDGE = `
window.__PERF_DEBUG__ = window.__PERF_DEBUG__ || {
  renderCounts: new Map(),
  renderTimes: new Map(),
  initialized: false
};

// Initialize render tracking by patching React
window.__PERF_DEBUG__.initRenderTracking = function() {
  if (window.__PERF_DEBUG__.initialized) return { alreadyInitialized: true };

  // Try to find React and patch scheduleUpdateOnFiber
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook && hook.onCommitFiberRoot) {
    const originalOnCommit = hook.onCommitFiberRoot;
    hook.onCommitFiberRoot = function(rendererID, root, priorityLevel) {
      try {
        trackRenders(root.current);
      } catch (e) {}
      return originalOnCommit.apply(this, arguments);
    };
    window.__PERF_DEBUG__.initialized = true;
    return { success: true, method: 'DevTools hook' };
  }

  // Alternative: manually scan periodically
  window.__PERF_DEBUG__.initialized = true;
  return { success: true, method: 'manual scan' };

  function trackRenders(fiber) {
    if (!fiber) return;

    const name = getComponentName(fiber);
    if (name && typeof fiber.type !== 'string') {
      const key = name;
      const current = window.__PERF_DEBUG__.renderCounts.get(key) || 0;
      window.__PERF_DEBUG__.renderCounts.set(key, current + 1);
    }

    let child = fiber.child;
    while (child) {
      trackRenders(child);
      child = child.sibling;
    }
  }

  function getComponentName(fiber) {
    if (!fiber || !fiber.type) return null;
    if (typeof fiber.type === 'string') return null;
    return fiber.type.displayName || fiber.type.name || null;
  }
};

// Get current render counts
window.__PERF_DEBUG__.getRenderCounts = function(componentFilter, threshold = 0) {
  const results = [];

  // First, do a current scan of the fiber tree to count instances
  const componentCounts = new Map();

  const scanFiber = (fiber) => {
    if (!fiber) return;

    const name = getComponentName(fiber);
    if (name) {
      const current = componentCounts.get(name) || { instances: 0, renders: 0 };
      current.instances++;
      componentCounts.set(name, current);
    }

    let child = fiber.child;
    while (child) {
      scanFiber(child);
      child = child.sibling;
    }
  };

  // Find root and scan
  const root = document.querySelector('#root, #app, #__next, [data-reactroot]');
  if (root) {
    const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$'));
    if (fiberKey) {
      let fiber = root[fiberKey];
      while (fiber.return) fiber = fiber.return;
      scanFiber(fiber);
    }
  }

  // Merge with tracked render counts
  for (const [name, count] of window.__PERF_DEBUG__.renderCounts) {
    const existing = componentCounts.get(name) || { instances: 0, renders: 0 };
    existing.renders = count;
    componentCounts.set(name, existing);
  }

  // Convert to results array
  for (const [name, data] of componentCounts) {
    if (componentFilter && !name.toLowerCase().includes(componentFilter.toLowerCase())) {
      continue;
    }
    if (data.renders >= threshold || data.instances > 0) {
      results.push({
        component: name,
        instances: data.instances,
        renders: data.renders,
        rendersPerInstance: data.instances > 0 ? Math.round(data.renders / data.instances * 10) / 10 : 0
      });
    }
  }

  // Sort by renders (most first)
  results.sort((a, b) => b.renders - a.renders);

  return results.slice(0, 50);

  function getComponentName(fiber) {
    if (!fiber || !fiber.type) return null;
    if (typeof fiber.type === 'string') return null;
    return fiber.type.displayName || fiber.type.name || null;
  }
};

// Measure component render times
window.__PERF_DEBUG__.measureSlowComponents = function(threshold = 16, limit = 20) {
  const measurements = [];

  // Use React Profiler data if available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook.getFiberRoots) {
      for (const roots of hook.getFiberRoots(1) || []) {
        measureFiber(roots.current);
      }
    }
  }

  // Fallback: scan fiber tree for actualDuration
  const root = document.querySelector('#root, #app, #__next, [data-reactroot]');
  if (root) {
    const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber$'));
    if (fiberKey) {
      let fiber = root[fiberKey];
      while (fiber.return) fiber = fiber.return;
      measureFiber(fiber);
    }
  }

  function measureFiber(fiber, path = []) {
    if (!fiber) return;

    const name = getComponentName(fiber);

    // React Profiler exposes timing data on fibers
    if (fiber.actualDuration !== undefined && fiber.actualDuration > threshold) {
      measurements.push({
        component: name || 'Unknown',
        path: [...path, name].filter(Boolean).join(' > '),
        actualDuration: Math.round(fiber.actualDuration * 100) / 100,
        selfDuration: Math.round((fiber.selfBaseDuration || 0) * 100) / 100,
        treeBaseDuration: Math.round((fiber.treeBaseDuration || 0) * 100) / 100
      });
    }

    let child = fiber.child;
    while (child) {
      measureFiber(child, [...path, name].filter(Boolean));
      child = child.sibling;
    }
  }

  function getComponentName(fiber) {
    if (!fiber || !fiber.type) return null;
    if (typeof fiber.type === 'string') return null;
    return fiber.type.displayName || fiber.type.name || null;
  }

  // Sort by duration (slowest first)
  measurements.sort((a, b) => b.actualDuration - a.actualDuration);

  return measurements.slice(0, limit);
};

// Get Web Vitals
window.__PERF_DEBUG__.getWebVitals = function() {
  const vitals = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null
  };

  // Get paint timings
  const paintEntries = performance.getEntriesByType('paint');
  for (const entry of paintEntries) {
    if (entry.name === 'first-contentful-paint') {
      vitals.fcp = {
        value: Math.round(entry.startTime),
        rating: entry.startTime <= 1800 ? 'good' : entry.startTime <= 3000 ? 'needs-improvement' : 'poor'
      };
    }
  }

  // Get LCP
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  if (lcpEntries.length > 0) {
    const lcp = lcpEntries[lcpEntries.length - 1];
    vitals.lcp = {
      value: Math.round(lcp.startTime),
      rating: lcp.startTime <= 2500 ? 'good' : lcp.startTime <= 4000 ? 'needs-improvement' : 'poor',
      element: lcp.element ? lcp.element.tagName : null
    };
  }

  // Get CLS
  const clsEntries = performance.getEntriesByType('layout-shift');
  let clsValue = 0;
  for (const entry of clsEntries) {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
    }
  }
  vitals.cls = {
    value: Math.round(clsValue * 1000) / 1000,
    rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor'
  };

  // Get FID from first-input
  const fidEntries = performance.getEntriesByType('first-input');
  if (fidEntries.length > 0) {
    const fid = fidEntries[0];
    const fidValue = fid.processingStart - fid.startTime;
    vitals.fid = {
      value: Math.round(fidValue),
      rating: fidValue <= 100 ? 'good' : fidValue <= 300 ? 'needs-improvement' : 'poor'
    };
  }

  // Get TTFB from navigation timing
  const navEntries = performance.getEntriesByType('navigation');
  if (navEntries.length > 0) {
    const nav = navEntries[0];
    vitals.ttfb = {
      value: Math.round(nav.responseStart),
      rating: nav.responseStart <= 800 ? 'good' : nav.responseStart <= 1800 ? 'needs-improvement' : 'poor'
    };
  }

  // Get INP (Interaction to Next Paint) - approximate from event timing
  const eventEntries = performance.getEntriesByType('event');
  if (eventEntries.length > 0) {
    const durations = eventEntries.map(e => e.duration).sort((a, b) => b - a);
    const inp = durations[Math.floor(durations.length * 0.02)] || durations[0] || 0;
    vitals.inp = {
      value: Math.round(inp),
      rating: inp <= 200 ? 'good' : inp <= 500 ? 'needs-improvement' : 'poor',
      interactions: eventEntries.length
    };
  }

  // Additional metrics
  const resourceEntries = performance.getEntriesByType('resource');
  const longTasks = performance.getEntriesByType('longtask');

  return {
    vitals,
    summary: {
      totalResources: resourceEntries.length,
      longTasks: longTasks.length,
      totalLongTaskTime: Math.round(longTasks.reduce((sum, t) => sum + t.duration, 0)),
      documentComplete: performance.timing
        ? performance.timing.domComplete - performance.timing.navigationStart
        : null
    },
    ratings: {
      lcp: vitals.lcp?.rating || 'unknown',
      fid: vitals.fid?.rating || 'unknown',
      cls: vitals.cls?.rating || 'unknown',
      fcp: vitals.fcp?.rating || 'unknown',
      ttfb: vitals.ttfb?.rating || 'unknown',
      inp: vitals.inp?.rating || 'unknown'
    }
  };
};
`;

// Ensure performance bridge is injected
async function ensurePerformanceBridge(page: Awaited<ReturnType<typeof getPage>>): Promise<void> {
  const hasPerfBridge = await page.evaluate(() => !!window.__PERF_DEBUG__?.getRenderCounts);
  if (!hasPerfBridge) {
    await page.evaluate(PERFORMANCE_BRIDGE);
  }
}

// Get render counts for components
export async function getRenderCount(params: GetRenderCountParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensurePerformanceBridge(page);

    // Initialize tracking first
    await page.evaluate(() => {
      return window.__PERF_DEBUG__.initRenderTracking();
    });

    const results = await page.evaluate(
      ({ componentName, threshold }) => {
        return window.__PERF_DEBUG__.getRenderCounts(componentName, threshold);
      },
      { componentName: params.componentName, threshold: params.threshold ?? 0 }
    );

    if (results.length === 0) {
      return {
        success: true,
        data: {
          message: 'No components found matching criteria',
          tip: 'Interact with the page to trigger renders, then call this tool again'
        },
      };
    }

    // Calculate some stats
    const totalRenders = results.reduce((sum, r) => sum + r.renders, 0);
    const highRenderComponents = results.filter(r => r.rendersPerInstance > 5);

    return {
      success: true,
      data: {
        summary: {
          componentsTracked: results.length,
          totalRenders,
          highRenderComponents: highRenderComponents.length
        },
        components: results,
        warnings: highRenderComponents.length > 0
          ? highRenderComponents.map(c => `${c.component} has ${c.rendersPerInstance} renders/instance - consider memoization`)
          : []
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get slow components
export async function getSlowComponents(params: GetSlowComponentsParams = {}): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensurePerformanceBridge(page);

    const results = await page.evaluate(
      ({ threshold, limit }) => {
        return window.__PERF_DEBUG__.measureSlowComponents(threshold, limit);
      },
      { threshold: params.threshold ?? 16, limit: params.limit ?? 20 }
    );

    if (results.length === 0) {
      return {
        success: true,
        data: {
          message: 'No slow components detected',
          note: 'This requires React Profiler data. Make sure the app is built with profiling enabled or use React DevTools.'
        },
      };
    }

    return {
      success: true,
      data: {
        threshold: `${params.threshold ?? 16}ms`,
        slowComponents: results,
        suggestions: results.slice(0, 3).map(c =>
          `${c.component} took ${c.actualDuration}ms - consider React.memo, useMemo, or code splitting`
        )
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get Web Vitals
export async function getWebVitals(): Promise<ToolResult> {
  try {
    const page = await getPage();
    await ensurePerformanceBridge(page);

    const result = await page.evaluate(() => {
      return window.__PERF_DEBUG__.getWebVitals();
    });

    // Add interpretations
    const interpretations: string[] = [];
    if (result.vitals.lcp?.rating === 'poor') {
      interpretations.push('LCP is poor - optimize largest content element loading');
    }
    if (result.vitals.cls?.rating === 'poor') {
      interpretations.push('CLS is poor - add size attributes to images/embeds, avoid inserting content above existing content');
    }
    if (result.vitals.fid?.rating === 'poor') {
      interpretations.push('FID is poor - reduce JavaScript execution time, break up long tasks');
    }
    if (result.summary.longTasks > 5) {
      interpretations.push(`${result.summary.longTasks} long tasks detected - consider code splitting or web workers`);
    }

    return {
      success: true,
      data: {
        ...result,
        interpretations: interpretations.length > 0 ? interpretations : ['All vitals look healthy!']
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
    __PERF_DEBUG__: {
      renderCounts: Map<string, number>;
      renderTimes: Map<string, number[]>;
      initialized: boolean;
      initRenderTracking: () => { success?: boolean; method?: string; alreadyInitialized?: boolean };
      getRenderCounts: (componentFilter?: string, threshold?: number) => Array<{
        component: string;
        instances: number;
        renders: number;
        rendersPerInstance: number;
      }>;
      measureSlowComponents: (threshold?: number, limit?: number) => Array<{
        component: string;
        path: string;
        actualDuration: number;
        selfDuration: number;
        treeBaseDuration: number;
      }>;
      getWebVitals: () => {
        vitals: {
          lcp: { value: number; rating: string; element?: string | null } | null;
          fid: { value: number; rating: string } | null;
          cls: { value: number; rating: string } | null;
          fcp: { value: number; rating: string } | null;
          ttfb: { value: number; rating: string } | null;
          inp: { value: number; rating: string; interactions?: number } | null;
        };
        summary: {
          totalResources: number;
          longTasks: number;
          totalLongTaskTime: number;
          documentComplete: number | null;
        };
        ratings: Record<string, string>;
      };
    };
  }
}
