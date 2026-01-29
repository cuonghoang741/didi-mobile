import { BaseEntity } from './common';

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & {
  id?: string;
};

export type CategoryUpdate = Partial<CategoryInsert>;
