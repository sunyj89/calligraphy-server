import type { Book, LeaderboardEntry, ScoreRecord, Term, Work } from '@/types'

export const TERM_LABELS: Record<Term, string> = {
  spring: '春季',
  summer: '夏季',
  autumn: '秋季',
}

export const TARGET_PART_LABELS = {
  root: '树根',
  trunk: '树干',
} as const

export const GALLERY_SCOPE_LABELS = {
  classroom: '班级展示',
  school: '学校展示',
  both: '班级/学校展示',
} as const

export function formatDate(value?: string) {
  if (!value) return '--'
  return new Date(value).toLocaleDateString('zh-CN')
}

export function findStudentRank(entries: LeaderboardEntry[], studentId?: string | null) {
  if (!studentId) return null
  return entries.find((entry) => entry.id === studentId)?.rank ?? null
}

export function getBookName(books: Book[], bookId?: string) {
  if (!bookId) return ''
  return books.find((book) => book.id === bookId)?.name ?? ''
}

export function getBookProgress(book: Book) {
  const lit = typeof book.isLit === 'boolean' ? book.isLit : null
  const litScore = typeof book.litScore === 'number' ? book.litScore : null

  return {
    lit,
    litScore,
  }
}

export function getScoreRecordTitle(record: ScoreRecord, books: Book[]) {
  if (record.scoreType === 'practice') {
    const bookName = getBookName(books, record.bookId)
    const targetPart = record.targetPart ? TARGET_PART_LABELS[record.targetPart] : ''
    return [bookName || '练习册', targetPart].filter(Boolean).join(' ')
  }

  if (record.scoreType === 'work') {
    const slotMatch = record.reason?.match(/^slot:(\d+)$/)
    return slotMatch ? `作品槽位 ${slotMatch[1]}` : '作品评分'
  }

  if (record.reason?.trim()) {
    return record.reason
  }

  if (record.scoreType === 'homework') return '作业积分'
  if (record.scoreType === 'competition') return '比赛积分'

  return '成长记录'
}

export function getWorkDisplayTitle(work: Work, books: Book[]) {
  return work.description || getBookName(books, work.bookId) || `作品槽位 ${work.slotIndex}`
}
