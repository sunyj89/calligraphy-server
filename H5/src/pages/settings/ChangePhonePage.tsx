import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '@/components/layout/NavBar'
import { useAuthStore } from '@/stores/auth'
import { useCountdown } from '@/hooks/useCountdown'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export function ChangePhonePage() {
  const navigate = useNavigate()
  const student = useAuthStore(s => s.student)
  const [newPhone, setNewPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { seconds, isActive, start: startCountdown } = useCountdown(60)

  const currentPhone = student?.phone ? student.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''

  const handleSendCode = async () => {
    if (!newPhone || isActive) return
    try { await api.sendSmsCode(newPhone); startCountdown() } catch (err) { setError(err instanceof Error ? err.message : '发送失败') }
  }

  const handleSubmit = async () => {
    setError('')
    if (!newPhone) { setError('请输入新手机号'); return }
    if (!code) { setError('请输入验证码'); return }
    setLoading(true)
    try { await api.changePhone(newPhone, code); navigate(-1) } catch (err) { setError(err instanceof Error ? err.message : '修改失败') } finally { setLoading(false) }
  }

  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center px-5 pt-3"><span className="font-number font-semibold text-[15px]">9:41</span></div>
      <NavBar title="修改手机号" />
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-text-secondary">当前手机号</span>
          <span className="text-sm text-text-primary font-medium">{currentPhone}</span>
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">新手机号</label>
          <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="请输入新手机号" className="w-full h-11 border-b border-divider text-sm outline-none placeholder:text-text-disabled" />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">验证码</label>
          <div className="flex items-center gap-2 border-b border-divider">
            <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="请输入验证码" className="flex-1 h-11 text-sm outline-none placeholder:text-text-disabled" />
            <button onClick={handleSendCode} disabled={isActive || !newPhone} className={cn('text-sm font-semibold whitespace-nowrap px-3 py-2 rounded-tag', isActive || !newPhone ? 'text-text-disabled bg-gray-100' : 'text-white bg-primary')}>{isActive ? `${seconds}s` : '获取验证码'}</button>
          </div>
        </div>
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <button onClick={handleSubmit} disabled={loading} className="w-full h-12 bg-primary text-white font-bold text-base rounded-btn mt-4 disabled:opacity-60">{loading ? '修改中...' : '确认修改'}</button>
      </div>
    </div>
  )
}
