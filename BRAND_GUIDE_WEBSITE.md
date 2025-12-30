# NextIgnition Brand Guide for Website

Quick reference for exact brand specifications when building the product website.

## 🎨 Color Palette

### Primary Colors
```css
--primary: #6666FF;           /* Electric Blue - Main brand color */
--primary-dark: #4B4FDB;       /* Darker blue for hover states */
--primary-light: #E3E4FF;      /* Light blue for backgrounds */
```

### Accent Colors
```css
--accent: #F78405;             /* Vibrant Orange - CTAs, highlights */
--accent-light: #FFD6A8;       /* Light orange for backgrounds */
```

### Neutral Colors
```css
--navy: #242B64;               /* Dark navy for text, shadows */
--navy-muted: #2F3A88;        /* Muted navy */
--background: #FFFFFF;         /* White background */
--surface: #FFFFFF;            /* White surface */
--surface-muted: #F6F7FF;      /* Light purple-tinted background */
--card: #F1F3FF;               /* Card background */
```

### Text Colors
```css
--text-primary: #1A1A1A;       /* Main text */
--text-secondary: #4C4C66;       /* Secondary text */
--text-subtle: #7D7DA8;        /* Subtle text */
```

### Border Colors
```css
--border: #E1E4FF;             /* Light border */
--border-strong: #C5C9F6;      /* Stronger border */
```

### Gradients
```css
/* Primary Gradient */
background: linear-gradient(135deg, #6666FF 0%, #4B4FDB 100%);

/* Accent Gradient */
background: linear-gradient(135deg, #F78405 0%, #FF9E2C 100%);

/* Navy Gradient */
background: linear-gradient(135deg, #242B64 0%, #171C3E 100%);
```

## 📝 Typography

### Font Families
```css
/* Display/Headings */
font-family: 'Funnel Display', sans-serif;
font-weight: 500 (Medium) or 700 (Bold);

/* Body Text */
font-family: 'Inter', sans-serif;
font-weight: 400 (Regular), 500 (Medium), or 600 (SemiBold);
```

### Type Scale
```css
/* Hero Text */
font-family: 'Funnel Display', sans-serif;
font-weight: 700;
font-size: 52px;
line-height: 58px;
letter-spacing: -1px;

/* Display Text */
font-family: 'Funnel Display', sans-serif;
font-weight: 500;
font-size: 40px;
line-height: 44px;
letter-spacing: -0.8px;

/* Heading */
font-family: 'Funnel Display', sans-serif;
font-weight: 500;
font-size: 28px;
line-height: 34px;

/* Title */
font-family: 'Inter', sans-serif;
font-weight: 600;
font-size: 20px;
line-height: 26px;

/* Body */
font-family: 'Inter', sans-serif;
font-weight: 400;
font-size: 16px;
line-height: 24px;

/* Caption */
font-family: 'Inter', sans-serif;
font-weight: 400;
font-size: 14px;
line-height: 20px;
```

### Google Fonts Import
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

## 📐 Spacing Scale

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-xxl: 48px;
```

## 🔲 Border Radius

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 20px;
--radius-full: 9999px;
```

## 🎭 Shadows

```css
/* Small Shadow */
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

/* Medium Shadow */
box-shadow: 0 12px 24px rgba(36, 43, 100, 0.16);

/* Large Shadow */
box-shadow: 0 18px 32px rgba(36, 43, 100, 0.18);
```

## 🎯 Usage Guidelines

### Primary Color (#6666FF)
- Main CTAs and buttons
- Links and interactive elements
- Brand highlights
- Gradient backgrounds

### Accent Color (#F78405)
- Secondary CTAs
- Important highlights
- Warning/attention elements
- Gradient accents

### Navy (#242B64)
- Headings and important text
- Shadows and depth
- Footer backgrounds
- Dark sections

### Typography Hierarchy
1. **Hero**: Funnel Display Bold, 52px
2. **Section Headings**: Funnel Display Medium, 40px
3. **Card Titles**: Funnel Display Medium, 28px
4. **Body Text**: Inter Regular, 16px
5. **Captions**: Inter Regular, 14px

## 🔗 Production Links

- **Production App**: https://nextignition-app.vercel.app
- **Sign Up**: https://nextignition-app.vercel.app/(auth)/register
- **Login**: https://nextignition-app.vercel.app/(auth)/login
- **GitHub**: https://github.com/nextignition/nextignition-app

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 767px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

## 🎨 Tailwind Config Example

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6666FF',
          dark: '#4B4FDB',
          light: '#E3E4FF',
        },
        accent: {
          DEFAULT: '#F78405',
          light: '#FFD6A8',
        },
        navy: {
          DEFAULT: '#242B64',
          muted: '#2F3A88',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F6F7FF',
          card: '#F1F3FF',
        },
      },
      fontFamily: {
        display: ['Funnel Display', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
}
```

---

**Use this guide to ensure 100% brand consistency across the website!**



