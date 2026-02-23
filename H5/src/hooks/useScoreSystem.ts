import { GROWTH_STAGES } from '@/lib/constants'
import type { GrowthStage, ScoreRecord } from '@/types'

// 根据总积分计算当前阶段
export function calculateStage(totalScore: number): GrowthStage {
  for (let i = GROWTH_STAGES.length - 1; i >= 0; i--) {
    if (totalScore >= GROWTH_STAGES[i].minScore) {
      return GROWTH_STAGES[i].key
    }
  }
  return 'sprout'
}

// 判断是否为高年级学员
export function checkIsSenior(score: number): boolean {
  return score >= 4500
}

// 获取阶段目标分数（下一个阶段的最低分）
export function getStageTargetScore(totalScore: number): number {
  for (const stage of GROWTH_STAGES) {
    if (totalScore <= stage.maxScore) {
      return stage.maxScore === Infinity ? 10000 : stage.maxScore + 1
    }
  }
  return 10000
}

// 获取阶段进度百分比（在当前阶段内）
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

// 根据积分记录生成标题
export function deriveTitle(record: ScoreRecord): string {
  if (record.title) return record.title
  if (record.reason) return record.reason
  return getScoreTypeLabel(record.scoreType) + '积分'
}

// 获取积分类型标签
export function getScoreTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    root: '笔画练习',
    trunk: '结构练习',
    leaf: '优秀作业',
    fruit: '比赛获奖',
    basic: '基础练习',
    homework: '优秀作业',
    competition: '比赛获奖',
    adjustment: '积分调整',
  }
  return labels[type] || '其他'
}
