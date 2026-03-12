import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, TreePine } from 'lucide-react';

import { useAuthStore } from '@/stores/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!phone) return setError('请输入手机号');
    if (!password) return setError('请输入密码');
    if (!agreed) return setError('请先同意用户协议和隐私政策');
    setLoading(true);
    try {
      await login(phone, password);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-mobile flex-col bg-white">
      <div className="flex flex-1 flex-col gap-5 px-6 pt-16">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-light">
            <TreePine className="text-primary" size={44} />
          </div>
          <h1 className="text-2xl font-bold">成长树</h1>
          <p className="text-sm text-text-tertiary">学生端账号密码登录</p>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-input bg-primary-lighter px-4">
          <Phone size={18} className="text-text-disabled" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-text-disabled"
          />
        </div>

        <div className="flex items-center gap-2 rounded-input bg-primary-lighter px-4">
          <Lock size={18} className="text-text-disabled" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-text-disabled"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-text-tertiary">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          已阅读并同意用户协议与隐私政策
        </label>

        {error && <p className="text-center text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="h-12 rounded-btn bg-primary text-base font-bold text-white disabled:opacity-60"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </div>
    </div>
  );
}
