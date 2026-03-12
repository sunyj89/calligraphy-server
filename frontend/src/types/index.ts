export type GrowthStage =
  | 'sprout'
  | 'seedling'
  | 'small'
  | 'medium'
  | 'large'
  | 'xlarge'
  | 'fruitful';

export type ScoreType = 'practice' | 'homework' | 'work' | 'competition';
export type Term = 'spring' | 'summer' | 'autumn';
export type PracticeTarget = 'root' | 'trunk';

export interface Student {
  id: string;
  name: string;
  avatar?: string;
  phone: string;
  address?: string;
  school?: string;
  grade: string;
  gender: string;
  birthday?: string;
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
}

export interface ScoreRecord {
  id: string;
  studentId: string;
  teacherId: string;
  scoreType: ScoreType;
  score: number;
  rawScore?: number;
  multiplier?: number;
  term?: Term;
  targetPart?: PracticeTarget;
  bookId?: string;
  workId?: string;
  reason?: string;
  createdAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'teacher';
  passwordChangedAt?: string;
  createdAt?: string;
}

export interface TeacherSummary {
  id: string;
  name: string;
  phone: string;
}

export interface BasicPracticeForm {
  bookId: string;
  score: 5 | 20 | 50 | 70;
  remark: string;
  term: Term;
}

export interface HomeworkForm {
  name: string;
  score: number;
  term: Term;
}

export interface CompetitionForm {
  name: string;
  score: number;
  term: Term;
}

export interface Work {
  id: string;
  studentId: string;
  teacherId: string;
  term: Term;
  slotIndex: 1 | 2;
  galleryScope: 'classroom' | 'school' | 'both';
  imageUrl: string;
  thumbnailUrl?: string;
  description?: string;
  score: number;
  isActive: boolean;
  createdAt: string;
}

export interface Statistics {
  totalStudents: number;
  seniorStudents: number;
  newToday?: number;
  activeStudents?: number;
}

export interface Classroom {
  id: string;
  name: string;
  gradeYear?: string;
  description?: string;
  teacherId: string;
  teacher?: TeacherSummary;
  isActive: boolean;
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OverviewStatistics {
  totalStudents: number;
  seniorStudents: number;
  totalTeachers: number;
  totalClassrooms: number;
  activeThisWeek: number;
  stageDistribution: Record<string, number>;
  scoreTrend: { date: string; count: number; totalScore: number }[];
}

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
