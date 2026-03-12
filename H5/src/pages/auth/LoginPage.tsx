import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TreePine, User, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const handleSubmit = async () => {
    setError('')

    if (!phone) {
      setError('请输入手机号')
      return
    }

    if (!password) {
      setError('请输入密码')
      return
    }

    if (!agreed) {
      setError('请先同意用户协议和隐私政策')
      return
    }

    setLoading(true)
    try {
      await login(phone, password)
      navigate('/home', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center justify-between px-5">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>

      <div className="flex flex-col items-center gap-2 pt-8 pb-5 px-5">
        <div className="w-[72px] h-[72px] bg-primary-light rounded-[20px] flex items-center justify-center">
          <TreePine size={40} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold">书法成长树</h1>
        <p className="text-[13px] text-text-tertiary">使用老师为你开通的账号登录</p>
      </div>

      <div className="flex-1 flex flex-col gap-4 px-6 pt-2.5">
        <div className="rounded-input bg-[#F5F5F5] p-[3px]">
          <div className="h-9 rounded-tag bg-white text-text-primary shadow-sm flex items-center justify-center text-sm font-medium">
            手机号 + 密码登录
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5 h-12 bg-primary-lighter rounded-input px-4">
            <User size={18} className="text-text-disabled" />
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="请输入手机号"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-disabled"
            />
          </div>

          <div className="flex items-center gap-2.5 h-12 bg-primary-lighter rounded-input px-4">
            <Lock size={18} className="text-text-disabled" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-disabled"
            />
          </div>
        </div>

        <p className="text-xs text-text-tertiary text-right">忘记密码请联系授课老师重置</p>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 bg-primary text-white font-bold text-base rounded-btn tracking-widest disabled:opacity-60"
        >
          {loading ? '登录中...' : '登录'}
        </button>

        <div className="rounded-card bg-primary-lighter px-4 py-3 text-sm text-text-secondary leading-6">
          <p>没有账号时，请先由老师在后台创建学员档案。</p>
          <p>首次登录后，你可以在“我的”中完善个人资料并修改密码。</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 px-6 pt-10 pb-10">
        <div className="flex items-center gap-1.5">
          <div
            onClick={() => setAgreed(!agreed)}
            className={cn(
              'w-4 h-4 rounded border-[1.5px] flex items-center justify-center cursor-pointer',
              agreed ? 'bg-primary border-primary' : 'border-[#CCCCCC]'
            )}
          >
            {agreed && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M1 4L3.5 6.5L9 1"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <span className="text-xs text-text-tertiary">
            已阅读并同意
            {' '}
            <span onClick={() => navigate('/agreement')} className="text-primary cursor-pointer">
              《用户协议》
            </span>
            {' '}
            和
            {' '}
            <span onClick={() => navigate('/privacy-policy')} className="text-primary cursor-pointer">
              《隐私政策》
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
