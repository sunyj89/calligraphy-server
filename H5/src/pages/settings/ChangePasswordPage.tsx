import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { NavBar } from '@/components/layout/NavBar'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!oldPassword) {
      setError('请输入原密码')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setError('新密码至少 6 位')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    setLoading(true)
    try {
      await api.changePassword(oldPassword, newPassword)
      setSuccess('密码修改成功，请重新登录')
      logout()
      window.setTimeout(() => navigate('/login', { replace: true, state: { message: '密码修改成功，请重新登录' } }), 600)
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-mobile flex-col bg-white">
      <NavBar title="修改登录密码" />
      <div className="flex flex-col gap-4 px-5 py-4">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">原密码</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
            placeholder="请输入原密码"
            className="h-11 w-full border-b border-divider text-sm outline-none placeholder:text-text-disabled"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">新密码</label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="请输入新密码（至少 6 位）"
            className="h-11 w-full border-b border-divider text-sm outline-none placeholder:text-text-disabled"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">确认新密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="请再次输入新密码"
            className="h-11 w-full border-b border-divider text-sm outline-none placeholder:text-text-disabled"
          />
        </div>

        {error && <p className="text-center text-xs text-red-500">{error}</p>}
        {success && <p className="text-center text-xs text-primary">{success}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 h-12 w-full rounded-btn bg-primary text-base font-bold text-white disabled:opacity-60"
        >
          {loading ? '提交中...' : '确认修改'}
        </button>
      </div>
    </div>
  )
}
