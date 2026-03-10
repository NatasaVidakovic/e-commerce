import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-theme-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatExpansionModule,
    TranslatePipe
  ],
  templateUrl: './theme-settings.component.html',
  styleUrl: './theme-settings.component.scss'
})
export class ThemeSettingsComponent {
  private _isDarkMode: boolean = false;
  
  primaryColor: string = '';
  secondaryColor: string = '';
  accentColor: string = '';
  
  textPrimaryColor: string = '';
  textSecondaryColor: string = '';
  textTertiaryColor: string = '';
  
  bgPrimaryColor: string = '';
  bgSecondaryColor: string = '';
  surfaceColor: string = '';
  
  borderColor: string = '';
  inputBgColor: string = '';
  buttonTextColor: string = '';
  
  
  constructor(
    private themeService: ThemeService,
    private snackbar: SnackbarService
  ) {
    const config = this.themeService.themeConfig();
    this._isDarkMode = config.mode === 'dark';
    
    this.primaryColor = config.primaryColor || '';
    this.secondaryColor = config.secondaryColor || '';
    this.accentColor = config.accentColor || '';
    
    this.textPrimaryColor = config.textPrimaryColor || '';
    this.textSecondaryColor = config.textSecondaryColor || '';
    this.textTertiaryColor = config.textTertiaryColor || '';
    
    this.bgPrimaryColor = config.bgPrimaryColor || '';
    this.bgSecondaryColor = config.bgSecondaryColor || '';
    this.surfaceColor = config.surfaceColor || '';
    
    this.borderColor = config.borderColor || '';
    this.inputBgColor = config.inputBgColor || '';
    this.buttonTextColor = config.buttonTextColor || '';
    
  }
  
  isDarkMode(): boolean {
    return this._isDarkMode;
  }
  
  onThemeModeChange(isDark: boolean): void {
    const mode: ThemeMode = isDark ? 'dark' : 'light';
    this.themeService.setThemeMode(mode);
    this._isDarkMode = isDark;
    this.snackbar.success(`${isDark ? 'Dark' : 'Light'} mode enabled`);
  }
  
  applyCustomColors(): void {
    const colors: any = {};
    
    if (this.primaryColor) colors.primaryColor = this.primaryColor;
    if (this.secondaryColor) colors.secondaryColor = this.secondaryColor;
    if (this.accentColor) colors.accentColor = this.accentColor;
    
    if (this.textPrimaryColor) colors.textPrimaryColor = this.textPrimaryColor;
    if (this.textSecondaryColor) colors.textSecondaryColor = this.textSecondaryColor;
    if (this.textTertiaryColor) colors.textTertiaryColor = this.textTertiaryColor;
    
    if (this.bgPrimaryColor) colors.bgPrimaryColor = this.bgPrimaryColor;
    if (this.bgSecondaryColor) colors.bgSecondaryColor = this.bgSecondaryColor;
    if (this.surfaceColor) colors.surfaceColor = this.surfaceColor;
    
    if (this.borderColor) colors.borderColor = this.borderColor;
    if (this.inputBgColor) colors.inputBgColor = this.inputBgColor;
    if (this.buttonTextColor) colors.buttonTextColor = this.buttonTextColor;
    
    if (Object.keys(colors).length > 0) {
      this.themeService.setCustomColors(colors);
      this.snackbar.success('Theme customization applied successfully');
    } else {
      this.snackbar.error('Please customize at least one option');
    }
  }
  
  resetToDefaults(): void {
    this.themeService.resetToDefaults();
    this._isDarkMode = false;
    
    this.primaryColor = '';
    this.secondaryColor = '';
    this.accentColor = '';
    
    this.textPrimaryColor = '';
    this.textSecondaryColor = '';
    this.textTertiaryColor = '';
    
    this.bgPrimaryColor = '';
    this.bgSecondaryColor = '';
    this.surfaceColor = '';
    
    this.borderColor = '';
    this.inputBgColor = '';
    this.buttonTextColor = '';
    
    this.snackbar.success('Theme reset to defaults');
  }
  
  previewTheme(): void {
    this.applyCustomColors();
  }
  
  onColorChange(): void {
    const colors: any = {};
    
    if (this.primaryColor) colors.primaryColor = this.primaryColor;
    if (this.secondaryColor) colors.secondaryColor = this.secondaryColor;
    if (this.accentColor) colors.accentColor = this.accentColor;
    
    if (this.textPrimaryColor) colors.textPrimaryColor = this.textPrimaryColor;
    if (this.textSecondaryColor) colors.textSecondaryColor = this.textSecondaryColor;
    if (this.textTertiaryColor) colors.textTertiaryColor = this.textTertiaryColor;
    
    if (this.bgPrimaryColor) colors.bgPrimaryColor = this.bgPrimaryColor;
    if (this.bgSecondaryColor) colors.bgSecondaryColor = this.bgSecondaryColor;
    if (this.surfaceColor) colors.surfaceColor = this.surfaceColor;
    
    if (this.borderColor) colors.borderColor = this.borderColor;
    if (this.inputBgColor) colors.inputBgColor = this.inputBgColor;
    if (this.buttonTextColor) colors.buttonTextColor = this.buttonTextColor;
    
    if (Object.keys(colors).length > 0) {
      this.themeService.setCustomColors(colors);
    }
  }
  
}
