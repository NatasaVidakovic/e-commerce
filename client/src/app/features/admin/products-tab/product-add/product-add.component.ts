import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { Product, CreateProductRequest } from '../../../../shared/models/product';
import { ShopService } from '../../../../core/services/shop.service';
import { AdminService } from '../../../../core/services/admin.service';
import { ProductTypeDto } from '../../../../shared/models/product-type.model';

@Component({
  selector: 'app-admin-product-add',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe
  ],
  templateUrl: './product-add.component.html'
})
export class AdminProductAddComponent implements OnInit {
  productForm: FormGroup;
  loading = false;
  @Output() productCreated = new EventEmitter<void>();
  private returnTab = 'catalog';
  productTypes: ProductTypeDto[] = [];
  activeProductTypes: ProductTypeDto[] = [];
  pendingImages: { file: File; previewUrl: string }[] = [];
  uploadingImages = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private shopService: ShopService,
    private adminService: AdminService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      brand: ['', Validators.required],
      productTypeId: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      quantityInStock: ['', [Validators.required, Validators.min(0)]]
    });

    this.route.queryParams.subscribe(params => {
      if (params['returnTab']) {
        this.returnTab = params['returnTab'];
      }
    });
  }

  ngOnInit() {
    this.loadProductTypes();
  }

  loadProductTypes(): void {
    this.adminService.getProductTypes().subscribe({
      next: (types) => {
        this.productTypes = types;
        this.activeProductTypes = types.filter(type => type.isActive);
      },
      error: (error) => {
        console.error('Error loading product types:', error);
      }
    });
  }

  onSubmit() {
    if (this.productForm.invalid) return;

    this.loading = true;
    const formData = this.productForm.value;
    
    const productData = {
      name: formData.name,
      brand: formData.brand,
      productTypeId: parseInt(formData.productTypeId),
      price: parseFloat(formData.price),
      pictureUrl: '',
      description: formData.description,
      quantityInStock: parseInt(formData.quantityInStock)
    };

    this.shopService.createProduct(productData).subscribe({
      next: (response) => {
        if (this.pendingImages.length > 0 && response?.id) {
          this.uploadingImages = true;
          this.uploadPendingImages(response.id, 0, () => {
            this.productCreated.emit();
            this.router.navigate(['/admin'], { queryParams: { tab: this.getTabIndex(this.returnTab), refresh: 1 } });
          });
        } else {
          this.productCreated.emit();
          this.router.navigate(['/admin'], { queryParams: { tab: this.getTabIndex(this.returnTab), refresh: 1 } });
        }
      },
      error: (error) => {
        console.error('Error creating product:', error);
        alert('Error creating product: ' + (error.error?.message || error.message || 'Unknown error'));
        this.loading = false;
      }
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        this.pendingImages.push({ file, previewUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeImage(index: number): void {
    this.pendingImages.splice(index, 1);
  }

  moveImage(index: number, direction: -1 | 1): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.pendingImages.length) return;
    const temp = this.pendingImages[index];
    this.pendingImages[index] = this.pendingImages[newIndex];
    this.pendingImages[newIndex] = temp;
  }

  private uploadPendingImages(productId: number, index: number, callback: () => void): void {
    if (index >= this.pendingImages.length) {
      this.uploadingImages = false;
      callback();
      return;
    }
    this.shopService.uploadProductImage(productId, this.pendingImages[index].file).subscribe({
      next: () => this.uploadPendingImages(productId, index + 1, callback),
      error: (err) => {
        console.error('Failed to upload image:', err);
        this.uploadPendingImages(productId, index + 1, callback);
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin'], { queryParams: { tab: this.getTabIndex(this.returnTab) } });
  }

  private getTabIndex(tabName: string): number {
    const tabMap: {[key: string]: number} = {
      'catalog': 1,
      'best-reviewed': 3,
      'best-selling': 4,
      'suggested': 5,
      'discounts': 6
    };
    return tabMap[tabName] || 1; // Default to catalog
  }
}
