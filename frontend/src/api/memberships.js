import api from './axios'

export const membershipsAPI = {
  getMy: () =>
    api.get('/memberships/my'),

  getById: (id) =>
    api.get(`/memberships/${id}`),

  getByCause: (causeId) =>
    api.get(`/memberships/cause/${causeId}`),

  join: (causeId) =>
    api.post('/memberships/join', null, { params: { causeId } }),

  approve: (membershipId) =>
    api.post(`/memberships/${membershipId}/approve`),

  reject: (membershipId) =>
    api.delete(`/memberships/${membershipId}/reject`),

  leave: (causeId) =>
    api.delete('/memberships/leave', { params: { causeId } }),
}
