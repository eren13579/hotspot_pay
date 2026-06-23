import axios from 'axios'

const API_BASE_URL = '/api/V1'

/** Instance axios sans intercepteurs JWT — pour les routes publiques (portail captif) */
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export default publicApi
