---
layout: default
title: Console Tools
---

# Console Tools

Tools for capturing and analyzing console output from the browser.

---

## get_console

Retrieve captured console logs with optional filtering. Logs are stored in a circular buffer (default: 100 entries).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `level` | string | No | Filter by level: `log`, `info`, `warn`, `error` |
| `search` | string | No | Filter by text content (substring match) |
| `limit` | number | No | Maximum entries to return |
| `since` | string | No | Only logs after this timestamp |

**Response:**

```json
{
  "logs": [
    {
      "level": "error",
      "text": "TypeError: Cannot read property 'user' of undefined",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "location": "app.js:42:15"
    },
    {
      "level": "warn",
      "text": "Deprecation warning: componentWillMount is deprecated",
      "timestamp": "2024-01-15T10:29:58.000Z",
      "location": "UserProfile.js:12:5"
    },
    {
      "level": "log",
      "text": "User logged in: john@example.com",
      "timestamp": "2024-01-15T10:29:55.000Z",
      "location": "auth.js:78:10"
    }
  ],
  "total": 3
}
```

**Example:**

```
Show all console logs
Show only errors from the console
Are there any warnings about deprecation?
Search console logs for "TypeError"
```

---

## clear_console

Clear all captured console logs. Useful for focusing on logs from a specific action.

**Parameters:** None

**Example:**

```
Clear console logs
Now click the button and show me any errors
```

---

## Log Levels

| Level | Description | Common Use |
|-------|-------------|------------|
| `log` | General output | Debug info, state logging |
| `info` | Informational | Application status |
| `warn` | Warnings | Deprecations, potential issues |
| `error` | Errors | Exceptions, failures |

---

## Automatic Capture

Console logs are automatically captured from:

- `console.log()`, `console.info()`, `console.warn()`, `console.error()`
- Uncaught exceptions
- Promise rejections
- Network errors (some browsers)

**What's captured:**

| Data | Description |
|------|-------------|
| Level | log, info, warn, error |
| Text | Full message content |
| Timestamp | When the log occurred |
| Location | Source file and line number (when available) |

---

## Common Patterns

### Find All Errors

```
Show all console errors
```

### Debug Specific Issue

```
Search console for "undefined"
Show logs containing "API"
```

### Isolate Action

```
Clear console
Click the submit button
Show any new errors
```

### Check for Warnings

```
Show all console warnings
Are there any deprecation warnings?
```

---

## Tips

### Combining Filters

Use multiple parameters for precise filtering:

```
Show errors containing "TypeError"
```

### Time-based Filtering

Focus on recent logs:

```
Show console logs from the last 30 seconds
Show logs since I clicked the button
```

### Correlating with Network

Errors often relate to failed requests:

```
Show console errors
Show failed network requests
Explain the relationship
```

---

## Error Analysis

For deeper error analysis, use the `explain_error` tool which combines:

- Console errors
- Failed network requests
- React component state (if applicable)
- Suggested fixes

```
Explain the error on this page
```

---

[Back to Tools Reference →](./index)
