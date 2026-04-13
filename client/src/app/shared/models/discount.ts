import { Product } from "./product";

export type DiscountState = 'Draft' | 'Active' | 'Expired' | 'Disabled';

export interface Discount {
  id: number;
  name: string;
  description: string;
  value: number;
  isPercentage: boolean;
  isActive: boolean;
  dateFrom: Date | string;
  dateTo: Date | string;
  products: Product[];
  hasBeenUsed: boolean;
  state: DiscountState;
  canEdit: boolean;
  canDelete: boolean;
}

export interface DiscountSummary {
  id: number;
  name: string;
  description: string;
  value: number;
  isPercentage: boolean;
  isActive: boolean;
  dateFrom: Date | string;
  dateTo: Date | string;
  productCount: number;
  state: DiscountState;
}

