# Responsive Frontend Architecture — Technical Specification

## Objective
Implement a responsive frontend architecture that adapts efficiently across all screen sizes and device types (mobile, tablet, desktop, ultrawide), with focus on performance, modularity, and maintainability.

---

## 1. Layout Strategy

✅ **Implemented:**
- Mobile-first approach with breakpoint mixins
- CSS Grid and Flexbox for all layouts
- Fluid layouts using %, fr, and minmax()

**Guidelines:**
- Use content-driven breakpoints (not device-driven)
- Avoid absolute/fixed pixel sizing unless structurally required
- Use %, fr, and minmax() for grids; avoid layout constraints via px

---

## 2. Breakpoints & Containers

✅ **Current Breakpoints:**
```scss
xs: < 425px
sm: 425px - 768px
md: 768px - 1024px
lg: 1024px - 1200px
xl: 1200px - 1440px
xxl: > 1440px
```

**Implementation:**
- Minimal breakpoint count (6 breakpoints)
- Breakpoints trigger only where content requires structural changes
- Located in: `src/styles/_breakpoints.scss`

**Future Enhancement:**
- Consider container queries for component-level responsiveness
- Enable `container-type: inline-size` where components must adjust internally

---

## 3. Typography & Scale

✅ **Implemented:**
- Fluid typography with `clamp(min, preferred, max)`
- rem/em units for text and spacing
- Located in: `src/styles/_typography.scss`

**Examples:**
```scss
h1: clamp(2rem, 1.5rem + 2.5vw, 3.5rem)
h2: clamp(1.75rem, 1.35rem + 2vw, 3rem)
body: clamp(1rem, 0.95rem + 0.25vw, 1.125rem)
```

**Guidelines:**
- Maintain readable line width (~45–75 characters) at all breakpoints
- Use consistent line-height for readability

---

## 4. Spacing & Units

✅ **Implemented:**
- Consistent spacing scale using rem units
- Located in: `src/styles/_spacing.scss`

**Scale:**
```scss
$spacing-1: 0.25rem;  // 4px
$spacing-2: 0.5rem;   // 8px
$spacing-3: 0.75rem;  // 12px
$spacing-4: 1rem;     // 16px
$spacing-5: 1.25rem;  // 20px
$spacing-6: 1.5rem;   // 24px
$spacing-8: 2rem;     // 32px
$spacing-10: 2.5rem;  // 40px
$spacing-12: 3rem;    // 48px
$spacing-16: 4rem;    // 64px
$spacing-20: 5rem;    // 80px
$spacing-24: 6rem;    // 96px
```

**Guidelines:**
- Use relative units for spacing (rem, em, %, vw)
- Avoid fixed margins and padding in px unless necessary for alignment
- Use consistent spacing scale across components for rhythm

---

## 5. Media & Responsive Assets

✅ **Implemented:**
- Lazy loading with `loading="lazy"` attribute
- Applied to product images and detail images

**Guidelines:**
- Use responsive images with srcset and sizes
- Use next-gen formats (e.g., WebP/AVIF) for performance
- Reserve dimensions to prevent layout shift (CLS)

**Future Enhancement:**
- Implement srcset for multiple image sizes
- Convert images to WebP/AVIF format

---

## 6. Interaction & Touch

✅ **Implemented:**
- Minimum touch target size: 44px (2.75rem)
- Applied to all buttons, icon buttons, and interactive elements

**Examples:**
```scss
button {
  min-height: 2.75rem; // 44px
  min-width: 2.75rem;
}
```

**Guidelines:**
- No hover-only interactions; provide fallback for touch-based devices
- Maintain consistent hit-box and spacing around interactive elements

---

## 7. Progressive Enhancement & Fallbacks

**Current Implementation:**
- CSS-first approach for layouts
- No JavaScript dependency for layout

**Future Enhancement:**
- Use `@supports` for feature detection (e.g. container queries)
- Provide fallback layouts for browsers lacking feature support

---

## 8. Angular Integration Guidelines

✅ **Implemented:**
- No inline styling; all styles in SCSS files
- Component-level styling with proper encapsulation
- Components are independent and fluid

