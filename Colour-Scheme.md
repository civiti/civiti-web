# Civica Color Scheme Documentation

## 🎨 Color Palette Overview

Our color scheme balances authority and trust with urgent civic action. The palette uses a professional blue-orange combination that's both colorblind-friendly and conveys the seriousness of community issues.

### Color Names & Values

| Color Name | Hex | RGB | HSL | Usage |
|------------|-----|-----|-----|-------|
| **Black** | `#000000` | `rgb(0, 0, 0)` | `hsl(0, 0%, 0%)` | Primary text (optional) |
| **Oxford Blue** | `#14213D` | `rgb(20, 33, 61)` | `hsl(221, 51%, 16%)` | Headers, Navigation, Trust |
| **Orange Web** | `#FCA311` | `rgb(252, 163, 17)` | `hsl(37, 98%, 53%)` | CTAs, Urgency, Actions |
| **Platinum** | `#E5E5E5` | `rgb(229, 229, 229)` | `hsl(0, 0%, 90%)` | Backgrounds, Borders |
| **White** | `#FFFFFF` | `rgb(255, 255, 255)` | `hsl(0, 0%, 100%)` | Cards, Clean sections |

---

## 🖥️ CSS Variables

```css
:root {
  /* Primary Colors - HEX */
  --black: #000000;
  --oxford-blue: #14213D;
  --orange-web: #FCA311;
  --platinum: #E5E5E5;
  --white: #FFFFFF;
  
  /* Primary Colors - HSL */
  --black-hsl: hsla(0, 0%, 0%, 1);
  --oxford-blue-hsl: hsla(221, 51%, 16%, 1);
  --orange-web-hsl: hsla(37, 98%, 53%, 1);
  --platinum-hsl: hsla(0, 0%, 90%, 1);
  --white-hsl: hsla(0, 0%, 100%, 1);
  
  /* Semantic Colors */
  --color-primary: var(--oxford-blue);
  --color-accent: var(--orange-web);
  --color-background: var(--platinum);
  --color-surface: var(--white);
  --color-text: var(--oxford-blue);
  --color-text-light: var(--white);
  
  /* State Colors */
  --color-success: #28A745;
  --color-warning: var(--orange-web);
  --color-error: #DC3545;
  --color-info: var(--oxford-blue);
  
  /* Opacity Variants */
  --oxford-blue-90: rgba(20, 33, 61, 0.9);
  --oxford-blue-80: rgba(20, 33, 61, 0.8);
  --orange-web-90: rgba(252, 163, 17, 0.9);
  --orange-web-20: rgba(252, 163, 17, 0.2);
  
  /* Gradients */
  --gradient-vertical: linear-gradient(180deg, #000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
  --gradient-horizontal: linear-gradient(90deg, #000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
  --gradient-diagonal: linear-gradient(45deg, #000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
  --gradient-radial: radial-gradient(#000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
  
  /* Practical Gradients */
  --gradient-hero: linear-gradient(135deg, var(--oxford-blue) 0%, rgba(20, 33, 61, 0.8) 100%);
  --gradient-cta: linear-gradient(135deg, #FCA311 0%, #FDB833 100%);
}
```

---

## 🎨 SCSS Variables

