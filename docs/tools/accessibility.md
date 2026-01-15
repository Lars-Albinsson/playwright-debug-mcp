---
layout: default
title: Accessibility Tools
---

# Accessibility Tools

Tools for auditing accessibility and inspecting the ARIA tree.

---

## run_accessibility_audit

Perform a lightweight WCAG-style accessibility audit without external dependencies.

**Parameters:** None

**Response:**

```json
{
  "issues": [
    {
      "type": "image",
      "severity": "critical",
      "count": 3,
      "message": "Images missing alt text",
      "elements": [
        { "selector": "img.hero-image", "src": "/hero.jpg" },
        { "selector": "img.profile-pic", "src": "/user.png" }
      ],
      "wcag": "1.1.1"
    },
    {
      "type": "form",
      "severity": "serious",
      "count": 2,
      "message": "Form inputs missing labels",
      "elements": [
        { "selector": "input#email", "type": "email" },
        { "selector": "input#phone", "type": "tel" }
      ],
      "wcag": "1.3.1"
    },
    {
      "type": "heading",
      "severity": "moderate",
      "count": 1,
      "message": "Skipped heading level (h1 to h3)",
      "elements": [],
      "wcag": "1.3.1"
    },
    {
      "type": "color",
      "severity": "serious",
      "count": 5,
      "message": "Elements with potentially low contrast",
      "elements": [
        { "selector": ".subtle-text", "color": "#999", "background": "#fff" }
      ],
      "wcag": "1.4.3"
    }
  ],
  "summary": {
    "critical": 1,
    "serious": 2,
    "moderate": 1,
    "minor": 0,
    "total": 4
  }
}
```

**Checks Performed:**

| Category | Checks | WCAG |
|----------|--------|------|
| Images | Missing alt text, decorative images | 1.1.1 |
| Forms | Missing labels, button text | 1.3.1 |
| Headings | Hierarchy, skipped levels | 1.3.1 |
| Color | Low contrast detection | 1.4.3 |
| ARIA | Invalid roles, missing labels | 4.1.2 |
| Focus | Missing focus indicators | 2.4.7 |
| Links | Empty links, missing text | 2.4.4 |

**Example:**

```
Run an accessibility audit
Are there any a11y issues?
Check if images have alt text
```

---

## get_aria_tree

Get the accessibility tree structure as seen by screen readers.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `selector` | string | No | Root element to start from |

**Response:**

```json
{
  "tree": {
    "role": "document",
    "name": "My Application",
    "children": [
      {
        "role": "banner",
        "children": [
          {
            "role": "navigation",
            "name": "Main navigation",
            "children": [
              { "role": "link", "name": "Home" },
              { "role": "link", "name": "Products" },
              { "role": "link", "name": "Contact" }
            ]
          }
        ]
      },
      {
        "role": "main",
        "children": [
          {
            "role": "heading",
            "name": "Welcome",
            "level": 1
          },
          {
            "role": "button",
            "name": "Get Started"
          },
          {
            "role": "form",
            "name": "Contact Form",
            "children": [
              {
                "role": "textbox",
                "name": "Email address",
                "required": true
              },
              {
                "role": "button",
                "name": "Submit"
              }
            ]
          }
        ]
      }
    ]
  },
  "stats": {
    "totalNodes": 24,
    "interactive": 8,
    "landmarks": 3
  }
}
```

**Example:**

```
Get the ARIA tree
What does a screen reader see?
Show the accessibility structure of the form
```

---

## Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| **Critical** | Blocks access for users | Fix immediately |
| **Serious** | Major barriers | Fix soon |
| **Moderate** | Causes difficulties | Should fix |
| **Minor** | Best practice | Nice to fix |

---

## Common Patterns

### Full Accessibility Check

```
Run accessibility audit
Get the ARIA tree
What issues need immediate attention?
```

### Fix Form Accessibility

```
Run accessibility audit (find form issues)
Get ARIA tree for the form
Add missing labels to inputs
```

### Navigation Check

```
Get ARIA tree
Is the navigation properly labeled?
Can users navigate by landmarks?
```

---

## WCAG Quick Reference

### Level A (Minimum)

| Criterion | Description |
|-----------|-------------|
| 1.1.1 | Non-text content has text alternatives |
| 1.3.1 | Information and structure are programmatic |
| 2.1.1 | All functionality keyboard accessible |
| 2.4.1 | Bypass blocks mechanism |
| 4.1.2 | Name, role, value for UI components |

### Level AA (Target)

| Criterion | Description |
|-----------|-------------|
| 1.4.3 | Contrast ratio at least 4.5:1 |
| 1.4.4 | Text resizable to 200% |
| 2.4.6 | Headings and labels are descriptive |
| 2.4.7 | Focus is visible |

---

## Common Fixes

### Images

```html
<!-- Bad -->
<img src="chart.png">

<!-- Good -->
<img src="chart.png" alt="Sales chart showing 20% growth">

<!-- Decorative (OK to skip alt) -->
<img src="decoration.png" alt="" role="presentation">
```

### Forms

```html
<!-- Bad -->
<input type="email" placeholder="Email">

<!-- Good -->
<label for="email">Email address</label>
<input type="email" id="email">

<!-- Or with aria-label -->
<input type="email" aria-label="Email address">
```

### Buttons

```html
<!-- Bad -->
<button><i class="icon-search"></i></button>

<!-- Good -->
<button aria-label="Search">
  <i class="icon-search" aria-hidden="true"></i>
</button>
```

### Headings

```html
<!-- Bad: Skipped level -->
<h1>Title</h1>
<h3>Subtitle</h3>

<!-- Good: Sequential -->
<h1>Title</h1>
<h2>Subtitle</h2>
```

---

## Tips

### Start with Critical Issues

Focus on critical and serious issues first - they have the biggest impact on users.

### Test with Keyboard

After fixing issues, verify:
- Can you Tab to all interactive elements?
- Is focus visible?
- Can you activate everything with Enter/Space?

### Use ARIA Sparingly

Native HTML semantics are better than ARIA:

```html
<!-- Better -->
<button>Submit</button>

<!-- Worse (but sometimes necessary) -->
<div role="button" tabindex="0">Submit</div>
```

### Check Real Screen Reader

The ARIA tree shows structure, but testing with VoiceOver (Mac) or NVDA (Windows) reveals the actual experience.

---

[Back to Tools Reference →](./index)
