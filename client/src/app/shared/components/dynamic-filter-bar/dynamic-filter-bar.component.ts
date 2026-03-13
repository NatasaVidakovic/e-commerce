import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';

import {
  DynamicFilterDefinition,
  DynamicSortOption,
  FilterViewModel
} from '../../models/dynamic-filtering';

@Component({
  selector: 'app-dynamic-filter-bar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OverlayModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDatepickerModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './dynamic-filter-bar.component.html',
  styleUrl: './dynamic-filter-bar.component.scss'
})
export class DynamicFilterBarComponent implements OnInit {
  @Input({ required: true }) filterDefinitions: DynamicFilterDefinition[] = [];
  @Input({ required: true }) sortOptions: DynamicSortOption[] = [];
  @Input() liveFiltering: boolean = true;
  private sliderMinBound: number | null = null;
  private sliderMaxBound: number | null = null;

  @Input() set minPriceRange(value: number) {
    const v = Number(value);
    if (!Number.isFinite(v)) return;
    if (this.sliderMinBound === null) {
      this.sliderMinBound = v;
      return;
    }

    // If we were initialized with placeholder bounds (0..10000), allow snapping to real data bounds.
    if (this.sliderMinBound === 0 && v > 0 && (this.sliderMaxBound === 10000 || this.sliderMaxBound === null)) {
      this.sliderMinBound = v;
      return;
    }

    this.sliderMinBound = Math.min(this.sliderMinBound, v);
  }

  get minPriceRange(): number {
    return this.sliderMinBound ?? 0;
  }

  @Input() set maxPriceRange(value: number) {
    const v = Number(value);
    if (!Number.isFinite(v)) return;
    if (this.sliderMaxBound === null) {
      this.sliderMaxBound = v;
      return;
    }

    // If we were initialized with placeholder bounds (0..10000), allow snapping to real data bounds.
    if (this.sliderMaxBound === 10000 && v < 10000 && (this.sliderMinBound === 0 || this.sliderMinBound === null)) {
      this.sliderMaxBound = v;
      return;
    }

    this.sliderMaxBound = Math.max(this.sliderMaxBound, v);
  }

  get maxPriceRange(): number {
    return this.sliderMaxBound ?? 10000;
  }

  @Input() viewLayout: 'grid' | 'list' = 'grid';
  @Input() showViewLayoutToggle: boolean = false;
  
  @Output() changed = new EventEmitter<{ filters: FilterViewModel[][]; sort: DynamicSortOption }>();
  @Output() reset = new EventEmitter<void>();
  @Output() rawValuesChanged = new EventEmitter<Record<string, any>>();
  @Output() viewLayoutChange = new EventEmitter<'grid' | 'list'>();

  private _initialValues: Record<string, any> | null = null;

  @Input() set initialValues(values: Record<string, any> | null) {
    this._initialValues = values;
  }

  form!: FormGroup;
  isFiltersOpen = false;
  advancedFiltersOpen = false;
  openFilterSections = new Set<string>();
  mobileDrawerOpen = false;

  constructor(private fb: FormBuilder) {
    this.form = new FormGroup({
      sort: new FormControl(0)
    });
  }

  get searchDefinition(): DynamicFilterDefinition | null {
    const def = this.filterDefinitions.find(d => d.key === 'search' && d.controlType === 'text');
    return def ?? null;
  }

  get panelFilterDefinitions(): DynamicFilterDefinition[] {
    return this.filterDefinitions.filter(d => !(d.key === 'search' && d.controlType === 'text'));
  }

  get sortLabel(): string {
    const sort = this.getSelectedSort();
    return sort?.label ?? 'Sort';
  }

  get activeFilterCount(): number {
    return this.buildFiltersExcludingSearch().length;
  }

  get selectedSortIndex(): number {
    return Number(this.form.get('sort')?.value ?? 0);
  }

