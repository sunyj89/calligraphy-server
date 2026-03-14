import { useEffect, useState } from 'react'

import { getScoreTypeLabel } from '@/hooks/useScoreSystem'
import { SCORE_TYPE_COLORS } from '@/lib/constants'
import { formatDate, getBookName, getScoreRecordTitle, TARGET_PART_LABELS, TERM_LABELS } from '@/lib/student'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { useStudentStore } from '@/stores/student'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'practice', label: '练习册' },
  { key: 'homework', label: '作业' },
  { key: 'work', label: '作品' },
  { key: 'competition', label: '比赛' },
] as const

export function GrowthDetailPage() {
  const student = useAuthStore((state) => state.student)
  const { books, records, recordsLoading, fetchBooks, fetchRecords } = useStudentStore()
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('all')

  useEffect(() => {
    void fetchBooks()
  }, [fetchBooks])

  useEffect(() => {
    void fetchRecords(activeTab)
  }, [activeTab, fetchRecords])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-3">
        <h1 className="text-[22px] font-semibold tracking-tight">成长明细</h1>
        <div className="rounded-card bg-primary px-3 py-1.5 text-xs font-bold text-white">总分 {student?.totalScore ?? 0}</div>
      </div>

      <div className="flex px-5">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 border-b py-2.5 text-center text-[13px]',
              activeTab === tab.key ? 'border-primary font-bold text-primary' : 'border-transparent text-text-disabled'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3">
        {recordsLoading && records.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center text-sm text-text-tertiary">当前分类下还没有成长记录</div>
        ) : (
          <div className="space-y-2.5">
            {records.map((record) => {
              const colors = SCORE_TYPE_COLORS[record.scoreType] || SCORE_TYPE_COLORS.practice
              const bookName = getBookName(books, record.bookId)
              const title = getScoreRecordTitle(record, books)

              return (
                <div key={record.id} className={cn('flex items-center gap-3 rounded-input p-3.5', colors.bg)}>
                  <div className={cn('w-1 self-stretch rounded-sm', colors.accent)} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold text-white', colors.accent)}>
                        {getScoreTypeLabel(record.scoreType)}
                      </span>
                      <span className="truncate text-sm font-semibold text-text-primary">{title}</span>
                    </div>
                    <div className="space-y-0.5 text-[11px] text-text-tertiary">
                      <div>{formatDate(record.createdAt)}</div>
                      <div>
                        原始分 {record.rawScore ?? record.score}
                        {record.multiplier && record.multiplier > 1 ? ` · 倍率 x${record.multiplier}` : ''}
                        {record.term ? ` · ${TERM_LABELS[record.term]}` : ''}
                      </div>
                      {(record.targetPart || bookName || record.workId) && (
                        <div>
                          {record.targetPart ? `部位 ${TARGET_PART_LABELS[record.targetPart]}` : ''}
                          {bookName ? `${record.targetPart ? ' · ' : ''}练习册 ${bookName}` : ''}
                          {record.workId ? `${record.targetPart || bookName ? ' · ' : ''}作品记录` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={cn('shrink-0 font-score text-xl font-semibold', colors.text)}>+{record.score}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
