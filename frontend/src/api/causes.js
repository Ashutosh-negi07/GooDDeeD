import api from './axios'

export const causesAPI = {
  getAll: (page = 0, size = 10) =>
    api.get('/causes', { params: { page, size } }),

  getById: (id) =>
    api.get(`/causes/${id}`),

  getMyCauses: () =>
    api.get('/causes/my'),

  search: (keyword, page = 0, size = 10) =>
    api.get('/causes/search', { params: { keyword, page, size } }),

  create: (data) =>
    api.post('/causes', data),

  update: (id, data) =>
    api.put(`/causes/${id}`, data),

  delete: (id) =>
    api.delete(`/causes/${id}`),
}
