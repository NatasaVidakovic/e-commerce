import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { SelectionModel } from '@angular/cdk/collections';
import { TranslatePipe } from '@ngx-translate/core';
import { ShopService } from '../../../../core/services/shop.service';
import { Product } from '../../../../shared/models/product';

export type ProductStoreSelectorDialogData = {
  title: string;
  preselectedIds: number[];
};

@Component({
  selector: 'product-store-selector-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    CurrencyPipe,
    TranslatePipe
  ],
  templateUrl: './product-store-selector-dialog.component.html'
})
export class ProductStoreSelectorDialogComponent implements OnInit {
  displayedColumns: string[] = ['select', 'id', 'pictureUrl', 'name', 'brand', 'type', 'price', 'quantityInStock'];
  dataSource = new MatTableDataSource<Product>([]);
  selection = new SelectionModel<Product>(true, []);
  loading = false;

  constructor(
    private shopService: ShopService,
    public dialogRef: MatDialogRef<ProductStoreSelectorDialogComponent, number[] | null>,
    @Inject(MAT_DIALOG_DATA) public data: ProductStoreSelectorDialogData
  ) {
    this.dataSource.filterPredicate = (p: Product, filter: string) =>
      p.name?.toLowerCase().includes(filter) ||
      p.brand?.toLowerCase().includes(filter) ||
      p.type?.toLowerCase().includes(filter);
  }

  ngOnInit(): void {
    this.loadAllProducts();
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = value;
  }

  isPreselected(product: Product): boolean {
    return this.data.preselectedIds?.includes(product.id) ?? false;
  }

  toggleRow(product: Product) {
    if (this.isPreselected(product)) return;
    this.selection.toggle(product);
  }

  isAllSelected(): boolean {
    const selectable = this.dataSource.filteredData.filter(p => !this.isPreselected(p));
    return selectable.length > 0 && selectable.every(p => this.selection.isSelected(p));
  }

  toggleAll() {
    const selectable = this.dataSource.filteredData.filter(p => !this.isPreselected(p));
    if (this.isAllSelected()) {
      selectable.forEach(p => this.selection.deselect(p));
      return;
    }
    selectable.forEach(p => this.selection.select(p));
  }

  save() {
    const selectedIds = this.selection.selected
      .map(p => p.id)
      .filter(id => !this.data.preselectedIds.includes(id));

    this.dialogRef.close(selectedIds);
  }

  cancel() {
    this.dialogRef.close(null);
  }

  private loadAllProducts() {
    this.loading = true;

    this.shopService.filterProducts({
      filters: [],
      currentPage: 1,
      pageSize: 1000,
      column: 'Name',
      accessor: '',
      ascending: true,
      descending: false
    }).subscribe({
      next: response => {
        this.dataSource.data = response.data as unknown as Product[];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
