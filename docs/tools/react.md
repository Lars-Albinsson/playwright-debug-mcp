---
layout: default
title: React Debugging Tools
---

# React Debugging Tools

Tools for inspecting React component trees, props, state, and hooks. Works with React 16+ applications without requiring React DevTools.

---

## How It Works

These tools inject a React Fiber Bridge into the page that:

1. Locates React roots (`[data-reactroot]`, `#root`, `#app`, `#__next`)
2. Traverses the React Fiber tree
3. Extracts component names, props, state, and hooks
4. Serializes data safely for transport

---

## get_react_tree

Get the complete React component tree with props and hooks.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `maxDepth` | number | No | Maximum tree depth (default: 10) |
| `includeHooks` | boolean | No | Include hook state (default: true) |

**Response:**

```json
{
  "tree": {
    "name": "App",
    "props": {},
    "hooks": [],
    "children": [
      {
        "name": "AuthProvider",
        "props": {},
        "hooks": [
          { "type": "useState", "value": { "user": null } }
        ],
        "children": [
          {
            "name": "Router",
            "children": [
              {
                "name": "Dashboard",
                "props": { "userId": 42 },
                "hooks": [
                  { "type": "useState", "value": { "loading": false } },
                  { "type": "useEffect", "deps": ["userId"] }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**Example:**

```
Get the React component tree
Show me the component hierarchy for this page
What components are mounted?
```

---

## find_component

Search for components by name and get their state/props.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Component name (partial match, case-insensitive) |
| `all` | boolean | No | Return all matches (default: false, returns first) |

**Response:**

```json
{
  "components": [
    {
      "name": "UserProfile",
      "path": "App > AuthProvider > Router > Dashboard > UserProfile",
      "props": {
        "userId": 42,
        "showAvatar": true
      },
      "hooks": [
        { "type": "useState", "value": { "user": { "name": "John" } } },
        { "type": "useEffect", "deps": ["userId"] }
      ]
    }
  ],
  "count": 1
}
```

**Example:**

```
Find the UserProfile component
Find all Button components
Search for components with "Modal" in the name
```

---

## get_component_state

Get detailed state and props for a specific component by path.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `path` | string | Yes | Component path from `find_component` |

**Response:**

```json
{
  "name": "UserProfile",
  "path": "App > AuthProvider > Router > Dashboard > UserProfile",
  "props": {
    "userId": 42,
    "showAvatar": true,
    "onUpdate": "[Function]"
  },
  "state": {
    "user": {
      "id": 42,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "loading": false,
    "error": null
  },
  "hooks": [
    {
      "type": "useState",
      "name": "user",
      "value": { "id": 42, "name": "John Doe" }
    },
    {
      "type": "useState",
      "name": "loading",
      "value": false
    },
    {
      "type": "useCallback",
      "deps": ["userId"]
    }
  ]
}
```

**Example:**

```
Get the state of the UserProfile component
What's the current state of AuthProvider?
Show me the props being passed to Dashboard
```

---

## collect_component_instances

Extract all instances of a component type across the tree, with their rendered HTML output.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `componentName` | string | Yes | Component name to collect |
| `includeHtml` | boolean | No | Include rendered HTML (default: true) |

**Response:**

```json
{
  "componentName": "Button",
  "instances": [
    {
      "path": "App > Form > Button",
      "props": {
        "variant": "primary",
        "onClick": "[Function]"
      },
      "hooks": [{ "type": "useState", "value": false }],
      "html": "<button class=\"btn-primary\">Submit</button>"
    },
    {
      "path": "App > Header > Button",
      "props": {
        "variant": "secondary",
        "onClick": "[Function]"
      },
      "hooks": [],
      "html": "<button class=\"btn-secondary\">Cancel</button>"
    }
  ],
  "count": 2
}
```

**Example:**

```
Collect all Button component instances
Show me every Card component and how it renders
Find all instances of ErrorBoundary
```

---

## Common Patterns

### Debug State Issues

```
Find the AuthProvider component
What's the current user state?
Why is isAuthenticated false?
```

### Understand Component Hierarchy

```
Get the React tree to see the component structure
Find where UserProfile is in the tree
```

### Compare Component Instances

```
Collect all Card component instances
Why do some cards look different?
```

### Track Props Flow

```
Find the Dashboard component
What props are being passed down?
Get the component state to see what it's receiving
```

---

## Supported Hook Types

| Hook | Detection | Data Captured |
|------|-----------|---------------|
| `useState` | Full | Current value |
| `useReducer` | Full | Current state |
| `useRef` | Full | Current ref value |
| `useMemo` | Partial | Memoized value |
| `useCallback` | Partial | Dependencies |
| `useEffect` | Partial | Dependencies |
| `useContext` | Full | Context value |

---

## Limitations

- **Minified names**: Production builds may show minified component names
- **Large state**: Very large state objects are truncated
- **Non-serializable**: Functions, Symbols, and circular refs are sanitized
- **Concurrent mode**: Some features of React 18 concurrent mode may affect traversal

---

## Tips

### Finding the Right Component

Start broad, then narrow down:

```
Get the React tree (overview)
Find components with "User" in the name
Get state for the specific one I need
```

### Production Debugging

Even with minified names, you can often identify components by:

- Their position in the tree
- Their props structure
- Their state shape

```
Get the React tree
Find the component that has userId in its props
```

---

[Back to Tools Reference →](./index)
