---
layout: default
title: DOM Inspection Tools
---

# DOM Inspection Tools

Tools for examining page structure and element details.

---

## get_dom

Get a summarized DOM tree with selective depth traversal. Useful for understanding page structure without overwhelming output.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | No | Root element selector (default: `body`) |
| `maxDepth` | number | No | Maximum tree depth (default: 5) |

**Response:**

```json
{
  "tree": {
    "tag": "body",
    "children": [
      {
        "tag": "header",
        "class": "site-header",
        "children": [...]
      },
      {
        "tag": "main",
        "id": "content",
        "children": [...]
      }
    ]
  }
}
```

**Example:**

```
Get the DOM tree for the main content area
Show me the structure of the navigation menu
```

---

## get_element

Get detailed information about a specific element including computed styles, bounding box, and attributes.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | Yes | Element selector |

**Response:**

```json
{
  "tag": "button",
  "id": "submit-btn",
  "class": "btn btn-primary",
  "text": "Submit",
  "attributes": {
    "type": "submit",
    "disabled": "false",
    "data-testid": "submit-button"
  },
  "boundingBox": {
    "x": 100,
    "y": 200,
    "width": 120,
    "height": 40
  },
  "computedStyles": {
    "display": "inline-flex",
    "backgroundColor": "rgb(59, 130, 246)",
    "color": "rgb(255, 255, 255)",
    "fontSize": "14px"
  },
  "isVisible": true,
  "isEnabled": true
}
```

**Example:**

```
Get details about the submit button
What styles are applied to the error message?
Is the login button visible and enabled?
```

---

## get_text_content

Extract visible text from elements matching a selector. Useful for verifying content or extracting data.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | Yes | Element selector |
| `all` | boolean | No | Get text from all matches (default: false) |

**Response:**

```json
{
  "text": "Welcome, John Doe",
  "count": 1
}
```

Or with `all: true`:

```json
{
  "texts": [
    "Item 1",
    "Item 2",
    "Item 3"
  ],
  "count": 3
}
```

**Example:**

```
Get the text from all error messages on the page
What does the welcome message say?
Extract all list items from the sidebar
```

---

## Use Cases

### Understanding Page Structure

```
Get the DOM tree to understand the page layout
```

Returns a hierarchical view of elements, helping identify the structure without looking at raw HTML.

### Debugging CSS Issues

```
Get element details for the header to check its styles
```

Shows computed styles, making it easy to debug why elements don't appear as expected.

### Verifying Content

```
Get the text content of all validation error messages
```

Extracts visible text to verify error messages, labels, or dynamic content.

### Locating Elements

```
Get the DOM tree for the form to find the right selectors
```

Helps identify the correct selectors for subsequent interactions.

---

## Tips

### Limiting Depth

Large pages can produce overwhelming output. Use `maxDepth` to limit:

```
Get the DOM tree with maxDepth 3 to see the high-level structure
```

### Scoping to Sections

Start from a specific container to reduce noise:

```
Get the DOM tree starting from the #sidebar element
```

### Checking Visibility

Use `get_element` to verify if elements are visible and enabled before interaction:

```
Check if the submit button is visible and enabled
```

---

[Back to Tools Reference →](./index)
