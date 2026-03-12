import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TreePine } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

export function WelcomePage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center justify-between px-5">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>

      <div className="flex items-center justify-between px-5 py-2">
        <h1 className="text-[22px] font-semibold tracking-tight">书法成长树</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-10">
        <div className="animate-float">
          <div className="w-32 h-32 bg-primary-light rounded-full flex items-center justify-center">
            <TreePine size={64} className="text-primary" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-text-primary">开启你的书法成长之旅</h2>
        <p className="text-sm text-text-tertiary text-center leading-6">
          练习记录、作品查看和成长积分都会同步到这里。
          账号由老师统一创建，登录后即可开始使用。
        </p>

        <div className="w-full flex flex-col gap-3 mt-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full h-12 bg-primary text-white font-bold text-base rounded-btn"
          >
            立即登录
          </button>
          <button
            onClick={() => navigate('/agreement')}
            className="w-full h-12 border border-primary text-primary font-bold text-base rounded-btn"
          >
            查看使用说明
          </button>
        </div>

        <p className="text-sm text-text-tertiary mt-2">如未开通账号，请联系授课老师。</p>
      </div>

      <div className="h-16" />
    </div>
  )
}
