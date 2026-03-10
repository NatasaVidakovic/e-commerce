# Responsive Design Guide

## Overview
This document outlines the responsive design system implemented across the Angular frontend. The system ensures proper behavior across all breakpoints with optimized layout scaling, spacing, and component sizing for mobile/tablet/desktop usability.

---

## Breakpoints

### Defined Breakpoints
Located in `src/styles/_breakpoints.scss`:

| Name | Value | Target Devices |
|------|-------|----------------|
| `xs` | < 425px | Small phones |
| `sm` | 425px - 768px | Phones/tablets |
| `md` | 768px - 1024px | Tablets/small laptops |
| `lg` | 1024px - 1200px | Desktop |
| `xl` | 1200px - 1440px | Large desktop |
| `xxl` | > 1440px | Extra large desktop |

### Usage

```scss
@import 'styles/breakpoints';

.my-component {
  // Mobile-first approach
  padding: 1rem;
  
  // Tablet and up
  @include md {
    padding: 1.5rem;
  }
  
  // Desktop and up
  @include lg {
    padding: 2rem;
  }
}
```

### Available Mixins
- `@include xs` - Max-width < 425px
- `@include sm` - Min-width >= 425px
- `@include md` - Min-width >= 768px
- `@include lg` - Min-width >= 1024px
- `@include xl` - Min-width >= 1200px
- `@include xxl` - Min-width >= 1440px
- `@include max-xs`, `@include max-sm`, etc. - Max-width variants
- `@include between-sm-md` - Range breakpoints

---

## Spacing System

### Spacing Scale
Located in `src/styles/_spacing.scss`:

| Variable | Value | Pixels |
|----------|-------|--------|
| `$spacing-0` | 0 | 0px |
| `$spacing-1` | 0.25rem | 4px |
| `$spacing-2` | 0.5rem | 8px |
| `$spacing-3` | 0.75rem | 12px |
| `$spacing-4` | 1rem | 16px |
| `$spacing-5` | 1.25rem | 20px |
| `$spacing-6` | 1.5rem | 24px |
| `$spacing-8` | 2rem | 32px |
| `$spacing-10` | 2.5rem | 40px |
| `$spacing-12` | 3rem | 48px |
| `$spacing-16` | 4rem | 64px |
| `$spacing-20` | 5rem | 80px |
| `$spacing-24` | 6rem | 96px |
| `$spacing-32` | 8rem | 128px |

### Usage

```scss
@import 'styles/spacing';

.card {
  padding: $spacing-4;
  margin-bottom: $spacing-6;
  gap: $spacing-3;
}
```

### Utility Classes
Available margin, padding, and gap utilities:
- `.m-{0-12}` - Margin
- `.p-{0-12}` - Padding
- `.gap-{0-8}` - Gap (for flex/grid)

---

## Typography

### Fluid Typography
Located in `src/styles/_typography.scss`:

All font sizes use `clamp()` for fluid scaling:

| Variable | Min Size | Max Size |
|----------|----------|----------|
| `$font-size-xs` | 0.75rem (12px) | 0.875rem (14px) |
| `$font-size-sm` | 0.875rem (14px) | 1rem (16px) |
| `$font-size-base` | 1rem (16px) | 1.125rem (18px) |
| `$font-size-lg` | 1.125rem (18px) | 1.25rem (20px) |
| `$font-size-xl` | 1.25rem (20px) | 1.5rem (24px) |
| `$font-size-2xl` | 1.5rem (24px) | 1.875rem (30px) |
| `$font-size-3xl` | 1.875rem (30px) | 2.25rem (36px) |
| `$font-size-4xl` | 2.25rem (36px) | 3rem (48px) |

### Font Weights
- `$font-weight-light`: 300
- `$font-weight-normal`: 400
- `$font-weight-medium`: 500
- `$font-weight-semibold`: 600
- `$font-weight-bold`: 700

### Line Heights
- `$line-height-tight`: 1.25
- `$line-height-normal`: 1.5
- `$line-height-relaxed`: 1.75

### Usage

```scss
@import 'styles/typography';

h1 {
  font-size: $font-size-4xl;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}
```

---

## Layout Patterns

### Container
Responsive container with max-width constraints:

```html
<div class="container">
  <!-- Content -->
</div>
```

Max widths:
- Mobile: 100% with padding
- md: 768px
- lg: 1024px
- xl: 1200px
- xxl: 1440px

### Grid System
Responsive grid utilities:

```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <!-- Grid items -->
</div>
```

### Flexbox
Responsive flex utilities:

```html
<div class="flex flex-col md:flex-row gap-4 items-center justify-between">
  <!-- Flex items -->
</div>
```

---

## Component Patterns

### Header/Navigation
- **Mobile (< 768px)**: Hamburger menu with slide-out drawer
- **Desktop (>= 768px)**: Full horizontal navigation

Key features:
- Fixed positioning with proper z-index
- Touch-friendly menu items (min 44px)
- Smooth transitions
- Overlay backdrop on mobile

### Product Grid
Responsive columns:
- Mobile: 1 column
- Small tablets (425px+): 2 columns
- Tablets (768px+): 2 columns
- Desktop (1024px+): 3 columns
- Large desktop (1200px+): 4 columns

