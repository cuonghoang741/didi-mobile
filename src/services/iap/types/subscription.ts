import { User } from '../../../models/user';

export enum PurchasePlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  platform: PurchasePlatform;
  productId: string; // Store/Play Store product ID
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface Purchase {
  id: number;
  userId: number;
  productId: number;
  transactionId: string; // Store transaction ID
  originalTransactionId: string | null; // For subscriptions
  platform: PurchasePlatform;
  status: PurchaseStatus;

  // Store receipt/verification data
  receiptData: string | null; // Base64 encoded receipt
  verificationData: any | null; // Store verification response

  // Purchase details
  purchaseDate: string | null;
  expirationDate: string | null; // For subscriptions
  quantity: number;

  // Error handling
  errorMessage: string | null;
  retryCount: number;

  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;

  // Relations
  user: User;
  product: Product;
  subscriptions: UserSubscription[];
}

export interface UserSubscription {
  id: number;
  userId: number;
  productId: number;
  purchaseId: number;

  // Subscription details
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  autoRenew: boolean;

  // Grace period for failed renewals
  gracePeriodEnd: string | null;

  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;

  // Relations
  user: User;
  product: Product;
  purchase: Purchase;
}
