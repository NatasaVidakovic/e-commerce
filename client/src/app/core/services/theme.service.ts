import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ThemeMode;
  // Brand Colors
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  // Text Colors
  textPrimaryColor?: string;
  textSecondaryColor?: string;
  textTertiaryColor?: string;
  // Background Colors
  bgPrimaryColor?: string;
  bgSecondaryColor?: string;
  surfaceColor?: string;
  // UI Element Colors
  borderColor?: string;
  inputBgColor?: string;
  buttonTextColor?: string;
  // Product Specific
  productCardColor?: string;
  // Images
  logoUrl?: string;
  welcomeImageUrl?: string;
  // Hero settings
  showWelcomeImage?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'app-theme-config';
  
  themeConfig = signal<ThemeConfig>(this.loadThemeConfig());
  
  constructor() {
    effect(() => {
      const config = this.themeConfig();
      this.applyTheme(config);
      this.saveThemeConfig(config);
    });
    
    this.applyTheme(this.themeConfig());
  }
  
  setThemeMode(mode: ThemeMode): void {
    this.themeConfig.update(config => ({ ...config, mode }));
  }
  
  toggleTheme(): void {
    const currentMode = this.themeConfig().mode;
    this.setThemeMode(currentMode === 'light' ? 'dark' : 'light');
  }
  
  setCustomColors(colors: Partial<ThemeConfig>): void {
    this.themeConfig.update(config => ({ ...config, ...colors }));
  }
  
  resetToDefaults(): void {
    const root = document.documentElement;
    
    // Remove all custom color overrides
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-primary-hover');
    root.style.removeProperty('--color-primary-active');
    root.style.removeProperty('--color-secondary');
    root.style.removeProperty('--color-secondary-hover');
    root.style.removeProperty('--color-secondary-active');
    root.style.removeProperty('--color-accent');
    root.style.removeProperty('--color-accent-hover');
    root.style.removeProperty('--color-text-primary');
    root.style.removeProperty('--color-text-secondary');
    root.style.removeProperty('--color-text-tertiary');
    root.style.removeProperty('--color-bg-primary');
    root.style.removeProperty('--color-bg-secondary');
    root.style.removeProperty('--color-surface');
    root.style.removeProperty('--color-border-primary');
    root.style.removeProperty('--color-input-bg');
    root.style.removeProperty('--color-btn-primary-text');
    root.style.removeProperty('--color-product-card');
    root.style.removeProperty('--logo-url');
    root.style.removeProperty('--welcome-image-url');
    
    // Reset to light mode
    root.removeAttribute('data-theme');
    
    // Update config and clear storage
    this.themeConfig.set({ mode: 'light' });
    localStorage.removeItem(this.THEME_STORAGE_KEY);
  }
  
  private applyTheme(config: ThemeConfig): void {
    const root = document.documentElement;
    
    if (config.mode === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    
    if (config.primaryColor) {
      root.style.setProperty('--color-primary', config.primaryColor);
      root.style.setProperty('--color-primary-hover', this.adjustBrightness(config.primaryColor, -10));
      root.style.setProperty('--color-primary-active', this.adjustBrightness(config.primaryColor, -20));
    }
    
    if (config.secondaryColor) {
      root.style.setProperty('--color-secondary', config.secondaryColor);
      root.style.setProperty('--color-secondary-hover', this.adjustBrightness(config.secondaryColor, -10));
      root.style.setProperty('--color-secondary-active', this.adjustBrightness(config.secondaryColor, -20));
    }
    
    if (config.accentColor) {
      root.style.setProperty('--color-accent', config.accentColor);
      root.style.setProperty('--color-accent-hover', this.adjustBrightness(config.accentColor, -10));
    }
    
    // Apply text colors
    if (config.textPrimaryColor) {
      root.style.setProperty('--color-text-primary', config.textPrimaryColor);
    }
    if (config.textSecondaryColor) {
      root.style.setProperty('--color-text-secondary', config.textSecondaryColor);
    }
    if (config.textTertiaryColor) {
      root.style.setProperty('--color-text-tertiary', config.textTertiaryColor);
    }
    
    // Apply background colors
    if (config.bgPrimaryColor) {
      root.style.setProperty('--color-bg-primary', config.bgPrimaryColor);
    }
    if (config.bgSecondaryColor) {
      root.style.setProperty('--color-bg-secondary', config.bgSecondaryColor);
    }
    if (config.surfaceColor) {
      root.style.setProperty('--color-surface', config.surfaceColor);
    }
    
    // Apply UI element colors
    if (config.borderColor) {
      root.style.setProperty('--color-border-primary', config.borderColor);
    }
    if (config.inputBgColor) {
      root.style.setProperty('--color-input-bg', config.inputBgColor);
    }
    if (config.buttonTextColor) {
      root.style.setProperty('--color-btn-primary-text', config.buttonTextColor);
    }
    
    // Apply product-specific colors
    if (config.productCardColor) {
      root.style.setProperty('--color-product-card', config.productCardColor);
    }
    
    // Apply custom images
    if (config.logoUrl) {
      root.style.setProperty('--logo-url', `url(${config.logoUrl})`);
    }
    if (config.welcomeImageUrl) {
      root.style.setProperty('--welcome-image-url', `url(${config.welcomeImageUrl})`);
    }
  }
  
  private loadThemeConfig(): ThemeConfig {
    try {
      const stored = localStorage.getItem(this.THEME_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load theme config:', error);
    }
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return { mode: prefersDark ? 'dark' : 'light' };
  }
  
  private saveThemeConfig(config: ThemeConfig): void {
    try {
      localStorage.setItem(this.THEME_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save theme config:', error);
    }
  }
  
  private adjustBrightness(color: string, percent: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const adjust = (value: number) => {
      const adjusted = value + (value * percent / 100);
      return Math.max(0, Math.min(255, Math.round(adjusted)));
    };
    
    const newR = adjust(r).toString(16).padStart(2, '0');
    const newG = adjust(g).toString(16).padStart(2, '0');
    const newB = adjust(b).toString(16).padStart(2, '0');
    
    return `#${newR}${newG}${newB}`;
  }
}
