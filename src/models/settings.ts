import { BaseEntity } from './common';

export interface Fanpage {
  id: string;
  platform: string; // 'facebook' | 'tiktok' | 'instagram' | 'zalo' | 'youtube' | 'other'
  url: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  branch_name: string;
  account_name: string;
  account_number: string;
  qr_code_url: string | null;
}

export interface StoreSettings extends BaseEntity {
  fanpage_urls: Fanpage[];
  branches: Branch[];
  bank_accounts: BankAccount[];
  jpy_exchange_rate: number;
}
