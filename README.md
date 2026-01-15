# Playwright React Debug MCP

[![npm version](https://img.shields.io/npm/v/playwright-react-debug-mcp.svg)](https://www.npmjs.com/package/playwright-react-debug-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

**Debug React applications with AI assistance using Claude and Playwright.**

A [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that gives Claude the ability to interact with live web applications through a browser. Navigate pages, inspect the DOM, monitor network requests, debug React components, and analyze errors—all through natural conversation.

<!--
Add a demo GIF here:
![Demo](./docs/assets/demo.gif)
-->

---

## Why Use This?

| Traditional Debugging | With Playwright React Debug MCP |
|-----------------------|---------------------------|
| Manually reproduce issues | "Navigate to /dashboard and check for errors" |
| Screenshot and paste into chat | Claude sees the live page and interacts directly |
| Copy-paste console errors | Console logs captured automatically |
| Open React DevTools manually | Claude queries component tree with state/props |
| Check Network tab for failures | All HTTP traffic monitored and analyzed |

---

## Features

- **40 debugging tools** across 10 categories
- **Browser Control** - Navigate, click, fill forms, automate user flows
- **DOM Inspection** - Element details, computed styles, text extraction
- **Network Monitoring** - Request/response bodies, headers, timing
- **Console Capture** - Errors, warnings, logs with filtering
- **React DevTools** - Component tree, props, state, hooks inspection
- **State Management** - Redux, Zustand, React Query, Context inspection
- **Performance** - Render tracking, slow components, Web Vitals
- **Error Detection** - Hydration errors, error boundaries, memory leaks
- **Accessibility** - WCAG-style audits, ARIA tree inspection
- **Error Analysis** - AI-powered analysis with suggested fixes

---

## Quick Start

### Install

```bash
npm install -g playwright-react-debug-mcp
npx playwright install chromium
```

### Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "playwright-debug": {
      "command": "npx",
      "args": ["playwright-react-debug-mcp"]
    }
  }
}
```

### Configure Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "playwright-debug": {
      "command": "npx",
      "args": ["playwright-react-debug-mcp"],
      "transport": "stdio"
    }
  }
}
```

### Try It

```
You: Navigate to https://example.com and take a screenshot

Claude: I'll navigate to the page and capture a screenshot.
[Browser opens, navigates, returns screenshot]

Done! The page shows...
```

---

## Example Session

```
You: Navigate to my app at localhost:3000/login and try logging in
     with test@example.com

Claude: I'll navigate to the login page and fill in the credentials.

[Navigates, fills email/password, clicks submit]

The login failed. Let me check what happened:

- Console: "TypeError: Cannot read property 'token' of undefined"
- Network: POST /api/auth returned 200 but body is empty
- React: AuthProvider shows { isAuthenticated: false, error: null }

The API returns 200 without a token. The frontend expects response.data.token
but data is undefined. The error state isn't being set because the HTTP
status was 200.

Suggestions:
1. Backend should return { data: { token: "..." } } or proper error status
2. Frontend should validate response structure, not just HTTP status
```

---

## Available Tools

### Navigation & Interaction (11 tools)
| Tool | Description |
|------|-------------|
| `navigate` | Navigate to URL with wait conditions |
| `click` | Click elements (left/right/double) |
| `fill` | Fill form fields |
| `select` | Select dropdown options |
| `type` | Type text character-by-character |
| `hover` | Hover over elements |
| `scroll` | Scroll page or element into view |
| `wait_for` | Wait for element/navigation |
| `go_back` | Browser back |
| `go_forward` | Browser forward |
| `reload` | Reload page |

### Inspection (3 tools)
| Tool | Description |
|------|-------------|
| `get_dom` | Summarized DOM tree |
| `get_element` | Element details with styles |
| `get_text_content` | Extract visible text |

### Network (3 tools)
| Tool | Description |
|------|-------------|
| `get_network` | View requests with filtering |
| `get_request_detail` | Full request/response details |
| `clear_network` | Clear captured requests |

### Console (2 tools)
| Tool | Description |
|------|-------------|
| `get_console` | View logs with filtering |
| `clear_console` | Clear captured logs |

### React (4 tools)
| Tool | Description |
|------|-------------|
| `get_react_tree` | Component tree with hooks |
| `find_component` | Search components by name |
| `get_component_state` | Detailed state/props |
| `collect_component_instances` | All instances of a component |

### State Management (4 tools)
| Tool | Description |
|------|-------------|
| `get_redux_state` | Redux store state + actions |
| `get_zustand_stores` | Zustand store inspection |
| `get_react_query_cache` | React Query cache |
| `get_context_values` | React Context values |

### Performance (3 tools)
| Tool | Description |
|------|-------------|
| `get_render_count` | Component render tracking |
| `get_slow_components` | Slow component detection |
| `get_web_vitals` | Core Web Vitals (LCP, CLS, etc.) |

### Error Detection (3 tools)
| Tool | Description |
|------|-------------|
| `find_hydration_errors` | SSR hydration mismatches |
| `get_error_boundaries` | React error boundaries |
| `detect_memory_leaks` | Memory leak indicators |

### Accessibility (2 tools)
| Tool | Description |
|------|-------------|
| `run_accessibility_audit` | WCAG-style audit |
| `get_aria_tree` | Accessibility tree |

### Advanced (5 tools)
| Tool | Description |
|------|-------------|
| `screenshot` | Capture page or element |
| `evaluate_js` | Execute JavaScript |
| `explain_error` | AI error analysis |
| `get_debug_summary` | Page state overview |

---

## Use Cases

**Interactive Debugging**
```
What errors are on this page?
Why did the form submission fail?
```

**Automated Testing**
```
Fill the registration form and verify it submits successfully
Click through the checkout flow and check for errors
```

**React Development**
```
Find the UserProfile component and show its state
What props are being passed to the Modal?
Collect all Button instances and compare their usage
```

**API Integration**
```
What requests were made when I clicked submit?
Show me the response from the failed API call
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_CONSOLE_ENTRIES` | 100 | Console log buffer size |
| `MAX_NETWORK_ENTRIES` | 100 | Network request buffer size |
| `PLAYWRIGHT_HEADLESS` | false | Run browser headless |

```json
{
  "mcpServers": {
    "playwright-debug": {
      "command": "npx",
      "args": ["playwright-react-debug-mcp"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "true"
      }
    }
  }
}
```

---

## Development

```bash
# Clone
git clone https://github.com/Lars-Albinsson/playwright-react-debug-mcp
cd playwright-react-debug-mcp

# Install
npm install
npx playwright install chromium

# Build
npm run build

# Run
npm start

# Watch mode
npm run dev
```

---

## Documentation

- [Getting Started](https://lars-albinsson.github.io/playwright-react-debug-mcp/getting-started)
- [Tools Reference](https://lars-albinsson.github.io/playwright-react-debug-mcp/tools/)
- [Examples](https://lars-albinsson.github.io/playwright-react-debug-mcp/examples/)

---

## Requirements

- Node.js 18+
- Playwright (Chromium)
- Claude Desktop or Claude Code

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Related

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Playwright](https://playwright.dev/)
- [Claude](https://claude.ai/)
