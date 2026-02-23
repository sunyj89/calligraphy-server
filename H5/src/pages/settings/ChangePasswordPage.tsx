import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '@/components/layout/NavBar'
import { api } from '@/lib/api'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!oldPassword) { setError('请输入原密码'); return }
    if (!newPassword || newPassword.length < 6) { setError('新密码至少6位'); return }
    if (newPassword !== confirmPassword) { setError('两次密码不一致'); return }
    setLoading(true)
    try {
      await api.changePassword(oldPassword, newPassword)
      navigate(-1)
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改失败')
    } finally { setLoading(false) }
  }

  return (
    <div className="w-full max-w-mobile mx-auto bg-white min-h-screen flex flex-col">
      <div className="h-11 flex items-center px-5 pt-3">
        <span className="font-number font-semibold text-[15px]">9:41</span>
      </div>
      <NavBar title="修改登录密码" />
      <div className="px-5 py-4 flex flex-col gap-4">
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">原密码</label>
          <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="请输入原密码" className="w-full h-11 border-b border-divider text-sm outline-none placeholder:text-text-disabled" />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">新密码</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="请输入新密码（至少6位）" className="w-full h-11 border-b border-divider text-sm outline-none placeholder:text-text-disabled" />
        </div>
        <div>
          <label className="text-sm text-text-secondary mb-1.5 block">确认新密码</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="请再次输入新密码" className="w-full h-11 border-b border-divider text-sm outline-none placeholder:text-text-disabled" />
        </div>
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <button onClick={handleSubmit} disabled={loading} className="w-full h-12 bg-primary text-white font-bold text-base rounded-btn mt-4 disabled:opacity-60">
          {loading ? '修改中...' : '确认修改'}
        </button>
      </div>
    </div>
  )
}
