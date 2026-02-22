import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Users, BookOpen, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import type { Classroom, Student } from '@/types';

export function ClassroomManagement() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', gradeYear: '', description: '' });

  // Edit dialog
  const [showEdit, setShowEdit] = useState(false);
  const [editClassroom, setEditClassroom] = useState<Classroom | null>(null);
  const [editForm, setEditForm] = useState({ name: '', gradeYear: '', description: '' });

  // Students dialog
  const [showStudents, setShowStudents] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [classroomStudents, setClassroomStudents] = useState<Student[]>([]);

  // Assign students dialog
  const [showAssign, setShowAssign] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [error, setError] = useState('');

  const loadClassrooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getClassrooms(page, 20, search || undefined);
      setClassrooms(res.items);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async () => {
    setError('');
    if (!createForm.name) {
      setError('请填写班级名称');
      return;
    }
    try {
      await api.createClassroom(createForm);
      setShowCreate(false);
      setCreateForm({ name: '', gradeYear: '', description: '' });
      loadClassrooms();
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败');
    }
  };

  const handleEdit = async () => {
    if (!editClassroom) return;
    setError('');
    try {
      await api.updateClassroom(editClassroom.id, editForm);
      setShowEdit(false);
      loadClassrooms();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败');
    }
  };

  const handleDelete = async (classroom: Classroom) => {
    if (!confirm(`确认删除班级 "${classroom.name}"？`)) return;
    try {
      await api.deleteClassroom(classroom.id);
      loadClassrooms();
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败');
    }
  };

  const openEdit = (c: Classroom) => {
    setEditClassroom(c);
    setEditForm({ name: c.name, gradeYear: c.gradeYear || '', description: c.description || '' });
    setShowEdit(true);
    setError('');
  };

  const openStudents = async (c: Classroom) => {
    setSelectedClassroom(c);
    setShowStudents(true);
    try {
      const res = await api.getClassroomStudents(c.id, 1, 100);
      setClassroomStudents(res.items);
    } catch {
      setClassroomStudents([]);
    }
  };

  const openAssign = async (c: Classroom) => {
    setSelectedClassroom(c);
    setShowAssign(true);
    setSelectedStudentIds([]);
    try {
      // 获取所有未分配班级的学生
      const res = await api.getStudents(1, 200);
      const unassigned = res.items.filter(s => !s.classroomId);
      setAllStudents(unassigned);
    } catch {
      setAllStudents([]);
    }
  };

  const handleAssign = async () => {
    if (!selectedClassroom || selectedStudentIds.length === 0) return;
    try {
      await api.assignStudentsToClassroom(selectedClassroom.id, selectedStudentIds);
      setShowAssign(false);
      loadClassrooms();
      alert(`已分配 ${selectedStudentIds.length} 名学生`);
    } catch (e) {
      alert(e instanceof Error ? e.message : '分配失败');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClassroom) return;
    if (!confirm('确认将该学生移出班级？')) return;
    try {
      await api.removeStudentsFromClassroom(selectedClassroom.id, [studentId]);
      const res = await api.getClassroomStudents(selectedClassroom.id, 1, 100);
      setClassroomStudents(res.items);
      loadClassrooms();
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败');
    }
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              班级管理
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索班级名称"
                  className="pl-9 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => { setShowCreate(true); setError(''); }} data-testid="add-classroom-btn">
                <Plus className="w-4 h-4 mr-1" />
                创建班级
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((c) => (
              <Card key={c.id} className="border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{c.name}</h3>
                      {c.gradeYear && (
                        <Badge variant="secondary" className="mt-1">{c.gradeYear}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(c)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {c.description && (
                    <p className="text-sm text-gray-500 mb-3">{c.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{c.studentCount || 0} 名学生</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openStudents(c)}>
                        <Users className="w-3.5 h-3.5 mr-1" />
                        查看
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openAssign(c)}>
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        分配
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {classrooms.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                {isLoading ? '加载中...' : '暂无班级数据'}
              </div>
            )}
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

      {/* 创建班级 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新班级</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
            <div className="space-y-2">
              <Label>班级名称 *</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="如：书法一班" />
            </div>
            <div className="space-y-2">
              <Label>年级</Label>
              <Input value={createForm.gradeYear} onChange={(e) => setCreateForm({ ...createForm, gradeYear: e.target.value })} placeholder="如：2024级" />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="班级描述（选填）" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate}>确认创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑班级 */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑班级</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
            <div className="space-y-2">
              <Label>班级名称</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>年级</Label>
              <Input value={editForm.gradeYear} onChange={(e) => setEditForm({ ...editForm, gradeYear: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>取消</Button>
            <Button onClick={handleEdit}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看班级学生 */}
      <Dialog open={showStudents} onOpenChange={setShowStudents}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedClassroom?.name} - 学生列表</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {classroomStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">暂无学生</div>
            ) : (
              <div className="space-y-2">
                {classroomStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{s.phone || '--'}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleRemoveStudent(s.id)}>
                      <UserMinus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 分配学生 */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>分配学生到 {selectedClassroom?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {allStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">暂无未分配班级的学生</div>
            ) : (
              <div className="space-y-2">
                {allStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(s.id)}
                      onChange={() => toggleStudentSelection(s.id)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">{s.name}</span>
                    <span className="text-sm text-gray-500">{s.phone || '--'}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(false)}>取消</Button>
            <Button onClick={handleAssign} disabled={selectedStudentIds.length === 0}>
              确认分配 ({selectedStudentIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
