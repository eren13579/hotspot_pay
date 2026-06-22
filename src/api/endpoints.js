import api from './axios'

/* ============================================
   DASHBOARD
   ============================================ */
export const dashboardApi = {
  overview: (userId, period) => {
    let url = `/dashboard/overview?user_id=${userId}`
    if (period?.startDate) url += `&start_date=${period.startDate}`
    if (period?.endDate) url += `&end_date=${period.endDate}`
    return api.get(url)
  },

  hotspotStats: (hotspotId, userId) =>
    api.get(`/dashboard/hotspot/${hotspotId}?user_id=${userId}`),

  // Stats globales (admin — tous les utilisateurs)
  adminOverview: (period) => {
    let url = '/dashboard/admin/overview'
    if (period?.startDate) url += `?start_date=${period.startDate}`
    if (period?.endDate) url += `&end_date=${period.endDate}`
    return api.get(url)
  },

  // Comptage tickets + forfaits pour un utilisateur
  counts: (userId) =>
    api.get(`/dashboard/counts?user_id=${userId}`),

  // Comptage admin (tous)
  adminCounts: () =>
    api.get('/dashboard/admin/counts'),

}

/* ============================================
   HOTSPOTS
   ============================================ */
export const hotspotsApi = {
  list: (userId, page = 0, size = 10, scope) => {
    let url = `/hotspots?user_id=${userId}&page=${page}&size=${size}`
    if (scope) url += `&scope=${scope}`
    return api.get(url)
  },

  adminList: (page = 0, size = 10, scope) => {
    let url = `/hotspots?page=${page}&size=${size}`
    if (scope) url += `&scope=${scope}`
    return api.get(url)
  },

  get: (id) =>
    api.get(`/hotspots/${id}`),

  create: (data) =>
    api.post('/hotspots', data),

  update: (id, data) =>
    api.put(`/hotspots/${id}`, data),

  delete: (id) =>
    api.delete(`/hotspots/${id}`),

  test: (id) =>
    api.post(`/hotspots/${id}/test`),

  generateToken: (id) =>
    api.post(`/hotspots/${id}/generate-token`),

  revokeToken: (id) =>
    api.delete(`/hotspots/${id}/router-token`),
}

/* ============================================
   HOTSPOT PLANS (not subscription plans)
   ============================================ */
export const hotspotPlansApi = {
  list: (hotspotId) =>
    api.get(`/hotspots/${hotspotId}/plans`),

  get: (hotspotId, planId) =>
    api.get(`/hotspots/${hotspotId}/plans/${planId}`),

  create: (hotspotId, data) =>
    api.post(`/hotspots/${hotspotId}/plans`, data),

  update: (hotspotId, planId, data) =>
    api.put(`/hotspots/${hotspotId}/plans/${planId}`, data),

  toggle: (hotspotId, planId) =>
    api.patch(`/hotspots/${hotspotId}/plans/${planId}/toggle`),

  delete: (hotspotId, planId) =>
    api.delete(`/hotspots/${hotspotId}/plans/${planId}`),
}

/* ============================================
   TICKETS
   ============================================ */
export const ticketsApi = {
  list: (hotspotId) =>
    api.get(`/hotspots/${hotspotId}/tickets`),

  import: (hotspotId, tickets) =>
    api.post(`/hotspots/${hotspotId}/tickets/import`, { tickets }),

  revoke: (hotspotId, ticketId) =>
    api.delete(`/hotspots/${hotspotId}/tickets/${ticketId}`),

  delete: (hotspotId, ticketId) =>
    api.delete(`/hotspots/${hotspotId}/tickets/${ticketId}/delete`),

  deleteAll: (hotspotId) =>
    api.delete(`/hotspots/${hotspotId}/tickets`),
}

/* ============================================
   SESSIONS
   ============================================ */
export const sessionsApi = {
  all: () =>
    api.get('/sessions/all'),

  active: (scope) =>
    api.get(`/sessions/active${scope === 'self' ? '?scope=self' : ''}`),

  byHotspot: (hotspotId) =>
    api.get(`/sessions/hotspot/${hotspotId}`),

  get: (sessionId) =>
    api.get(`/sessions/${sessionId}`),

  revoke: (sessionId) =>
    api.post(`/sessions/${sessionId}/revoke`),

  delete: (sessionId) =>
    api.delete(`/sessions/${sessionId}`),
}

/* ============================================
   PAIEMENTS
   ============================================ */
