# Theme Variables Quick Reference

## Most Commonly Used Variables

### Colors
```scss
// Primary Brand Colors
var(--color-primary)           // Main brand color
var(--color-primary-hover)     // Hover state
var(--color-secondary)         // Secondary brand color
var(--color-accent)            // Accent/highlight color

// Status Colors
var(--color-success)           // Success states
var(--color-error)             // Error states  
var(--color-warning)           // Warning states
var(--color-info)              // Info states

// Text Colors
var(--color-text-primary)      // Main text
var(--color-text-secondary)    // Secondary text
var(--color-text-tertiary)     // Muted text

// Backgrounds
var(--color-bg-primary)        // Main background
var(--color-bg-secondary)      // Secondary background
var(--color-surface)           // Cards/panels

// Borders
var(--color-border-primary)    // Standard borders
var(--color-border-focus)      // Focus state borders

// Shadows
var(--shadow-sm)               // Small shadow
var(--shadow-md)               // Medium shadow
var(--shadow-lg)               // Large shadow
```

## Common Patterns

### Card Component
```scss
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-primary);
  box-shadow: var(--shadow-md);
  color: var(--color-text-primary);
}
```

### Button Component
```scss
.button-primary {
  background: var(--color-btn-primary-bg);
  color: var(--color-btn-primary-text);
  
  &:hover {
    background: var(--color-btn-primary-hover);
  }
}
```

### Input Component
```scss
.input {
  background: var(--color-input-bg);
  color: var(--color-input-text);
  border: 1px solid var(--color-input-border);
  
  &:focus {
    border-color: var(--color-input-border-focus);
  }
  
  &::placeholder {
    color: var(--color-input-placeholder);
  }
}
```

### Badge Component
```scss
.badge-success {
  background: var(--color-badge-active-bg);
  color: var(--color-badge-active-text);
}

.badge-error {
  background: var(--color-badge-expired-bg);
  color: var(--color-badge-expired-text);
}
```

## Migration Cheat Sheet

| Old Hardcoded Color | New Theme Variable |
|---------------------|-------------------|
| `#3b82f6` (blue) | `var(--color-primary)` |
| `#ffffff` (white) | `var(--color-surface)` or `var(--color-text-inverse)` |
| `#1f2937` (dark gray) | `var(--color-text-primary)` |
| `#6b7280` (gray) | `var(--color-text-tertiary)` |
| `#16a34a` (green) | `var(--color-success)` |
| `#dc2626` (red) | `var(--color-error)` |
| `#f59e0b` (orange) | `var(--color-warning)` |
| `#e5e7eb` (light gray) | `var(--color-border-primary)` |
| `rgba(0,0,0,0.1)` | `var(--color-bg-overlay)` |
