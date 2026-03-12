export type GrowthStage =
  | 'sprout'
  | 'seedling'
  | 'small'
  | 'medium'
  | 'large'
  | 'xlarge'
  | 'fruitful'

export type ScoreType = 'practice' | 'homework' | 'work' | 'competition'
export type Term = 'spring' | 'summer' | 'autumn'

export interface Student {
  id: string
  name: string
  avatar?: string
  phone: string
  address?: string
  school?: string
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
}

export interface Book {
  id: string
  name: string
  cover?: string
  description?: string
  orderNum: number
  isActive?: boolean
  createdAt?: string
}

export interface ScoreRecord {
  id: string
  studentId: string
  teacherId: string
  scoreType: ScoreType
  score: number
  rawScore?: number
  multiplier?: number
  term?: Term
  targetPart?: 'root' | 'trunk'
  bookId?: string
  workId?: string
  reason?: string
  title?: string
  teacherName?: string
  createdAt: string
}

export interface Work {
  id: string
  studentId: string
  teacherId: string
  term: Term
  slotIndex: 1 | 2
  galleryScope: 'classroom' | 'school' | 'both'
  imageUrl: string
  thumbnailUrl?: string
  description?: string
  score: number
  bookName?: string
  teacherComment?: string
  teacherName?: string
  rating?: number
  tags?: string[]
  isActive: boolean
  createdAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page?: number
  pageSize?: number
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  student?: Student
}

export interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  totalScore: number
  stage: GrowthStage
  avatar?: string
  classroomId?: string
}