**Guidelines:**
- No hard-coded widths/heights inside components
- Components must not assume page context
- Leverage Angular async pipes and change detection optimizations

---

## 9. Performance & Rendering

✅ **Implemented:**
- No horizontal scroll (overflow-x: hidden on body)
- CSS animations preferred over JS
- Lazy loading for images

**Guidelines:**
- Minimize layout thrashing (avoid style recalculation triggers)
- Avoid unnecessary reflows caused by fixed pixel resizing
- Prioritize CSS over JS for animations to reduce main-thread blocking

---

## 10. Testing & Validation Requirements

**Must be validated on:**

**Devices:**
- Mobile (iOS + Android)
- Tablets
- Desktop
- Ultrawide monitors
- Portrait + landscape orientations

**Browsers:**
- Chrome (stable)
- Safari (stable)
- Firefox (stable)
- Safari mobile (mandatory)

**Test Conditions:**
- Throttled network
- Throttled CPU
- Real physical devices (not emulator-only)

---

## 11. Definition of Done

A page/component is considered responsive when:

✅ **Layout:**
- No layout overflow on narrow viewports
- Component layout adjusts without breakpoints for minor sizing changes
- Breakpoints exist only for structural layout shifts

✅ **Typography & Spacing:**
- Typography and spacing scale fluidly
- Readable line width maintained

✅ **Media:**
- Images and media adapt to container size
- Lazy loading implemented

✅ **Interaction:**
- Touch targets are valid (≥44px)
- Works on touch devices

✅ **Browser Support:**
- Works in Safari mobile
- Cross-browser compatible

---

## Implementation Status

### ✅ Completed
- Centralized SCSS system (breakpoints, spacing, typography, utilities)
- Mobile-first responsive layouts
- Fluid typography with clamp()
- Consistent spacing scale
- Touch-friendly interactive elements (44px minimum)
- Lazy loading for images
- Header with mobile hamburger menu
- Shop page with grid/list view toggle
- Product cards with consistent sizing
- Cart, login, and checkout responsive layouts
- Dynamic filter bar with mobile drawer
- Homepage carousels with horizontal scrolling

### 🔄 In Progress / Future Enhancements
- Container queries for component-level responsiveness
- Responsive images with srcset
- WebP/AVIF image formats
- @supports feature detection
- Comprehensive cross-browser testing
- Performance testing with throttled network/CPU
- Physical device testing

---

## File Structure

```
src/
├── styles/
│   ├── _breakpoints.scss      # Breakpoint definitions and mixins
│   ├── _spacing.scss          # Spacing scale and utilities
│   ├── _typography.scss       # Fluid typography scale
│   ├── _utilities.scss        # Utility classes
│   └── themes/
│       └── _theme-variables.scss
├── app/
│   ├── layout/
│   │   └── header/           # Responsive header with mobile menu
│   ├── features/
│   │   ├── home/             # Homepage with carousels
│   │   ├── shop/             # Shop with grid/list view
│   │   ├── cart/             # Responsive cart
│   │   └── account/          # Responsive login/register
│   └── shared/
│       └── components/
│           └── dynamic-filter-bar/  # Mobile filter drawer
└── RESPONSIVE_DESIGN_GUIDE.md       # Detailed implementation guide
```

---

## Key Principles

1. **Mobile-First:** Start with mobile layout, enhance for larger screens
2. **Content-Driven:** Breakpoints based on content needs, not devices
3. **Fluid by Default:** Use relative units and flexible layouts
4. **Performance-First:** Optimize for mobile networks and devices
5. **Touch-Friendly:** All interactions work on touch devices
6. **Progressive Enhancement:** Core functionality works everywhere
7. **Component Independence:** Components adapt to their container
8. **Maintainable:** Centralized system, consistent patterns

---

## Next Steps

1. Implement container queries for advanced component responsiveness
2. Add srcset for responsive images
3. Convert images to WebP/AVIF
4. Comprehensive testing on physical devices
5. Performance audit with Lighthouse
6. Accessibility audit (WCAG 2.1 AA)
7. Cross-browser testing matrix
8. Document component-specific responsive patterns
