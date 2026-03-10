# Responsive Design Testing Checklist

## Device Testing Matrix

### Mobile Devices
- [ ] iPhone SE (375x667)
- [ ] iPhone 12/13/14 (390x844)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] Samsung Galaxy S21 (360x800)
- [ ] Samsung Galaxy S21 Ultra (384x854)
- [ ] Google Pixel 5 (393x851)
- [ ] Google Pixel 7 Pro (412x915)

### Tablets
- [ ] iPad Mini (768x1024)
- [ ] iPad Air (820x1180)
- [ ] iPad Pro 11" (834x1194)
- [ ] iPad Pro 12.9" (1024x1366)
- [ ] Samsung Galaxy Tab S8 (800x1280)
- [ ] Surface Pro 8 (912x1368)

### Desktop
- [ ] 1366x768 (Small laptop)
- [ ] 1920x1080 (Full HD)
- [ ] 2560x1440 (2K)
- [ ] 3840x2160 (4K)

### Ultrawide
- [ ] 2560x1080 (21:9)
- [ ] 3440x1440 (21:9)
- [ ] 5120x1440 (32:9)

### Orientations
- [ ] Portrait mode on all mobile/tablet devices
- [ ] Landscape mode on all mobile/tablet devices

---

## Browser Testing

### Desktop Browsers
- [ ] Chrome (latest stable)
- [ ] Firefox (latest stable)
- [ ] Safari (latest stable)
- [ ] Edge (latest stable)

### Mobile Browsers
- [ ] Safari iOS (mandatory)
- [ ] Chrome Android
- [ ] Firefox Android
- [ ] Samsung Internet

---

## Performance Testing

### Network Conditions
- [ ] Fast 3G (throttled)
- [ ] Slow 3G (throttled)
- [ ] 4G (throttled)
- [ ] Offline mode

### CPU Throttling
- [ ] 4x slowdown
- [ ] 6x slowdown

### Lighthouse Audits
- [ ] Performance score ≥ 70 (mobile)
- [ ] Performance score ≥ 90 (desktop)
- [ ] Accessibility score ≥ 90
- [ ] Best Practices score ≥ 90
- [ ] SEO score ≥ 90

---

## Layout Testing

### Homepage
- [ ] Hero section scales properly
- [ ] Discount carousel scrolls horizontally
- [ ] Product carousels scroll horizontally
- [ ] Navigation arrows don't overlap content
- [ ] No horizontal scroll on any viewport
- [ ] Images load with lazy loading
- [ ] Touch targets ≥ 44px

### Shop Page
- [ ] Filter sidebar collapses to drawer on mobile
- [ ] Grid/list view toggle works
- [ ] Product grid adapts to viewport
- [ ] Product cards have consistent heights
- [ ] Pagination is accessible
- [ ] No content overflow
- [ ] Touch targets ≥ 44px

### Product Detail
- [ ] Image and details stack on mobile
- [ ] Side-by-side layout on desktop
- [ ] Add to cart button accessible
- [ ] Reviews section readable
- [ ] No horizontal scroll
- [ ] Touch targets ≥ 44px

### Cart
- [ ] Cart items stack on mobile
- [ ] Side-by-side on desktop
- [ ] Quantity controls accessible
- [ ] Order summary visible
- [ ] Checkout button accessible
- [ ] Touch targets ≥ 44px

### Checkout
- [ ] Form fields stack properly
- [ ] Address form readable
- [ ] Payment section accessible
- [ ] Order summary visible
- [ ] Submit button accessible
- [ ] Touch targets ≥ 44px

### Login/Register
- [ ] Form centered and readable
- [ ] Input fields accessible
- [ ] Submit button accessible
- [ ] Links readable
- [ ] Touch targets ≥ 44px

### Header/Navigation
- [ ] Logo visible at all sizes
- [ ] Hamburger menu on mobile
- [ ] Desktop nav on larger screens
- [ ] Cart icon accessible
- [ ] Language selector works
- [ ] Mobile menu slides in/out
- [ ] Touch targets ≥ 44px

---

## Typography Testing

- [ ] All text readable at smallest viewport (320px)
- [ ] Headings scale fluidly
- [ ] Body text scales fluidly
- [ ] Line length 45-75 characters
- [ ] Line height appropriate for readability
- [ ] No text overflow or truncation issues

---

## Spacing Testing

