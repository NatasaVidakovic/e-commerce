import { nanoid } from "nanoid";

export type CartType = {
  id: string;
  ownerEmail?: string;
  items: CartItem[];
  deliveryMethodId?: number;
  paymentIntentId?: string;
  clientSecret?: string;
  coupon?: Coupon;
  voucher?: Voucher;
}

export type CartItem = {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  pictureUrl: string;
  brand: string;
  type: string;
}

export class Cart implements CartType {
  id = nanoid();
  ownerEmail?: string;
  items: CartItem[] = [];
  deliveryMethodId?: number;
  paymentIntentId?: string;
  clientSecret?: string;
  // coupon?: Coupon;
  voucher?: Voucher;
}

export type Voucher = {
    id: number;
    code: string;
    description?: string;
    amountOff?: number;
    percentOff?: number;
    isActive: boolean;
    createdAt: string;
}

export type Coupon = {
    name: string;
    amountOff?: number;
    percentOff?: number;
    promotionCode: string;
    couponId: string;
}
