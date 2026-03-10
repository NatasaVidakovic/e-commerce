import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { Product, CreateProductRequest, ProductImage } from '../../../shared/models/product';
import { ShopService } from '../../../core/services/shop.service';
import { AdminService } from '../../../core/services/admin.service';
import { ProductTypeDto } from '../../../shared/models/product-type.model';

@Component({
  selector: 'app-admin-product-edit',
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
  templateUrl: './admin-product-edit.component.html'
})
export class AdminProductEditComponent implements OnInit {
  productForm: FormGroup;
  loading = true;
  saving = false;
  productId: number = 0;
  private returnTab = 'catalog';
  productTypes: ProductTypeDto[] = [];
  activeProductTypes: ProductTypeDto[] = [];
  productImages: ProductImage[] = [];
  pendingFiles: File[] = [];
  uploadingImage = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private shopService: ShopService,
    private adminService: AdminService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      brand: ['', Validators.required],
      productTypeId: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      quantityInStock: [0, [Validators.required, Validators.min(0)]]
    });

    this.route.queryParams.subscribe(params => {
      if (params['returnTab']) {
        this.returnTab = params['returnTab'];
      }
    });
  }

  ngOnInit() {
    this.loadProductTypes();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId = +id;
      this.loadProduct(this.productId);
    }
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

  loadProduct(id: number) {
    this.shopService.getProduct(id).subscribe({
      next: (product) => {
        const formData = {
          name: product.name,
          brand: product.brand,
          productTypeId: product.productTypeId || product.productType?.id || 1,
          price: product.price,
          description: product.description,
          quantityInStock: product.quantityInStock
        };
        
        this.productForm.patchValue(formData);
        this.productImages = (product.images || []).sort((a, b) => a.displayOrder - b.displayOrder);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.productForm.invalid) return;

    this.saving = true;
    const formData = this.productForm.value;
    
    const primary = this.productImages.find(i => i.isPrimary);
    const pictureUrl = primary?.url || (this.productImages.length > 0 ? this.productImages[0].url : '');
    const productData = {
      name: formData.name,
      brand: formData.brand,
      productTypeId: parseInt(formData.productTypeId),
      price: parseFloat(formData.price),
      pictureUrl: pictureUrl,
      description: formData.description,
      quantityInStock: parseInt(formData.quantityInStock)
    };

    this.shopService.updateProduct(this.productId, productData).subscribe({
      next: () => {
        this.router.navigate(['/admin'], { queryParams: { tab: this.getTabIndex(this.returnTab), refresh: 1 } });
      },
      error: (error) => {
        console.error('Error updating product:', error);
        alert('Error updating product: ' + (error.error?.message || error.message || 'Unknown error'));
        this.saving = false;
      }
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !this.productId) return;
    this.uploadingImage = true;
    const files = Array.from(input.files);
    input.value = '';
    this.uploadFilesSequentially(files, 0);
  }

  private uploadFilesSequentially(files: File[], index: number): void {
    if (index >= files.length) {
      this.uploadingImage = false;
      return;
    }
    this.shopService.uploadProductImage(this.productId, files[index]).subscribe({
      next: (img) => {
        this.productImages.push(img);
        this.uploadFilesSequentially(files, index + 1);
      },
      error: (err) => {
        console.error('Failed to upload image:', err);
        this.uploadFilesSequentially(files, index + 1);
      }
    });
  }

  removeImage(index: number): void {
    const img = this.productImages[index];
    if (!img?.id) return;
    this.shopService.deleteProductImage(this.productId, img.id).subscribe({
      next: () => this.productImages.splice(index, 1),
      error: (err) => console.error('Failed to delete image:', err)
    });
  }

  setPrimary(index: number): void {
    const img = this.productImages[index];
    if (!img?.id) return;
    this.shopService.setProductImagePrimary(this.productId, img.id).subscribe({
      next: () => {
        this.productImages.forEach((i, idx) => i.isPrimary = idx === index);
      },
      error: (err) => console.error('Failed to set primary:', err)
    });
  }

  moveImage(index: number, direction: -1 | 1): void {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.productImages.length) return;
    const temp = this.productImages[index];
    this.productImages[index] = this.productImages[newIndex];
    this.productImages[newIndex] = temp;
    const orderedIds = this.productImages.map(i => i.id);
    this.shopService.reorderProductImages(this.productId, orderedIds).subscribe({
      error: (err) => console.error('Failed to reorder:', err)
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
