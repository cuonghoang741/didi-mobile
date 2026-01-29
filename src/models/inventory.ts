import { BaseEntity, InventoryStatus } from './common';

export interface InventoryItem extends BaseEntity {
  variant_id: string;
  imei: string | null;
  serial_number: string | null;
  status: InventoryStatus;
  purchase_date: string | null;
  purchase_price: number | null;
}
