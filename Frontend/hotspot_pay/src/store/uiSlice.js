import { createSlice } from '@reduxjs/toolkit'

function getInitialTheme() {
  try { return localStorage.getItem('hotspotpay-theme') || 'dark' } catch { return 'dark' }
}
function getInitialLocale() {
  try { return localStorage.getItem('hotspotpay-locale') || 'fr' } catch { return 'fr' }
}

const initialState = {
  sidebarOpen: true,
  theme: getInitialTheme(),
  locale: getInitialLocale(),
  searchQuery: '',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
      try { localStorage.setItem('hotspotpay-theme', action.payload) } catch {}
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem('hotspotpay-theme', state.theme) } catch {}
    },
    setLocale: (state, action) => {
      state.locale = action.payload
      try { localStorage.setItem('hotspotpay-locale', action.payload) } catch {}
    },
    toggleLocale: (state) => {
      state.locale = state.locale === 'fr' ? 'en' : 'fr'
      try { localStorage.setItem('hotspotpay-locale', state.locale) } catch {}
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    },
  },
})

export const { toggleSidebar, setSidebarOpen, setTheme, toggleTheme, setLocale, toggleLocale, setSearchQuery } = uiSlice.actions
export default uiSlice.reducer
