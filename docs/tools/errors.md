---
layout: default
title: Error Detection Tools
---

# Error Detection Tools

Tools for detecting hydration mismatches, inspecting error boundaries, and identifying memory leaks.

---

## find_hydration_errors

Detect SSR hydration mismatches in Next.js, Remix, and other SSR frameworks.

**Parameters:** None

**Response:**

```json
{
  "errors": [
    {
      "type": "console",
      "level": "error",
      "message": "Text content does not match server-rendered HTML",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "ssrMarkers": {
    "hasDataReactRoot": true,
    "hasNextData": true,
    "hasNuxtData": false,
    "hasRemixContext": false
  },
  "domIssues": [
    {
      "type": "duplicate-id",
      "id": "user-menu",
      "count": 2
    },
    {
      "type": "client-only-markers",
      "count": 3,
      "note": "These elements have hydration suppression"
    }
  ],
  "isSSR": true,
  "summary": "Found 1 potential hydration error(s)"
}
```

**Detected Patterns:**

- React hydration warnings
- Text content mismatches
- Server/client HTML differences
- Minified React errors (#418, #423, #425)
- Duplicate IDs
- Suspense boundary issues

**Example:**

```
Check for hydration errors
Why is there a hydration mismatch?
Are there any SSR issues?
```

---

## get_error_boundaries

Find React error boundaries and see which ones have caught errors.

**Parameters:** None

**Response:**

```json
{
  "boundaries": [
    {
      "name": "AppErrorBoundary",
      "path": "App > AppErrorBoundary",
      "hasError": false,
      "error": null,
      "errorInfo": null
    },
    {
      "name": "WidgetErrorBoundary",
      "path": "App > Dashboard > WidgetErrorBoundary",
      "hasError": true,
      "error": "Cannot read property 'data' of undefined",
      "errorStack": "TypeError: Cannot read property...",
      "errorInfo": null
    }
  ],
  "activeBoundaries": [
    {
      "name": "WidgetErrorBoundary",
      "hasError": true,
      "error": "Cannot read property 'data' of undefined"
    }
  ],
  "summary": "1 of 2 error boundaries have caught errors"
}
```

**Example:**

```
Find error boundaries
Which error boundaries have caught errors?
Why did the widget crash?
```

---

## detect_memory_leaks

Identify potential memory leak indicators in the application.

**Parameters:** None

**Response:**

```json
{
  "issues": [
    {
      "type": "memory-info",
      "usedJSHeapSize": "45MB",
      "totalJSHeapSize": "67MB",
      "jsHeapSizeLimit": "2048MB"
    },
    {
      "type": "large-dom",
      "nodeCount": 2500,
      "warning": "Large DOM can cause memory issues and slow performance",
      "suggestion": "Consider virtualization for long lists"
    },
    {
      "type": "large-globals",
      "items": [
        { "name": "eventLog", "type": "array", "size": 15000 }
      ],
      "warning": "Large global collections may indicate a memory leak"
    }
  ],
  "summary": "Found 3 potential memory-related issues",
  "suggestions": [
    "Use React DevTools Profiler to identify components that re-render frequently",
    "Check for useEffect cleanup functions",
    "Ensure event listeners are removed on unmount",
    "Consider using WeakMap/WeakSet for caching"
  ]
}
```

**Checked Indicators:**

| Check | Threshold | Meaning |
|-------|-----------|---------|
| Large DOM | > 1500 nodes | Performance and memory impact |
| Multiple React roots | > 1 | May cause leaks if not managed |
| Large global arrays | > 1000 items | May be accumulating data |
| Large global Maps/Sets | > 1000 items | May be accumulating data |
| Iframes | Any | Hold references if not cleaned |
| Memory warnings | In console | Direct memory issues |

**Example:**

```
Check for memory leaks
Is there a memory problem?
Why is the page getting slow?
```

---

## Common Patterns

### Debug SSR Issues

```
Find hydration errors
Check the console for more details
What's different between server and client?
```

### Investigate Crashes

```
Get error boundaries
Find which one caught the error
Get the full error stack
```

### Performance Degradation

```
Detect memory leaks
Get Web Vitals
Check if DOM is too large
```

---

## Hydration Error Causes

Common causes of hydration mismatches:

| Cause | Solution |
|-------|----------|
| Date/time rendering | Use `suppressHydrationWarning` or sync on client |
| Browser-only APIs | Check `typeof window` before using |
| Random IDs | Use deterministic ID generation |
| Conditional rendering | Ensure same conditions on server/client |
| Third-party scripts | Load after hydration completes |

---

## Memory Leak Prevention

```jsx
// Always clean up effects
useEffect(() => {
  const handler = () => { ... };
  window.addEventListener('resize', handler);

  return () => {
    window.removeEventListener('resize', handler);
  };
}, []);

// Cancel subscriptions
useEffect(() => {
  const subscription = api.subscribe(data => setData(data));

  return () => {
    subscription.unsubscribe();
  };
}, []);

// Use AbortController for fetches
useEffect(() => {
  const controller = new AbortController();

  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(setData);

  return () => {
    controller.abort();
  };
}, []);
```

---

## Tips

### Hydration Debugging

1. Check if the error happens on first load only
2. Look for browser-only code (localStorage, window)
3. Check for non-deterministic values (dates, random)
4. Verify API responses match between server/client

### Error Boundary Strategy

- Wrap major sections (header, sidebar, main content)
- Use granular boundaries for risky components
- Log errors to monitoring service
- Provide meaningful fallback UI

---

[Back to Tools Reference →](./index)
