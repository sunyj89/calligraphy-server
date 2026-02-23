import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TreePine, User, Lock, Phone, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { useCountdown } from '@/hooks/useCountdown'
import { api } from '@/lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const loginWithSms = useAuthStore(s => s.loginWithSms)
  const [activeTab, setActiveTab] = useState<'password' | 'sms'>('password')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const { seconds, isActive, start: startCountdown } = useCountdown(60)

  const handleSendCode = async () => {
    if (!phone || isActive) return
    try {
      await api.sendSmsCode(phone)
      startCountdown()
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    }
  }

  const handleSubmit = async () => {
    setError('')
    if (!phone) { setError('请输入手机号'); return }
    if (activeTab === 'password' && !password) { setError('请输入密码'); return }
    if (activeTab === 'sms' && !smsCode) { setError('请输入验证码'); return }
    if (!agreed) { setError('请先同意用户协议和隐私政策'); return }
    setLoading(true)
    try {
      if (activeTab === 'password') {
        await login(phone, password)
      } else {
        await loginWithSms(phone, smsCode)
      }
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
        <p className="text-[13px] text-text-tertiary">记录每一笔成长</p>
      </div>
      <div className="flex-1 flex flex-col gap-5 px-6 pt-2.5">
        <div className="flex rounded-input bg-[#F5F5F5] p-[3px]">
          <button onClick={() => setActiveTab('password')} className={cn('flex-1 h-9 rounded-tag text-sm font-medium flex items-center justify-center', activeTab === 'password' ? 'bg-white text-text-primary shadow-sm' : 'text-text-tertiary')}>账号密码登录</button>
          <button onClick={() => setActiveTab('sms')} className={cn('flex-1 h-9 rounded-tag text-sm font-medium flex items-center justify-center', activeTab === 'sms' ? 'bg-white text-text-primary shadow-sm' : 'text-text-tertiary')}>手机验证码</button>
        </div>
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5 h-12 bg-primary-lighter rounded-input px-4">
            {activeTab === 'password' ? <User size={18} className="text-text-disabled" /> : <Phone size={18} className="text-text-disabled" />}
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={activeTab === 'password' ? '请输入手机号' : '请输入手机号'} className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-disabled" />
          </div>
          {activeTab === 'password' ? (
            <div className="flex items-center gap-2.5 h-12 bg-primary-lighter rounded-input px-4">
              <Lock size={18} className="text-text-disabled" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-disabled" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 h-12 bg-primary-lighter rounded-input px-4">
              <Shield size={18} className="text-text-disabled" />
              <input type="text" value={smsCode} onChange={e => setSmsCode(e.target.value)} placeholder="请输入验证码" className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-disabled" />
              <button onClick={handleSendCode} disabled={isActive || !phone} className={cn('text-sm font-semibold whitespace-nowrap', isActive || !phone ? 'text-text-disabled' : 'text-primary')}>{isActive ? `${seconds}s` : '获取验证码'}</button>
            </div>
          )}
        </div>
        {activeTab === 'password' && (
          <div className="flex justify-end"><span className="text-xs text-primary font-medium">忘记密码？</span></div>
        )}
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <button onClick={handleSubmit} disabled={loading} className="w-full h-12 bg-primary text-white font-bold text-base rounded-btn tracking-widest disabled:opacity-60">{loading ? '登录中...' : '登  录'}</button>
        <div className="flex items-center justify-center gap-1">
          <span className="text-[13px] text-text-tertiary">还没有账号？</span>
          <button onClick={() => navigate('/register')} className="text-[13px] text-primary font-semibold">立即注册</button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 px-6 pt-10 pb-10">
        <div className="flex items-center gap-1.5">
          <div onClick={() => setAgreed(!agreed)} className={cn('w-4 h-4 rounded border-[1.5px] flex items-center justify-center cursor-pointer', agreed ? 'bg-primary border-primary' : 'border-[#CCCCCC]')}>
            {agreed && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </div>
          <span className="text-xs text-text-tertiary">已阅读并同意 <span onClick={() => navigate('/agreement')} className="text-primary">《用户协议》</span> 及 <span onClick={() => navigate('/privacy-policy')} className="text-primary">《隐私政策》</span></span>
        </div>
      </div>
    </div>
  )
}
