import type { GrowthStage } from '@/types'

// 成长阶段定义
export const GROWTH_STAGES: {
  key: GrowthStage
  name: string
  range: string
  minScore: number
  maxScore: number
  image: string
}[] = [
  { key: 'sprout', name: '萌芽宝宝', range: '0-1499', minScore: 0, maxScore: 1499, image: '/images/tree/stage1-sprout.png' },
  { key: 'seedling', name: '努力伸腰', range: '1500-2999', minScore: 1500, maxScore: 2999, image: '/images/tree/stage2-growing.png' },
  { key: 'small', name: '撑起小伞', range: '3000-4499', minScore: 3000, maxScore: 4499, image: '/images/tree/stage3-umbrella.png' },
  { key: 'medium', name: '有模有样', range: '4500-5999', minScore: 4500, maxScore: 5999, image: '/images/tree/stage4-shaped.png' },
  { key: 'large', name: '披上绿袍', range: '6000-7499', minScore: 6000, maxScore: 7499, image: '/images/tree/stage5-green.png' },
  { key: 'xlarge', name: '绿意满满', range: '7500-8999', minScore: 7500, maxScore: 8999, image: '/images/tree/stage6-lush.png' },
  { key: 'fruitful', name: '硕果累累', range: '9000+', minScore: 9000, maxScore: Infinity, image: '/images/tree/stage7-fruit.png' },
]

// 积分类型颜色映射
export const SCORE_TYPE_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  basic: { bg: 'bg-primary-lighter', text: 'text-primary', accent: 'bg-primary' },
  root: { bg: 'bg-primary-lighter', text: 'text-primary', accent: 'bg-primary' },
  trunk: { bg: 'bg-primary-lighter', text: 'text-primary', accent: 'bg-primary' },
  homework: { bg: 'bg-homework-light', text: 'text-homework', accent: 'bg-homework' },
  leaf: { bg: 'bg-homework-light', text: 'text-homework', accent: 'bg-homework' },
  competition: { bg: 'bg-competition-light', text: 'text-competition', accent: 'bg-competition' },
  fruit: { bg: 'bg-competition-light', text: 'text-competition', accent: 'bg-competition' },
}

// 积分类型标签
export const SCORE_TYPE_LABELS: Record<string, string> = {
  basic: '练习',
  homework: '作业',
  competition: '获奖',
  adjustment: '调整',
  root: '笔画',
  trunk: '结构',
  leaf: '作业',
  fruit: '比赛',
}

// 获取阶段信息
export function getStageInfo(stage: GrowthStage) {
  return GROWTH_STAGES.find(s => s.key === stage) || GROWTH_STAGES[0]
}

// 获取阶段索引（0-based）
export function getStageIndex(stage: GrowthStage): number {
  return GROWTH_STAGES.findIndex(s => s.key === stage)
}
