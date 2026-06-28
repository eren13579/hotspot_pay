import api from './axios'

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (email, password) =>
    api.post('/auth/register', { email, password }),

  refresh: () =>
    api.post('/auth/refresh', {}, {
      headers: { 'Refresh-Token': localStorage.getItem('refreshToken') },
    }),

  logout: () =>
    api.post('/auth/logout', {}, {
      headers: { 'Refresh-Token': localStorage.getItem('refreshToken') },
    }),

  google: (payload) =>
    api.post('/auth/google', payload),

  me: () =>
    api.get('/auth/me'),

  changePassword: (oldPassword, newPassword) =>
    api.put('/auth/password', { oldPassword, newPassword }),
}
