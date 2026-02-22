// 学员成长阶段
export type GrowthStage = 'sprout' | 'seedling' | 'small' | 'medium' | 'large' | 'xlarge' | 'fruitful';

// 积分记录类型（含后端返回的 root/trunk/leaf/fruit）
export type ScoreType = 'basic' | 'homework' | 'competition' | 'adjustment' | 'root' | 'trunk' | 'leaf' | 'fruit';

// 练习册分类
export type BookCategory = 'root' | 'trunk';

// 学员接口
export interface Student {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  address: string;
  school: string;
  grade: string;
  totalScore: number;
  rootScore: number;
  trunkScore: number;
  leafCount: number;
  fruitCount: number;
  stage: GrowthStage;
  isSenior: boolean;
  classroomId?: string;
  createdAt: string;
  updatedAt?: string;
  lastActive?: string;
}

// 练习册得分等级
export interface BookScores {
  level5: boolean;
  level20: boolean;
  level50: boolean;
}

// 练习册接口（前端 UI 用）
export interface Book {
  id: string;
  name: string;
  category: BookCategory;
  maxScore: number;
  scores: BookScores;
  completedAt?: string;
  currentScore: number;
  orderNum: number;
}

// 积分记录接口
export interface ScoreRecord {
  id: string;
  studentId: string;
  teacherId: string;
  scoreType: ScoreType;
  score: number;
  reason?: string;
  createdAt: string;
  // 前端推导字段
  title?: string;
  teacherName?: string;
}

// 教师接口
export interface Teacher {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'teacher';
  passwordChangedAt?: string;
  createdAt?: string;
}

// 积分操作表单数据
export interface BasicPracticeForm {
  bookId: string;
  score: 5 | 20 | 50;
  remark: string;
}

export interface HomeworkForm {
  name: string;
  score: number;
}

export interface CompetitionForm {
  name: string;
  score: number;
}

export interface AdjustmentForm {
  type: string;
  score: number;
  reason: string;
}

// 成长树节点
export interface TreeNode {
  id: string;
  type: 'root' | 'trunk' | 'leaf' | 'fruit';
  name: string;
  score: number;
  x: number;
  y: number;
  completed: boolean;
}

// 统计信息
export interface Statistics {
  totalStudents: number;
  newToday?: number;
  activeStudents?: number;
  seniorStudents: number;
}

// 作品接口
export interface Work {
  id: string;
  studentId: string;
  bookId?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

// 班级接口
export interface Classroom {
  id: string;
  name: string;
  gradeYear?: string;
  description?: string;
  teacherId: string;
  isActive: boolean;
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 仪表盘概览统计
export interface OverviewStatistics {
  totalStudents: number;
  seniorStudents: number;
  totalTeachers: number;
  totalClassrooms: number;
  activeThisWeek: number;
  stageDistribution: Record<string, number>;
  scoreTrend: { date: string; count: number; totalScore: number }[];
}

// 排行榜条目
export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  totalScore: number;
  stage: GrowthStage;
  isSenior: boolean;
  classroomId?: string;
}
