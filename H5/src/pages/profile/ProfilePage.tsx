import { useEffect, type ElementType } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Lock, MessageCircle, Settings, UserPen } from 'lucide-react'

import { CONTACT_CHANNELS, getStageInfo } from '@/lib/constants'
import { formatDate } from '@/lib/student'
import { useAuthStore } from '@/stores/auth'

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ElementType
  label: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5">
      <Icon size={20} className="text-primary" />
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      <ChevronRight size={18} className="text-[#CCCCCC]" />
    </button>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const student = useAuthStore((state) => state.student)
  const refreshProfile = useAuthStore((state) => state.refreshProfile)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  const stageInfo = getStageInfo(student?.stage ?? 'sprout')
  const phone = student?.phone ? student.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '--'

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-5 py-3">
        <h1 className="text-[22px] font-semibold tracking-tight">个人中心</h1>
        <button
          onClick={() => navigate('/settings/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
        >
          <Settings size={18} className="text-text-secondary" />
        </button>
      </div>

      <div className="px-5 py-3">
        <div className="mb-4 flex items-center gap-3.5">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-primary-light text-2xl">
            {student?.avatar ? <img src={student.avatar} alt={student.name} className="h-full w-full object-cover" /> : '学'}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-text-primary">{student?.name || '学生'}</h2>
            <p className="mt-0.5 text-xs text-text-tertiary">{phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[14px] bg-primary-lighter p-3.5">
            <div className="font-number text-xl font-bold text-primary">{student?.totalScore ?? 0}</div>
            <div className="text-[11px] text-text-tertiary">累计总分</div>
          </div>
          <div className="rounded-[14px] bg-primary-lighter p-3.5">
            <div className="text-sm font-bold text-primary">{stageInfo.name}</div>
            <div className="text-[11px] text-text-tertiary">成长阶段</div>
          </div>
          <div className="rounded-[14px] bg-white p-3.5 shadow-sm">
            <div className="text-sm font-semibold text-text-primary">年级</div>
            <div className="mt-1 text-xs text-text-tertiary">{student?.grade || '--'}</div>
          </div>
          <div className="rounded-[14px] bg-white p-3.5 shadow-sm">
            <div className="text-sm font-semibold text-text-primary">性别</div>
            <div className="mt-1 text-xs text-text-tertiary">{student?.gender || '--'}</div>
          </div>
          <div className="rounded-[14px] bg-white p-3.5 shadow-sm">
            <div className="text-sm font-semibold text-text-primary">生日</div>
            <div className="mt-1 text-xs text-text-tertiary">{formatDate(student?.birthday)}</div>
          </div>
          <div className="rounded-[14px] bg-white p-3.5 shadow-sm">
            <div className="text-sm font-semibold text-text-primary">学校</div>
            <div className="mt-1 text-xs text-text-tertiary">{student?.school || '--'}</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-2">
        <div className="rounded-[14px] bg-primary-lighter p-4">
          <div className="text-sm font-semibold text-text-primary">联系我们</div>
          <div className="mt-2 text-xs leading-6 text-text-secondary">
            <div>客服电话：{CONTACT_CHANNELS.servicePhone}</div>
            <div>微信号：{CONTACT_CHANNELS.wechat}</div>
            <div>{CONTACT_CHANNELS.serviceHours}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-2">
        <div className="rounded-[14px] bg-primary-lighter">
          <MenuItem icon={UserPen} label="修改个人信息" onClick={() => navigate('/settings/profile')} />
        </div>
        <div className="rounded-[14px] bg-primary-lighter">
          <MenuItem icon={Lock} label="修改登录密码" onClick={() => navigate('/settings/password')} />
          <MenuItem icon={MessageCircle} label="联系我们" onClick={() => navigate('/settings/contact')} />
        </div>
      </div>

      <div className="px-5 py-4">
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="h-11 w-full rounded-input border border-border text-sm font-medium text-text-tertiary"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}
