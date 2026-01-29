import { Category } from './category';
import { Image } from './Image';
import { Prompt } from './prompt';
import { ImageType } from './types';
import { User } from './user';

export interface Task {
  id: number;
  brandName: string;
  keyImages: string;
  color: string;
  categoryId: number;
  promptId: number;
  fullPrompt: string;
  userId?: number;
  imageSelectedId?: number;

  category?: Category;
  prompt?: Prompt;
  images?: Image[];
  taskExecutions?: TaskExecution[];
  user?: User;

  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface TaskExecution {
  id: number;
  taskId: number;
  numberOfImages: number;
  prompt?: string;
  imageId?: number;
  imageType?: ImageType;

  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;

  task?: Task;
  images?: Image[];
}
