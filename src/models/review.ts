import { BaseEntity, ReviewStatus } from './common';

export interface ProductReview extends BaseEntity {
  product_id: string;
  user_id: string | null; // Đổi từ customer_id sang user_id
  order_id: string | null;

  rating: number;
  title: string | null;
  content: string | null;
  images: string[] | null;

  // Reviewer info (for seeding or non-logged in users)
  reviewer_name: string | null;
  reviewer_email: string | null;

  status: ReviewStatus;
  is_verified_purchase: boolean;
  is_seeded: boolean;

  // Admin response
  admin_reply: string | null;
  admin_reply_at: string | null;

  helpful_count: number;
  not_helpful_count: number;
}
