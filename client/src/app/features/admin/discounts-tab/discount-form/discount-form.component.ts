import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Discount } from '../../../../shared/models/discount';
import { Product } from '../../../../shared/models/product';
import { DiscountService } from '../../../../core/services/discount.service';
import { ShopService } from '../../../../core/services/shop.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';

@Component({
  selector: 'app-discount-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslatePipe
  ],
  templateUrl: './discount-form.component.html',
  styleUrls: ['./discount-form.component.scss']
})
export class DiscountFormComponent implements OnInit {
  discountForm: FormGroup;
  loading = false;
  loadingDiscount = false;
  isEditMode = false;
  discountId?: number;
  availableProducts: Product[] = [];
  selectedProductIds: number[] = [];
  minDate = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  })();
  minEndDate: Date | null = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  })();
  discountAlreadyStarted = false;
  canEditDiscount = true;
  editRestrictionMessage = '';
  currentDiscount?: Discount;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private discountService: DiscountService,
    private shopService: ShopService,
    private snackbar: SnackbarService
  ) {
    this.discountForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      value: ['', [Validators.required, Validators.min(0)]],
      isPercentage: [false],
      isActive: [true],
      dateFrom: ['', [Validators.required, this.dateNotInPastValidator()]],
      dateTo: ['', [Validators.required, this.dateNotInPastValidator()]],
      productIds: [[]],
      types: [[]]
    }, { validators: this.dateRangeValidator() });

    // Watch for changes to isActive checkbox
    this.discountForm.get('isActive')?.valueChanges.subscribe(isActive => {
      if (isActive) {
        this.validateActivation();
      }
    });

    // Watch for changes to dateFrom to update minEndDate
    this.discountForm.get('dateFrom')?.valueChanges.subscribe(dateFrom => {
      if (dateFrom) {
        const nextDay = new Date(dateFrom);
        nextDay.setDate(nextDay.getDate() + 1);
        this.minEndDate = nextDay;
      } else {
        this.minEndDate = new Date();
      }
    });
  }

  ngOnInit() {
    this.loadProducts();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.discountId = +params['id'];
        this.loadDiscount(this.discountId);
      }
    });
  }

  loadProducts() {
    const model = {
      currentPage: 1,
      pageSize: 1000,
      column: 'Name',
      accessor: '',
      ascending: true,
      descending: false,
      filters: []
    };
    
    this.shopService.filterProducts(model).subscribe({
      next: (response) => {
        this.availableProducts = response.data || [];
      },
      error: (error: any) => console.error('Error loading products:', error)
    });
  }

  loadDiscount(id: number) {
    this.loadingDiscount = true;
    
    this.discountService.getDiscountById(id).subscribe({
      next: (discount: Discount) => {
        this.currentDiscount = discount;
        this.selectedProductIds = discount.products?.map((p: any) => p.id) || [];
        
        const formData = {
          name: discount.name || '',
          description: discount.description || '',
          value: discount.value || 0,
          isPercentage: discount.isPercentage || false,
          isActive: discount.isActive !== undefined ? discount.isActive : true,
          dateFrom: discount.dateFrom ? new Date(discount.dateFrom) : null,
          dateTo: discount.dateTo ? new Date(discount.dateTo) : null,
          productIds: this.selectedProductIds,
          types: []
        };
        
        this.discountForm.patchValue(formData);
        
        // Check if discount can be edited based on backend rules
        if (!discount.canEdit) {
          this.canEditDiscount = false;
          this.discountForm.disable();
          
          if (discount.hasBeenUsed) {
            this.editRestrictionMessage = 'This discount has been used in orders and cannot be modified due to financial reporting requirements.';
          } else if (discount.state === 'Active' || discount.state === 'Expired') {
            this.editRestrictionMessage = `This discount is ${discount.state.toLowerCase()} and cannot be edited. You can disable it instead.`;
          } else {
            this.editRestrictionMessage = 'This discount cannot be edited.';
          }

          this.snackbar.show(this.editRestrictionMessage, { duration: 10000, panelClass: ['error-snackbar'] });
        } else if (discount.dateFrom) {
          // Show warning if discount has started but can still be edited (shouldn't happen with new rules)
          const startDate = new Date(discount.dateFrom);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          startDate.setHours(0, 0, 0, 0);
          
          if (startDate < today) {
            this.discountAlreadyStarted = true;
          }
        }
        
        this.loadingDiscount = false;
      },
      error: (error: any) => {
        console.error('Error loading discount:', error);
        this.snackbar.errorFrom(error, 'Error loading discount', { duration: 8000, panelClass: ['error-snackbar'] });
        this.loadingDiscount = false;
      }
    });
  }

  onProductSelectionChange(event: any) {
    this.selectedProductIds = event.value;
    this.discountForm.patchValue({ productIds: this.selectedProductIds });
  }

  onSubmit() {
    // Mark all fields as touched to show validation errors
    Object.keys(this.discountForm.controls).forEach(key => {
      this.discountForm.get(key)?.markAsTouched();
    });

    if (this.discountForm.invalid) {
      const errors = this.getFormValidationErrors();
      this.snackbar.error('Please fix the following errors: ' + errors.join(', '));
      return;
    }

    this.loading = true;
    const formValue = this.discountForm.value;
    
    // Normalize dates to noon UTC to avoid timezone issues
    const dateFrom = new Date(formValue.dateFrom);
    dateFrom.setHours(12, 0, 0, 0);
    
    const dateTo = new Date(formValue.dateTo);
    dateTo.setHours(12, 0, 0, 0);
    
    const discountData = {
      name: formValue.name,
      description: formValue.description,
      value: formValue.value,
      isPercentage: formValue.isPercentage,
      isActive: formValue.isActive,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      productIds: formValue.productIds || [],
      types: formValue.types || []
    };

    const operation = this.isEditMode
      ? this.discountService.updateDiscount(this.discountId!, discountData)
      : this.discountService.createDiscount(discountData);

    operation.subscribe({
      next: () => {
        this.snackbar.success(
          this.isEditMode ? 'Discount updated successfully!' : 'Discount created successfully!',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.router.navigate(['/admin'], { queryParams: { tab: 6, refresh: 1 } });
      },
      error: (error: any) => {
        console.error('Error saving discount:', error);
        this.loading = false;

        this.snackbar.errorFrom(
          error,
          'Error saving discount',
          { duration: 12000, panelClass: ['error-snackbar'] },
          (msg) => msg.includes('already have an active discount') ? ('⚠️ OVERLAP CONFLICT: ' + msg) : msg
        );
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin'], { queryParams: { tab: 6 } });
  }

  getProductName(productId: number): string {
    const product = this.availableProducts.find(p => p.id === productId);
    return product ? `${product.name} (${product.brand})` : `Product ID: ${productId}`;
  }

  removeProduct(productId: number): void {
    this.selectedProductIds = this.selectedProductIds.filter(id => id !== productId);
    this.discountForm.patchValue({ productIds: this.selectedProductIds });
  }

  dateNotInPastValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      return selectedDate < today ? { pastDate: true } : null;
    };
  }

  dateRangeValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDate = group.get('dateFrom')?.value;
      const endDate = group.get('dateTo')?.value;
      
      if (!startDate || !endDate) return null;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      // End date must be after start date
      if (end <= start) {
        return { invalidDateRange: true };
      }
      
      return null;
    };
  }

  validateActivation(): void {
    const endDate = this.discountForm.get('dateTo')?.value;
    const isActive = this.discountForm.get('isActive')?.value;
    
    if (isActive && endDate) {
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      if (end < today) {
        this.snackbar.show(
          'Cannot activate an expired discount. Please update the end date first.',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
        this.discountForm.patchValue({ isActive: false }, { emitEvent: false });
      }
    }
  }

  getFormValidationErrors(): string[] {
    const errors: string[] = [];
    
    Object.keys(this.discountForm.controls).forEach(key => {
      const control = this.discountForm.get(key);
      if (control && control.errors) {
        Object.keys(control.errors).forEach(errorKey => {
          switch (errorKey) {
            case 'required':
              errors.push(`${this.getFieldName(key)} is required`);
              break;
            case 'min':
              errors.push(`${this.getFieldName(key)} must be greater than 0`);
              break;
            case 'pastDate':
              errors.push(`${this.getFieldName(key)} must be at least tomorrow`);
              break;
          }
        });
      }
    });
    
    if (this.discountForm.hasError('invalidDateRange')) {
      errors.push('End date must be after start date');
    }
    
    return errors;
  }

  getFieldName(key: string): string {
    const fieldNames: { [key: string]: string } = {
      'name': 'Name',
      'description': 'Description',
      'value': 'Value',
      'dateFrom': 'Start date',
      'dateTo': 'End date'
    };
    return fieldNames[key] || key;
  }
}
