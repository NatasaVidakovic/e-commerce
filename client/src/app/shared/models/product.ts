import { ProductReview } from './product-review.model';
import { ProductTypeDto } from './product-type.model';

export type ProductImage = {
  id: number;
  url: string;
  thumbnailUrl?: string;
  displayOrder: number;
  isPrimary: boolean;
  altText: string;
}

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  hasActiveDiscount?: boolean;
  discountName?: string;
  pictureUrl: string;
  type: string; // Keep for backward compatibility in display
  productTypeId?: number; // Optional for backward compatibility
  productType?: ProductTypeDto; // New field for structured product type
  brand: string;
  quantityInStock: number;
  isFavourite: boolean;
  rating?: number;
  reviews?: ProductReview[];
  images?: ProductImage[];
  reviewsCount?: number;
}

export type CreateProductRequest = {
  name: string;
  description: string;
  price: number;
  pictureUrl: string;
  productTypeId: number;
  brand: string;
  quantityInStock: number;
}