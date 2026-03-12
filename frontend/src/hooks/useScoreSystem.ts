import { useCallback, useState } from 'react';

import { api } from '@/lib/api';
import type { BasicPracticeForm, CompetitionForm, HomeworkForm, ScoreRecord, Student } from '@/types';

export function deriveTitle(record: ScoreRecord): string {
  const label = getScoreTypeLabel(record.scoreType);
  return record.reason ? `${label}: ${record.reason}` : label;
}

export function getScoreTypeLabel(scoreType: string): string {
  const labels: Record<string, string> = {
    practice: '练习册',
    homework: '作业',
    work: '作品',
    competition: '比赛',
  };
  return labels[scoreType] || scoreType;
}

function inferTargetPart(orderNum?: number): 'root' | 'trunk' {
  if (!orderNum) return 'root';
  return orderNum <= 16 ? 'root' : 'trunk';
}

export function useScoreSystem(initialStudent: Student) {
  const [currentStudent, setCurrentStudent] = useState<Student>(initialStudent);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStudent = useCallback(async (studentId: string) => {
    const updated = await api.getStudent(studentId);
    setCurrentStudent(updated);
    return updated;
  }, []);

  const loadRecords = useCallback(async (studentId: string) => {
    const res = await api.getStudentScores(studentId, 1, 100);
    setRecords(res.items);
  }, []);

  const addBasicPracticeScore = useCallback(
    async (form: BasicPracticeForm, bookOrderNum?: number): Promise<boolean> => {
      setIsLoading(true);
      try {
        await api.addPracticeScore(currentStudent.id, {
          score: form.score,
          term: form.term,
          bookId: form.bookId,
          targetPart: inferTargetPart(bookOrderNum),
          reason: form.remark || 'practice',
        });
        await refreshStudent(currentStudent.id);
        await loadRecords(currentStudent.id);
        return true;
      } finally {
        setIsLoading(false);
      }
    },
    [currentStudent.id, loadRecords, refreshStudent]
  );

  const addHomeworkScore = useCallback(
    async (form: HomeworkForm): Promise<boolean> => {
      setIsLoading(true);
      try {
        await api.addHomeworkScore(currentStudent.id, {
          score: form.score,
          term: form.term,
          reason: form.name,
        });
        await refreshStudent(currentStudent.id);
        await loadRecords(currentStudent.id);
        return true;
      } finally {
        setIsLoading(false);
      }
    },
    [currentStudent.id, loadRecords, refreshStudent]
  );

  const addCompetitionScore = useCallback(
    async (form: CompetitionForm): Promise<boolean> => {
      setIsLoading(true);
      try {
        await api.addCompetitionScore(currentStudent.id, form);
        await refreshStudent(currentStudent.id);
        await loadRecords(currentStudent.id);
        return true;
      } finally {
        setIsLoading(false);
      }
    },
    [currentStudent.id, loadRecords, refreshStudent]
  );

  return {
    student: currentStudent,
    records,
    isLoading,
    refreshStudent,
    loadRecords,
    addBasicPracticeScore,
    addHomeworkScore,
    addCompetitionScore,
  };
}
