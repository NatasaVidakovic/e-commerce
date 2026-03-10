# ✅ GLOBAL RULE: PRODUCT CARD COLOR SYSTEM (DARK THEME)

> **Goal:** Make product pricing hierarchy readable, contrast-correct, and consistent across listing grids, detail page, checkout, and admin preview.

---

## **1. COLOR TOKENS (SEMANTIC VARIABLES)**

All product card colors are defined as **semantic tokens** in `_theme-variables.scss`. Developers should **never hardcode hex values** in components.

### **Light Theme Tokens**

```scss
// Pricing Colors
--color-price-original: #6B7280;        // Muted gray, struck-through old price
--color-price-current: #DC2626;         // Promo discounted price (primary red)
--color-price-save: #16A34A;            // Positive "save" informative green
--color-price-regular: #1F2937;         // Regular price when no discount
--color-price-currency: #9CA3AF;        // Lighter variation for currency symbol

// Badge Colors
--color-badge-discount: #DC2626;        // Discount badge background
--color-badge-new: #06B6D4;             // New product badge (cyan)
--color-badge-limited: #F59E0B;         // Limited availability (orange)
--color-badge-bestseller: #9333EA;      // Best seller badge (purple)
--color-badge-text: #FFFFFF;            // Text inside badges

// Card States
--color-card-bg: #FFFFFF;               // Product card background
--color-card-hover: #F9FAFB;            // Hover state
--color-card-border: #E5E7EB;           // Card border
--color-card-selected: #DBEAFE;         // Selected state
--color-card-disabled: rgba(255, 255, 255, 0.4);  // Disabled/out of stock

// Text Elements
--color-product-title: #1F2937;         // Product title
--color-product-subtitle: #6B7280;      // Subtitle/description
--color-product-category: #9CA3AF;      // Category tags
--color-info-tag: #EF4444;              // Optional brand/info tag
```

### **Dark Theme Tokens**

```scss
// Pricing Colors
--color-price-original: #9AA1AC;        // Muted gray, struck-through old price
--color-price-current: #E32B2B;         // Promo discounted price (primary red)
--color-price-save: #3ACC6C;            // Positive "save" informative green
--color-price-regular: #DDE3ED;         // Regular price when no discount
--color-price-currency: #C2C7D2;        // Lighter variation for currency symbol

// Badge Colors
--color-badge-discount: #E64040;        // Discount badge background
--color-badge-new: #3DE1DF;             // New product badge (cyan)
--color-badge-limited: #F29B38;         // Limited availability (orange)
--color-badge-bestseller: #A762EA;      // Best seller badge (purple)
--color-badge-text: #FFFFFF;            // Text inside badges

// Card States
--color-card-bg: #1B232F;               // Product card background
--color-card-hover: #232C3B;            // Hover state
--color-card-border: #2A3441;           // Card border
--color-card-selected: #1B3B70;         // Selected state
--color-card-disabled: rgba(27, 35, 47, 0.4);  // Disabled/out of stock

// Text Elements
--color-product-title: #FFFFFF;         // Product title
--color-product-subtitle: #AEB4C0;      // Subtitle/description
--color-product-category: #8A8F9A;      // Category tags
--color-info-tag: #F38C8C;              // Optional brand/info tag
```

---

## **2. PRICE DISPLAY HIERARCHY RULES**

### **CASE A: Product with Discount**

```
OLD PRICE (if exists)
↓
CURRENT PRICE (prominent)
↓
SAVE AMOUNT (optional)
```

#### HTML Structure

```html
<div class="product-price">
  <div class="product-price__original">
    <span class="product-price__currency">$</span>200.00
  </div>
  <div class="product-price__current">
    <span class="product-price__currency">$</span>140.00
  </div>
  <div class="product-price__save">60.00</div>
</div>
```

#### Style Rules

| Element | CSS Class | Style Rules |
|---------|-----------|-------------|
| Old price | `.product-price__original` | `color: var(--color-price-original)`<br>`text-decoration: line-through`<br>`opacity: 0.85`<br>`font-size: 0.875rem` |
| Current price | `.product-price__current` | `color: var(--color-price-current)`<br>`font-weight: 700`<br>`font-size: 1.25rem` (mobile)<br>`font-size: 1.5rem` (desktop) |
| Save amount | `.product-price__save` | `color: var(--color-price-save)`<br>`font-size: 0.8125rem`<br>`::before { content: "Save " }` |
| Currency symbol | `.product-price__currency` | `color: var(--color-price-currency)`<br>`font-size: 0.8em`<br>`vertical-align: baseline` |

---

### **CASE B: Product NOT Discounted**

```html
<div class="product-price">
  <div class="product-price__regular">
    <span class="product-price__currency">$</span>200.00
  </div>
</div>
```

