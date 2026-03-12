import type {
  Book,
  LeaderboardEntry,
  LoginResponse,
  PaginatedResponse,
  ScoreRecord,
  Student,
  Term,
  Work,
} from '@/types'

const API_BASE = '/api'
let token = localStorage.getItem('token')

export function setToken(newToken: string) {
  token = newToken
  localStorage.setItem('token', newToken)
}

export function clearToken() {
  token = null
  localStorage.removeItem('token')
}

export function getToken() {
  return token
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function transformKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(transformKeys)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [snakeToCamel(k), transformKeys(v)])
    )
  }
  return obj
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

function transformKeysToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(transformKeysToSnake)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [camelToSnake(k), transformKeysToSnake(v)])
    )
  }
  return obj
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  if (response.status === 401) {
    clearToken()
    window.location.href = `${import.meta.env.BASE_URL}login`
    throw new Error('login expired')
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'request failed' }))
    throw new Error(error.detail || 'request failed')
  }
  const data = await response.json()
  return transformKeys(data) as T
}

export const api = {
  login: (phone: string, password: string) =>
    request<LoginResponse>('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  getMe: () => request<Student>('/student/me'),

  updateProfile: (data: Partial<Pick<Student, 'name' | 'avatar' | 'gender' | 'birthday' | 'school' | 'grade'>>) =>
    request<Student>('/student/profile', {
      method: 'PUT',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ message: string }>('/student/password', {
      method: 'PUT',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),

  getScores: (scoreType?: string, page = 1, pageSize = 20, term?: Term) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (scoreType && scoreType !== 'all') params.append('score_type', scoreType)
    if (term) params.append('term', term)
    return request<PaginatedResponse<ScoreRecord>>(`/student/scores?${params}`)
  },

  getBooks: () => request<PaginatedResponse<Book>>('/student/books'),

  getWorks: (term?: Term, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (term) params.append('term', term)
    return request<PaginatedResponse<Work>>(`/student/works?${params}`)
  },

  getWork: (workId: string) => request<Work>(`/student/works/${workId}`),

  getClassroomGallery: (term?: Term, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (term) params.append('term', term)
    return request<PaginatedResponse<Work>>(`/student/gallery/classroom?${params}`)
  },

  getSchoolGallery: (term?: Term, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (term) params.append('term', term)
    return request<PaginatedResponse<Work>>(`/student/gallery/school?${params}`)
  },

  getClassroomLeaderboard: (limit = 20) =>
    request<LeaderboardEntry[]>(`/student/leaderboard/classroom?limit=${limit}`),

  getSchoolLeaderboard: (limit = 20) =>
    request<LeaderboardEntry[]>(`/student/leaderboard/school?limit=${limit}`),
}
