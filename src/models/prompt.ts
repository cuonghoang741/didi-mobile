import { Category } from './category';
import { Task } from './task';
import { ImageType } from './types';

export interface Prompt {
  id: number;
  name?: string;
  content: string;
  iconName?: string;
  iconUrl?: string;
  type: ImageType;
  categoryId?: number;
  imageNameValid?: string;

  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;

  category?: Category; // Category interface
  tasks?: Task[]; // Task interface array
}
