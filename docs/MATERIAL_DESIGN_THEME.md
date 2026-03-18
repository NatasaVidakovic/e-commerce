# Theme and Color System Documentation

## Overview

This WebShop application implements a comprehensive theme system with full light/dark mode support, semantic color tokens, and extensive customization capabilities. The system supports real-time theme switching, admin configuration, and consistent color application across all components.

**Note:** This system uses custom CSS variables (not Material Design 3 tokens) for better flexibility and control.

---

## Architecture Overview

### Core Theme Components

1. **Theme Service** (`src/app/core/services/theme.service.ts`) 
   - Runtime theme management
   - Light/dark mode switching
   - Custom color overrides
   - localStorage persistence

2. **Theme Variables** (`src/styles/themes/_theme-variables.scss`) 
   - CSS custom properties for all colors
   - Light and dark mode definitions
   - Semantic color organization

3. **Theme Mixins** (`src/styles/themes/_theme-mixins.scss`) 
   - Reusable SCSS mixins
   - Common theme patterns
   - Component styling utilities

4. **Admin Configuration** (`src/app/features/admin/theme-settings/`) 
   - Theme customization interface
   - Real-time preview
   - Color picker integration

---

## Implementation Status

### **FEATURES**

- Theme service with light/dark mode switching
- CSS custom properties for all colors
- Admin theme configuration interface
- localStorage persistence for theme preferences
- Real-time theme preview
- Custom color override functionality

### **MISSING FEATURES**

- Component-level theme mixins usage
- Comprehensive component theming
- Advanced theme animations
- Theme export/import functionality
- Per-user theme storage in database

---

## Color Token System

**Note:** This application uses custom CSS variables, not Material Design 3 tokens.

### Primary / Brand Colors

| Token | Light Theme | Dark Theme | Usage |
|-------|-------------|------------|-------|
| `--color-primary` | #3b82f6 | #60a5fa | Main UI accent |
| `--color-primary-hover` | #2563eb | #3b82f6 | Hover state |
| `--color-primary-active` | #1d4ed8 | #2563eb | Active/pressed state |
| `--color-primary-light` | #dbeafe | #1e3a8a | Light variant |
| `--color-primary-lighter` | #eff6ff | #1e40af | Lighter variant |

### Secondary Colors

| Token | Light Theme | Dark Theme | Usage |
|-------|-------------|------------|-------|
| `--color-secondary` | #9333ea | #a855f7 | Secondary accent |
| `--color-secondary-hover` | #7e22ce | #9333ea | Hover state |
| `--color-secondary-active` | #6b21a8 | #7e22ce | Active state |
| `--color-secondary-light` | #f3e8ff | #581c87 | Light variant |

### Accent Colors

| Token | Light Theme | Dark Theme | Usage |
|-------|-------------|------------|-------|
| `--color-accent` | #7d00fa | #a78bfa | Highlight elements |
| `--color-accent-hover` | #6b00d9 | #8b5cf6 | Hover state |

### Neutral (Background & Surfaces)

| Token | Light Theme | Dark Theme | Usage |
|-------|-------------|------------|-------|
| `--color-bg-primary` | #ffffff | #111827 | App background |
| `--color-bg-secondary` | #f9fafb | #1f2937 | Cards, panels |
| `--color-bg-tertiary` | #f3f4f6 | #374151 | List panels, alternating rows |
| `--color-bg-hover` | #f3f4f6 | #374151 | Hovered area |
| `--color-bg-elevated` | #ffffff | #1f2937 | Modals, drawers, dropdowns |
| `--color-bg-border` | #e5e7eb | #4b5563 | Dividers & outlines |

### Text & Icon Colors

| Token | Light Theme | Dark Theme | Usage |
|-------|-------------|------------|-------|
| `--color-text-primary` | #111827 | #f9fafb | Main text |
| `--color-text-secondary` | #4b5563 | #d1d5db | Labels, metadata |
| `--color-text-tertiary` | #6b7280 | #9ca3af | Minor info, placeholders |
| `--color-text-disabled` | #9ca3af | #6b7280 | Disabled text |
| `--color-text-inverse` | #ffffff | #111827 | High contrast text |

### States (Success / Warning / Error / Info)

| Token | Light Theme | Dark Theme | Usage |
|-------|-------------|------------|-------|
| `--color-success` | #16a34a | #34d399 | Success states |
| `--color-success-light` | #d1fae5 | #065f46 | Success fill background |
| `--color-success-dark` | #065f46 | #d1fae5 | Success dark variant |
| `--color-warning` | #f59e0b | #fbbf24 | Warning states |
| `--color-warning-light` | #fef3c7 | #78350f | Warning background |
| `--color-error` | #dc2626 | #ef4444 | Error states |
| `--color-error-light` | #fee2e2 | #991b1b | Error background |
| `--color-info` | #0ea5e9 | #38bdf8 | Info / shipping states |
| `--color-info-light` | #e0f2fe | #075985 | Info background |

---

## Component Styling Patterns

### Buttons

#### Primary Button
```scss
background: var(--color-primary);
color: #ffffff;
border: 1px solid var(--color-primary);

&:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

&:active {
  background: var(--color-primary-active);
  border-color: var(--color-primary-active);
}
```

#### Secondary Button
```scss
background: var(--color-bg-secondary);
border: 1px solid var(--color-bg-border);
color: var(--color-text-primary);

&:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-text-secondary);
}
```