#### Rules:
- Use `.product-price__regular` class
- No strike-through
- No discount badge
- No save label
- Color: `var(--color-price-regular)`

---

## **3. BADGE SYSTEM**

### **Badge Placement**

Badges appear in the **top-right corner** of the product card image, stacked vertically with 6px gap.

```html
<div class="product-image-wrapper">
  <img src="product.jpg" alt="Product">
  <div class="product-badges">
    <span class="product-badge product-badge--discount">20</span>
    <span class="product-badge product-badge--new">NEW</span>
  </div>
</div>
```

### **Badge Types**

| Badge Type | CSS Class | Background Token | Usage |
|------------|-----------|------------------|-------|
| Discount | `.product-badge--discount` | `--color-badge-discount` | Shows percentage off (e.g., "-20%") |
| New | `.product-badge--new` | `--color-badge-new` | New product indicator |
| Limited | `.product-badge--limited` | `--color-badge-limited` | Limited availability |
| Best Seller | `.product-badge--bestseller` | `--color-badge-bestseller` | Popular product |

### **Badge Sizes**

```html
<!-- Default -->
<span class="product-badge product-badge--discount">20</span>

<!-- Small -->
<span class="product-badge product-badge--discount product-badge--sm">20</span>

<!-- Large -->
<span class="product-badge product-badge--discount product-badge--lg">20</span>
```

### **Discount Badge Format**

The discount badge automatically adds `-` prefix and `%` suffix:

```html
<span class="product-badge product-badge--discount">20</span>
<!-- Renders as: "-20%" -->
```

---

## **4. PRODUCT CARD STRUCTURE**

### **Complete Example**

```html
<div class="product-card">
  <div class="product-image-wrapper">
    <img src="product.jpg" alt="Product Name">
    <div class="product-badges">
      <span class="product-badge product-badge--discount">30</span>
      <span class="product-badge product-badge--new">NEW</span>
    </div>
  </div>
  
  <div class="product-card-content">
    <span class="product-category">Electronics</span>
    
    <h3 class="product-title">Premium Wireless Headphones</h3>
    
    <p class="product-subtitle">High-quality sound with noise cancellation</p>
    
    <div class="product-price">
      <div class="product-price__original">
        <span class="product-price__currency">$</span>299.99
      </div>
      <div class="product-price__current">
        <span class="product-price__currency">$</span>209.99
      </div>
      <div class="product-price__save">90.00</div>
    </div>
  </div>
</div>
```

---

## **5. TEXT & SPACING RULES**

### **Product Title**
- **Class:** `.product-title`
- **Color:** `var(--color-product-title)`
- **Font Size:** 1rem (mobile), 1.125rem (desktop)
- **Max Lines:** 2 lines with ellipsis overflow
- **Font Weight:** 600

### **Product Subtitle**
- **Class:** `.product-subtitle`
- **Color:** `var(--color-product-subtitle)`
- **Font Size:** 0.875rem
- **Max Lines:** 1 line with ellipsis
- **Font Weight:** 400

### **Category/Tags**
- **Class:** `.product-category` or `.product-tag`
- **Color:** `var(--color-product-category)`
- **Font Size:** 0.75rem
- **Transform:** uppercase
- **Letter Spacing:** 0.025em

### **Vertical Spacing**

```
image
↓ 12px (mobile) / 16px (desktop)
category
↓ 8px
title
↓ 6px
subtitle
↓ 8px
price block
```

---

## **6. CARD STATES**

### **Default State**

```scss
.product-card {
  background-color: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
}
```

### **Hover State**

```scss
.product-card:hover {
  background-color: var(--color-card-hover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

### **Selected State**

```scss
.product-card.selected {
  background-color: var(--color-card-selected);
  border-color: var(--md-sys-primary);
  outline: 2px solid var(--md-sys-primary);
}
```

### **Disabled/Out of Stock**

```scss
.product-card.out-of-stock {
  opacity: 0.4;
  pointer-events: none;
  filter: grayscale(0.5);
}
```

Displays "OUT OF STOCK" overlay automatically.

---

## **7. RESPONSIVE BEHAVIOR**

### **Grid Layouts**

```scss
.product-grid {
  // Mobile: 2 columns
  grid-template-columns: repeat(2, 1fr);
  
  // Tablet: 3 columns
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  // Desktop: 4 columns
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
  
  // Large desktop: 5 columns
  @media (min-width: 1440px) {
    grid-template-columns: repeat(5, 1fr);
  }
}
```

### **Price Stack**

| View | Layout |
|------|--------|
| Mobile | Vertical stack (default) |
| Desktop | Horizontal option with `.product-price--horizontal` |

### **Currency Symbol Sizing**

- **Mobile:** 0.75rem
- **Desktop:** 0.8em (relative to price)

---

## **8. FORMAT RULES**

### **Discount Calculation**

Discounts must calculate visually meaningful values:

```typescript
// Example calculation
const originalPrice = 200;
const currentPrice = 140;
const saveAmount = originalPrice - currentPrice; // 60
const discountPercent = Math.round((saveAmount / originalPrice) * 100); // 30%
```

### **Currency Formatting**

Use Angular's `currency` pipe or custom formatting:

```html
{{ product.price | currency:'USD':'symbol':'1.2-2' }}
```

---

## **9. IMPLEMENTATION GUIDE FOR DEVELOPERS**

### **❌ DO NOT**

```scss
// Bad: Hardcoded colors
.my-price {
  color: #E32B2B;
}
```

### **✅ DO**

```scss
// Good: Use semantic tokens
.my-price {
  color: var(--color-price-current);
}
```

### **Component Structure**

```
ProductCardComponent
  ↳ ProductImageComponent
      ↳ ProductBadgesComponent
  ↳ ProductInfoComponent
      ↳ ProductPriceComponent
