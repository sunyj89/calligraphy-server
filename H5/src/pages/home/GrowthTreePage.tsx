import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { GROWTH_STAGES, getStageInfo } from '@/lib/constants'
import { getStageProgress, getStageTargetScore } from '@/hooks/useScoreSystem'
import { cn } from '@/lib/utils'
import { Sprout } from 'lucide-react'

export function GrowthTreePage() {
  const navigate = useNavigate()
  const student = useAuthStore(s => s.student)
  const refreshProfile = useAuthStore(s => s.refreshProfile)

  useEffect(() => { refreshProfile() }, [refreshProfile])

  const totalScore = student?.totalScore ?? 800
  const stage = student?.stage ?? 'sprout'
  const stageInfo = getStageInfo(stage)
  const progress = getStageProgress(totalScore)
  const targetScore = getStageTargetScore(totalScore)
  const remaining = Math.max(0, targetScore - totalScore)
  const currentStageIndex = GROWTH_STAGES.findIndex(s => s.key === stage)

  return (
    <div className="flex flex-col">
      {/* 状态栏 */}
      <div className="h-11 flex items-center justify-between px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>

      {/* 顶部标题 */}
      <div className="flex items-center justify-between px-5 py-2">
        <h1 className="text-[22px] font-semibold tracking-tight">书法成长树</h1>
      </div>

      {/* 积分卡片 */}
      <div className="px-5 py-1">
        <div className="rounded-card p-3 px-4" style={{ background: 'linear-gradient(180deg, #E6F4EA 0%, #F5FBF7 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs text-text-secondary">当前积分</span>
              <div className="flex items-baseline gap-1">
                <span className="font-number font-semibold text-3xl text-text-primary">{totalScore}</span>
                <span className="text-xs text-text-tertiary">分</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-text-secondary">目标积分</span>
              <div className="flex items-baseline gap-1">
                <span className="font-number font-semibold text-xl text-text-secondary">{targetScore}</span>
                <span className="text-xs text-text-tertiary">分</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-primary font-medium">已完成 {progress}%</span>
              <span className="text-text-tertiary">还差 {remaining} 分</span>
            </div>
          </div>
        </div>
      </div>

      {/* 成长树图片 */}
      <div className="flex flex-col items-center px-5">
        <div className="relative w-[335px] h-[260px] rounded-card overflow-hidden">
          <img
            src={stageInfo.image}
            alt={stageInfo.name}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] object-contain"
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1.5 rounded-card flex items-center gap-1.5">
            <Sprout size={14} />
            <span className="text-xs font-medium">{stageInfo.name}</span>
          </div>
        </div>
      </div>

      {/* 成长阶段 */}
      <div className="px-5 py-1 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-text-primary">成长阶段</h3>
          <button onClick={() => navigate('/records')} className="text-xs text-primary font-semibold">
            查看明细 →
          </button>
        </div>
        <div className="rounded-card bg-primary-lighter p-1">
          {GROWTH_STAGES.map((s, index) => {
            const isCurrent = s.key === stage
            const isPast = index < currentStageIndex
            const isFuture = index > currentStageIndex
            return (
              <div key={s.key} className={cn('flex items-center gap-2.5 px-4 py-2.5 rounded-tag', isCurrent && 'bg-primary-light')}>
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                  isCurrent ? 'bg-primary text-white' : isPast ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-text-disabled'
                )}>
                  {isPast ? '✓' : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-medium', isFuture && 'text-text-disabled')}>{s.name}</span>
                    <span className={cn('text-xs', isFuture ? 'text-text-disabled' : 'text-text-tertiary')}>{s.range}</span>
                    {isCurrent && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-medium">进行中</span>}
                    {isPast && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">已完成</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
