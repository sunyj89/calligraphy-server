import { create } from 'zustand'
import { api } from '@/lib/api'
import { setToken, clearToken, getToken } from '@/lib/api'
import type { Student } from '@/types'

interface AuthState {
  token: string | null
  student: Student | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (phone: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getToken(),
  student: null,
  isAuthenticated: !!getToken(),
  isLoading: false,

  login: async (phone, password) => {
    const res = await api.login(phone, password)
    setToken(res.accessToken)
    set({ token: res.accessToken, isAuthenticated: true, student: res.student || null })
    if (!res.student) {
      await get().refreshProfile()
    }
  },

  logout: () => {
    clearToken()
    set({ token: null, student: null, isAuthenticated: false })
  },

  refreshProfile: async () => {
    try {
      set({ isLoading: true })
      const student = await api.getMe()
      set({ student, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  initialize: () => {
    const token = getToken()
    if (token) {
      set({ token, isAuthenticated: true })
      get().refreshProfile()
    }
  },
}))
