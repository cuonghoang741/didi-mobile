import {
  Product,
  Purchase,
  PurchasePlatform,
  PurchaseStatus,
  UserSubscription,
} from '@/services/iap/types/subscription';
import { Platform } from 'react-native';

import authApi from '../../config/authApi.config';

// DTO Interfaces based on backend controller
export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  currency: string;
  platform: PurchasePlatform;
  productId: string; // Store/Play Store product ID
}

export interface CreatePurchaseDto {
  productId: string; // Store/Play Store product ID
  transactionId: string;
  originalTransactionId?: string;
  receiptData: string;
  platform: PurchasePlatform;
  purchaseDate?: string;
  expirationDate?: string;
  quantity?: number;
  transactionMetadata?: any;
}

export interface VerifyPurchaseDto {
  transactionId: string;
  receiptData: string;
  platform: PurchasePlatform;
  productId?: string;
}

export interface UpdatePurchaseStatusDto {
  status: PurchaseStatus;
  errorMessage?: string;
  verificationData?: any;
}

export interface CreateSubscriptionDto {
  productId: number;
  purchaseId: number;
  startDate: string;
  endDate?: string;
  autoRenew?: boolean;
}

export interface UpdateSubscriptionDto {
  endDate?: string;
  isActive?: boolean;
  autoRenew?: boolean;
  gracePeriodEnd?: string;
}

// Response interfaces
export interface ProductListResponse {
  result: Product[];
  total: number;
}

export interface PurchaseListResponse {
  purchases: Purchase[];
  total: number;
}

export interface SubscriptionListResponse {
  subscriptions: UserSubscription[];
  total: number;
}

export interface UserActiveProductsResponse {
  consumables: UserSubscription[];
  nonConsumables: UserSubscription[];
  subscriptions: UserSubscription[];
}

export const iapApi = {
  // Internal: Map RN Platform to backend enum
  _mapPlatform(): PurchasePlatform {
    const os = Platform.OS;

    return os === 'ios' ? ('APPLE_STORE' as PurchasePlatform) : ('GOOGLE_PLAY' as PurchasePlatform);
  },

  getProducts: async (platform?: PurchasePlatform): Promise<Product[]> => {
    const params = platform ? { platform } : {};

    const products = (await authApi.get('/iap/products', { params })) as Product[];

    return products || [];
  },

  // Purchase Management
  createPurchase: async (createPurchaseDto: CreatePurchaseDto): Promise<Purchase> => {
    return await authApi.post('/iap/purchases', createPurchaseDto);
  },


  // getUserActiveSubscriptions: async (): Promise<SubscriptionListResponse> => {
  //   return await authApi.get('/iap/subscriptions');
  // },

  // User Products Summary
  getUserActiveProducts: async (): Promise<UserActiveProductsResponse> => {
    return await authApi.get('/iap/user/products');
  },

  createPurchaseFromStore: async (purchaseData: {
    productId: string;
    transactionId: string;
    receiptData: string;
    originalTransactionId?: string;
    purchaseDate?: string;
    expirationDate?: string;
    transactionMetadata?: any;
  }): Promise<Purchase> => {
    const createDto: CreatePurchaseDto = {
      productId: purchaseData.productId,
      transactionId: purchaseData.transactionId,
      originalTransactionId: purchaseData.originalTransactionId,
      receiptData: purchaseData.receiptData,
      platform: iapApi._mapPlatform(),
      purchaseDate: purchaseData.purchaseDate,
      expirationDate: purchaseData.expirationDate,
      quantity: 1,
      transactionMetadata: purchaseData.transactionMetadata,
    };

    return await iapApi.createPurchase(createDto);
  },

  getProductsForCurrentPlatform: async (): Promise<Product[]> => {
    const platform = iapApi._mapPlatform();
    return (await iapApi.getProducts(platform)) as Product[];
  },
};
