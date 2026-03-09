import type { Student, ScoreRecord, Book, Work, PaginatedResponse, LoginResponse } from '@/types'

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

// snake_case → camelCase 深度转换
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

// camelCase → snake_case 转换
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

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearToken()
    window.location.href = `${import.meta.env.BASE_URL}login`
    throw new Error('登录已过期，请重新登录')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }))
    throw new Error(error.detail || '请求失败')
  }

  const data = await response.json()
  return transformKeys(data) as T
}

async function requestRaw<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }))
    throw new Error(error.detail || '请求失败')
  }

  const data = await response.json()
  return transformKeys(data) as T
}

export const api = {
  // 学生认证
  login: (phone: string, password: string) =>
    request<LoginResponse>('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  loginWithSms: (phone: string, code: string) =>
    request<LoginResponse>('/auth/student/sms-login', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  sendSmsCode: (phone: string) =>
    request<{ message: string }>('/auth/student/sms-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  register: (data: { phone: string; code: string; password: string; name: string }) =>
    request<LoginResponse>('/auth/student/register', {
      method: 'POST',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  // 学生信息
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

  changePhone: (newPhone: string, code: string) =>
    request<{ message: string }>('/student/phone', {
      method: 'PUT',
      body: JSON.stringify({ new_phone: newPhone, code }),
    }),

  // 积分记录
  getScores: (type?: string, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (type && type !== 'all') params.append('type', type)
    return request<PaginatedResponse<ScoreRecord>>(`/student/scores?${params}`)
  },

  // 练习册
  getBooks: () => request<PaginatedResponse<Book>>('/student/books'),

  // 作品
  getWorks: (bookId?: string, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (bookId) params.append('book_id', bookId)
    return request<PaginatedResponse<Work>>(`/student/works?${params}`)
  },

  getWork: (workId: string) => request<Work>(`/student/works/${workId}`),

  // 上传
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return requestRaw<{ url: string; filename: string }>('/upload/image', {
      method: 'POST',
      body: formData,
    })
  },
}
