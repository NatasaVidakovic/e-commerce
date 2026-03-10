# Theme System Documentation

## Overview

This application uses a centralized CSS variable-based theme system that supports:
- Light and dark modes
- Customizable primary, secondary, and accent colors
- Automatic persistence of theme preferences
- Admin configuration interface

## Architecture

### Core Files

1. **`src/styles/themes/_theme-variables.scss`**
   - Defines all CSS custom properties (variables) for both light and dark themes
   - Contains color definitions for all UI elements
   - Organized by semantic purpose (primary, error, success, text, background, etc.)

2. **`src/styles/themes/_theme-mixins.scss`**
   - Reusable SCSS mixins for common theme patterns
   - Provides utilities for cards, buttons, inputs, badges, etc.

3. **`src/app/core/services/theme.service.ts`**
   - Angular service for runtime theme management
   - Handles theme switching and persistence
   - Supports custom color overrides

4. **`src/app/features/admin/theme-settings/`**
   - Admin UI for theme configuration
   - Allows switching between light/dark modes
   - Enables custom color selection

## Using Theme Variables

### In Component SCSS Files

Instead of hardcoded colors:
```scss
// ❌ Don't do this
.my-component {
  background-color: #3b82f6;
  color: #ffffff;
}
```

Use theme variables:
```scss
// ✅ Do this
.my-component {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}
```

### Available CSS Variables

#### Primary Colors
- `--color-primary` - Main brand color
- `--color-primary-hover` - Hover state
- `--color-primary-active` - Active/pressed state
- `--color-primary-light` - Light variant
- `--color-primary-lighter` - Lighter variant

#### Semantic Colors
- `--color-success` / `--color-success-hover` / `--color-success-light` / `--color-success-dark`
- `--color-error` / `--color-error-hover` / `--color-error-light` / `--color-error-dark`
- `--color-warning` / `--color-warning-hover` / `--color-warning-light` / `--color-warning-dark`
- `--color-info` / `--color-info-hover` / `--color-info-light` / `--color-info-dark`

#### Text Colors
- `--color-text-primary` - Main text
- `--color-text-secondary` - Secondary text
- `--color-text-tertiary` - Tertiary/muted text
- `--color-text-disabled` - Disabled text
- `--color-text-inverse` - Inverse text (for dark backgrounds)

#### Background Colors
- `--color-bg-primary` - Main background
- `--color-bg-secondary` - Secondary background
- `--color-bg-tertiary` - Tertiary background
- `--color-bg-hover` - Hover background
- `--color-bg-active` - Active background

#### Surface Colors (Cards, Panels)
- `--color-surface` - Card/panel background
- `--color-surface-hover` - Hover state
- `--color-surface-raised` - Elevated surface

#### Border Colors
- `--color-border-primary` - Main borders
- `--color-border-secondary` - Secondary borders
- `--color-border-focus` - Focus state
- `--color-border-error` - Error state

#### Shadows
- `--shadow-sm` - Small shadow
- `--shadow-md` - Medium shadow
- `--shadow-lg` - Large shadow
- `--shadow-xl` - Extra large shadow

#### Badge Colors
- `--color-badge-draft-bg` / `--color-badge-draft-text`
- `--color-badge-active-bg` / `--color-badge-active-text`
- `--color-badge-expired-bg` / `--color-badge-expired-text`
- `--color-badge-disabled-bg` / `--color-badge-disabled-text`
- `--color-badge-default-bg` / `--color-badge-default-text`

#### Gradients
- `--gradient-primary`
- `--gradient-secondary`
- `--gradient-accent`
- `--gradient-surface`

## Using the Theme Service

### In Components

```typescript
import { ThemeService } from '@core/services/theme.service';

export class MyComponent {
  constructor(private themeService: ThemeService) {}
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }
  
  setDarkMode() {
    this.themeService.setThemeMode('dark');
  }
  
  setCustomColors() {
    this.themeService.setCustomColors({
      primaryColor: '#ff6b6b',
      secondaryColor: '#4ecdc4'
    });
  }
}
```

### Theme Configuration

The theme service automatically:
- Loads saved preferences from localStorage
- Applies theme on initialization
- Persists changes automatically
- Respects system dark mode preference (if no saved preference)

## Admin Theme Configuration

Admins can configure the theme via the Theme Settings page:

1. Navigate to Admin Panel → Theme Settings
2. Toggle between Light/Dark mode
3. Select custom colors using color pickers
4. Preview changes in real-time
5. Apply or reset to defaults

## Dark Mode Implementation

Dark mode is implemented using the `[data-theme="dark"]` attribute selector:

```scss
:root {
  --color-primary: #3b82f6; // Light mode
}

[data-theme="dark"] {
  --color-primary: #60a5fa; // Dark mode
}
```

The theme service applies this attribute to the `<html>` element when dark mode is enabled.

## Best Practices

1. **Always use semantic variables**: Use `--color-primary` instead of `--color-blue-500`
2. **Avoid inline styles**: Use CSS classes with theme variables
3. **Test both themes**: Always verify components work in both light and dark modes
4. **Use mixins for common patterns**: Import and use theme mixins for consistency
5. **Maintain contrast**: Ensure text is readable in both themes

## Migration Guide

To migrate existing components to use the theme system:

1. Identify hardcoded colors in SCSS files
2. Replace with appropriate CSS variables
3. Test in both light and dark modes
4. Update any inline styles in templates
5. Verify accessibility (contrast ratios)

## Example Component Migration

### Before
```scss
.my-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #1f2937;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.my-button {
  background: #3b82f6;
  color: white;
  
  &:hover {
    background: #2563eb;
  }
}
```

### After
```scss
.my-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-primary);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-md);
}

.my-button {
  background: var(--color-btn-primary-bg);
  color: var(--color-btn-primary-text);
  
  &:hover {
    background: var(--color-btn-primary-hover);
  }
}
```

## Troubleshooting

### Theme not applying
- Ensure `_theme-variables.scss` is imported in `styles.scss`
- Check that the theme service is initialized in the app
- Verify localStorage is accessible

### Colors not changing
- Clear browser cache
- Check for hardcoded colors overriding variables
- Verify CSS specificity isn't causing issues

### Dark mode not working
- Ensure `[data-theme="dark"]` is applied to `<html>` element
- Check that dark mode variables are defined
- Verify no `!important` rules are overriding theme variables
