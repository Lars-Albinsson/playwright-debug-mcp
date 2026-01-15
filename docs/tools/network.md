---
layout: default
title: Network Monitoring Tools
---

# Network Monitoring Tools

Tools for tracking and inspecting HTTP traffic. All requests are automatically captured when the browser is active.

---

## get_network

View captured network requests with optional filtering. Requests are stored in a circular buffer (default: 100 entries).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `urlPattern` | string | No | Filter by URL (substring match) |
| `method` | string | No | Filter by HTTP method (`GET`, `POST`, etc.) |
| `status` | number | No | Filter by status code |
| `hasError` | boolean | No | Filter to only failed requests |
| `limit` | number | No | Maximum entries to return |

**Response:**

```json
{
  "requests": [
    {
      "id": "req_001",
      "url": "https://api.example.com/users",
      "method": "GET",
      "status": 200,
      "statusText": "OK",
      "duration": 145,
      "size": 2048,
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "req_002",
      "url": "https://api.example.com/auth",
      "method": "POST",
      "status": 401,
      "statusText": "Unauthorized",
      "duration": 89,
      "size": 128,
      "timestamp": "2024-01-15T10:30:01.000Z"
    }
  ],
  "total": 2
}
```

**Example:**

```
Show all network requests
Show failed API requests (status >= 400)
Show all POST requests to /api/
What requests were made to the auth endpoint?
```

---

## get_request_detail

Get full details for a specific request including headers and body content.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `requestId` | string | Yes | Request ID from `get_network` |

**Response:**

```json
{
  "request": {
    "url": "https://api.example.com/users",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer eyJ..."
    },
    "body": {
      "email": "user@example.com",
      "name": "John Doe"
    }
  },
  "response": {
    "status": 201,
    "statusText": "Created",
    "headers": {
      "Content-Type": "application/json",
      "X-Request-Id": "abc123"
    },
    "body": {
      "id": 42,
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "timing": {
    "start": 1705315800000,
    "end": 1705315800145,
    "duration": 145
  }
}
```

**Example:**

```
Get details for the failed auth request
Show me the request body that was sent to /api/users
What response did the server return for request req_002?
```

---

## clear_network

Clear all captured network requests. Useful for focusing on requests from a specific action.

**Parameters:** None

**Example:**

```
Clear network logs
Now click submit and show me only the requests from that action
```

---

## Automatic Capture

Network requests are automatically captured when:

- The browser navigates to a new page
- JavaScript makes fetch/XHR requests
- Images, scripts, and other resources load

**What's captured:**

| Data | Size Limit | Notes |
|------|------------|-------|
| URL, method, status | Always | Basic request info |
| Request headers | Always | All headers |
| Response headers | Always | All headers |
| Request body | 50KB | JSON and text only |
| Response body | 50KB | JSON and text only |
| Timing | Always | Start, end, duration |

Large bodies are truncated with a note indicating the original size.

---

## Common Patterns

### Debug API Failures

```
Show all failed requests (status >= 400)
Get details for the failed request
```

### Monitor Form Submission

```
Clear network logs
Fill and submit the form
Show the POST request that was made
What was the response?
```

### Check Authentication

```
Show requests to /api/auth
Are the correct headers being sent?
```

### Performance Analysis

```
Show all network requests sorted by duration
Which requests are taking the longest?
```

---

## Tips

### Filtering Effectively

Use URL patterns to focus on specific APIs:

```
Show requests to /api/users
Show requests containing "graphql"
```

### Correlating with Errors

When debugging errors, check for failed requests:

```
Show failed network requests
Explain the error with network context
```

### Clearing Before Actions

Clear logs before a specific action to isolate requests:

```
Clear network logs
Click the login button
Show what requests were made
```

---

[Back to Tools Reference →](./index)
