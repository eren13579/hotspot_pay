import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../api/auth'

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login(email, password)
      if (data.success) return { data: data.data, message: data.message, email }
      return rejectWithValue(data.message || 'Échec de la connexion')
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Erreur réseau')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await authApi.register(email, password)
      if (data.success) return { data: data.data, message: data.message, email }
      return rejectWithValue({
        message: data.message || "Échec de l'inscription",
        fields: data.data || {},
      })
    } catch (err) {
      const responseData = err.response?.data
      return rejectWithValue({
        message: responseData?.message || 'Erreur réseau',
        fields: responseData?.data || {},
      })
    }
  }
)

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authApi.me()
      if (data.success) return data.data
      return rejectWithValue('Session expirée')
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Erreur réseau')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout()
    } catch {
      // Même si le logout API échoue, on nettoie côté client
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }
)

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (idToken, { rejectWithValue }) => {
    try {
      const { data } = await authApi.google(idToken)
      if (data.success) return { data: data.data, message: data.message }
      return rejectWithValue(data.message || 'Échec de la connexion Google')
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Erreur réseau')
    }
  }
)

const initialState = {
  user: null,
  userId: null,
  role: null,
  isNewUser: false,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,
  fieldErrors: {},
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
      state.fieldErrors = {}
    },
    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      localStorage.setItem('accessToken', action.payload.accessToken)
      if (action.payload.refreshToken) {
        localStorage.setItem('refreshToken', action.payload.refreshToken)
      }
    },
    setUser: (state, action) => {
      state.user = action.payload
    },
    clearNewUserFlag: (state) => {
      state.isNewUser = false
    },
    resetAuth: () => {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      return { ...initialState, accessToken: null, refreshToken: null, isAuthenticated: false }
    },
  },
  extraReducers: (builder) => {
    builder
      // -- LOGIN --
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.error = null
        state.userId = action.payload.data.userId
        state.role = action.payload.data.role
        state.accessToken = action.payload.data.accessToken
        state.refreshToken = action.payload.data.refreshToken
        state.isAuthenticated = true
        state.user = {
          email: action.payload.email,
          userId: action.payload.data.userId,
          role: action.payload.data.role,
          planType: action.payload.data.planType,
          fullName: action.payload.data.fullName || null,
        }
        localStorage.setItem('accessToken', action.payload.data.accessToken)
        if (action.payload.data.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.data.refreshToken)
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // -- REGISTER --
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
        state.fieldErrors = {}
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.fieldErrors = {}
        state.userId = action.payload.data.userId
        state.role = action.payload.data.role
        state.accessToken = action.payload.data.accessToken
        state.refreshToken = action.payload.data.refreshToken
        state.isAuthenticated = true
        state.user = { email: action.payload.email, role: action.payload.data.role, planType: action.payload.data.planType }
        state.isNewUser = true
        localStorage.setItem('accessToken', action.payload.data.accessToken)
        if (action.payload.data.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.data.refreshToken)
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || "Échec de l'inscription"
        state.fieldErrors = action.payload?.fields || {}
      })
      // -- FETCH ME --
      .addCase(fetchMe.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false
        state.error = null
        const payload = action.payload
        state.user = payload.user || payload
        if (payload.user?.userId) state.userId = payload.user.userId
        if (payload.user?.role) state.role = payload.user.role
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false
        // NE PAS réinitialiser l'auth ! Les vraies erreurs 401 sont déjà
        // gérées par l'intercepteur axios (refresh → redirect /sign-in).
        // Un 429 (rate limit) ne doit PAS déconnecter l'utilisateur.
        state.error = typeof action.payload === 'string' ? action.payload : 'Erreur de chargement du profil'
      })
      // -- LOGOUT --
      .addCase(logoutUser.fulfilled, (state) => {
        return {
          ...initialState,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }
      })
  },
})

export const { clearError, setTokens, setUser, clearNewUserFlag, resetAuth } = authSlice.actions
export default authSlice.reducer
