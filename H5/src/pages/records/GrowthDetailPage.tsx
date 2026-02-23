import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useStudentStore } from '@/stores/student'
import { cn } from '@/lib/utils'
import { SCORE_TYPE_COLORS } from '@/lib/constants'
import { deriveTitle, getScoreTypeLabel } from '@/hooks/useScoreSystem'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'basic', label: '基础练习' },
  { key: 'homework', label: '优秀作业' },
  { key: 'competition', label: '比赛获奖' },
]

export function GrowthDetailPage() {
  const student = useAuthStore(s => s.student)
  const { records, recordsLoading, fetchRecords } = useStudentStore()
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => { fetchRecords(activeTab) }, [activeTab, fetchRecords])

  const totalScore = student?.totalScore ?? 0

  return (
    <div className="flex flex-col h-full">
      {/* 状态栏 */}
      <div className="h-11 flex items-center justify-between px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>

      {/* 页面标题 */}
      <div className="flex items-center justify-between px-5 py-3">
        <h1 className="text-[22px] font-semibold tracking-tight">成长明细</h1>
        <div className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-card">
          总计 {totalScore}分
        </div>
      </div>

      {/* Tab 栏 */}
      <div className="flex px-5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 py-2.5 text-[13px] tracking-wider text-center',
              activeTab === tab.key
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-text-disabled font-medium'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 记录列表 */}
      <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-2.5">
        {recordsLoading && records.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <span className="text-4xl">📝</span>
            <span className="text-sm text-text-tertiary">暂无记录</span>
          </div>
        ) : (
          records.map(record => {
            const colors = SCORE_TYPE_COLORS[record.scoreType] || SCORE_TYPE_COLORS.basic
            return (
              <div key={record.id} className={cn('flex items-center gap-3 rounded-input p-3.5', colors.bg)}>
                <div className={cn('w-1 self-stretch rounded-sm', colors.accent)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded text-white', colors.accent)}>
                      {getScoreTypeLabel(record.scoreType)}
                    </span>
                    <span className="text-sm font-semibold text-text-primary truncate">
                      {deriveTitle(record)}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-tertiary">
                    {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <span className={cn('font-score text-xl font-semibold shrink-0', colors.text)}>
                  +{record.score}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