  hasValue(key: string): boolean {
    const control = this.form.get(key);
    if (!control) return false;
    const val = control.value;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'string') return val.trim() !== '';
    return val !== null && val !== undefined && val !== '';
  }

  clearFilter(key: string, silent = false) {
    const def = this.filterDefinitions.find(d => d.key === key);
    if (!def) return;
    const resetValue = def.controlType === 'select' && def.multiple ? [] : '';
    this.form.get(key)?.setValue(resetValue, { emitEvent: !silent });
  }

  clearPriceRange() {
    this.form.get('minPrice')?.setValue('');
    this.form.get('maxPrice')?.setValue('');
  }

  hasPriceRange(): boolean {
    return this.filterDefinitions.some(d => d.key === 'minPrice') && 
           this.filterDefinitions.some(d => d.key === 'maxPrice');
  }

  hasDateRange(): boolean {
    return this.filterDefinitions.some(d => d.controlType === 'dateRange');
  }

  getDateRangeStart(key: string): string {
    return this.form.get(key + 'Start')?.value || '';
  }

  getDateRangeEnd(key: string): string {
    return this.form.get(key + 'End')?.value || '';
  }

  clearDateRange(key: string) {
    this.form.get(key + 'Start')?.setValue('');
    this.form.get(key + 'End')?.setValue('');
  }

  hasDateRangeValue(key: string): boolean {
    return !!(this.getDateRangeStart(key) || this.getDateRangeEnd(key));
  }

  isDateRangeInvalid(key: string): boolean {
    const start = this.form.get(key + 'Start')?.value;
    const end = this.form.get(key + 'End')?.value;
    if (!start || !end) return false;
    const s = start instanceof Date ? start : new Date(start);
    const e = end instanceof Date ? end : new Date(end);
    return !isNaN(s.getTime()) && !isNaN(e.getTime()) && e < s;
  }

  getMinEndDate(key: string): Date | null {
    const v = this.form.get(key + 'Start')?.value;
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  getMaxStartDate(key: string): Date | null {
    const v = this.form.get(key + 'End')?.value;
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  hasAnyInvalidDateRange(): boolean {
    return this.filterDefinitions
      .filter(d => d.controlType === 'dateRange')
      .some(d => this.isDateRangeInvalid(d.key));
  }

  private clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  // Price slider calculations
  getPriceMin(): number {
    const val = this.form.get('minPrice')?.value;
    const min = this.minPriceRange;
    const max = this.getPriceMax();

    if (val === '' || val === null || val === undefined) return min;

    const num = Number(val);
    if (Number.isNaN(num)) return min;
    return this.clampNumber(num, min, max);
  }

  getPriceMaxValue(): number {
    const val = this.form.get('maxPrice')?.value;
    const min = this.minPriceRange;
    const max = this.getPriceMax();

    if (val === '' || val === null || val === undefined) return max;

    const num = Number(val);
    if (Number.isNaN(num)) return max;
    return this.clampNumber(num, min, max);
  }

  getPriceMax(): number {
    return this.sliderMaxBound ?? 10000;
  }

  getPriceRangeLeft(): number {
    const rangeMin = this.minPriceRange;
    const min = this.getPriceMin();
    const rangeMax = this.getPriceMax();
    const range = rangeMax - rangeMin;
    if (range <= 0) return 0;
    const pct = ((min - rangeMin) / range) * 100;
    return this.clampNumber(pct, 0, 100);
  }

  getPriceRangeWidth(): number {
    const rangeMin = this.minPriceRange;
    const min = this.getPriceMin();
    const maxVal = this.getPriceMaxValue();
    const rangeMax = this.getPriceMax();
    const range = rangeMax - rangeMin;
    if (range <= 0) return 0;
    const widthPct = ((maxVal - min) / range) * 100;
    return this.clampNumber(widthPct, 0, 100);
  }

  // Price slider event handlers
  onMinPriceSliderChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    const currentMax = this.getPriceMaxValue();
    
    if (value <= currentMax) {
      this.form.get('minPrice')?.setValue(value === this.minPriceRange ? '' : value);
    }
  }

  onMaxPriceSliderChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    const currentMin = this.getPriceMin();
    
    if (value >= currentMin) {
      this.form.get('maxPrice')?.setValue(value === this.getPriceMax() ? '' : value);
    }
  }

  // Filter panel controls

  applyFilters() {
    if (this.hasAnyInvalidDateRange()) return;
    this.emit();
    this.closeFilters();
  }

  toggleFilterSection(key: string) {
    if (this.openFilterSections.has(key)) {
      this.openFilterSections.delete(key);
    } else {
      this.openFilterSections.add(key);
    }
  }

  isFilterSectionOpen(key: string): boolean {
    return this.openFilterSections.has(key);
  }

  isOptionSelected(key: string, option: string): boolean {
    const control = this.form.get(key);
    if (!control) return false;
    const val = control.value;
    if (Array.isArray(val)) return val.includes(option);
    return false;
  }

  toggleOption(key: string, option: string) {
    const control = this.form.get(key);
    if (!control) return;
    const currentValue = control.value || [];
    const newValue = currentValue.includes(option)
      ? currentValue.filter((v: string) => v !== option)
      : [...currentValue, option];
    control.setValue(newValue);
  }

  ngOnInit() {
    const controls: Record<string, any> = { sort: [0] };

    for (const d of this.filterDefinitions) {
      if (d.controlType === 'select' && d.multiple) {
        controls[d.key] = [[]];
      } else if (d.controlType === 'dateRange') {
        controls[d.key + 'Start'] = [''];
        controls[d.key + 'End'] = [''];
      } else {
        controls[d.key] = [''];
      }
    }

    this.form = this.fb.group(controls);

    if (this._initialValues) {
      this.form.patchValue(this._initialValues, { emitEvent: false });
    }

    // Sort is always live (user action)
    this.form.get('sort')?.valueChanges.subscribe(() => this.emit());

    if (this.liveFiltering) {
      this.form.valueChanges
        .pipe(debounceTime(250))
        .subscribe(() => this.emit());
    } else {
      // Apply-only mode: still emit search changes immediately
      const searchKey = this.searchDefinition?.key;
      if (searchKey) {
        this.form.get(searchKey)?.valueChanges
          .pipe(debounceTime(250))
          .subscribe(() => this.emit());
      }
    }
  }

  getSelectedSort(): DynamicSortOption {
    const idx = Number(this.form.get('sort')?.value ?? 0);
    return this.sortOptions[idx] ?? this.sortOptions[0];
  }

  private buildFilters(): FilterViewModel[][] {
    const filters: FilterViewModel[][] = [];

    for (const d of this.filterDefinitions) {
      if (d.controlType === 'dateRange') {
        // Handle date range as two separate filters
        const startDate = this.form.get(d.key + 'Start')?.value;
        const endDate = this.form.get(d.key + 'End')?.value;

        if (startDate) {
          const startFilter: FilterViewModel = {
            propertyName: d.propertyName,
            firstLevel: d.firstLevel ?? '',
            secondLevel: d.secondLevel ?? '',
            operationType: 'GreaterThanOrEqual',
            dataType: 'DateTime',
            value: startDate,
            defaultFilter: false,
            multipleValues: false
          };
          filters.push([startFilter]);
        }

        if (endDate) {
          const endFilter: FilterViewModel = {
            propertyName: d.propertyName,
            firstLevel: d.firstLevel ?? '',
            secondLevel: d.secondLevel ?? '',
            operationType: 'LessThanOrEqual',
            dataType: 'DateTime',
            value: endDate,
            defaultFilter: false,
            multipleValues: false
          };
          filters.push([endFilter]);
        }
        continue;
      }

      const raw = this.form.get(d.key)?.value;

      const isEmptyString = typeof raw === 'string' && raw.trim() === '';
      const isEmptyArray = Array.isArray(raw) && raw.length === 0;
      const isNullish = raw === null || raw === undefined;

      if (isNullish || isEmptyString || isEmptyArray) continue;

      const multipleValues = Array.isArray(raw);
      const value = multipleValues ? raw.join(',') : raw;

      const f: FilterViewModel = {
        propertyName: d.propertyName,
        firstLevel: d.firstLevel ?? '',
        secondLevel: d.secondLevel ?? '',
        operationType: d.operationType,
        dataType: d.dataType,
        value,
        defaultFilter: false,
        multipleValues
      };

      filters.push([f]);
    }

    return filters;
  }

  private buildFiltersExcludingSearch(): FilterViewModel[][] {
    const searchKey = this.searchDefinition?.key;
    if (!searchKey) return this.buildFilters();

    return this.buildFilters().filter(group => {
      const first = group?.[0];
      return first?.propertyName !== this.searchDefinition?.propertyName;
    });
  }

  emit() {
    const sort = this.getSelectedSort();
    this.changed.emit({ filters: this.buildFilters(), sort });
    this.rawValuesChanged.emit({ ...this.form.value });
  }

  onOverlayKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeFilters();
    }
  }

  toggleFilters() {
    this.isFiltersOpen = !this.isFiltersOpen;
  }

  closeFilters() {
    this.isFiltersOpen = false;
    this.advancedFiltersOpen = false;
  }

  onSortSelect(index: number) {
    this.form.get('sort')?.setValue(index);
  }

  onReset() {
    const resetValue: Record<string, any> = { sort: 0 };
    for (const d of this.filterDefinitions) {
      if (d.controlType === 'dateRange') {
        resetValue[d.key + 'Start'] = '';
        resetValue[d.key + 'End'] = '';
      } else {
        resetValue[d.key] = d.controlType === 'select' && d.multiple ? [] : '';
      }
    }
    this.form.reset(resetValue);
    this.closeFilters();
    this.closeMobileDrawer();
    this.reset.emit();
    this.rawValuesChanged.emit({ ...this.form.value });
  }

  toggleAdvancedFilters() {
    this.advancedFiltersOpen = !this.advancedFiltersOpen;
  }

  onSortSelectChange(event: Event) {
    const idx = Number((event.target as HTMLSelectElement).value);
    this.form.get('sort')?.setValue(idx);
  }

  toggleMobileDrawer() {
    this.mobileDrawerOpen = !this.mobileDrawerOpen;
  }

  closeMobileDrawer() {
    this.mobileDrawerOpen = false;
  }

  applyMobileFilters() {
    if (this.hasAnyInvalidDateRange()) return;
    this.emit();
    this.closeMobileDrawer();
  }

  onViewLayoutChange(layout: 'grid' | 'list') {
    this.viewLayoutChange.emit(layout);
  }
}
