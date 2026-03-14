import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TreePine } from 'lucide-react'

import { useAuthStore } from '@/stores/auth'

export function WelcomePage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) navigate('/home', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-mobile flex-col bg-white">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-10">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-light">
          <TreePine className="text-primary" size={56} />
        </div>
        <h2 className="text-xl font-semibold">开启你的书法成长之旅</h2>
        <p className="text-center text-sm text-text-tertiary">登录后查看成长树、成长明细、书架和作品展示。</p>
        <button
          onClick={() => navigate('/login')}
          className="h-12 w-full rounded-btn bg-primary text-base font-bold text-white"
        >
          立即登录
        </button>
      </div>
    </div>
  )
}
