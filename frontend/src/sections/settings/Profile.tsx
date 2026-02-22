import { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export function Profile() {
  const { teacher, refreshMe } = useAuth();
  const [nameForm, setNameForm] = useState({ name: teacher?.name || '' });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [nameMsg, setNameMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleUpdateName = async () => {
    if (!nameForm.name.trim()) {
      setNameMsg('请输入姓名');
      return;
    }
    setNameLoading(true);
    setNameMsg('');
    try {
      await api.updateProfile({ name: nameForm.name.trim() });
      await refreshMe();
      setNameMsg('姓名修改成功');
    } catch (err) {
      setNameMsg(err instanceof Error ? err.message : '修改失败');
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg('');
    if (!pwForm.oldPassword || !pwForm.newPassword) {
      setPwMsg('请填写完整');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg('两次输入的新密码不一致');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg('新密码至少6位');
      return;
    }
    setPwLoading(true);
    try {
      await api.changePassword(pwForm.oldPassword, pwForm.newPassword);
      setPwMsg('密码修改成功，请重新登录');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg(err instanceof Error ? err.message : '修改失败');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            个人信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>手机号</Label>
            <Input value={teacher?.phone || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>角色</Label>
            <Input value={teacher?.role === 'admin' ? '管理员' : '教师'} disabled />
          </div>
          <div className="space-y-2">
            <Label>姓名</Label>
            <Input
              value={nameForm.name}
              onChange={(e) => setNameForm({ name: e.target.value })}
              placeholder="输入姓名"
            />
          </div>
          {nameMsg && (
            <p className={`text-sm ${nameMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{nameMsg}</p>
          )}
          <Button onClick={handleUpdateName} disabled={nameLoading} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-1" />
            {nameLoading ? '保存中...' : '保存姓名'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            修改密码
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>旧密码</Label>
            <Input
              type="password"
              value={pwForm.oldPassword}
              onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
              placeholder="输入旧密码"
            />
          </div>
          <div className="space-y-2">
            <Label>新密码</Label>
            <Input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="至少6位"
            />
          </div>
          <div className="space-y-2">
            <Label>确认新密码</Label>
            <Input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              placeholder="再次输入新密码"
            />
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>
          )}
          <Button onClick={handleChangePassword} disabled={pwLoading} className="bg-blue-600 hover:bg-blue-700">
            <Lock className="w-4 h-4 mr-1" />
            {pwLoading ? '提交中...' : '修改密码'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
