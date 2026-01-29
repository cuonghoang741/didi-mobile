import { BaseEntity, CustomerStatus, AddressType } from './common';

export interface User extends BaseEntity {
  email: string;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  status: CustomerStatus;
  total_orders: number;
  total_completed_orders: number; // Trường mới
  total_spent: number;
  loyalty_points: number;
  role: 'admin' | 'customer' | 'staff';
}

export interface UserAddress extends BaseEntity {
  user_id: string;
  type: AddressType;
  is_default: boolean;
  full_name: string;
  phone: string;
  address_line1: string;
  city: string;
  country: string;
}