### Filter Panel
- **Mobile (< 1024px)**: Drawer from left side with overlay
- **Desktop (>= 1024px)**: Fixed sidebar

### Forms
- Minimum input height: 3.5rem (56px)
- Minimum button height: 2.75rem (44px) for touch targets
- Full-width on mobile
- Constrained width on desktop (max 28rem)

### Cart Layout
- **Mobile**: Stacked layout (items → summary)
- **Desktop**: Side-by-side (3:1 ratio)

---

## Touch Targets

All interactive elements meet WCAG 2.1 Level AAA guidelines:
- **Minimum size**: 44px × 44px (2.75rem)
- Buttons: `min-height: 2.75rem`
- Icon buttons: `min-width: 2.75rem; min-height: 2.75rem`
- Form inputs: `min-height: 3.5rem`

---

## Responsive Images

### Lazy Loading
Images use native lazy loading:

```html
<img src="{{product.pictureUrl}}" 
     alt="{{product.name}}"
     loading="lazy">
```

### Aspect Ratios
Product images maintain 1:1 aspect ratio:

```scss
img {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
```

---

## Performance Considerations

### Mobile Optimizations
1. **Lazy loading**: Images load only when needed
2. **Fluid typography**: Reduces layout shifts
3. **CSS Grid/Flexbox**: Native browser layout engines
4. **Minimal JavaScript**: Layout handled by CSS
5. **Touch-optimized**: Larger targets, no hover-dependent interactions

### Bundle Size
- Centralized SCSS reduces duplication
- Utility classes prevent inline styles
- Shared breakpoint/spacing variables

---

## Testing Checklist

### Breakpoint Testing
- [ ] < 425px (iPhone SE, small phones)
- [ ] 425px - 768px (iPhone 12, Android phones)
- [ ] 768px - 1024px (iPad, tablets)
- [ ] 1024px - 1200px (iPad Pro, small laptops)
- [ ] > 1200px (Desktop)

### Functionality Testing
- [ ] No horizontal scrolling below 768px
- [ ] All text readable without zooming
- [ ] Touch targets >= 44px
- [ ] Forms usable on mobile
- [ ] Navigation accessible on all sizes
- [ ] Images load properly (lazy loading)
- [ ] No layout shifts during load
- [ ] Filters accessible on mobile (drawer)

### Browser Testing
- [ ] Chrome (Desktop & Mobile)
- [ ] Safari (iOS)
- [ ] Firefox
- [ ] Edge

---

## Common Patterns

### Responsive Padding

```scss
.component {
  padding: $spacing-4;
  
  @include md {
    padding: $spacing-6;
  }
  
  @include lg {
    padding: $spacing-8;
  }
}
```

### Responsive Typography

```scss
h1 {
  font-size: clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem);
}
```

### Responsive Grid

```scss
.grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: $spacing-4;
  
  @include sm {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  @include lg {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

### Responsive Flex Direction

```scss
.container {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
  
  @include md {
    flex-direction: row;
    gap: $spacing-6;
  }
}
```

---

## File Structure

```
src/styles/
├── _breakpoints.scss    # Breakpoint definitions and mixins
├── _spacing.scss        # Spacing scale and utilities
├── _typography.scss     # Font sizes, weights, line heights
├── _utilities.scss      # Utility classes
└── themes/
    └── _theme-variables.scss  # Color system

src/app/
├── layout/
│   └── header/          # Responsive header with mobile menu
├── features/
│   ├── shop/            # Responsive product grid
│   ├── cart/            # Responsive cart layout
│   └── account/         # Responsive forms
└── shared/
    └── components/
        └── dynamic-filter-bar/  # Mobile drawer filters
```

---

## Migration Guide

### Converting Fixed Sizes to Responsive

**Before:**
```scss
.component {
  padding: 20px;
  font-size: 16px;
  width: 300px;
}
```

**After:**
```scss
@import 'styles/breakpoints';
@import 'styles/spacing';
@import 'styles/typography';

.component {
  padding: $spacing-5;  // 1.25rem = 20px
  font-size: $font-size-base;  // Fluid 16-18px
  width: 100%;
  max-width: 18.75rem;  // 300px
  
  @include md {
    width: 18.75rem;
  }
}
```

### Adding Mobile Menu

1. Add state management in component
2. Create mobile menu HTML structure
3. Add overlay and drawer styles
4. Implement toggle functionality
5. Test on mobile devices

---

## Best Practices

1. **Mobile-first**: Start with mobile styles, add desktop enhancements
2. **Relative units**: Use rem/em instead of px
3. **Fluid typography**: Use clamp() for scalable text
4. **Touch targets**: Minimum 44px for interactive elements
5. **No horizontal scroll**: Test all breakpoints
6. **Semantic HTML**: Use proper heading hierarchy
7. **Accessibility**: ARIA labels, keyboard navigation
8. **Performance**: Lazy load images, minimize reflows
9. **Consistent spacing**: Use spacing scale variables
10. **Test thoroughly**: All breakpoints and devices

---

## Support

For questions or issues with the responsive system:
1. Check this documentation
2. Review `src/styles/` SCSS files
3. Inspect existing responsive components
4. Test in browser DevTools responsive mode
