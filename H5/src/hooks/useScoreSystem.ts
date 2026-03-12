import { GROWTH_STAGES } from '@/lib/constants'
import type { GrowthStage, ScoreRecord } from '@/types'

export function calculateStage(totalScore: number): GrowthStage {
  for (let index = GROWTH_STAGES.length - 1; index >= 0; index -= 1) {
    if (totalScore >= GROWTH_STAGES[index].minScore) {
      return GROWTH_STAGES[index].key
    }
  }
  return 'sprout'
}

export function checkIsSenior(score: number): boolean {
  return score >= 4500
}

export function getStageTargetScore(totalScore: number): number {
  for (const stage of GROWTH_STAGES) {
    if (totalScore <= stage.maxScore) {
      return stage.maxScore === Infinity ? 10000 : stage.maxScore + 1
    }
  }
  return 10000
}

export function getStageProgress(totalScore: number): number {
  for (const stage of GROWTH_STAGES) {
    if (totalScore <= stage.maxScore) {
      const range = stage.maxScore === Infinity ? 1000 : stage.maxScore - stage.minScore + 1
      const progress = totalScore - stage.minScore
      return Math.min(100, Math.round((progress / range) * 100))
    }
  }
  return 100
}

export function deriveTitle(record: ScoreRecord): string {
  if (record.title) return record.title
  if (record.reason) return record.reason
  if (record.scoreType === 'practice') {
    return record.targetPart === 'trunk' ? '练习册树干积分' : '练习册树根积分'
  }
  if (record.scoreType === 'work') return '作品评分'
  return `${getScoreTypeLabel(record.scoreType)}积分`
}

export function getScoreTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    practice: '练习册',
    work: '作品',
    root: '树根',
    trunk: '树干',
    leaf: '作业',
    fruit: '比赛',
    basic: '练习册',
    homework: '作业',
    competition: '比赛',
    adjustment: '调整',
  }
  return labels[type] || '其他'
}
