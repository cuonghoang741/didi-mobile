import axios from 'axios';

import BASE_URL from './baseUrl';

const publicApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Connection: 'keep-alive',
  },
  paramsSerializer: (params) => {
    const query = Object.entries(params)
      .flatMap(([key, value]) => {
        if (value === undefined || value === null) return [];
        return Array.isArray(value)
          ? value
              .filter((v) => v !== undefined && v !== null)
              .map((val) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
          : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join('&');

    return query;
  },
});

// publicApi.interceptors.request.use((config) => {
//   console.log('(📍 PublicApiConfig) request', {
//     url: config.url,
//     method: config.method,
//     headers: config.headers,
//     body: config.data,
//   });

//   return config;
// });

// publicApi.interceptors.response.use(
//   (response) => {
//     console.log('(📍 PublicApiConfig) response', {
//       url: response.config.url,
//       method: response.config.method,
//       headers: response.config.headers,
//       body: response.config.data,
//       status: response.status,
//       statusText: response.statusText,
//       data: response.data,
//     });

//     return response;
//   },
//   (error) => {
//     console.log('(📍 PublicApiConfig) error', {
//       url: error.config.url,
//       method: error.config.method,
//       headers: error.config.headers,
//       body: error.config.data,
//       status: error.response?.status,
//       statusText: error.response?.statusText,
//       data: error.response?.data,
//     });

//     return Promise.reject(error);
//   },
// );

export default publicApi;
