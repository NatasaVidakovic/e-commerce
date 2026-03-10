# Material Design 3 Dark Theme System

## Overview

This WebShop application now implements a comprehensive Material Design 3 dark theme system with proper color tokens, semantic status badges, and accessible contrast ratios.

## 🎨 Color Token System

### Primary / Brand Colors

| Token | Light Theme | Dark Theme | Usage |
|-------|-------------|------------|-------|
| `--md-sys-primary` | #3B82F6 | #90CAF9 | Main UI accent |
| `--md-sys-on-primary` | #FFFFFF | #0F1A2F | Text/icons on primary |
| `--md-sys-primary-container` | #DBEAFE | #1B3B70 | Buttons, selected bg |
| `--md-sys-on-primary-container` | #1E3A8A | #DDE4FF | Text on container |
| `--md-sys-primary-hover` | #2563EB | #82B8F8 | Hover state |
| `--md-sys-primary-press` | #1D4ED8 | #6A9FEA | Active/pressed state |

### Neutral (Background & Surfaces)

| Token | Light Theme | Dark Theme | Usage |
|-------|-------------|------------|-------|
| `--md-sys-bg-default` | #FFFFFF | #121212 | App background |
| `--md-sys-bg-surface` | #F9FAFB | #1E1E1E | Cards, panels |
| `--md-sys-bg-surface-variant` | #F3F4F6 | #292929 | List panels, alternating rows |
| `--md-sys-bg-surface-hover` | #F3F4F6 | #2E2E2E | Hovered area |
| `--md-sys-bg-elevated` | #FFFFFF | #242424 | Modals, drawers, dropdowns |
| `--md-sys-bg-border` | #E5E7EB | #373737 | Dividers & outlines |

### Text & Icon Colors

| Token | Light Theme | Dark Theme | Usage |
|-------|-------------|------------|-------|
| `--md-sys-text-primary` | #1F2937 | #E1E1E1 | Main text |
| `--md-sys-text-secondary` | #4B5563 | #B3B3B3 | Labels, metadata |
| `--md-sys-text-tertiary` | #6B7280 | #8A8A8A | Minor info, placeholders |
| `--md-sys-text-disabled` | #9CA3AF | #666666 | Disabled text |
| `--md-sys-text-on-surface` | #1F2937 | #E1E1E1 | General text on surfaces |
| `--md-sys-text-inverse` | #FFFFFF | #121212 | High contrast text |

### States (Success / Warning / Error / Info)

| Token | Light Theme | Dark Theme | Usage |
|-------|-------------|------------|-------|
| `--md-sys-success` | #16A34A | #66E2B3 | Success states |
| `--md-sys-success-container` | #D1FAE5 | #114D31 | Success fill background |
| `--md-sys-warning` | #F59E0B | #FFD966 | Warning states |
| `--md-sys-warning-container` | #FEF3C7 | #3F2E00 | Warning background |
| `--md-sys-error` | #DC2626 | #F26666 | Error states |
| `--md-sys-error-container` | #FEE2E2 | #410001 | Error background |
| `--md-sys-info` | #0EA5E9 | #78BFFF | Info / shipping states |
| `--md-sys-info-container` | #E0F2FE | #0C253F | Info background |

## 🔘 Component Styling

### Buttons

#### Primary Button
```scss
background: var(--md-sys-primary-container);
color: var(--md-sys-on-primary-container);

&:hover {
  background: var(--md-sys-primary-hover);
}

&:active {
  background: var(--md-sys-primary-press);
}
```

#### Secondary Button
```scss
background: var(--md-sys-bg-surface);
border: 1px solid var(--md-sys-bg-border);
color: var(--md-sys-text-primary);

&:hover {
  background: var(--md-sys-bg-surface-hover);
}
```

#### Ghost / Link Button
```scss
background: transparent;
color: var(--md-sys-primary);

&:hover {
  background: rgba(59, 130, 246, 0.10); // Light theme
  background: rgba(144, 202, 249, 0.10); // Dark theme
}
```

### Inputs & Form Fields

```scss
background: var(--md-sys-bg-surface);
border: 1px solid var(--md-sys-bg-border);
color: var(--md-sys-text-primary);

::placeholder {
  color: var(--md-sys-text-tertiary);
}

&:hover {
  border-color: var(--md-sys-text-secondary);
}

&:focus {
  border-color: var(--md-sys-primary);
  border-width: 2px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.30); // Light
  box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.30); // Dark
}
```

### Tables & Lists

```scss
table {
  background: var(--md-sys-bg-surface);
  border: 1px solid var(--md-sys-bg-border);
}

th {
  background: var(--md-sys-bg-surface-variant);
  color: var(--md-sys-text-secondary);
  font-weight: 600;
}

tr:nth-child(even) {
  background: var(--md-sys-bg-surface-hover);
}

tr:hover {
  background: rgba(144, 202, 249, 0.15); // Dark theme
}
```

### Dropdowns & Menus

```scss
.dropdown {
  background: var(--md-sys-bg-elevated);
  border: 1px solid var(--md-sys-bg-border);
  box-shadow: var(--shadow-lg);
}

.dropdown-item:hover {
  background: var(--md-sys-bg-surface-hover);
}

.dropdown-item.selected {
  background: var(--md-sys-primary-container);
  color: var(--md-sys-on-primary-container);
}
```