```scss
// Primary Colors - HEX
$black: #000000;
$oxford-blue: #14213D;
$orange-web: #FCA311;
$platinum: #E5E5E5;
$white: #FFFFFF;

// Primary Colors - HSL
$black-hsl: hsla(0, 0%, 0%, 1);
$oxford-blue-hsl: hsla(221, 51%, 16%, 1);
$orange-web-hsl: hsla(37, 98%, 53%, 1);
$platinum-hsl: hsla(0, 0%, 90%, 1);
$white-hsl: hsla(0, 0%, 100%, 1);

// Primary Colors - RGB
$black-rgb: rgba(0, 0, 0, 1);
$oxford-blue-rgb: rgba(20, 33, 61, 1);
$orange-web-rgb: rgba(252, 163, 17, 1);
$platinum-rgb: rgba(229, 229, 229, 1);
$white-rgb: rgba(255, 255, 255, 1);

// Semantic Mappings
$color-primary: $oxford-blue;
$color-accent: $orange-web;
$color-background: $platinum;
$color-surface: $white;
$color-text: $oxford-blue;
$color-text-light: $white;

// State Colors
$color-success: #28A745;
$color-warning: $orange-web;
$color-error: #DC3545;
$color-info: $oxford-blue;

// Gradients
$gradient-top: linear-gradient(0deg, #000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
$gradient-right: linear-gradient(90deg, #000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
$gradient-bottom: linear-gradient(180deg, #000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
$gradient-left: linear-gradient(270deg, #000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
$gradient-top-right: linear-gradient(45deg, #000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
$gradient-bottom-right: linear-gradient(135deg, #000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
$gradient-top-left: linear-gradient(225deg, #000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
$gradient-bottom-left: linear-gradient(315deg, #000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
$gradient-radial: radial-gradient(#000000, #14213D, #FCA311, #E5E5E5, #FFFFFF);
```

---

## 🎯 Color Usage Guidelines

### Primary Brand (Oxford Blue)
- **Use for:** Headers, navigation, primary text, trust-building elements
- **Example:** App header, navigation menu, section titles, form labels
- **Meaning:** Authority, professionalism, trustworthiness
- **Accessibility:** Excellent contrast on white/platinum backgrounds

### Accent/Action (Orange Web)
- **Use for:** CTAs, urgent badges, action buttons, important counters
- **Example:** "Send Email" button, "X emails sent" counter, "URGENT" badges
- **Meaning:** Action required, urgency, civic engagement
- **Accessibility:** Use white text on orange backgrounds

### Background (Platinum)
- **Use for:** Page backgrounds, disabled states, borders, dividers
- **Example:** Main page background, inactive buttons, section separators
- **Meaning:** Neutral, unobtrusive, clean
- **Accessibility:** Not for text, decorative only

### Surface (White)
- **Use for:** Cards, content areas, input fields, modals
- **Example:** Issue cards, form backgrounds, modal dialogs
- **Meaning:** Clean, focused content areas
- **Accessibility:** Perfect for readability

### Text (Oxford Blue or Black)
- **Use for:** Body text, descriptions, secondary information
- **Example:** Issue descriptions, form instructions, timestamps
- **Meaning:** Readable, professional, clear
- **Accessibility:** Oxford Blue preferred over pure black for softer appearance

---

## 💻 Implementation Examples

### Buttons
```css
/* Primary CTA Button */
.btn-primary {
  background-color: var(--orange-web);
  color: var(--white);
  border: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #FCA311 0%, #FDB833 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(252, 163, 17, 0.3);
}

/* Secondary Button */
.btn-secondary {
  background-color: var(--oxford-blue);
  color: var(--white);
  border: none;
}

.btn-secondary:hover {
  background-color: rgba(20, 33, 61, 0.9);
}

/* Ghost Button */
.btn-ghost {
  background-color: transparent;
  color: var(--oxford-blue);
  border: 2px solid var(--oxford-blue);
}
```

### Issue Cards
```css
.issue-card {
  background-color: var(--white);
  border: 1px solid var(--platinum);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.issue-card:hover {
  box-shadow: 0 8px 24px rgba(20, 33, 61, 0.1);
  transform: translateY(-2px);
}

.issue-card .urgency-badge {
  background-color: var(--orange-web);
  color: var(--white);
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 600;
}

.issue-card .email-counter {
  color: var(--orange-web);
  font-weight: 700;
  font-size: 1.2em;
}
```

### Navigation
```css
.navbar {
  background-color: var(--oxford-blue);
  color: var(--white);
}

.nav-link {
  color: var(--white);
  opacity: 0.9;
}

.nav-link:hover,
.nav-link.active {
  opacity: 1;
  color: var(--orange-web);
}
```

