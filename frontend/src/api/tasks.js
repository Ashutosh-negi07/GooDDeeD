import api from './axios'

export const tasksAPI = {
  create: (data) =>
    api.post('/tasks', data),

  getById: (id) =>
    api.get(`/tasks/${id}`),

  getByCause: (causeId, { status, page = 0, size = 10 } = {}) =>
    api.get(`/tasks/cause/${causeId}`, { params: { status, page, size } }),

  getByGoal: (goalId, page = 0, size = 10) =>
    api.get(`/tasks/goal/${goalId}`, { params: { page, size } }),

  update: (id, data) =>
    api.put(`/tasks/${id}`, data),

  updateStatus: (id, status) =>
    api.patch(`/tasks/${id}/status`, null, { params: { status } }),

  delete: (id) =>
    api.delete(`/tasks/${id}`),

  getMyTasks: ({ status, causeId, goalId, page = 0, size = 10 } = {}) =>
    api.get('/tasks/my', { params: { status, causeId, goalId, page, size } }),

  getMyStatistics: ({ causeId, goalId } = {}) =>
    api.get('/tasks/my/statistics', { params: { causeId, goalId } }),
}
