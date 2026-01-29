import { PaginationResponse } from '@/types/common';

import authApi from '../config/authApi.config';

import { Image } from '@/models/Image';

export const imageApi = {
  getImages: async (): Promise<PaginationResponse<Image>> => {
    const response = await authApi.get('/image');
    return response.data;
  },
};
