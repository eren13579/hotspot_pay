import { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { loginUser, registerUser, logoutUser, fetchMe, clearError, googleLogin } from '../store/authSlice'
import { hotspotsApi } from '../api/endpoints'

export function useAuth() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, userId, role, accessToken, isAuthenticated, isNewUser, loading, error, fieldErrors } =
    useSelector((state) => state.auth)

  const login = async (email, password) => {
    const result = await dispatch(loginUser({ email, password }))
    if (loginUser.fulfilled.match(result)) {
      toast.success(result.payload.message || 'Connexion réussie')

      // Vérifier si l'utilisateur a au moins 1 hotspot
      // Si oui -> dashboard, sinon -> onboarding
      const userId = result.payload.data?.userId
      try {
        const { data } = await hotspotsApi.list(userId, 0, 1, 'self')
        const items = data?.data?.content || []
        if (items.length > 0) {
          navigate('/dashboard')
        } else {
          navigate('/onboarding')
        }
      } catch {
        navigate('/dashboard')
      }
    }
    return result
  }

  const register = async (email, password) => {
    const result = await dispatch(registerUser({ email, password }))
    if (registerUser.fulfilled.match(result)) {
      toast.success(result.payload.message || 'Compte créé avec succès')
      navigate('/onboarding')
    }
    return result
  }

  const logout = async () => {
    await dispatch(logoutUser())
    toast.info('Vous êtes déconnecté')
    navigate('/sign-in')
  }

  const loadProfile = useCallback(async () => {
    if (isAuthenticated) {
      const result = await dispatch(fetchMe())
      if (fetchMe.fulfilled.match(result)) {
        const payload = result.payload
        return { ok: true, userId: payload.user?.userId || payload?.userId }
      }
    }
    return { ok: false, userId: null }
  }, [isAuthenticated, dispatch])

  const google = async (idToken) => {
    const result = await dispatch(googleLogin(idToken))
    if (googleLogin.fulfilled.match(result)) {
      toast.success(result.payload.message || 'Connexion réussie')

      // Vérifier si l'utilisateur a au moins 1 hotspot
      const userId = result.payload.data?.userId
      try {
        const { data } = await hotspotsApi.list(userId, 0, 1, 'self')
        const items = data?.data?.content || []
        navigate(items.length > 0 ? '/dashboard' : '/onboarding')
      } catch {
        navigate('/dashboard')
      }
    }
    return result
  }

  return {
    user,
    userId,
    role,
    accessToken,
    isAuthenticated,
    isNewUser,
    loading,
    error,
    fieldErrors,
    login,
    register,
    logout,
    loadProfile,
    clearError: () => dispatch(clearError()),
    google,
  }
}
