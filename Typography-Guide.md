# Civica Typography Guide - Fira Sans

## 🔤 Typography Overview

Fira Sans is our chosen typeface for Civica, designed by Mozilla specifically for screen readability. It provides excellent legibility, supports Romanian diacritics perfectly, and conveys approachability while maintaining professionalism.

---

## 📦 Implementation

### HTML Setup (Full Font Family)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
```

### Optimized Setup (Recommended for Civica)
```html
<!-- Only load the weights we actually use -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

---

## 🎨 Font Weight Classes

### Regular Weights
```css
.fira-sans-thin {
  font-family: "Fira Sans", sans-serif;
  font-weight: 100;
  font-style: normal;
}

.fira-sans-extralight {
  font-family: "Fira Sans", sans-serif;
  font-weight: 200;
  font-style: normal;
}

.fira-sans-light {
  font-family: "Fira Sans", sans-serif;
  font-weight: 300;
  font-style: normal;
}

.fira-sans-regular {
  font-family: "Fira Sans", sans-serif;
  font-weight: 400;
  font-style: normal;
}

.fira-sans-medium {
  font-family: "Fira Sans", sans-serif;
  font-weight: 500;
  font-style: normal;
}

.fira-sans-semibold {
  font-family: "Fira Sans", sans-serif;
  font-weight: 600;
  font-style: normal;
}

.fira-sans-bold {
  font-family: "Fira Sans", sans-serif;
  font-weight: 700;
  font-style: normal;
}

.fira-sans-extrabold {
  font-family: "Fira Sans", sans-serif;
  font-weight: 800;
  font-style: normal;
}

.fira-sans-black {
  font-family: "Fira Sans", sans-serif;
  font-weight: 900;
  font-style: normal;
}
```

### Italic Weights
```css
.fira-sans-thin-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 100;
  font-style: italic;
}

.fira-sans-extralight-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 200;
  font-style: italic;
}

.fira-sans-light-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 300;
  font-style: italic;
}

.fira-sans-regular-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 400;
  font-style: italic;
}

.fira-sans-medium-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 500;
  font-style: italic;
}

.fira-sans-semibold-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 600;
  font-style: italic;
}

.fira-sans-bold-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 700;
  font-style: italic;
}

.fira-sans-extrabold-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 800;
  font-style: italic;
}

.fira-sans-black-italic {
  font-family: "Fira Sans", sans-serif;
  font-weight: 900;
  font-style: italic;
}
```

---

## 📐 Type Scale for Civica

### Base Typography Setup
```css
:root {
  /* Font Family */
  --font-primary: "Fira Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  
  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* Letter Spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
}
```

### Global Styles
```css
body {
  font-family: var(--font-primary);
  font-weight: 400;
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--oxford-blue);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 🎯 Civica-Specific Typography

### Headers
```css
h1, .h1 {
  font-size: var(--text-4xl);
  font-weight: 700;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--oxford-blue);
}

h2, .h2 {
  font-size: var(--text-3xl);
  font-weight: 600;
  line-height: var(--leading-tight);
  color: var(--oxford-blue);
}

h3, .h3 {
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: var(--leading-normal);
  color: var(--oxford-blue);
}

