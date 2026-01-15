---
layout: default
title: Navigation & Interaction Tools
---

# Navigation & Interaction Tools

Tools for controlling the browser and interacting with page elements.

---

## navigate

Navigate to a URL with configurable wait conditions.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `url` | string | Yes | URL to navigate to |
| `waitUntil` | string | No | Wait condition: `load`, `domcontentloaded`, `networkidle` |

**Example:**

```
Navigate to https://example.com/dashboard and wait for network idle
```

---

## click

Click on an element. Supports various click types and buttons.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | Yes | Element selector |
| `button` | string | No | `left`, `right`, `middle` (default: `left`) |
| `clickCount` | number | No | Number of clicks (default: 1, use 2 for double-click) |

**Example:**

```
Click the submit button
Double-click on the file to open it
Right-click on the image to see context menu
```

---

## fill

Clear a form field and fill it with text.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | Yes | Input element selector |
| `value` | string | Yes | Text to fill |

**Example:**

```
Fill the email field with test@example.com
```

---

## select

Select options in a dropdown. Supports single and multiple selection.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | Yes | Select element selector |
| `values` | string[] | Yes | Values to select |

**Example:**

```
Select "California" from the state dropdown
Select multiple options: "Red", "Blue", "Green"
```

---

## type

Type text character by character. Useful for autocomplete fields or simulating real user input.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | Yes | Input element selector |
| `text` | string | Yes | Text to type |
| `delay` | number | No | Delay between keystrokes in ms (default: 50) |

**Example:**

```
Type "react hooks" into the search box slowly to trigger autocomplete
```

---

## hover

Hover over an element. Useful for triggering hover states, tooltips, or dropdown menus.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | Yes | Element selector |

**Example:**

```
Hover over the user menu to show the dropdown
```

---

## scroll

Scroll the page or scroll an element into view.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | No | Element to scroll into view |
| `direction` | string | No | `up`, `down`, `left`, `right` |
| `amount` | number | No | Pixels to scroll |

**Example:**

```
Scroll down 500 pixels
Scroll the footer into view
```

---

## wait_for

Wait for an element to reach a specific state, or wait for navigation.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | No | Element selector (for element waiting) |
| `state` | string | No | `visible`, `hidden`, `attached`, `detached` |
| `navigation` | boolean | No | Wait for navigation event |
| `timeout` | number | No | Maximum wait time in ms (default: 30000) |

**Example:**

```
Wait for the loading spinner to disappear
Wait for the modal to become visible
Wait for navigation after form submission
```

---

## go_back

Navigate back in browser history.

**Parameters:** None

**Example:**

```
Go back to the previous page
```

---

## go_forward

Navigate forward in browser history.

**Parameters:** None

**Example:**

```
Go forward in history
```

---

## reload

Reload the current page.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `waitUntil` | string | No | Wait condition after reload |

**Example:**

```
Reload the page and wait for network idle
```

---

## Selector Tips

### CSS Selectors

```
# By ID
#login-button

# By class
.btn-primary

# By attribute
[data-testid="submit"]
input[type="email"]

# Combining
form#login .submit-btn
```

### Text Selectors

```
# Exact match
text=Submit

# Case-insensitive regex
text=/sign in/i

# Partial match
text=Sign
```

### Role Selectors (Accessibility)

```
role=button[name="Submit"]
role=textbox[name="Email"]
role=link[name="Home"]
```

---

## Common Patterns

### Form Submission

```
Fill the email field with test@example.com
Fill the password field with secret123
Click the login button
Wait for navigation
```

### Autocomplete

```
Type "react" slowly into the search box
Wait for the suggestions dropdown to appear
Click the first suggestion
```

### Dropdown Menu

```
Hover over the user menu
Wait for the dropdown to be visible
Click "Sign Out"
```

---

[Back to Tools Reference →](./index)