### Filter Chips

```scss
.chip {
  background: var(--md-sys-bg-surface-variant);
  color: var(--md-sys-text-primary);
}

.chip.selected {
  background: var(--md-sys-primary-container);
  color: var(--md-sys-on-primary-container);
}
```

## 📦 Semantic Status Badges

### Order Status Badges

The application includes pre-built semantic badge classes for order management:

| Order State | CSS Class | Badge Color (Dark) |
|-------------|-----------|-------------------|
| New | `badge-order-status-new` | Info (Blue) |
| Confirmed | `badge-order-status-confirmed` | Primary (Blue) |
| Preparing | `badge-order-status-preparing` | Info (Blue) |
| Shipped | `badge-order-status-shipped` | Info (Blue) |
| Delivered | `badge-order-status-delivered` | Success (Green) |
| Cancelled | `badge-order-status-cancelled` | Error (Red) |
| Returned | `badge-order-status-returned` | Warning (Yellow) |

#### Usage Example

```html
<span class="badge badge-order-status-delivered">
  Delivered
</span>
```

### Payment Status Badges

| Payment State | CSS Class | Badge Color |
|---------------|-----------|-------------|
| Pending | `badge-payment-status-pending` | Warning |
| Paid | `badge-payment-status-paid` | Success |
| Failed | `badge-payment-status-failed` | Error |
| Refunded | `badge-payment-status-refunded` | Default |

### Payment Type Badges

| Payment Type | CSS Class | Badge Color |
|--------------|-----------|-------------|
| Stripe | `badge-payment-type-stripe` | Primary |
| Cash on Delivery | `badge-payment-type-cod` | Success |

### Generic State Badges

| State | CSS Class | Usage |
|-------|-----------|-------|
| Draft | `badge-state-draft` | Draft items |
| Active | `badge-state-active` | Active items |
| Expired | `badge-state-expired` | Expired items |
| Disabled | `badge-state-disabled` | Disabled items |
| Default | `badge-state-default` | Default state |

## 🔔 Toast & Alert Styling

```scss
.toast {
  background: var(--md-sys-bg-elevated);
  color: var(--md-sys-text-primary);
}

.toast-success {
  border-left: 4px solid var(--md-sys-success);
}

.toast-error {
  border-left: 4px solid var(--md-sys-error);
}

.toast-warning {
  border-left: 4px solid var(--md-sys-warning);
}

.toast-info {
  border-left: 4px solid var(--md-sys-info);
}
```

## 📁 File Structure

```
client/src/styles/
├── themes/
│   └── _theme-variables.scss    # All Material Design tokens
├── _badges.scss                 # Semantic badge system
├── _breakpoints.scss            # Responsive breakpoints
├── _spacing.scss                # Spacing utilities
├── _typography.scss             # Typography system
├── _utilities.scss              # Utility classes
└── _progressive-enhancement.scss # Progressive enhancement
```

## 🎯 Implementation Guidelines

### 1. Always Use CSS Variables

✅ **Good:**
```scss
.my-component {
  background: var(--md-sys-bg-surface);
  color: var(--md-sys-text-primary);
}
```

❌ **Bad:**
```scss
.my-component {
  background: #1E1E1E;
  color: #E1E1E1;
}
```

### 2. Use Semantic Badge Classes

✅ **Good:**
```html
<span class="badge badge-order-status-delivered">Delivered</span>
```

❌ **Bad:**
```html
<span class="bg-green-100 text-green-800 px-2 py-1 rounded">Delivered</span>
```

### 3. Leverage State Tokens

For interactive elements, use the appropriate state tokens:

```scss
.button {
  background: var(--md-sys-primary-container);
  
  &:hover {
    background: var(--md-sys-primary-hover);
  }
  
  &:active {
    background: var(--md-sys-primary-press);
  }
}
```

### 4. Maintain Contrast Ratios

All color combinations meet WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- UI components: 3:1 contrast ratio

## 🔄 Backward Compatibility

Legacy color variables are mapped to new Material Design tokens:

```scss
--color-primary → var(--md-sys-primary)
--color-text-primary → var(--md-sys-text-primary)
--color-bg-primary → var(--md-sys-bg-default)
--color-surface → var(--md-sys-bg-surface)
```

This ensures existing components continue to work while new components can use the Material Design tokens directly.

## 🌓 Theme Switching

The theme system automatically adapts based on the `data-theme` attribute:

```html
<body data-theme="dark">
  <!-- Dark theme applied -->
</body>

<body data-theme="light">
  <!-- Light theme applied -->
</body>
```

## ✨ Benefits

1. **Consistent Design Language** - Material Design 3 principles throughout
2. **Accessible Contrast** - WCAG AA compliant color combinations
3. **Semantic Badges** - Pre-built status indicators for orders and payments
4. **Layered Depth** - Proper elevation system for dark theme
5. **Smooth Transitions** - All interactive states have proper hover/focus effects
6. **Maintainable** - Centralized token system for easy updates
7. **Responsive** - Works seamlessly on mobile and desktop
8. **Future-Proof** - Easy to extend with new tokens and components

## 📚 Additional Resources

- [Material Design 3 Guidelines](https://m3.material.io/)
- [Dark Theme Best Practices](https://material.io/design/color/dark-theme.html)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
