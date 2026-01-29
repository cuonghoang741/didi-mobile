import { Image } from './Image';
import { CreditSource } from './types';
import { User } from './user';

export interface Credit {
  id: number;
  userId: number;
  amount: number;
  source?: CreditSource;
  metadata?: {
    [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
  };
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;

  user?: User; // User interface
  images?: Image[]; // Image interface array
}
