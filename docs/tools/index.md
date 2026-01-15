---
layout: default
title: Tools Reference
---

# Tools Reference

Playwright Debug MCP provides **28 tools** organized into 6 categories. Each tool is designed to help AI assistants debug and interact with web applications.

---

## Tool Categories

| Category | Count | Description |
|----------|-------|-------------|
| [Navigation & Interaction](#navigation--interaction) | 11 | Navigate pages and interact with elements |
| [DOM Inspection](#dom-inspection) | 3 | Examine page structure and elements |
| [Network Monitoring](#network-monitoring) | 3 | Track and inspect HTTP requests |
| [Console](#console) | 2 | Capture and filter console logs |
| [React Debugging](#react-debugging) | 4 | Inspect React components and state |
| [Advanced](#advanced) | 5 | Screenshots, JS execution, error analysis |

---

## Navigation & Interaction

Tools for controlling the browser and interacting with page elements.

| Tool | Description |
|------|-------------|
| `navigate` | Navigate to a URL with configurable wait conditions |
| `click` | Click an element (supports double-click, right-click) |
| `fill` | Clear and fill a form field with text |
| `select` | Select options in a dropdown (single or multiple) |
| `type` | Type text character-by-character (for autocomplete) |
| `hover` | Hover over an element |
| `scroll` | Scroll page or scroll element into view |
| `wait_for` | Wait for element/navigation with state detection |
| `go_back` | Navigate back in browser history |
| `go_forward` | Navigate forward in browser history |
| `reload` | Reload the current page |

[View detailed documentation →](./navigation)

---

## DOM Inspection

Tools for examining the page structure and element details.

| Tool | Description |
|------|-------------|
| `get_dom` | Get summarized DOM tree with selective depth |
| `get_element` | Get detailed element info (styles, box, attributes) |
| `get_text_content` | Extract visible text from matched elements |

[View detailed documentation →](./inspection)

---

## Network Monitoring

Tools for tracking and inspecting HTTP traffic.

| Tool | Description |
|------|-------------|
| `get_network` | View captured requests with filtering |
| `get_request_detail` | Get full request/response with headers and body |
| `clear_network` | Clear captured network logs |

[View detailed documentation →](./network)

---

## Console

Tools for capturing and analyzing console output.

| Tool | Description |
|------|-------------|
| `get_console` | Get console logs with level/text filtering |
| `clear_console` | Clear captured console logs |

[View detailed documentation →](./console)

---

## React Debugging

Tools for inspecting React component trees, props, state, and hooks.

| Tool | Description |
|------|-------------|
| `get_react_tree` | Get complete React component tree |
| `find_component` | Search for components by name |
| `get_component_state` | Get detailed state/props for a component |
| `collect_component_instances` | Extract all instances of a component type |

[View detailed documentation →](./react)

---

## Advanced

Tools for screenshots, JavaScript execution, and error analysis.

| Tool | Description |
|------|-------------|
| `screenshot` | Capture full-page or element screenshot |
| `evaluate_js` | Execute JavaScript in page context |
| `explain_error` | AI-assisted error analysis with context |
| `get_debug_summary` | Quick overview of page state |

[View detailed documentation →](./advanced)

---

## Common Parameters

### Selectors

Most tools accept a `selector` parameter using [Playwright selectors](https://playwright.dev/docs/selectors):

```
# CSS selectors
button.submit
#login-form input[type="email"]
[data-testid="user-menu"]

# Text selectors
text=Submit
text=/Sign\s+In/i

# Role selectors
role=button[name="Submit"]
role=textbox[name="Email"]

# XPath
xpath=//button[@type="submit"]
```

### Wait Conditions

Navigation and wait tools support these conditions:

| Condition | Description |
|-----------|-------------|
| `load` | Wait for `load` event |
| `domcontentloaded` | Wait for `DOMContentLoaded` event |
| `networkidle` | Wait until no network activity for 500ms |

---

## Error Handling

All tools return structured responses:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Failure:**
```json
{
  "success": false,
  "error": "Element not found: #missing-element"
}
```

---

## Next Steps

- [Navigation Tools →](./navigation)
- [React Debugging →](./react)
- [See Examples →](../examples/)
