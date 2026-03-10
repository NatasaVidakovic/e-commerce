export interface ProductTypeDto {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  productCount: number;
}

export interface CreateProductTypeDto {
  name: string;
  description: string;
  isActive: boolean;
}

export interface UpdateProductTypeDto {
  name: string;
  description: string;
  isActive: boolean;
}
