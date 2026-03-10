export interface ProductReview {
  id: number;
  appUserId: string;
  appUsername?: string;
  productId: number;
  description?: string;
  parentCommentId?: number;
  rating: number;
  reviewDate?: Date;
  createdAt?: Date;
}