export const paymentsApi = {
  list: (hotspotId) =>
    api.get(`/hotspots/${hotspotId}/payments`),

  initiate: (data) =>
    api.post('/portal/payments/initiate', data),

  status: (reference) =>
    api.get(`/portal/payments/status/${reference}`),

  portalStatus: (reference) =>
    api.get(`/portal/payment/${reference}/status`),

  refund: (paymentId) =>
    api.post(`/payments/${paymentId}/refund`),
}

/* ============================================
   ABONNEMENTS
   ============================================ */
export const subscriptionsApi = {
  plans: () =>
    api.get('/subscriptions/plans'),

  mine: () =>
    api.get('/subscriptions/me'),

  history: () =>
    api.get('/subscriptions/me/history'),

  subscribe: (data) =>
    api.post('/subscriptions', data),

  adminList: () =>
    api.get('/subscriptions/admin/plans'),

  adminCreate: (data) =>
    api.post('/subscriptions/admin/plans', data),

  adminUpdate: (planId, data) =>
    api.put(`/subscriptions/admin/plans/${planId}`, data),

  adminDelete: (planId) =>
    api.delete(`/subscriptions/admin/plans/${planId}`),

  adminTogglePopular: (planId) =>
    api.patch(`/subscriptions/admin/plans/${planId}/toggle-popular`),
}

/* ============================================
   ROUTEURS & SCRIPTS
   ============================================ */
export const routerApi = {
  brands: () =>
    api.get('/router-brands'),

  brandDetail: (slug) =>
    api.get(`/router-brands/${slug}`),

  models: (slug) =>
    api.get(`/router-brands/${slug}/models`),

  downloadScript: (hotspotId, { token, brand = 'mikrotik', format = 'bash' }) =>
    api.get(`/script-download/${hotspotId}`, {
      params: { token, brand, format },
      responseType: 'blob',
    }),
}
/* ============================================
   ADMIN — UTILISATEURS
   ============================================ */
export const adminUsersApi = {
  list: (page = 0, size = 20, filters = {}) => {
    let url = `/admin/users?page=${page}&size=${size}`
    if (filters.active != null) url += `&active=${filters.active}`
    if (filters.role) url += `&role=${encodeURIComponent(filters.role)}`
    if (filters.planType) url += `&planType=${encodeURIComponent(filters.planType)}`
    return api.get(url)
  },

  search: (q, page = 0, size = 20) =>
    api.get(`/admin/users/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`),

  create: (data) =>
    api.post('/admin/users', data),

  update: (userId, data) =>
    api.put(`/admin/users/${userId}`, data),

  delete: (userId) =>
    api.delete(`/admin/users/${userId}`),
}

/* ============================================
   UTILISATEURS
   ============================================ */
export const usersApi = {
  me: () =>
    api.get('/users/me'),

  update: (data) =>
    api.put('/users/me', data),

  planInfo: () =>
    api.get('/users/me/plan-info'),
}

/* ============================================
   RETRAITS
   ============================================ */
export const withdrawalsApi = {
  create: (data) =>
    api.post('/withdrawals', data),

  list: (page = 0, size = 20, scope) => {
    const url = scope === 'global'
      ? `/withdrawals/admin?page=${page}&size=${size}`
      : `/withdrawals?page=${page}&size=${size}`
    return api.get(url)
  },

  get: (id) =>
    api.get(`/withdrawals/${id}`),

  cancel: (id) =>
    api.delete(`/withdrawals/${id}`),

  approve: (id) =>
    api.post(`/withdrawals/${id}/approve`),

  reject: (id, reason) =>
    api.post(`/withdrawals/${id}/reject`, { reason }),

  // Batch
  batchApprove: (withdrawalIds) =>
    api.post('/withdrawals/batch/approve', { withdrawalIds }),

  batchReject: (withdrawalIds, reason) =>
    api.post('/withdrawals/batch/reject', { withdrawalIds, reason }),
}

/* ============================================
   ADMIN — PARAMÈTRES SYSTÈME
   ============================================ */