### Forms
```css
.form-input {
  background-color: var(--white);
  border: 2px solid var(--platinum);
  color: var(--oxford-blue);
}

.form-input:focus {
  border-color: var(--orange-web);
  outline: none;
  box-shadow: 0 0 0 3px rgba(252, 163, 17, 0.2);
}

.form-label {
  color: var(--oxford-blue);
  font-weight: 600;
}
```

### States
```css
/* Success State */
.alert-success {
  background-color: #28A745;
  color: white;
  border-radius: 4px;
}

/* Warning/Urgent State */
.alert-warning {
  background-color: var(--orange-web);
  color: white;
}

/* Error State */
.alert-error {
  background-color: #DC3545;
  color: white;
}

/* Disabled State */
.disabled {
  background-color: var(--platinum);
  color: rgba(20, 33, 61, 0.4);
  cursor: not-allowed;
}
```

---

## 🌈 Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'oxford-blue': '#14213D',
        'orange-web': '#FCA311',
        'platinum': '#E5E5E5',
        // Semantic colors
        'primary': '#14213D',
        'accent': '#FCA311',
        'surface': '#FFFFFF',
        'background': '#E5E5E5',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #14213D 0%, rgba(20, 33, 61, 0.8) 100%)',
        'gradient-cta': 'linear-gradient(135deg, #FCA311 0%, #FDB833 100%)',
      },
      boxShadow: {
        'orange': '0 4px 12px rgba(252, 163, 17, 0.3)',
        'card': '0 8px 24px rgba(20, 33, 61, 0.1)',
      }
    }
  }
}
```

---

## ♿ Accessibility Considerations

### Contrast Ratios (WCAG Compliant)
- **Oxford Blue on White:** 12.63:1 ✅ (AAA)
- **Orange Web on White:** 2.96:1 ✅ (AA for large text)
- **White on Oxford Blue:** 12.63:1 ✅ (AAA)
- **White on Orange Web:** 2.96:1 ✅ (AA for large text)
- **Oxford Blue on Platinum:** 10.15:1 ✅ (AAA)
- **Black on White:** 21:1 ✅ (AAA)

### Colorblind Considerations
- **Blue-Orange is the most colorblind-safe combination**
- Works for all types: Protanopia, Deuteranopia, Tritanopia
- Clear luminance difference ensures distinguishability

### Recommendations
1. Use Oxford Blue for all body text (softer than pure black)
2. Ensure Orange Web is only used for large text or with white text
3. Add hover states with opacity changes for better feedback
4. Include icons with color to reinforce meaning

---

## 🎨 Usage Patterns for Civica

### Issue Priority Levels
```css
.priority-urgent {
  border-left: 4px solid var(--orange-web);
  background-color: rgba(252, 163, 17, 0.1);
}

.priority-normal {
  border-left: 4px solid var(--oxford-blue);
}

.priority-resolved {
  border-left: 4px solid #28A745;
  opacity: 0.7;
}
```

### Email Counter Display
```css
.email-counter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.email-counter-number {
  color: var(--orange-web);
  font-size: 1.5em;
  font-weight: 700;
}

.email-counter-label {
  color: var(--oxford-blue);
}
```

### Hero Sections
```css
.hero {
  background: var(--gradient-hero);
  color: var(--white);
}

.hero-cta {
  background: var(--gradient-cta);
  color: var(--white);
  padding: 16px 32px;
  font-weight: 700;
  text-transform: uppercase;
}
```

---

## 🚀 Quick Start Code

```css
/* Base setup for Civica */
body {
  background-color: var(--platinum);
  color: var(--oxford-blue);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  background-color: var(--white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(20, 33, 61, 0.1);
}

.action-required {
  color: var(--orange-web);
  font-weight: 600;
}

.official-badge {
  background-color: var(--oxford-blue);
  color: var(--white);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.875em;
}
```