import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Settings, UserPen, ShieldCheck, Lock, MessageCircle, ChevronRight } from 'lucide-react'
import { getStageInfo } from '@/lib/constants'

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 px-4 py-3.5 w-full">
      <Icon size={20} className="text-primary" />
      <span className="flex-1 text-sm font-medium text-left">{label}</span>
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
    refreshProfile()
  }, [refreshProfile])

  const stageInfo = getStageInfo(student?.stage ?? 'sprout')
  const phone = student?.phone ? student.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''
  const avatarText = student?.name?.slice(0, 1) || '学'

  return (
    <div className="flex flex-col">
      <div className="h-11 flex items-center justify-between px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>

      <div className="flex items-center justify-between px-5 py-2">
        <h1 className="text-[22px] font-semibold tracking-tight">我的</h1>
        <button
          onClick={() => navigate('/settings/profile')}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center"
        >
          <Settings size={18} className="text-text-secondary" />
        </button>
      </div>

      <div className="px-5 py-3">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary-light border-2 border-primary flex items-center justify-center text-2xl font-semibold text-primary">
            {avatarText}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold">{student?.name || '小书法家'}</h2>
            <p className="text-xs text-text-tertiary mt-0.5">{phone || '未绑定手机号'}</p>
          </div>
        </div>

        <div className="flex items-center justify-around bg-primary-lighter rounded-[14px] py-3.5">
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-number font-bold text-xl text-primary">{student?.totalScore ?? 0}</span>
            <span className="text-[11px] text-text-tertiary">总积分</span>
          </div>
          <div className="w-px h-9 bg-border" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-bold text-sm text-primary">{stageInfo.name}</span>
            <span className="text-[11px] text-text-tertiary">成长阶段</span>
          </div>
          <div className="w-px h-9 bg-border" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-number font-bold text-xl text-primary">{student?.fruitCount ?? 0}</span>
            <span className="text-[11px] text-text-tertiary">果实数</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-2 flex flex-col gap-4">
        <div>
          <p className="text-xs text-text-tertiary font-semibold mb-1 px-1">账号管理</p>
          <div className="bg-primary-lighter rounded-[14px]">
            <MenuItem icon={UserPen} label="修改个人信息" onClick={() => navigate('/settings/profile')} />
          </div>
        </div>

        <div>
          <p className="text-xs text-text-tertiary font-semibold mb-1 px-1">安全设置</p>
          <div className="bg-primary-lighter rounded-[14px]">
            <MenuItem icon={ShieldCheck} label="个人隐私保护" onClick={() => navigate('/settings/privacy')} />
            <MenuItem icon={Lock} label="修改登录密码" onClick={() => navigate('/settings/password')} />
          </div>
        </div>

        <div>
          <p className="text-xs text-text-tertiary font-semibold mb-1 px-1">帮助与反馈</p>
          <div className="bg-primary-lighter rounded-[14px]">
            <MenuItem icon={MessageCircle} label="联系我们" onClick={() => navigate('/settings/contact')} />
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="w-full h-11 rounded-input border border-border text-sm text-text-tertiary font-medium"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}
