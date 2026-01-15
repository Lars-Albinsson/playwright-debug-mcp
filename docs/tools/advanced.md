---
layout: default
title: Advanced Tools
---

# Advanced Tools

Tools for screenshots, JavaScript execution, and intelligent error analysis.

---

## screenshot

Capture a screenshot of the page or a specific element. Returns a base64-encoded PNG.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | No | Element to capture (default: full page) |
| `fullPage` | boolean | No | Capture full scrollable page (default: false) |

**Response:**

```json
{
  "image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "format": "png",
  "width": 1280,
  "height": 720
}
```

**Example:**

```
Take a screenshot of the page
Capture a screenshot of just the header
Take a full-page screenshot including everything below the fold
```

---

## evaluate_js

Execute arbitrary JavaScript in the page context. Useful for:

- Reading page variables
- Triggering custom events
- Testing JavaScript logic
- Accessing browser APIs

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `script` | string | Yes | JavaScript code to execute |

**Response:**

```json
{
  "result": { ... },
  "type": "object"
}
```

**Example:**

```
Execute: window.location.href
Execute: document.querySelectorAll('button').length
Execute: localStorage.getItem('authToken')
Execute: window.__REDUX_STORE__.getState()
```

**Security Note:** Be careful with scripts that modify page state during debugging.

---

## explain_error

Intelligent error analysis that combines multiple data sources to explain what went wrong and suggest fixes.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `errorText` | string | No | Specific error to focus on |
| `includeNetwork` | boolean | No | Include network context (default: true) |
| `includeReact` | boolean | No | Include React state (default: true) |

**Response:**

```json
{
  "error": {
    "type": "TypeError",
    "message": "Cannot read property 'user' of undefined",
    "location": "UserProfile.js:42",
    "stack": "..."
  },
  "context": {
    "console": [
      { "level": "error", "text": "..." }
    ],
    "network": [
      { "url": "/api/user", "status": 401 }
    ],
    "react": {
      "component": "UserProfile",
      "state": { "user": null }
    }
  },
  "analysis": {
    "category": "Data Access Error",
    "explanation": "The UserProfile component tried to access user.name but the user object is null. This likely happened because the /api/user request returned 401 Unauthorized.",
    "suggestions": [
      "Check if the user is authenticated before rendering UserProfile",
      "Add null checking: user?.name or user && user.name",
      "Investigate why the API returned 401 - check auth token"
    ]
  }
}
```

**Example:**

```
Explain the error on this page
What's causing the TypeError?
Analyze the errors with full context
```

---

## get_debug_summary

Get a quick overview of the page's current state. Useful as a first step when starting a debugging session.

**Parameters:** None

**Response:**

```json
{
  "url": "https://example.com/dashboard",
  "title": "Dashboard - MyApp",
  "status": {
    "errors": 2,
    "warnings": 3,
    "failedRequests": 1
  },
  "summary": {
    "hasErrors": true,
    "errorTypes": ["TypeError", "NetworkError"],
    "failedEndpoints": ["/api/user"],
    "reactDetected": true,
    "componentCount": 42
  }
}
```

**Example:**

```
Get a debug summary of this page
What's the current state? Any errors?
Give me an overview before I start debugging
```

---

## Common Patterns

### Quick Health Check

```
Get a debug summary
```

Quickly see if there are errors, failed requests, or issues.

### Deep Error Investigation

```
Get debug summary (overview)
Explain the error (detailed analysis)
Get console logs for more context
Show failed network requests
```

### Visual Debugging

```
Take a screenshot to see the current state
```

Useful when layout issues can't be described through DOM alone.

### Custom Data Access

```
Execute: window.__APP_STATE__
Execute: JSON.parse(localStorage.getItem('user'))
```

Access application-specific data structures.

---

## Error Categories

The `explain_error` tool recognizes these error patterns:

| Category | Examples |
|----------|----------|
| **TypeError** | Cannot read property, is not a function |
| **Network** | Failed to fetch, 4xx/5xx responses |
| **CORS** | Cross-origin request blocked |
| **Syntax** | Unexpected token, parsing errors |
| **Reference** | Variable is not defined |
| **React** | Invalid hook call, render errors |
| **Promise** | Unhandled rejection |

---

## Tips

### Start with Summary

Always start debugging sessions with `get_debug_summary`:

```
Get a debug summary to see what we're dealing with
```

### Combine with Other Tools

Error analysis is most powerful when combined:

```
Explain the error
Show me the React component that crashed
Get the network request that failed
```

### JavaScript for Edge Cases

When built-in tools don't cover your case:

```
Execute: window.myApp.debugInfo()
Execute: document.cookie
Execute: performance.getEntriesByType('resource')
```

### Screenshots for Visual Issues

Layout and styling issues need visual context:

```
Take a screenshot of the modal
The button looks wrong - take a screenshot
```

---

[Back to Tools Reference →](./index)
