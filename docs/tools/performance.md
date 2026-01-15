---
layout: default
title: Performance Tools
---

# Performance Tools

Tools for tracking component renders, detecting slow components, and measuring Core Web Vitals.

---

## get_render_count

Track how many times components have rendered, useful for detecting unnecessary re-renders.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `componentName` | string | No | Filter by component name (partial match) |
| `threshold` | number | No | Only show components with renders >= threshold |

**Response:**

```json
{
  "summary": {
    "componentsTracked": 42,
    "totalRenders": 156,
    "highRenderComponents": 3
  },
  "components": [
    {
      "component": "UserProfile",
      "instances": 1,
      "renders": 15,
      "rendersPerInstance": 15
    },
    {
      "component": "Button",
      "instances": 8,
      "renders": 24,
      "rendersPerInstance": 3
    }
  ],
  "warnings": [
    "UserProfile has 15 renders/instance - consider memoization"
  ]
}
```

**Example:**

```
Get render counts for all components
How many times has UserProfile re-rendered?
Show components with more than 10 renders
```

---

## get_slow_components

Detect components that take a long time to render using React Profiler data.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `threshold` | number | No | Minimum render time in ms (default: 16) |
| `limit` | number | No | Max results to return (default: 20) |

**Response:**

```json
{
  "threshold": "16ms",
  "slowComponents": [
    {
      "component": "DataGrid",
      "path": "App > Dashboard > DataGrid",
      "actualDuration": 45.23,
      "selfDuration": 12.5,
      "treeBaseDuration": 78.4
    },
    {
      "component": "Chart",
      "path": "App > Dashboard > Chart",
      "actualDuration": 32.1,
      "selfDuration": 28.7,
      "treeBaseDuration": 35.2
    }
  ],
  "suggestions": [
    "DataGrid took 45.23ms - consider React.memo, useMemo, or code splitting",
    "Chart took 32.1ms - consider React.memo, useMemo, or code splitting"
  ]
}
```

**Example:**

```
Find slow components
Which components take longest to render?
Show components slower than 50ms
```

---

## get_web_vitals

Measure Core Web Vitals and other performance metrics.

**Parameters:** None

**Response:**

```json
{
  "vitals": {
    "lcp": {
      "value": 1850,
      "rating": "good",
      "element": "IMG"
    },
    "fid": {
      "value": 45,
      "rating": "good"
    },
    "cls": {
      "value": 0.05,
      "rating": "good"
    },
    "fcp": {
      "value": 1200,
      "rating": "good"
    },
    "ttfb": {
      "value": 320,
      "rating": "good"
    },
    "inp": {
      "value": 180,
      "rating": "good",
      "interactions": 15
    }
  },
  "summary": {
    "totalResources": 45,
    "longTasks": 2,
    "totalLongTaskTime": 156,
    "documentComplete": 2450
  },
  "ratings": {
    "lcp": "good",
    "fid": "good",
    "cls": "good",
    "fcp": "good",
    "ttfb": "good",
    "inp": "good"
  },
  "interpretations": [
    "All vitals look healthy!"
  ]
}
```

**Example:**

```
Get Web Vitals
What's the LCP score?
Are there any performance issues?
```

---

## Web Vitals Reference

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2500ms | ≤ 4000ms | > 4000ms |
| **FID** (First Input Delay) | ≤ 100ms | ≤ 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| **FCP** (First Contentful Paint) | ≤ 1800ms | ≤ 3000ms | > 3000ms |
| **TTFB** (Time to First Byte) | ≤ 800ms | ≤ 1800ms | > 1800ms |
| **INP** (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |

---

## Common Patterns

### Performance Audit

```
Get Web Vitals (overall health)
Get slow components (React-specific)
Get render counts (re-render issues)
```

### Optimize Re-renders

```
Get render counts
Find components with high renders/instance
Those need React.memo or useMemo
```

### Debug Slow Interactions

```
Get Web Vitals (check INP)
Get slow components
Find what's blocking interactions
```

---

## Tips

### Interpreting Render Counts

- **1-2 renders/instance**: Normal, healthy
- **3-5 renders/instance**: Worth investigating
- **6+ renders/instance**: Likely needs memoization

### React Profiler Data

For `get_slow_components` to work best:
- Use React development build, or
- Build with profiling enabled (`--profile` flag)
- React DevTools should be installed

### Long Tasks

If `longTasks > 5`, consider:
- Code splitting large bundles
- Moving heavy computation to Web Workers
- Breaking up synchronous operations

---

[Back to Tools Reference →](./index)
