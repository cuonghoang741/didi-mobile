import { Prompt } from './prompt';
import { Task } from './task';

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;

  prompts?: Prompt[]; // Prompt interface array
  tasks?: Task[]; // Task interface array
}