h4, .h4 {
  font-size: var(--text-xl);
  font-weight: 500;
  line-height: var(--leading-normal);
  color: var(--oxford-blue);
}
```

### Component-Specific Styles

#### Navigation
```css
.nav-link {
  font-size: var(--text-base);
  font-weight: 500;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
```

#### Issue Cards
```css
.issue-title {
  font-size: var(--text-xl);
  font-weight: 600;
  line-height: var(--leading-tight);
}

.issue-description {
  font-size: var(--text-base);
  font-weight: 400;
  line-height: var(--leading-relaxed);
}

.issue-meta {
  font-size: var(--text-sm);
  font-weight: 400;
  color: rgba(20, 33, 61, 0.7);
}
```

#### Email Counter
```css
.email-counter-number {
  font-size: var(--text-5xl);
  font-weight: 800;
  line-height: 1;
  color: var(--orange-web);
}

.email-counter-label {
  font-size: var(--text-base);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
```

#### Buttons
```css
.btn {
  font-family: var(--font-primary);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.btn-primary {
  font-size: var(--text-base);
}

.btn-secondary {
  font-size: var(--text-sm);
  font-weight: 500;
}
```

#### Forms
```css
.form-label {
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--oxford-blue);
}

.form-input {
  font-size: var(--text-base);
  font-weight: 400;
}

.form-helper {
  font-size: var(--text-sm);
  font-weight: 400;
  font-style: italic;
  color: rgba(20, 33, 61, 0.7);
}
```

#### Badges
```css
.badge {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.urgency-badge {
  font-weight: 800;
}
```

---

## 🌍 Romanian Language Support

### Special Characters
```css
/* Ensure proper rendering of Romanian diacritics */
.romanian-text {
  font-feature-settings: "locl";
}

/* Example usage */
.location-name {
  font-family: var(--font-primary);
  font-weight: 500;
  /* Properly displays: București, Constanța, Timișoara */
}
```

### Email Template Typography
```css
.email-template {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
}

.email-subject {
  font-size: var(--text-lg);
  font-weight: 700;
}

.email-greeting {
  font-weight: 500;
}

.email-body {
  font-weight: 400;
}

.email-signature {
  font-weight: 500;
  font-style: italic;
}
```

---

## 📱 Responsive Typography

### Mobile Adjustments
```css
@media (max-width: 768px) {
  :root {
    --text-base: 0.9375rem;  /* 15px */
    --text-4xl: 2rem;        /* 32px */
    --text-5xl: 2.5rem;      /* 40px */
  }
  
  h1, .h1 {
    font-size: var(--text-3xl);
  }
  
  .email-counter-number {
    font-size: var(--text-4xl);
  }
}
```

---

## ⚡ Performance Optimization

### Recommended Font Loading Strategy
```css
/* Base font stack while Fira Sans loads */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Apply Fira Sans when loaded */
.fonts-loaded body {
  font-family: "Fira Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

### JavaScript Font Loading
```javascript
// Add fonts-loaded class when ready
if ('fonts' in document) {
  document.fonts.ready.then(() => {
    document.documentElement.classList.add('fonts-loaded');
  });
}
```

---

## 🎨 Usage Guidelines

### DO ✅
- Use Regular (400) for body text
- Use Medium (500) for navigation and labels
- Use SemiBold (600) for card titles and section headers
- Use Bold (700) for primary headers
- Use ExtraBold (800) for impact numbers (email counter)
- Maintain consistent line heights for readability
- Use uppercase sparingly (navigation, labels, badges)

### DON'T ❌
- Use weights lighter than 400 for body text
- Mix too many weights in one component
- Use italic for emphasis (use SemiBold instead)
- Use Thin or ExtraLight weights (poor readability)
- Forget to test with Romanian diacritics

---

## 🔧 SCSS Mixins

```scss
// Typography mixins for consistent usage
@mixin heading-1 {
  font-size: var(--text-4xl);
  font-weight: 700;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

@mixin body-text {
  font-size: var(--text-base);
  font-weight: 400;
  line-height: var(--leading-relaxed);
}

@mixin button-text {
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

@mixin label-text {
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
```

---

## 🚀 Quick Reference

| Element | Size | Weight | Special |
|---------|------|--------|---------|
| H1 | 36px | 700 | Tight tracking |
| H2 | 30px | 600 | - |
| H3 | 24px | 600 | - |
| Body | 16px | 400 | Relaxed leading |
| Button | 16px | 600 | Uppercase, wide tracking |
| Label | 14px | 600 | Uppercase, wide tracking |
| Meta | 14px | 400 | Reduced opacity |
| Email Counter | 48px | 800 | Orange color |
| Badge | 12px | 700 | Uppercase |