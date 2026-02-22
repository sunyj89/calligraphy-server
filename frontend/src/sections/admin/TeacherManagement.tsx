import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RotateCcw, Ban, Pencil, UserPlus, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Teacher } from '@/types';

export function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', password: '', role: 'teacher' });

  // Edit dialog
  const [showEdit, setShowEdit] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', role: 'teacher' });

  // Reset password dialog
  const [showReset, setShowReset] = useState(false);
  const [resetTeacher, setResetTeacher] = useState<Teacher | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');

  const loadTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getTeachers(page, 20, search || undefined);
      setTeachers(res.items);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async () => {
    setError('');
    if (!createForm.name || !createForm.phone || !createForm.password) {
      setError('请填写完整信息');
      return;
    }
    try {
      await api.createTeacher(createForm);
      setShowCreate(false);
      setCreateForm({ name: '', phone: '', password: '', role: 'teacher' });
      loadTeachers();
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败');
    }
  };

  const handleEdit = async () => {
    if (!editTeacher) return;
    setError('');
    try {
      await api.updateTeacher(editTeacher.id, editForm);
      setShowEdit(false);
      loadTeachers();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败');
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!confirm(`确认禁用教师 ${teacher.name}？`)) return;
    try {
      await api.deleteTeacher(teacher.id);
      loadTeachers();
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败');
    }
  };

  const handleResetPassword = async () => {
    if (!resetTeacher || !newPassword) return;
    try {
      await api.resetTeacherPassword(resetTeacher.id, newPassword);
      setShowReset(false);
      setNewPassword('');
      alert('密码已重置');
    } catch (e) {
      setError(e instanceof Error ? e.message : '重置失败');
    }
  };

  const openEdit = (t: Teacher) => {
    setEditTeacher(t);
    setEditForm({ name: t.name, phone: t.phone || '', role: t.role });
    setShowEdit(true);
    setError('');
  };

  const openReset = (t: Teacher) => {
    setResetTeacher(t);
    setNewPassword('');
    setShowReset(true);
    setError('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              教师管理
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索教师姓名或手机号"
                  className="pl-9 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="teacher-search"
                />
              </div>
              <Button onClick={() => { setShowCreate(true); setError(''); }} data-testid="add-teacher-btn">
                <Plus className="w-4 h-4 mr-1" />
                添加教师
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">姓名</th>
                  <th className="pb-3 font-medium">手机号</th>
                  <th className="pb-3 font-medium">角色</th>
                  <th className="pb-3 font-medium">创建时间</th>
                  <th className="pb-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50" data-testid="teacher-row">
                    <td className="py-3 font-medium">{t.name}</td>
                    <td className="py-3 text-gray-600">{t.phone}</td>
                    <td className="py-3">
                      <Badge className={t.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                        {t.role === 'admin' ? (
                          <><Shield className="w-3 h-3 mr-1" />管理员</>
                        ) : (
                          <><User className="w-3 h-3 mr-1" />教师</>
                        )}
                      </Badge>
                    </td>
                    <td className="py-3 text-gray-500">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '--'}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openReset(t)}>
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(t)}>
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      {isLoading ? '加载中...' : '暂无教师数据'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
              <span className="text-sm text-gray-500 px-3 py-1">第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>下一页</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建教师对话框 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              添加新教师
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} data-testid="new-teacher-name" />
            </div>
            <div className="space-y-2">
              <Label>手机号</Label>
              <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} data-testid="new-teacher-phone" />
            </div>
            <div className="space-y-2">
              <Label>初始密码</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} data-testid="new-teacher-password" />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">教师</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} data-testid="confirm-add-teacher">确认添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑教师对话框 */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑教师</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>手机号</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">教师</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>取消</Button>
            <Button onClick={handleEdit}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码对话框 */}
      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码 - {resetTeacher?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
            <div className="space-y-2">
              <Label>新密码</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="请输入新密码" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReset(false)}>取消</Button>
            <Button onClick={handleResetPassword}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
