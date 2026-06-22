import axios from 'axios'

const API_BASE_URL = '/api/V1'

const clearAllCache = () => {
  localStorage.clear()
  sessionStorage.clear()
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        clearAllCache()
        window.location.href = '/sign-in'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: { 'Refresh-Token': refreshToken },
        })

        if (data.success) {
          const newToken = data.data.accessToken
          localStorage.setItem('accessToken', newToken)
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken)
          }
          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch (err) {
        processQueue(err, null)
        clearAllCache()
        window.location.href = '/sign-in'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
