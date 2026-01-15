---
layout: default
title: Examples
---

# Example Sessions

Real-world examples of debugging with Playwright Debug MCP.

---

## Debugging a Login Failure

**Scenario:** Users report they can't log in.

```
You: Navigate to https://myapp.com/login

Claude: Navigated to the login page. I can see a form with email and password fields.

You: Try logging in with test@example.com and password123

Claude: I'll fill in the credentials and submit.
[Uses fill for email, fill for password, click on submit]

The login failed. Let me gather information:

[Uses get_console, get_network]

I found the issue:
- Console: "TypeError: Cannot read property 'token' of undefined"
- Network: POST /api/auth returned 200 but the response body is empty

The API returns 200 but without a token. The frontend tries to access
response.data.token but data is undefined.

Suggestions:
1. Check the backend /api/auth endpoint - it should return { data: { token: "..." } }
2. Add null checking on the frontend: response.data?.token

You: Can you show me the AuthProvider component state?

Claude: [Uses find_component for AuthProvider]

AuthProvider state:
- isAuthenticated: false
- user: null
- loading: false
- error: null

The error is null even though login failed - the error handling isn't
capturing the issue.
```

---

## Finding a React State Bug

**Scenario:** A counter component isn't updating.

```
You: Navigate to localhost:3000/counter

Claude: Navigated to the counter page. I see a counter showing "0" and
increment/decrement buttons.

You: Click increment 3 times and check the state

Claude: [Uses click 3 times, then get_react_tree]

Interesting - the UI still shows "0" but let me check the component state.

[Uses find_component for Counter]

Counter component state:
- count: 3 (useState)

The state IS updating (count is 3) but the UI shows 0. This suggests
the component isn't re-rendering.

Let me check the component structure:

[Uses get_component_state]

Found it! The Counter component is wrapped in React.memo() and the
count is being passed as a prop, but the parent is using a stale
reference.

The issue is in the parent - it's not properly triggering updates.

You: Show me the parent component

Claude: [Uses get_react_tree to trace path]

The CounterContainer passes count like this:
props: { count: cachedCount }

And cachedCount comes from a useMemo with empty deps [], so it never
updates.
```

---

## Debugging Network Issues

**Scenario:** API requests are failing silently.

```
You: Go to https://myapp.com/dashboard and check for failed requests

Claude: [Uses navigate, then get_debug_summary]

Debug summary:
- 2 console errors
- 3 failed network requests
- React detected with 28 components

[Uses get_network with hasError: true]

Failed requests:
1. GET /api/user - 401 Unauthorized
2. GET /api/notifications - 401 Unauthorized
3. GET /api/dashboard-data - 500 Internal Server Error

The first two are auth issues, the third is a server error.

[Uses get_request_detail for the 500 error]

Request:
- GET /api/dashboard-data
- Headers include valid auth token

Response:
- 500 Internal Server Error
- Body: { "error": "Database connection failed" }

The server has a database issue. The auth failures are likely because
the auth middleware also needs the database.

You: Show me what the UI looks like

Claude: [Uses screenshot]

[Returns screenshot showing a blank dashboard with a loading spinner]

The UI is stuck on loading because all API requests failed.
The app should show an error state instead of infinite loading.
```

---

## Form Validation Testing

**Scenario:** Testing form validation rules.

```
You: Navigate to /signup and test the form validation

Claude: [Uses navigate, get_dom to understand form structure]

Found a signup form with fields:
- Email (required)
- Password (required, min 8 chars)
- Confirm Password (must match)

Let me test validation:

[Uses fill with invalid email, click submit]

Validation result:
- Email: "Please enter a valid email address" (shown in red)
- Form submission blocked

[Uses fill with valid email, short password]

- Password: "Password must be at least 8 characters"

[Uses fill with valid password, mismatched confirm]

- Confirm Password: "Passwords do not match"

[Uses fill with all valid values]

All validations passed. Form submitted successfully.

Validation summary:
- Email: regex validation (working)
- Password: length >= 8 (working)
- Confirm: must match password (working)
- All client-side, no server round-trip needed
```

---

## Investigating Performance Issues

**Scenario:** A page loads slowly.

```
You: Navigate to /products and check what's slow

Claude: [Uses navigate with networkidle wait]

Navigation took 4.2 seconds. Let me analyze:

[Uses get_network]

Network requests (sorted by duration):
1. GET /api/products - 3100ms (!)
2. GET /api/categories - 890ms
3. Other assets - under 200ms

The /api/products endpoint is the bottleneck at 3.1 seconds.

[Uses get_request_detail]

The response contains 5000 products with full details including
base64 images embedded in the JSON.

Issues identified:
1. Fetching ALL products instead of paginating
2. Including full image data in the API response
3. No caching headers

Recommendations:
1. Add pagination: /api/products?page=1&limit=20
2. Return image URLs instead of base64 data
3. Add Cache-Control headers for static product data
```

---

## React Component Analysis

**Scenario:** Understanding component usage patterns.

```
You: Collect all Button components and show how they're used

Claude: [Uses collect_component_instances for Button]

Found 12 Button instances:

1. Header > Button
   - variant: "ghost"
   - size: "sm"
   - HTML: <button class="btn-ghost">Menu</button>

2. LoginForm > Button
   - variant: "primary"
   - size: "lg"
   - loading: true
   - HTML: <button class="btn-primary btn-lg" disabled>...</button>

3-8. ProductCard > Button (6 instances)
   - variant: "secondary"
   - size: "md"
   - HTML: <button class="btn-secondary">Add to Cart</button>

9-12. Footer > Button (4 instances)
   - variant: "link"
   - HTML: <a class="btn-link">...</a>

Pattern analysis:
- Primary buttons: used for main CTAs (login, submit)
- Secondary buttons: product actions
- Ghost buttons: navigation elements
- Link buttons: footer navigation

All buttons follow consistent prop patterns.
```

---

## Quick Reference

| Task | Tools to Use |
|------|--------------|
| Page overview | `get_debug_summary` |
| Find errors | `get_console` + `explain_error` |
| API issues | `get_network` + `get_request_detail` |
| React state | `find_component` + `get_component_state` |
| Visual issues | `screenshot` |
| Form testing | `fill` + `click` + `get_console` |

---

[Back to Home →](../)
