# Playwright Debug MCP

A Model Context Protocol (MCP) server for frontend debugging with Playwright. This tool enables AI assistants like Claude to interact with web applications through a browser, making it easier to debug frontend issues, test user flows, and inspect live applications.

## Features

- **Browser Control**: Navigate, click, fill forms, and interact with web pages
- **DOM Inspection**: Get element details, DOM tree, and text content
- **Network Monitoring**: Track API calls, view request/response details
- **Console Logs**: Capture and analyze console output
- **Screenshots**: Take screenshots for visual debugging
- **JavaScript Execution**: Run custom JavaScript in the page context
- **React DevTools**: Inspect React component tree, props, and state
- **Error Analysis**: Analyze errors with full context (network, React state, etc.)

## Installation

```bash
npm install
npm run build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "playwright-debug": {
      "command": "node",
      "args": [
        "/path/to/playwright-debug-mcp/dist/index.js"
      ]
    }
  }
}
```

### With Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "playwright-debug": {
      "command": "node",
      "args": [
        "/path/to/playwright-debug-mcp/dist/index.js"
      ],
      "transport": "stdio"
    }
  }
}
```

## Available Tools

### Navigation & Interaction
- `navigate` - Navigate to a URL
- `click` - Click on an element
- `fill` - Fill a form field
- `select` - Select dropdown options
- `type` - Type text character by character
- `hover` - Hover over an element
- `scroll` - Scroll the page or element
- `go_back` / `go_forward` / `reload` - Browser navigation

### Inspection
- `get_dom` - Get summarized DOM tree
- `get_element` - Get detailed element info
- `get_text_content` - Get visible text from elements
- `get_console` - View console logs (with filtering)
- `get_network` - View network requests (with filtering)
- `get_request_detail` - Get detailed request/response info
- `get_debug_summary` - Quick overview of page state

### React Debugging
- `get_react_tree` - Get React component tree
- `find_component` - Find React components by name
- `get_component_state` - Get component props and state

### Advanced
- `screenshot` - Capture screenshots
- `evaluate_js` - Execute JavaScript in page context
- `explain_error` - Analyze errors with full context
- `wait_for` - Wait for elements or navigation

## Example Usage

Ask Claude:

```
Navigate to https://example.com and check for any console errors
```

```
Click the login button, fill in test credentials, and verify the dashboard loads
```

```
Get the React component tree and find the UserProfile component
```

```
Analyze any errors on the page with full context
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Run
npm start
```

## License

MIT
