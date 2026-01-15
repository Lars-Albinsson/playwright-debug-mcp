---
layout: default
title: Playwright Debug MCP
---

# Playwright Debug MCP

**Debug frontend applications with AI assistance using Claude and Playwright.**

Playwright Debug MCP is a [Model Context Protocol](https://modelcontextprotocol.io/) server that gives AI assistants like Claude the ability to interact with live web applications through a browser. Ask Claude to navigate, click, fill forms, inspect the DOM, monitor network requests, debug React components, and analyze errors—all through natural conversation.

---

## Why Use This?

| Traditional Debugging | With Playwright Debug MCP |
|-----------------------|---------------------------|
| Manually reproduce issues | Ask Claude: "Navigate to /dashboard and check for errors" |
| Screenshot and paste into chat | Claude sees the live page and can interact with it |
| Copy-paste console errors | Claude captures all console logs automatically |
| Inspect React DevTools manually | Claude queries React component tree directly |
| Check Network tab for failed requests | Claude monitors all network traffic |

---

## Key Features

### 🌐 Browser Control
Navigate pages, click elements, fill forms, and automate user flows through natural language.

### 🔍 DOM Inspection
Get summarized DOM trees, element details, computed styles, and text content.

### 📡 Network Monitoring
Track API calls, view request/response bodies, filter by URL or status code.

### ⚛️ React DevTools
Inspect React component trees, props, state, and hooks—without browser DevTools.

### 🐛 Error Analysis
Intelligent error analysis with full context: console logs, failed requests, React state.

### 📸 Screenshots
Capture full-page or element screenshots for visual debugging.

---

## Quick Example

```
You: Navigate to https://myapp.com/login and try logging in with test@example.com

Claude: I'll navigate to the login page and fill in the credentials.
[Uses navigate, fill, and click tools]

The login failed. I found these issues:
- Console error: "TypeError: Cannot read property 'user' of undefined"
- Network: POST /api/auth returned 401 Unauthorized
- React: The AuthProvider component has isAuthenticated: false

Would you like me to analyze the error further?
```

---

## Get Started

```bash
# Install
npm install playwright-debug-mcp
npx playwright install chromium

# Or clone and build
git clone https://github.com/Lars-Albinsson/playwright-debug-mcp
cd playwright-debug-mcp
npm install && npm run build
```

[Read the full setup guide →](./getting-started)

---

## Tools Overview

| Category | Tools | Description |
|----------|-------|-------------|
| [Navigation](./tools/navigation) | 11 tools | Navigate, click, fill, scroll, type |
| [Inspection](./tools/inspection) | 3 tools | DOM tree, element details, text content |
| [Network](./tools/network) | 3 tools | Request monitoring, response inspection |
| [Console](./tools/console) | 2 tools | Log capture, filtering |
| [React](./tools/react) | 4 tools | Component tree, state, props |
| [State Management](./tools/state-management) | 4 tools | Redux, Zustand, React Query, Context |
| [Performance](./tools/performance) | 3 tools | Render tracking, slow components, Web Vitals |
| [Error Detection](./tools/errors) | 3 tools | Hydration errors, error boundaries, memory leaks |
| [Accessibility](./tools/accessibility) | 2 tools | WCAG audit, ARIA tree |
| [Advanced](./tools/advanced) | 5 tools | Screenshots, JS execution, error analysis |

[View all 40 tools →](./tools/)

---

## Use Cases

- **Interactive Debugging**: "What errors are on this page?"
- **Automated Testing**: Build test flows through conversation
- **React Development**: "Find the UserProfile component and show its state"
- **API Integration**: "What requests failed when I clicked submit?"
- **Accessibility Testing**: "Get all form elements and their labels"

[See example sessions →](./examples/)

---

## Requirements

- Node.js 18+
- Playwright (Chromium)
- Claude Desktop or Claude Code

---

## License

MIT License - Free for personal and commercial use.

---

<p align="center">
  <a href="./getting-started">Get Started</a> •
  <a href="./tools/">Tools Reference</a> •
  <a href="./examples/">Examples</a> •
  <a href="https://github.com/Lars-Albinsson/playwright-debug-mcp">GitHub</a>
</p>
