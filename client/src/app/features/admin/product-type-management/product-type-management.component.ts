import { Component, OnInit, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ProductTypeDto, CreateProductTypeDto, UpdateProductTypeDto } from '../../../shared/models/product-type.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-product-type-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './product-type-management.component.html',
  styleUrls: ['./product-type-management.component.scss']
})
export class ProductTypeManagementComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'description', 'productCount', 'isActive', 'actions'];
  productTypes: ProductTypeDto[] = [];
  isLoading = false;
  
  addForm: FormGroup;
  selectedProductType: ProductTypeDto | null = null;
  
  @ViewChild('addDialogTemplate') addDialogTemplate!: TemplateRef<any>;
  @ViewChild('deleteDialogTemplate') deleteDialogTemplate!: TemplateRef<any>;
  
  private addDialogRef: MatDialogRef<any> | null = null;
  private deleteDialogRef: MatDialogRef<any> | null = null;
  
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  constructor() {
    this.addForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadProductTypes();
  }

  loadProductTypes(): void {
    this.isLoading = true;
    this.adminService.getProductTypes().subscribe({
      next: (types) => {
        this.productTypes = types;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product types:', error);
        this.snackBar.open(
          this.translate.instant('ADMIN.PRODUCT_TYPE.MESSAGES.LOAD_ERROR'), 
          this.translate.instant('COMMON.CLOSE'), 
          { duration: 3000 }
        );
        this.isLoading = false;
      }
    });
  }

  openCreateDialog(): void {
    this.addForm.reset({
      name: '',
      description: '',
      isActive: true
    });
    
    this.addDialogRef = this.dialog.open(this.addDialogTemplate, {
      width: '500px',
      disableClose: true
    });
  }

  closeAddDialog(): void {
    if (this.addDialogRef) {
      this.addDialogRef.close();
      this.addDialogRef = null;
    }
  }

  saveProductType(): void {
    if (this.addForm.invalid) return;

    const createDto: CreateProductTypeDto = this.addForm.value;
    
    this.adminService.createProductType(createDto).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('ADMIN.PRODUCT_TYPE.MESSAGES.CREATE_SUCCESS'), 
          this.translate.instant('COMMON.CLOSE'), 
          { duration: 3000 }
        );
        this.closeAddDialog();
        this.loadProductTypes();
      },
      error: (error) => {
        console.error('Error creating product type:', error);
        this.snackBar.open(
          this.translate.instant('ADMIN.PRODUCT_TYPE.MESSAGES.CREATE_ERROR'), 
          this.translate.instant('COMMON.CLOSE'), 
          { duration: 3000 }
        );
      }
    });
  }

  openDeleteDialog(productType: ProductTypeDto): void {
    this.selectedProductType = productType;
    
    this.deleteDialogRef = this.dialog.open(this.deleteDialogTemplate, {
      width: '400px',
      disableClose: true
    });
  }

  closeDeleteDialog(): void {
    if (this.deleteDialogRef) {
      this.deleteDialogRef.close();
      this.deleteDialogRef = null;
      this.selectedProductType = null;
    }
  }

  confirmDelete(): void {
    if (!this.selectedProductType || this.selectedProductType.productCount > 0) return;

    this.adminService.deleteProductType(this.selectedProductType.id).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('ADMIN.PRODUCT_TYPE.MESSAGES.DELETE_SUCCESS'), 
          this.translate.instant('COMMON.CLOSE'), 
          { duration: 3000 }
        );
        this.closeDeleteDialog();
        this.loadProductTypes();
      },
      error: (error) => {
        console.error('Error deleting product type:', error);
        this.snackBar.open(
          this.translate.instant('ADMIN.PRODUCT_TYPE.MESSAGES.DELETE_ERROR'), 
          this.translate.instant('COMMON.CLOSE'), 
          { duration: 3000 }
        );
      }
    });
  }

  toggleActive(productType: ProductTypeDto): void {
    const updateDto: UpdateProductTypeDto = {
      name: productType.name,
      description: productType.description,
      isActive: !productType.isActive
    };

    const statusKey = productType.isActive ? 'deactivated' : 'activated';

    this.adminService.updateProductType(productType.id, updateDto).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('ADMIN.PRODUCT_TYPE.MESSAGES.UPDATE_SUCCESS', { status: statusKey }), 
          this.translate.instant('COMMON.CLOSE'), 
          { duration: 3000 }
        );
        this.loadProductTypes();
      },
      error: (error) => {
        console.error('Error updating product type:', error);
        this.snackBar.open(
          this.translate.instant('ADMIN.PRODUCT_TYPE.MESSAGES.UPDATE_ERROR'), 
          this.translate.instant('COMMON.CLOSE'), 
          { duration: 3000 }
        );
      }
    });
  }
}