export const adminSettingsApi = {
  get: () =>
    api.get('/admin/settings'),

  update: (data) =>
    api.put('/admin/settings', data),

  upload: (formData) =>
    api.post('/admin/settings/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteFile: (url) =>
    api.delete(`/admin/settings/file?url=${encodeURIComponent(url)}`),
}

/* ============================================
   ADMIN — MARQUES DE ROUTEURS
   ============================================ */
/* ============================================
   ADMIN — MONITORING (FastAPI)
   ============================================ */
export const monitoringApi = {
  routerActions: (limit = 50) =>
    api.get(`/admin/monitoring/router-actions?limit=${limit}`),

  notificationCounts: () =>
    api.get('/admin/monitoring/notifications'),
}

export const routerBrandAdminApi = {
  list: (onlyActive = false) =>
    api.get(`/admin/router-brands?onlyActive=${onlyActive}`),

  getBySlug: (slug) =>
    api.get(`/admin/router-brands/${slug}`),

  create: (data) =>
    api.post('/admin/router-brands', data),

  update: (slug, data) =>
    api.put(`/admin/router-brands/${slug}`, data),

  toggleActive: (slug) =>
    api.patch(`/admin/router-brands/${slug}/toggle`),

  delete: (slug) =>
    api.delete(`/admin/router-brands/${slug}`),
}

/* ============================================
   ADMIN — MODÈLES DE ROUTEURS
   ============================================ */
export const routerModelAdminApi = {
  list: (brandSlug) =>
    api.get(`/admin/router-brands/${brandSlug}/models`),

  create: (brandSlug, data) =>
    api.post(`/admin/router-brands/${brandSlug}/models`, data),

  update: (brandSlug, modelId, data) =>
    api.put(`/admin/router-brands/${brandSlug}/models/${modelId}`, data),

  toggleActive: (brandSlug, modelId) =>
    api.patch(`/admin/router-brands/${brandSlug}/models/${modelId}/toggle`),

  delete: (brandSlug, modelId) =>
    api.delete(`/admin/router-brands/${brandSlug}/models/${modelId}`),
}

/* ============================================
   CONTACT (public)
   ============================================ */
export const contactApi = {
  submit: (data) =>
    api.post('/contact', data),
}

/* ============================================
   CONTACT ADMIN (tickets support)
   ============================================ */
export const contactAdminApi = {
  list: (params) =>
    api.get('/admin/contact-messages', { params }),

  get: (id) =>
    api.get(`/admin/contact-messages/${id}`),

  reply: (id, data) =>
    api.put(`/admin/contact-messages/${id}/reply`, data),

  markRead: (id) =>
    api.patch(`/admin/contact-messages/${id}/read`),

  updateStatus: (id, data) =>
    api.patch(`/admin/contact-messages/${id}/status`, data),
}

/* ============================================
   FAQ (publiques + admin CRUD)
   ============================================ */
export const faqApi = {
  list: () =>
    api.get('/faqs'),

  adminList: () =>
    api.get('/faqs/admin'),

  create: (data) =>
    api.post('/faqs/admin', data),

  update: (id, data) =>
    api.put(`/faqs/admin/${id}`, data),

  delete: (id) =>
    api.delete(`/faqs/admin/${id}`),
}

/* ============================================
   PORTAL CAPTIF (public — no JWT)
   Utilise publicApi pour éviter les intercepteurs auth
   ============================================ */
import publicApi from './publicAxios'

/* ============================================
   2FA (authentification à deux facteurs)
   ============================================ */
export const twoFactorApi = {
  setup: () => api.post('/auth/2fa/setup'),
  enable: (secret, totpCode) => api.post('/auth/2fa/enable', { secret, totpCode }),
  disable: (password) => api.post('/auth/2fa/disable', { password }),
  status: () => api.get('/auth/2fa/status'),
  authenticate: (tempToken, totpCode) => api.post('/auth/2fa/authenticate', { tempToken, totpCode }),
}

export const portalApi = {
  /** GET /portal/{hotspotId} — Charger la page portail (hotspot + plans + branding) */
  page: (hotspotId, mac) =>
    publicApi.get(`/portal/${hotspotId}${mac ? `?mac=${encodeURIComponent(mac)}` : ''}`),

  /** GET /portal/{hotspotId}/plans — Plans actifs du hotspot */
  plans: (hotspotId) =>
    publicApi.get(`/portal/${hotspotId}/plans`),

  /** POST /portal/pay — Initier un paiement Mobile Money */
  pay: (data) =>
    publicApi.post('/portal/pay', data),

  /** GET /portal/payment/{reference}/status — Polling statut paiement */
  paymentStatus: (reference) =>
    publicApi.get(`/portal/payment/${reference}/status`),

  /** POST /portal/{hotspotId}/tickets/connect — Connexion par ticket */
  ticketConnect: (hotspotId, data) =>
    publicApi.post(`/portal/${hotspotId}/tickets/connect`, data),

  /** GET /portal/{hotspotId}/tickets/{username}/info — Infos ticket */
  ticketInfo: (hotspotId, username) =>
    publicApi.get(`/portal/${hotspotId}/tickets/${username}/info`),

  /** POST /portal/payment/{reference}/connect — Connexion manuelle WiFi (auto-connect désactivé) */
  connectManually: (reference, mac) =>
    publicApi.post(`/portal/payment/${reference}/connect?mac=${encodeURIComponent(mac || '')}`),
}
