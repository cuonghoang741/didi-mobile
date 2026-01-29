import { Credit } from './credit';
import { Task, TaskExecution } from './task';
import { ImageStatus, ImageType } from './types';
import { User } from './user';

export interface Image {
  id: number;
  type: ImageType;
  name?: string;
  url?: string;
  status: ImageStatus;
  parentId?: number;
  taskId?: number;
  taskExecutionId?: number;
  responseJson?: Record<string, unknown>;
  userId?: number;
  creditId?: number;

  task?: Task; // Task interface
  taskExecution?: TaskExecution; // TaskExecution interface
  user?: User; // User interface
  credit?: Credit; // Credit interface

  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}