#### Ghost / Link Button
```scss
background: transparent;
color: var(--color-primary);

&:hover {
  background: rgba(59, 130, 246, 0.10); // Light theme
  background: rgba(96, 165, 250, 0.10); // Dark theme
}
}
```

### Inputs & Form Fields
```scss
background: var(--color-bg-secondary);
border: 1px solid var(--color-bg-border);
color: var(--color-text-primary);

&:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.20);
}

&::placeholder {
  color: var(--color-text-tertiary);
}
```

### Cards & Surfaces
```scss
background: var(--color-bg-secondary);
border: 1px solid var(--color-bg-border);
color: var(--color-text-primary);

&:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-text-secondary);
}
```

### Status Badges
```scss
// Success Badge
background: var(--color-success-light);
color: var(--color-success);

// Error Badge
background: var(--color-error-light);
color: var(--color-error);

// Warning Badge
background: var(--color-warning-light);
color: var(--color-warning);

// Info Badge
background: var(--color-info-light);
color: var(--color-info);
```

---

## Theme Service Implementation

### Basic Usage

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
  
  setLightMode() {
    this.themeService.setThemeMode('light');
  }
  
  setCustomColors() {
    this.themeService.setCustomColors({
      primaryColor: '#ff6b6b',
      secondaryColor: '#4ecdc4',
      accentColor: '#45b7d1'
    });
  }
  
  getCurrentTheme() {
    return this.themeService.currentTheme;
  }
}
```

### Theme Configuration Interface

```typescript
interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textPrimaryColor?: string;
  textSecondaryColor?: string;
  textTertiaryColor?: string;
  bgPrimaryColor?: string;
  bgSecondaryColor?: string;
  surfaceColor?: string;
  borderColor?: string;
  inputBgColor?: string;
  buttonTextColor?: string;
  productCardColor?: string;
  logoUrl?: string;
  welcomeImageUrl?: string;
  showWelcomeImage?: boolean;
}
```

---

## Admin Theme Configuration

### Features 

- Light/Dark mode toggle
- Color pickers for primary, secondary, and accent colors
- Real-time preview of theme changes
- Reset to defaults functionality
- Theme persistence in localStorage

### Usage

1. Navigate to Admin Panel → Theme Settings
2. Toggle between light and dark modes
3. Select custom colors using color pickers
4. Click "Apply Colors" to save changes
5. Use "Reset to Defaults" to restore original theme

---

## Implementation Details

### CSS Variable Structure

The theme system uses CSS custom properties defined in two contexts:

```scss
// Light theme (default)
:root {
  --color-primary: #3b82f6;
  --color-secondary: #9333ea;
  // ... other variables
}

// Dark theme override
[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-secondary: #a855f7;
  // ... other variables
}
```

### Theme Application

Theme switching is handled by adding/removing the `data-theme="dark"` attribute on the root element:

```typescript
// In theme.service.ts
setThemeMode(mode: 'light' | 'dark') {
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  this.themeMode.set(mode);
  this.saveToStorage();
}
```

---

## Usage in Components

### SCSS Usage

```scss
// In component styles
.my-component {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-bg-border);
  
  &:hover {
    background-color: var(--color-bg-hover);
  }
  
  .primary-action {
    background-color: var(--color-primary);
    color: #ffffff;
    
    &:hover {
      background-color: var(--color-primary-hover);
    }
  }
}
```

### TypeScript Usage

```typescript
// In component class
export class MyComponent implements OnInit {
  currentTheme = this.themeService.currentTheme;
  
  constructor(private themeService: ThemeService) {}
  
  ngOnInit() {
    // Subscribe to theme changes
    effect(() => {
      this.currentTheme = this.themeService.currentTheme();
    });
  }
}
```

---

## File Structure

```
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       └── theme.service.ts
│   └── features/
│       └── admin/
│           └── theme-settings/
│               ├── theme-settings.component.ts
│               ├── theme-settings.component.html
│               └── theme-settings.component.scss
└── styles/
    └── themes/
        ├── _theme-variables.scss
        ├── _theme-mixins.scss
        └── _index.scss
```

---

## Current Limitations

### Missing Features

- Component-level theme mixins are not widely used
- Limited theme animation support
- No theme export/import functionality
- No per-user theme persistence in database
- Some components still use hardcoded colors

### Known Issues

- Theme switching may cause brief flash during initial load
- Some third-party components may not inherit theme properly
- Color contrast validation not implemented

---

## Future Enhancements

### Planned Features

- Comprehensive component theming with mixins
- Theme animation system
- Theme export/import functionality
- Database storage for user preferences
- Color contrast validation
- Advanced theme presets
- Seasonal themes
- Automatic theme detection based on time

### Performance Improvements

- Reduce theme switching flash
- Optimize CSS variable usage
- Implement theme lazy loading

---

## Conclusion

This theme system provides a solid foundation for consistent theming across the WebShop application. While the core functionality is implemented and functional, there are opportunities for enhancement in component-level theming, animations, and user experience features.

The current implementation successfully delivers:

- Light/dark mode switching
- Custom color configuration
- Admin interface for theme management
- Persistent theme preferences
- Real-time theme preview

Future development should focus on expanding component theming, improving performance, and adding advanced customization features.
