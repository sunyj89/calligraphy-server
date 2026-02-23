import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Shield, Lock, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { useCountdown } from '@/hooks/useCountdown'
import { api } from '@/lib/api'
import { NavBar } from '@/components/layout/NavBar'

export function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore(s => s.register)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const { seconds, isActive, start: startCountdown } = useCountdown(60)

  const handleSendCode = async () => {
    if (!phone || isActive) return
    try { await api.sendSmsCode(phone); startCountdown() } catch (err) { setError(err instanceof Error ? err.message : '发送失败') }
  }

  const handleSubmit = async () => {
    setError('')
    if (!phone) { setError('请输入手机号'); return }
    if (!code) { setError('请输入验证码'); return }
    if (!password || password.length < 6) { setError('密码至少6位'); return }
    if (password !== confirmPassword) { setError('两次密码不一致'); return }
    if (!name) { setError('请输入昵称'); return }
    if (!agreed) { setError('请先同意用户协议和隐私政策'); return }
    setLoading(true)
    try { await register({ phone, code, password, name }); navigate('/home', { replace: true }) } catch (err) { setError(err instanceof Error ? err.message : '注册失败') } finally { setLoading(false) }
  }

  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center px-5"><span className="font-number font-semibold text-[15px]">9:41</span></div>
      <NavBar title="新用户注册" />
      <div className="flex-1 flex flex-col gap-3.5 px-6 pt-5">
        <p className="text-sm text-text-tertiary mb-2">请填写以下信息完成注册</p>
        <div className="flex items-center gap-2.5 h-12 border-b border-divider">
          <Phone size={18} className="text-text-disabled" />
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入手机号" className="flex-1 text-sm outline-none placeholder:text-text-disabled" />
        </div>
        <div className="flex items-center gap-2.5 h-12 border-b border-divider">
          <Shield size={18} className="text-text-disabled" />
          <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="验证码" className="flex-1 text-sm outline-none placeholder:text-text-disabled" />
          <button onClick={handleSendCode} disabled={isActive || !phone} className={cn('text-sm font-semibold whitespace-nowrap', isActive || !phone ? 'text-text-disabled' : 'text-primary')}>{isActive ? `${seconds}s` : '获取验证码'}</button>
        </div>
        <div className="flex items-center gap-2.5 h-12 border-b border-divider">
          <Lock size={18} className="text-text-disabled" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请设置密码（6-16位）" className="flex-1 text-sm outline-none placeholder:text-text-disabled" />
        </div>
        <div className="flex items-center gap-2.5 h-12 border-b border-divider">
          <Lock size={18} className="text-text-disabled" />
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="请再次输入密码" className="flex-1 text-sm outline-none placeholder:text-text-disabled" />
        </div>
        <div className="flex items-center gap-2.5 h-12 border-b border-divider">
          <Pencil size={18} className="text-text-disabled" />
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="给自己起个昵称吧" className="flex-1 text-sm outline-none placeholder:text-text-disabled" />
        </div>
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <button onClick={handleSubmit} disabled={loading} className="w-full h-12 bg-primary text-white font-bold text-base rounded-btn tracking-widest mt-4 disabled:opacity-60">{loading ? '注册中...' : '注  册'}</button>
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="text-[13px] text-text-tertiary">已有账号？</span>
          <button onClick={() => navigate('/login')} className="text-[13px] text-primary font-semibold">去登录</button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 px-6 py-8">
        <label className="flex items-center gap-1.5">
          <div onClick={() => setAgreed(!agreed)} className={cn('w-4 h-4 rounded border-[1.5px] flex items-center justify-center cursor-pointer', agreed ? 'bg-primary border-primary' : 'border-[#CCCCCC]')}>
            {agreed && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <span className="text-xs text-text-tertiary">已阅读并同意 <button onClick={() => navigate('/agreement')} className="text-primary">《用户协议》</button> 及 <button onClick={() => navigate('/privacy-policy')} className="text-primary">《隐私政策》</button></span>
        </label>
      </div>
    </div>
  )
}
