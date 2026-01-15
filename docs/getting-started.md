---
layout: default
title: Getting Started
---

# Getting Started

This guide will help you install and configure Playwright React Debug MCP for use with Claude Desktop or Claude Code.

---

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Claude Desktop** or **Claude Code** - [Get Claude](https://claude.ai/)

---

## Installation

### Option 1: npm (Recommended)

```bash
# Install globally
npm install -g playwright-react-debug-mcp

# Install Playwright browsers
npx playwright install chromium
```

### Option 2: Clone Repository

```bash
git clone https://github.com/Lars-Albinsson/playwright-react-debug-mcp
cd playwright-react-debug-mcp
npm install
npm run build
npx playwright install chromium
```

---

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

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

Or if you cloned the repository:

```json
{
  "mcpServers": {
    "playwright-debug": {
      "command": "node",
      "args": ["/absolute/path/to/playwright-react-debug-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop after saving.

### Claude Code

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

Or with a local installation:

```json
{
  "mcpServers": {
    "playwright-debug": {
      "command": "node",
      "args": ["./node_modules/playwright-react-debug-mcp/dist/index.js"],
      "transport": "stdio"
    }
  }
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_CONSOLE_ENTRIES` | 100 | Maximum console log entries to retain |
| `MAX_NETWORK_ENTRIES` | 100 | Maximum network request entries to retain |
| `PLAYWRIGHT_HEADLESS` | false | Run browser in headless mode |

Example:

```json
{
  "mcpServers": {
    "playwright-debug": {
      "command": "npx",
      "args": ["playwright-react-debug-mcp"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "true",
        "MAX_CONSOLE_ENTRIES": "200"
      }
    }
  }
}
```

---

## Verify Installation

1. Start Claude Desktop or Claude Code
2. Ask Claude: **"Navigate to https://example.com"**
3. You should see a browser window open and navigate to the page
4. Claude will confirm the navigation was successful

---

## First Debugging Session

Try these prompts to explore the capabilities:

```
Navigate to https://example.com and get a summary of the page
```

```
Take a screenshot of the current page
```

```
Get all console logs from the page
```

```
Show me the DOM tree
```

---

## Troubleshooting

### Browser doesn't open

- Ensure Playwright browsers are installed: `npx playwright install chromium`
- Check that the path in your config is correct
- Try running `node /path/to/dist/index.js` directly to see error messages

### "MCP server not found" error

- Verify the server name matches in your config
- Check that Node.js is in your PATH
- Restart Claude Desktop after config changes

### Permission errors on macOS

Grant Terminal or Claude Desktop permissions in System Preferences → Privacy & Security → Automation.

---

## Next Steps

- [Explore all available tools →](./tools/)
- [See example debugging sessions →](./examples/)
- [Contribute to the project →](https://github.com/Lars-Albinsson/playwright-react-debug-mcp/blob/main/CONTRIBUTING.md)