- [ ] Consistent spacing across all components
- [ ] No cramped layouts on mobile
- [ ] No excessive whitespace on desktop
- [ ] Padding scales appropriately
- [ ] Margins scale appropriately
- [ ] Gap spacing consistent

---

## Touch Target Testing

### Buttons
- [ ] All buttons ≥ 44px height
- [ ] All buttons ≥ 44px width (or full width)
- [ ] Adequate spacing between buttons

### Icon Buttons
- [ ] All icon buttons ≥ 44px x 44px
- [ ] Adequate spacing around icons

### Links
- [ ] All clickable links have adequate hit area
- [ ] Links in text have adequate spacing

### Form Controls
- [ ] Input fields ≥ 44px height
- [ ] Checkboxes/radios ≥ 44px hit area
- [ ] Select dropdowns ≥ 44px height

---

## Image Testing

- [ ] All images have lazy loading
- [ ] Images scale to container
- [ ] No layout shift when images load (CLS)
- [ ] Alt text present on all images
- [ ] Images maintain aspect ratio
- [ ] No pixelated or stretched images

---

## Interaction Testing

### Mouse/Desktop
- [ ] Hover states work on desktop
- [ ] Click interactions work
- [ ] Keyboard navigation works
- [ ] Focus states visible

### Touch/Mobile
- [ ] Tap interactions work
- [ ] Swipe gestures work (carousels)
- [ ] No hover-only functionality
- [ ] Touch feedback visible
- [ ] No accidental taps

---

## Accessibility Testing

- [ ] Keyboard navigation works throughout
- [ ] Focus indicators visible
- [ ] ARIA labels present where needed
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Form labels associated correctly
- [ ] Error messages accessible

---

## Edge Cases

- [ ] Very long product names handled
- [ ] Very long discount names handled
- [ ] Empty states display correctly
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] No products scenario
- [ ] Single product scenario
- [ ] Many products scenario (100+)

---

## Cross-Browser Issues

### Known Issues to Check
- [ ] CSS Grid support
- [ ] Flexbox gap support
- [ ] clamp() function support
- [ ] aspect-ratio support
- [ ] Container queries support (if implemented)
- [ ] Custom properties (CSS variables)

---

## Performance Metrics

### Target Metrics
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.8s

---

## Definition of Done

A page is considered fully responsive when:

✅ **All device sizes tested** (mobile, tablet, desktop, ultrawide)
✅ **All orientations tested** (portrait and landscape)
✅ **All browsers tested** (Chrome, Safari, Firefox, Edge)
✅ **Safari mobile tested** (mandatory)
✅ **No horizontal scroll** on any viewport
✅ **Typography scales fluidly** across all viewports
✅ **Touch targets ≥ 44px** on all interactive elements
✅ **Images lazy load** and don't cause layout shift
✅ **Performance metrics met** (Lighthouse ≥ 70 mobile)
✅ **Accessibility score ≥ 90** (Lighthouse)
✅ **No layout overflow** or content clipping
✅ **Consistent spacing** across all breakpoints

---

## Testing Tools

### Chrome DevTools
- Device toolbar (responsive mode)
- Network throttling
- CPU throttling
- Lighthouse audits
- Coverage tool

### Browser Extensions
- WAVE (accessibility)
- axe DevTools (accessibility)
- Responsive Viewer
- Viewport Resizer

### Online Tools
- BrowserStack (real device testing)
- LambdaTest (cross-browser testing)
- WebPageTest (performance)
- PageSpeed Insights (performance)

### Physical Devices
- At least one iOS device (iPhone)
- At least one Android device
- At least one tablet (iPad or Android)

---

## Reporting Template

### Issue Report Format
```
**Device:** [e.g., iPhone 14, Safari iOS 16]
**Viewport:** [e.g., 390x844]
**Page:** [e.g., Shop page]
**Issue:** [Description of the issue]
**Expected:** [What should happen]
**Actual:** [What actually happens]
**Screenshot:** [Attach screenshot]
**Priority:** [High/Medium/Low]
```

---

## Sign-Off Checklist

Before marking responsive implementation as complete:

- [ ] All critical pages tested on physical devices
- [ ] Safari mobile testing completed
- [ ] Performance audits passed
- [ ] Accessibility audits passed
- [ ] Cross-browser testing completed
- [ ] Edge cases handled
- [ ] Documentation updated
- [ ] Team review completed
- [ ] Stakeholder approval received
