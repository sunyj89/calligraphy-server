import type { Student, ScoreRecord, Teacher, Statistics, Classroom, OverviewStatistics, LeaderboardEntry } from '@/types';

const API_BASE = '/api';

let token = localStorage.getItem('token');

export function setToken(newToken: string) {
  token = newToken;
  localStorage.setItem('token', newToken);
}

export function clearToken() {
  token = null;
  localStorage.removeItem('token');
}

export function getToken() {
  return token;
}

// snake_case → camelCase 深度转换
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function transformKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(transformKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [snakeToCamel(k), transformKeys(v)])
    );
  }
  return obj;
}

// camelCase → snake_case 转换（仅一层，用于请求体）
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function transformKeysToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(transformKeysToSnake);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [camelToSnake(k), transformKeysToSnake(v)])
    );
  }
  return obj;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(error.detail || '请求失败');
  }

  const data = await response.json();
  return transformKeys(data) as T;
}

// 用于 multipart 请求（不设置 Content-Type，让浏览器自动设置 boundary）
async function requestRaw<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(error.detail || '请求失败');
  }

  const data = await response.json();
  return transformKeys(data) as T;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  teacher?: Teacher;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export const api = {
  // 认证
  login: (phone: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  getMe: () => request<Teacher>('/auth/me'),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),

  updateProfile: (data: { name?: string }) =>
    request<Teacher>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  // 学员
  getStudents: (page = 1, pageSize = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.append('search', search);
    return request<PaginatedResponse<Student>>(`/students?${params}`);
  },

  getStudent: (id: string) => request<Student>(`/students/${id}`),

  createStudent: (data: { name: string; phone?: string; avatar?: string; address?: string; school?: string; grade?: string }) =>
    request<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  updateStudent: (id: string, data: Record<string, unknown>) =>
    request<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  deleteStudent: (id: string) =>
    request<{ message: string }>(`/students/${id}`, { method: 'DELETE' }),

  getStatistics: () => request<Statistics>('/students/statistics'),

  // 积分
  getStudentScores: (studentId: string, page = 1, pageSize = 50) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    return request<PaginatedResponse<ScoreRecord>>(`/students/${studentId}/scores?${params}`);
  },

  addScore: (studentId: string, scoreType: string, score: number, reason?: string) =>
    request<ScoreRecord>(`/students/${studentId}/scores`, {
      method: 'POST',
      body: JSON.stringify({ score_type: scoreType, score, reason }),
    }),

  deleteScore: (scoreId: string) =>
    request<{ message: string }>(`/scores/${scoreId}`, { method: 'DELETE' }),

  // 练习册
  getBooks: () => request<PaginatedResponse<{ id: string; name: string; cover?: string; description?: string; orderNum: number; isActive: boolean; createdAt: string }>>('/books'),

  // 作品
  getStudentWorks: (studentId: string, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    return request<PaginatedResponse<{ id: string; studentId: string; bookId?: string; imageUrl: string; thumbnailUrl?: string; description?: string; isActive: boolean; createdAt: string }>>(`/students/${studentId}/works?${params}`);
  },

  createWork: (studentId: string, data: { imageUrl: string; bookId?: string; thumbnailUrl?: string; description?: string }) =>
    request<unknown>(`/students/${studentId}/works`, {
      method: 'POST',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  deleteWork: (workId: string) =>
    request<{ message: string }>(`/works/${workId}`, { method: 'DELETE' }),

  // 上传
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return requestRaw<{ url: string; filename: string }>('/upload/image', {
      method: 'POST',
      body: formData,
    });
  },

  // 教师管理 (admin)
  getTeachers: (page = 1, pageSize = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.append('search', search);
    return request<PaginatedResponse<Teacher>>(`/teachers?${params}`);
  },

  createTeacher: (data: { name: string; phone: string; password: string; role?: string }) =>
    request<Teacher>('/teachers', {
      method: 'POST',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  updateTeacher: (id: string, data: { name?: string; phone?: string; role?: string }) =>
    request<Teacher>(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  deleteTeacher: (id: string) =>
    request<{ message: string }>(`/teachers/${id}`, { method: 'DELETE' }),

  resetTeacherPassword: (id: string, newPassword: string) =>
    request<{ message: string }>(`/teachers/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword }),
    }),

  // 班级管理
  getClassrooms: (page = 1, pageSize = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.append('search', search);
    return request<PaginatedResponse<Classroom>>(`/classrooms?${params}`);
  },

  createClassroom: (data: { name: string; gradeYear?: string; description?: string }) =>
    request<Classroom>('/classrooms', {
      method: 'POST',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  updateClassroom: (id: string, data: { name?: string; gradeYear?: string; description?: string }) =>
    request<Classroom>(`/classrooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  deleteClassroom: (id: string) =>
    request<{ message: string }>(`/classrooms/${id}`, { method: 'DELETE' }),

  getClassroomStudents: (classroomId: string, page = 1, pageSize = 20) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    return request<PaginatedResponse<Student>>(`/classrooms/${classroomId}/students?${params}`);
  },

  assignStudentsToClassroom: (classroomId: string, studentIds: string[]) =>
    request<{ message: string }>(`/classrooms/${classroomId}/students`, {
      method: 'POST',
      body: JSON.stringify({ student_ids: studentIds }),
    }),

  removeStudentsFromClassroom: (classroomId: string, studentIds: string[]) =>
    request<{ message: string }>(`/classrooms/${classroomId}/students/remove`, {
      method: 'POST',
      body: JSON.stringify({ student_ids: studentIds }),
    }),

  // 统计概览
  getOverviewStatistics: () => request<OverviewStatistics>('/students/statistics/overview'),

  // 排行榜
  getLeaderboard: (limit = 20, classroomId?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (classroomId) params.append('classroom_id', classroomId);
    return request<LeaderboardEntry[]>(`/students/leaderboard?${params}`);
  },

  // 练习册管理 (admin)
  createBook: (data: { name: string; cover?: string; description?: string; orderNum?: number }) =>
    request<unknown>('/books', {
      method: 'POST',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  updateBook: (id: string, data: { name?: string; cover?: string; description?: string; orderNum?: number }) =>
    request<unknown>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),

  deleteBook: (id: string) =>
    request<{ message: string }>(`/books/${id}`, { method: 'DELETE' }),

  // 操作日志 (admin)
  getAuditLogs: (page = 1, pageSize = 20, action?: string, targetType?: string) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (action) params.append('action', action);
    if (targetType) params.append('target_type', targetType);
    return request<PaginatedResponse<{ id: string; teacherId: string; teacherName: string; action: string; targetType: string; targetId?: string; detail?: Record<string, unknown>; createdAt: string }>>(`/audit-logs?${params}`);
  },
};
