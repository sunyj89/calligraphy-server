import type {
  Classroom,
  CompetitionForm,
  LeaderboardEntry,
  OverviewStatistics,
  ScoreRecord,
  Statistics,
  Student,
  Teacher,
  Term,
  Work,
} from '@/types';

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

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
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
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'request failed' }));
    throw new Error(error.detail || 'request failed');
  }
  const data = await response.json();
  return transformKeys(data) as T;
}

async function requestRaw<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'request failed' }));
    throw new Error(error.detail || 'request failed');
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

export interface StudentDetailAggregate {
  student: Student;
  classroom?: {
    id: string;
    name: string;
    gradeYear?: string;
  } | null;
  teacher?: {
    id: string;
    name: string;
    phone?: string;
  } | null;
  growthDetail: PaginatedResponse<ScoreRecord>;
  works: PaginatedResponse<Work>;
}

export const api = {
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

  getStudents: (
    page = 1,
    pageSize = 20,
    search?: string,
    classroomId?: string,
    teacherId?: string
  ) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.append('search', search);
    if (classroomId) params.append('classroom_id', classroomId);
    if (teacherId) params.append('teacher_id', teacherId);
    return request<PaginatedResponse<Student>>(`/students?${params}`);
  },
  getStudent: (id: string) => request<Student>(`/students/${id}`),
  getStudentDetail: (id: string) => request<StudentDetailAggregate>(`/students/${id}/detail`),
  createStudent: (data: {
    name: string;
    phone: string;
    password?: string;
    avatar?: string;
    address?: string;
    school?: string;
    grade?: string;
    gender?: string;
    birthday?: string;
    classroomId?: string;
  }) =>
    request<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(
        transformKeysToSnake({
          ...data,
          password: data.password || '111111',
          grade: data.grade || '1',
          gender: data.gender || 'male',
        })
      ),
    }),
  updateStudent: (id: string, data: Record<string, unknown>) =>
    request<Student>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),
  deleteStudent: (id: string) => request<{ message: string }>(`/students/${id}`, { method: 'DELETE' }),
  getStatistics: () => request<Statistics>('/students/statistics'),
  getOverviewStatistics: () => request<OverviewStatistics>('/students/statistics/overview'),
  getLeaderboard: (limit = 20, classroomId?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (classroomId) params.append('classroom_id', classroomId);
    return request<LeaderboardEntry[]>(`/students/leaderboard?${params}`);
  },
  getSchoolLeaderboard: (limit = 20) =>
    request<LeaderboardEntry[]>(`/students/leaderboard/school?limit=${limit}`),

  getStudentScores: (studentId: string, page = 1, pageSize = 50, scoreType?: string, term?: Term) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (scoreType) params.append('score_type', scoreType);
    if (term) params.append('term', term);
    return request<PaginatedResponse<ScoreRecord>>(`/students/${studentId}/scores?${params}`);
  },
  addPracticeScore: (studentId: string, payload: { score: number; term: Term; bookId: string; targetPart: 'root' | 'trunk'; reason?: string }) =>
    request<ScoreRecord>(`/students/${studentId}/scores`, {
      method: 'POST',
      body: JSON.stringify(
        transformKeysToSnake({
          scoreType: 'practice',
          score: payload.score,
          term: payload.term,
          bookId: payload.bookId,
          targetPart: payload.targetPart,
          reason: payload.reason,
        })
      ),
    }),
  addHomeworkScore: (studentId: string, payload: { score: number; term: Term; reason?: string }) =>
    request<ScoreRecord>(`/students/${studentId}/scores`, {
      method: 'POST',
      body: JSON.stringify(transformKeysToSnake({ scoreType: 'homework', ...payload })),
    }),
  addCompetitionScore: (studentId: string, payload: CompetitionForm) =>
    request<ScoreRecord>(`/students/${studentId}/scores`, {
      method: 'POST',
      body: JSON.stringify(
        transformKeysToSnake({
          scoreType: 'competition',
          score: payload.score,
          term: payload.term,
          reason: payload.name,
        })
      ),
    }),
  deleteScore: (scoreId: string) => request<{ message: string }>(`/scores/${scoreId}`, { method: 'DELETE' }),

  getBooks: () =>
    request<PaginatedResponse<{ id: string; name: string; cover?: string; description?: string; orderNum: number; isActive: boolean; createdAt: string }>>(
      '/books'
    ),

  getStudentWorks: (studentId: string, page = 1, pageSize = 20, term?: Term) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (term) params.append('term', term);
    return request<PaginatedResponse<Work>>(`/students/${studentId}/works?${params}`);
  },
  createWork: (studentId: string, data: { imageUrl: string; description?: string; score: number; term: Term; slotIndex: 1 | 2; galleryScope: 'classroom' | 'school' | 'both'; bookId?: string; thumbnailUrl?: string }) =>
    request<Work>(`/students/${studentId}/works`, {
      method: 'POST',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),
  deleteWork: (workId: string) => request<{ message: string }>(`/works/${workId}`, { method: 'DELETE' }),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return requestRaw<{ url: string; filename: string }>('/upload/image', {
      method: 'POST',
      body: formData,
    });
  },

  getTeachers: (page = 1, pageSize = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.append('search', search);
    return request<PaginatedResponse<Teacher>>(`/teachers?${params}`);
  },
  createTeacher: (data: { name: string; phone: string; password?: string; role?: string }) =>
    request<Teacher>('/teachers', {
      method: 'POST',
      body: JSON.stringify(transformKeysToSnake({ ...data, password: data.password || '123456' })),
    }),
  updateTeacher: (id: string, data: { name?: string; phone?: string; role?: string }) =>
    request<Teacher>(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),
  deleteTeacher: (id: string) => request<{ message: string }>(`/teachers/${id}`, { method: 'DELETE' }),
  resetTeacherPassword: (id: string, newPassword = '123456') =>
    request<{ message: string }>(`/teachers/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword }),
    }),

  getClassrooms: (page = 1, pageSize = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search) params.append('search', search);
    return request<PaginatedResponse<Classroom>>(`/classrooms?${params}`);
  },
  createClassroom: (data: { name: string; gradeYear?: string; description?: string; teacherId?: string }) =>
    request<Classroom>('/classrooms', {
      method: 'POST',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),
  updateClassroom: (id: string, data: { name?: string; gradeYear?: string; description?: string; teacherId?: string }) =>
    request<Classroom>(`/classrooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transformKeysToSnake(data)),
    }),
  deleteClassroom: (id: string) => request<{ message: string }>(`/classrooms/${id}`, { method: 'DELETE' }),
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

  createBook: (data: { name: string; cover?: string; description?: string; orderNum?: number }) =>
    request('/books', { method: 'POST', body: JSON.stringify(transformKeysToSnake(data)) }),
  updateBook: (id: string, data: { name?: string; cover?: string; description?: string; orderNum?: number }) =>
    request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(transformKeysToSnake(data)) }),
  deleteBook: (id: string) => request<{ message: string }>(`/books/${id}`, { method: 'DELETE' }),

  getAuditLogs: (page = 1, pageSize = 20, action?: string, targetType?: string) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (action) params.append('action', action);
    if (targetType) params.append('target_type', targetType);
    return request<PaginatedResponse<{ id: string; teacherId: string; teacherName: string; action: string; targetType: string; targetId?: string; detail?: Record<string, unknown>; createdAt: string }>>(
      `/audit-logs?${params}`
    );
  },
};
