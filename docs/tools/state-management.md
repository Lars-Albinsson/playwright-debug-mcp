---
layout: default
title: State Management Tools
---

# State Management Tools

Tools for inspecting application state across Redux, Zustand, React Query, and React Context.

---

## get_redux_state

Inspect Redux store state, including recent action history.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `path` | string | No | Dot-notation path to specific state slice |

**Response:**

```json
{
  "hasRedux": true,
  "state": {
    "user": {
      "isAuthenticated": true,
      "profile": { "name": "John", "email": "john@example.com" }
    },
    "cart": {
      "items": [],
      "total": 0
    }
  },
  "recentActions": [
    { "type": "USER_LOGIN_SUCCESS", "timestamp": 1234567890 },
    { "type": "CART_CLEAR", "timestamp": 1234567891 }
  ]
}
```

**Example:**

```
Get the Redux state
What's in the user slice of Redux?
Show me recent Redux actions
```

---

## get_zustand_stores

Discover and inspect Zustand stores in the application.

**Parameters:** None

**Response:**

```json
{
  "stores": [
    {
      "name": "useUserStore",
      "state": {
        "user": { "id": 1, "name": "John" },
        "isLoading": false
      },
      "path": "App > AuthProvider > UserStore"
    },
    {
      "name": "useCartStore",
      "state": {
        "items": [{ "id": 1, "name": "Product", "qty": 2 }],
        "total": 29.99
      },
      "path": "App > CartProvider > CartStore"
    }
  ],
  "count": 2
}
```

**Example:**

```
Find all Zustand stores
What's the state of the user store?
Show me the cart store state
```

---

## get_react_query_cache

View React Query (TanStack Query) cache contents.

**Parameters:** None

**Response:**

```json
{
  "hasReactQuery": true,
  "queries": [
    {
      "queryKey": ["users", 1],
      "state": "success",
      "data": { "id": 1, "name": "John" },
      "staleTime": 300000,
      "isStale": false,
      "lastUpdated": "2024-01-15T10:30:00Z"
    },
    {
      "queryKey": ["products"],
      "state": "loading",
      "data": null,
      "isStale": true
    }
  ],
  "mutations": [
    {
      "mutationKey": ["updateUser"],
      "state": "idle"
    }
  ]
}
```

**Example:**

```
Show the React Query cache
What queries are currently loading?
Is the user data stale?
```

---

## get_context_values

Extract values from React Context providers in the component tree.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `contextName` | string | No | Filter to specific context by name |

**Response:**

```json
{
  "contexts": [
    {
      "name": "ThemeContext",
      "value": {
        "theme": "dark",
        "toggleTheme": "[Function]"
      },
      "path": "App > ThemeProvider"
    },
    {
      "name": "AuthContext",
      "value": {
        "user": { "id": 1, "name": "John" },
        "isAuthenticated": true,
        "login": "[Function]",
        "logout": "[Function]"
      },
      "path": "App > AuthProvider"
    }
  ],
  "count": 2
}
```

**Example:**

```
Show all React Context values
What's in the AuthContext?
Get the theme context value
```

---

## Common Patterns

### Debug Authentication State

```
Get the Redux state for user
Get the AuthContext value
Why is the user not logged in?
```

### Track Cart State

```
Get Zustand stores
Show me the cart store
What items are in the cart?
```

### Check Data Loading

```
Get the React Query cache
Which queries are still loading?
Is the products data stale?
```

---

## Supported Libraries

| Library | Detection | Data Captured |
|---------|-----------|---------------|
| Redux | Full | State + recent actions |
| Redux Toolkit | Full | State + recent actions |
| Zustand | Full | Store state via fiber |
| React Query v3/v4/v5 | Full | Queries + mutations |
| TanStack Query | Full | Queries + mutations |
| React Context | Full | Provider values |

---

## Tips

### Finding State Issues

Start with the global state, then narrow down:

```
Get Redux state (overview)
Get the specific slice: user.profile
Check if the data matches what you expect
```

### Comparing State Sources

When data seems inconsistent:

```
Get Redux state
Get React Query cache
Compare the user data in both
```

---

[Back to Tools Reference →](./index)
