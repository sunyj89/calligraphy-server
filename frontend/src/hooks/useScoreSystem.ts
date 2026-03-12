import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Student, ScoreRecord, BasicPracticeForm, HomeworkForm, CompetitionForm, AdjustmentForm } from '@/types';

// 资深学员阈值
const SENIOR_THRESHOLD = 4500;

// 作业翻倍系数
const HOMEWORK_MULTIPLIER = 2;

// 计算学员阶段
export function calculateStage(totalScore: number): Student['stage'] {
  if (totalScore >= 9000) return 'fruitful';
  if (totalScore >= 7500) return 'xlarge';
  if (totalScore >= 6000) return 'large';
  if (totalScore >= 4500) return 'medium';
  if (totalScore >= 3000) return 'small';
  if (totalScore >= 1500) return 'seedling';
  return 'sprout';
}

// 检查是否为资深学员
export function checkIsSenior(rootScore: number, trunkScore: number): boolean {
  return (rootScore + trunkScore) >= SENIOR_THRESHOLD;
}

// 计算实际得分
export function calculateActualScore(
  rawScore: number,
  type: string,
  isSenior: boolean
): number {
  if (type === 'homework' && isSenior) {
    return rawScore * HOMEWORK_MULTIPLIER;
  }
  return rawScore;
}

// 从 scoreType + reason 推导显示标题
export function deriveTitle(record: ScoreRecord): string {
  if (record.title) return record.title;
  const typeLabels: Record<string, string> = {
    basic: '基础练习',
    homework: '作业',
    competition: '获奖',
    adjustment: '调整',
    root: '笔画',
    trunk: '结构',
    leaf: '作业',
    fruit: '比赛',
  };
  const label = typeLabels[record.scoreType] || record.scoreType;
  return record.reason ? `【${label}】${record.reason}` : `【${label}】`;
}

export function useScoreSystem(initialStudent: Student) {
  const [currentStudent, setCurrentStudent] = useState<Student>(initialStudent);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 刷新学生数据
  const refreshStudent = useCallback(async (studentId: string) => {
    const updated = await api.getStudent(studentId);
    setCurrentStudent(updated);
    return updated;
  }, []);

  // 加载积分记录
  const loadRecords = useCallback(async (studentId: string) => {
    const res = await api.getStudentScores(studentId, 1, 100);
    setRecords(res.items);
  }, []);

  // 添加基础练习分数
  const addBasicPracticeScore = useCallback(async (form: BasicPracticeForm): Promise<boolean> => {
    setIsLoading(true);
    try {
      const reason = form.remark || `第${form.bookId}册 ${form.score}分`;
      await api.addScore(currentStudent.id, 'basic', form.score, reason);
      await refreshStudent(currentStudent.id);
      await loadRecords(currentStudent.id);
      return true;
    } catch (err) {
      console.error('添加基础练习分数失败:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentStudent.id, refreshStudent, loadRecords]);

  // 添加日常作业分数
  const addHomeworkScore = useCallback(async (form: HomeworkForm): Promise<boolean> => {
    setIsLoading(true);
    try {
      await api.addScore(currentStudent.id, 'homework', form.score, form.name);
      await refreshStudent(currentStudent.id);
      await loadRecords(currentStudent.id);
      return true;
    } catch (err) {
      console.error('添加作业分数失败:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentStudent.id, refreshStudent, loadRecords]);

  // 添加比赛作品分数
  const addCompetitionScore = useCallback(async (form: CompetitionForm): Promise<boolean> => {
    setIsLoading(true);
    try {
      await api.addScore(currentStudent.id, 'competition', form.score, form.name);
      await refreshStudent(currentStudent.id);
      await loadRecords(currentStudent.id);
      return true;
    } catch (err) {
      console.error('添加比赛分数失败:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentStudent.id, refreshStudent, loadRecords]);

  // 添加积分调整
  const addAdjustment = useCallback(async (form: AdjustmentForm): Promise<boolean> => {
    setIsLoading(true);
    try {
      const reason = `${form.type}: ${form.reason}`;
      await api.addScore(currentStudent.id, 'adjustment', form.score, reason);
      await refreshStudent(currentStudent.id);
      await loadRecords(currentStudent.id);
      return true;
    } catch (err) {
      console.error('添加积分调整失败:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentStudent.id, refreshStudent, loadRecords]);

  return {
    student: currentStudent,
    records,
    isLoading,
    refreshStudent,
    loadRecords,
    addBasicPracticeScore,
    addHomeworkScore,
    addCompetitionScore,
    addAdjustment,
  };
}
