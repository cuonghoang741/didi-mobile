import { BaseEntity } from './common';

export interface Brand extends BaseEntity {
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export type BrandInsert = Omit<Brand, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type BrandUpdate = Partial<BrandInsert>;
