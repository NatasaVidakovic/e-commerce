import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Product } from './../../../shared/models/product';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { PaginationComponent, PaginationEvent } from '../../../shared/components/pagination/pagination.component';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DeleteProductDialogComponent } from './product-delete/product-delete-dialog.component';
import { MatInputModule } from '@angular/material/input';
import { ProductStoreSelectorDialogComponent, ProductStoreSelectorDialogData } from './product-store-selector/product-store-selector-dialog.component';

@Component({
  selector: 'products-tab',
  standalone: true,
  imports: [
    MatIconModule,
    TranslatePipe,
    CommonModule,
    MatTableModule,
    PaginationComponent,
    MatButtonModule,
    MatTooltipModule,
    CurrencyPipe,
    MatLabel,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule
  ],
  templateUrl: './products-tab.component.html',
})
export class ProductsTabComponent implements OnChanges, AfterViewInit {

  @Input() title = '';
  @Input() products: Product[] = [];
  @Input() isAdmin = false;
  @Input() enableAddFromExisting = false; // New input to control the feature
  @Input() enableEdit = true;
  @Input() enableDelete = true;
  @Input() showInternalFilters = true;
  @Input() showRating = false;
  @Input() showActionBar = true;

  @Output() productUpdated = new EventEmitter<void>();
  @Output() productDeleted = new EventEmitter<number>();
  @Output() addProduct = new EventEmitter<void>();
  @Output() addFromExisting = new EventEmitter<number[]>();
  @Output() editProduct = new EventEmitter<number>();
  @Output() productCreated = new EventEmitter<void>();
  @Input() brands: string[] = [];
  @Input() types: string[] = [];

  @Output() selectedProductChange = new EventEmitter<Product | null>();

  @Input() serverSide = false;
  @Input() totalCount = 0;
  @Input() pageNumber = 1;
  @Input() pageSize = 25;

  @Output() queryChanged = new EventEmitter<{ search: string; brand: string; type: string; pageNumber: number; pageSize: number }>();
  @Output() pageChanged = new EventEmitter<{ pageNumber: number; pageSize: number }>();

  displayedColumns: string[] = [];

  dataSource = new MatTableDataSource<Product>();

  selectedProduct: Product | null = null;

  constructor(private dialog: MatDialog, private router: Router) {
    this.updateColumns();
  }

  ngOnChanges() {
    this.updateColumns();
    this.dataSource.data = this.products;

    if (this.selectedProduct && !this.products.find(p => p.id === this.selectedProduct?.id)) {
      this.selectedProduct = null;
    }
  }

  private updateColumns() {
    const base = ['id', 'pictureUrl', 'name', 'brand', 'type', 'price', 'quantityInStock'];
    if (this.showRating) {
      base.push('rating');
    }
    this.displayedColumns = base;
  }

  ngAfterViewInit(): void {
    // Pagination now handled by universal pagination component
  }

  onRowClick(product: Product) {
    if (this.enableEdit && this.selectedProduct?.id === product.id) {
      this.editProduct.emit(product.id);
      return;
    }
    this.selectedProduct = product;
    this.selectedProductChange.emit(this.selectedProduct);
  }

  goToAdd() {
    if (!this.enableAddFromExisting) {
      this.addProduct.emit();
    }
  }

  goToEditSelected() {
    if (!this.selectedProduct) return;
    if (!this.enableEdit) return;
    this.editProduct.emit(this.selectedProduct.id);
  }

  openAddFromExistingDialog() {
    const dialogRef = this.dialog.open<ProductStoreSelectorDialogComponent, ProductStoreSelectorDialogData, number[] | null>(
      ProductStoreSelectorDialogComponent,
      {
        width: '980px',
        maxHeight: '90vh',
        data: {
          title: 'Products in Store',
          preselectedIds: this.products.map(p => p.id)
        }
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (!result || result.length === 0) return;
      this.addFromExisting.emit(result);
    });
  }

  deleteSelected() {
    if (!this.enableDelete) return;
    if (this.selectedProduct) {
      this.openDeleteDialog(this.selectedProduct);
    }
  }

  openDeleteDialog(product: Product) {
    const dialogRef = this.dialog.open(DeleteProductDialogComponent, {
      data: product,
      width: '380px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productDeleted.emit(product.id);
      }
    });
  }

  reloadProducts() {
    this.productUpdated.emit();
  }

  onPage(event: PaginationEvent) {
    this.pageChanged.emit({ pageNumber: event.pageIndex + 1, pageSize: event.pageSize });
  }
}