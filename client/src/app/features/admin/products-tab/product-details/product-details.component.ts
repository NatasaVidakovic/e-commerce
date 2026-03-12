import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { Product } from '../../../../shared/models/product';
import { ShopService } from '../../../../core/services/shop.service';

@Component({
  selector: 'app-admin-product-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    TranslatePipe,
    CurrencyPipe
  ],
  templateUrl: './product-details.component.html'
})
export class AdminProductDetailsComponent implements OnInit {
  product: Product | null = null;
  loading = true;
  imageError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shopService: ShopService
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!idParam || Number.isNaN(id) || id <= 0) {
      this.goBack();
      return;
    }

    this.loadProduct(id);
  }

  loadProduct(id: number) {
    this.shopService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
        this.imageError = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.loading = false;
      }
    });
  }

  onImageError() {
    this.imageError = true;
  }

  goBack() {
    this.router.navigate(['/admin/catalog']);
  }

  editProduct() {
    if (this.product) {
      this.router.navigate(['/admin/catalog', this.product.id, 'edit']);
    }
  }

  deleteProduct() {
    if (this.product && confirm('Are you sure you want to delete this product?')) {
      this.shopService.deleteProduct(this.product.id).subscribe({
        next: () => {
          this.router.navigate(['/admin/catalog']);
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          alert('Error deleting product');
        }
      });
    }
  }
}
