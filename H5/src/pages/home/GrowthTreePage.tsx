import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sprout, Trophy } from 'lucide-react'

import { api } from '@/lib/api'
import { GROWTH_STAGES, getStageInfo } from '@/lib/constants'
import { getStageProgress, getStageTargetScore } from '@/hooks/useScoreSystem'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import type { LeaderboardEntry } from '@/types'

export function GrowthTreePage() {
  const navigate = useNavigate()
  const student = useAuthStore((state) => state.student)
  const refreshProfile = useAuthStore((state) => state.refreshProfile)
  const [classroomLeaderboard, setClassroomLeaderboard] = useState<LeaderboardEntry[]>([])
  const [schoolLeaderboard, setSchoolLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    void refreshProfile()
    void api.getClassroomLeaderboard(5).then(setClassroomLeaderboard).catch(() => setClassroomLeaderboard([]))
    void api.getSchoolLeaderboard(5).then(setSchoolLeaderboard).catch(() => setSchoolLeaderboard([]))
  }, [refreshProfile])

  const totalScore = student?.totalScore ?? 0
  const stage = student?.stage ?? 'sprout'
  const stageInfo = getStageInfo(stage)
  const progress = getStageProgress(totalScore)
  const targetScore = getStageTargetScore(totalScore)
  const remaining = Math.max(0, targetScore - totalScore)
  const currentStageIndex = GROWTH_STAGES.findIndex((item) => item.key === stage)

  function renderLeaderboard(title: string, entries: LeaderboardEntry[]) {
    return (
      <div className="rounded-card bg-primary-lighter p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
          <Trophy size={16} className="text-primary" />
          {title}
        </div>
        {entries.length === 0 ? (
          <div className="text-xs text-text-tertiary">暂无排名数据</div>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-tag bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center font-number text-sm font-bold text-primary">#{entry.rank}</span>
                  <span className="text-sm font-medium">{entry.name}</span>
                </div>
                <span className="font-number text-sm font-semibold text-text-secondary">{entry.totalScore}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-2">
        <h1 className="text-[22px] font-semibold tracking-tight">成长树</h1>
      </div>

      <div className="px-5 py-1">
        <div className="rounded-card p-3 px-4" style={{ background: 'linear-gradient(180deg, #E6F4EA 0%, #F5FBF7 100%)' }}>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <span className="text-xs text-text-secondary">当前累计总分</span>
              <div className="flex items-baseline gap-1">
                <span className="font-number text-3xl font-semibold text-text-primary">{totalScore}</span>
                <span className="text-xs text-text-tertiary">分</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-text-secondary">下一阶段目标</span>
              <div className="flex items-baseline gap-1">
                <span className="font-number text-xl font-semibold text-text-secondary">{targetScore}</span>
                <span className="text-xs text-text-tertiary">分</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-primary">已完成 {progress}%</span>
              <span className="text-text-tertiary">还差 {remaining} 分</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center px-5">
        <div className="relative h-[260px] w-[335px] overflow-hidden rounded-card">
          <img
            src={stageInfo.image}
            alt={stageInfo.name}
            className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 object-contain"
          />
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-card bg-primary px-4 py-1.5 text-white">
            <Sprout size={14} />
            <span className="text-xs font-medium">{stageInfo.name}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 py-1">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">成长阶段</h3>
            <button onClick={() => navigate('/records')} className="text-xs font-semibold text-primary">
              查看明细
            </button>
          </div>
          <div className="rounded-card bg-primary-lighter p-1">
            {GROWTH_STAGES.map((item, index) => {
              const isCurrent = item.key === stage
              const isPast = index < currentStageIndex
              const isFuture = index > currentStageIndex
              return (
                <div key={item.key} className={cn('flex items-center gap-2.5 rounded-tag px-4 py-2.5', isCurrent && 'bg-primary-light')}>
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      isCurrent ? 'bg-primary text-white' : isPast ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-text-disabled'
                    )}
                  >
                    {isPast ? '✓' : index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm font-medium', isFuture && 'text-text-disabled')}>{item.name}</span>
                      <span className={cn('text-xs', isFuture ? 'text-text-disabled' : 'text-text-tertiary')}>{item.range}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {renderLeaderboard('班级排名', classroomLeaderboard)}
        {renderLeaderboard('学校排名', schoolLeaderboard)}
      </div>
    </div>
  )
}
