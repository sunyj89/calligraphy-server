// 学员成长阶段
export type GrowthStage = 'sprout' | 'seedling' | 'small' | 'medium' | 'large' | 'xlarge' | 'fruitful'

// 积分记录类型
export type ScoreType = 'basic' | 'homework' | 'competition' | 'adjustment' | 'root' | 'trunk' | 'leaf' | 'fruit'

// 学员接口
export interface Student {
  id: string
  name: string
  avatar: string
  phone: string
  address: string
  school: string
  grade: string
  gender?: string
  birthday?: string
  totalScore: number
  rootScore: number
  trunkScore: number
  leafCount: number
  fruitCount: number
  stage: GrowthStage
  isSenior: boolean
  classroomId?: string
  createdAt: string
  updatedAt?: string
  lastActive?: string
}

// 练习册接口
export interface Book {
  id: string
  name: string
  cover?: string
  description?: string
  orderNum: number
  isActive: boolean
  createdAt: string
}

// 积分记录接口
export interface ScoreRecord {
  id: string
  studentId: string
  teacherId: string
  scoreType: ScoreType
  score: number
  reason?: string
  createdAt: string
  title?: string
  teacherName?: string
}

// 作品接口
export interface Work {
  id: string
  studentId: string
  bookId?: string
  imageUrl: string
  thumbnailUrl?: string
  description?: string
  isActive: boolean
  createdAt: string
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page?: number
  pageSize?: number
}

// 登录响应
export interface LoginResponse {
  accessToken: string
  tokenType: string
  student?: Student
}
