import { PaginationResponse } from '@/types/common';

import authApi from '../config/authApi.config';

import { Task } from '@/models/task';

export const taskApi = {
  getTasks: async (): Promise<PaginationResponse<Task>> => {
    const response = await authApi.get('/task');
    return response.data;
  },
  createTask: async (task: Task): Promise<Task> => {
    const response = await authApi.post('/task', task);
    return response.data;
  },
  updateTask: async (task: Task): Promise<Task> => {
    const response = await authApi.patch(`/task/${task.id}`, task);
    return response.data;
  },
  executeTask: async (task: Task): Promise<Task> => {
    const response = await authApi.post(`/task/${task.id}/execute`, task);
    return response.data;
  },
  getTaskById: async (id: number): Promise<Task> => {
    const response = await authApi.get(`/task/${id}`);
    return response.data;
  },
  guidelineExecuteTask: async (task: Task): Promise<Task> => {
    const response = await authApi.post(`/task/${task.id}/execute/guideline`, task);
    return response.data;
  },
  mockupExecuteTask: async (task: Task): Promise<Task> => {
    const response = await authApi.post(`/task/${task.id}/execute/mockup`, task);
    return response.data;
  },
};
