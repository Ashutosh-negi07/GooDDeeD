import api from './axios'

export const goalsAPI = {
  getById: (id) =>
    api.get(`/goals/${id}`),

  getByCause: (causeId, page = 0, size = 5) =>
    api.get(`/goals/cause/${causeId}`, { params: { page, size } }),

  create: (data) =>
    api.post('/goals', data),

  update: (id, data) =>
    api.put(`/goals/${id}`, data),

  delete: (id) =>
    api.delete(`/goals/${id}`),
}