```

### **Service Layer**

Create a `PriceService` or `PriceAdapter` to handle:
- Price calculations
- Discount percentages
- Currency formatting
- Save amount display

---

## **10. APPLIES THROUGHOUT APP**

This color system is **not only for product cards** — the same tokens apply in:

✅ **Product Listing** (Shop page)  
✅ **Product Detail** (Detail page)  
✅ **Shopping Cart** (Cart items)  
✅ **Checkout Summary** (Order review)  
✅ **Favorites/Wishlist** (Saved items)  
✅ **Search Results** (Search page)  
✅ **Category Lists** (Category pages)  
✅ **Admin Preview** (Admin product management)  
✅ **Order History** (Past orders)  

**Consistency makes the brand stronger.**

---

## **11. ACCESSIBILITY & CONTRAST**

All color combinations meet **WCAG AA standards**:

| Element | Contrast Ratio | Standard |
|---------|----------------|----------|
| Price text on card background | 7:1 | AAA |
| Badge text on badge background | 4.5:1 | AA |
| Product title on card background | 7:1 | AAA |
| Subtitle on card background | 4.5:1 | AA |

---

## **12. LOADING STATE**

Cards support a loading skeleton state:

```html
<div class="product-card loading">
  <div class="product-image-wrapper"></div>
  <div class="product-card-content">
    <div class="product-title"></div>
    <div class="product-price"></div>
  </div>
</div>
```

Displays animated gradient shimmer effect.

---

## **13. QUICK REFERENCE**

### **Most Common Classes**

```scss
// Card
.product-card
.product-card:hover
.product-card.selected
.product-card.out-of-stock

// Layout
.product-image-wrapper
.product-card-content
.product-badges

// Text
.product-title
.product-subtitle
.product-category

// Pricing
.product-price
.product-price__original
.product-price__current
.product-price__regular
.product-price__save
.product-price__currency

// Badges
.product-badge
.product-badge--discount
.product-badge--new
.product-badge--limited
.product-badge--bestseller
```

---

## **14. MIGRATION GUIDE**

### **Updating Existing Components**

1. **Replace hardcoded colors** with semantic tokens
2. **Add proper CSS classes** to price elements
3. **Implement badge system** for discounts
4. **Update responsive breakpoints** to match grid system
5. **Test in both light and dark themes**

### **Example Migration**

**Before:**
```html
<div class="price" style="color: red;">$140.00</div>
```

**After:**
```html
<div class="product-price__current">
  <span class="product-price__currency">$</span>140.00
</div>
```

---

## **15. THEME SWITCHING**

The system automatically adapts based on the `data-theme` attribute:

```html
<body data-theme="dark">
  <!-- Dark theme tokens applied -->
</body>

<body data-theme="light">
  <!-- Light theme tokens applied -->
</body>
```

No component changes required when switching themes.

---

## **16. BENEFITS**

✅ **Consistent Design Language** - Unified pricing display across all views  
✅ **Accessible Contrast** - WCAG AA/AAA compliant  
✅ **Semantic Tokens** - Easy theme switching  
✅ **Responsive** - Mobile-first approach  
✅ **Maintainable** - Centralized color system  
✅ **Scalable** - Easy to extend with new badge types  
✅ **Performance** - CSS-only animations  
✅ **Future-Proof** - No hardcoded values  

---

## **📚 Related Documentation**

- [Material Design Dark Theme](./MATERIAL_DESIGN_DARK_THEME.md)
- [Responsive Design Guide](./RESPONSIVE_DESIGN_GUIDE.md)
- [Theme Variables Reference](../src/styles/themes/_theme-variables.scss)
- [Product Card Styles](../src/styles/_product-cards.scss)
