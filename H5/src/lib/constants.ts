import type { GrowthStage } from '@/types'

export const GROWTH_STAGES: {
  key: GrowthStage
  name: string
  range: string
  minScore: number
  maxScore: number
  image: string
}[] = [
  { key: 'sprout', name: '萌芽宝宝', range: '0-1499', minScore: 0, maxScore: 1499, image: `${import.meta.env.BASE_URL}images/tree/stage1-sprout.webp` },
  { key: 'seedling', name: '努力伸展', range: '1500-2999', minScore: 1500, maxScore: 2999, image: `${import.meta.env.BASE_URL}images/tree/stage2-growing.webp` },
  { key: 'small', name: '撑起小伞', range: '3000-4499', minScore: 3000, maxScore: 4499, image: `${import.meta.env.BASE_URL}images/tree/stage3-umbrella.webp` },
  { key: 'medium', name: '有模有样', range: '4500-5999', minScore: 4500, maxScore: 5999, image: `${import.meta.env.BASE_URL}images/tree/stage4-shaped.webp` },
  { key: 'large', name: '披上绿装', range: '6000-7499', minScore: 6000, maxScore: 7499, image: `${import.meta.env.BASE_URL}images/tree/stage5-green.webp` },
  { key: 'xlarge', name: '绿意满满', range: '7500-8999', minScore: 7500, maxScore: 8999, image: `${import.meta.env.BASE_URL}images/tree/stage6-lush.webp` },
  { key: 'fruitful', name: '硕果累累', range: '9000+', minScore: 9000, maxScore: Infinity, image: `${import.meta.env.BASE_URL}images/tree/stage7-fruit.webp` },
]

export const SCORE_TYPE_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  practice: { bg: 'bg-primary-lighter', text: 'text-primary', accent: 'bg-primary' },
  basic: { bg: 'bg-primary-lighter', text: 'text-primary', accent: 'bg-primary' },
  root: { bg: 'bg-primary-lighter', text: 'text-primary', accent: 'bg-primary' },
  trunk: { bg: 'bg-primary-lighter', text: 'text-primary', accent: 'bg-primary' },
  homework: { bg: 'bg-homework-light', text: 'text-homework', accent: 'bg-homework' },
  leaf: { bg: 'bg-homework-light', text: 'text-homework', accent: 'bg-homework' },
  work: { bg: 'bg-amber-50', text: 'text-amber-700', accent: 'bg-amber-500' },
  competition: { bg: 'bg-competition-light', text: 'text-competition', accent: 'bg-competition' },
  fruit: { bg: 'bg-competition-light', text: 'text-competition', accent: 'bg-competition' },
}

export const SCORE_TYPE_LABELS: Record<string, string> = {
  practice: '练习册',
  basic: '练习册',
  homework: '作业',
  work: '作品',
  competition: '比赛',
  adjustment: '调整',
  root: '树根',
  trunk: '树干',
  leaf: '作业',
  fruit: '比赛',
}

export function getStageInfo(stage: GrowthStage) {
  return GROWTH_STAGES.find((item) => item.key === stage) || GROWTH_STAGES[0]
}

export function getStageIndex(stage: GrowthStage): number {
  return GROWTH_STAGES.findIndex((item) => item.key === stage)
}
