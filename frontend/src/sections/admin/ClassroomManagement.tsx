import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Pencil, Plus, Search, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { Classroom, Student, Teacher } from '@/types';

type ClassroomFormState = {
  name: string;
  gradeYear: string;
  description: string;
  teacherId: string;
};

const emptyForm: ClassroomFormState = {
  name: '',
  gradeYear: '',
  description: '',
  teacherId: '',
};

export function ClassroomManagement() {
  const { teacher } = useAuth();
  const isAdmin = teacher?.role === 'admin';
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [classroomStudents, setClassroomStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [createForm, setCreateForm] = useState<ClassroomFormState>(emptyForm);
  const [editForm, setEditForm] = useState<ClassroomFormState>(emptyForm);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);

  const teacherOptions = useMemo(() => teachers.filter((item) => item.role === 'teacher'), [teachers]);

  const loadClassrooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getClassrooms(page, 20, search || undefined);
      setClassrooms(res.items);
      setTotal(res.total);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  const loadTeachers = useCallback(async () => {
    if (!isAdmin) return;
    const res = await api.getTeachers(1, 100);
    setTeachers(res.items);
  }, [isAdmin]);

  useEffect(() => {
    void loadClassrooms();
  }, [loadClassrooms]);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  function resetDialogs() {
    setError('');
    setSelectedStudentIds([]);
  }

  async function handleCreate() {
    setError('');
    if (!createForm.name.trim()) {
      setError('请填写班级名称');
      return;
    }
    try {
      await api.createClassroom({
        name: createForm.name.trim(),
        gradeYear: createForm.gradeYear || undefined,
        description: createForm.description || undefined,
        teacherId: isAdmin ? createForm.teacherId || undefined : undefined,
      });
      setCreateForm(emptyForm);
      setShowCreate(false);
      await loadClassrooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建班级失败');
    }
  }

  async function handleEdit() {
    if (!editingClassroom) return;
    setError('');
    try {
      await api.updateClassroom(editingClassroom.id, {
        name: editForm.name.trim() || undefined,
        gradeYear: editForm.gradeYear || undefined,
        description: editForm.description || undefined,
        teacherId: isAdmin ? editForm.teacherId || undefined : undefined,
      });
      setShowEdit(false);
      setEditingClassroom(null);
      await loadClassrooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新班级失败');
    }
  }

  async function handleDelete(classroom: Classroom) {
    if (!confirm(`确认删除班级“${classroom.name}”吗？`)) return;
    await api.deleteClassroom(classroom.id);
    await loadClassrooms();
  }

  function openEditDialog(classroom: Classroom) {
    resetDialogs();
    setEditingClassroom(classroom);
    setEditForm({
      name: classroom.name,
      gradeYear: classroom.gradeYear || '',
      description: classroom.description || '',
      teacherId: classroom.teacherId || '',
    });
    setShowEdit(true);
  }

  async function openStudentsDialog(classroom: Classroom) {
    resetDialogs();
    setSelectedClassroom(classroom);
    setShowStudents(true);
    const res = await api.getClassroomStudents(classroom.id, 1, 100);
    setClassroomStudents(res.items);
  }

  async function openAssignDialog(classroom: Classroom) {
    resetDialogs();
    setSelectedClassroom(classroom);
    setShowAssign(true);
    const res = await api.getStudents(1, 200);
    setUnassignedStudents(res.items.filter((item) => !item.classroomId));
  }

  async function handleAssignStudents() {
    if (!selectedClassroom || selectedStudentIds.length === 0) return;
    await api.assignStudentsToClassroom(selectedClassroom.id, selectedStudentIds);
    setShowAssign(false);
    await loadClassrooms();
  }

  async function handleRemoveStudent(studentId: string) {
    if (!selectedClassroom) return;
    if (!confirm('确认将该学生移出当前班级吗？')) return;
    await api.removeStudentsFromClassroom(selectedClassroom.id, [studentId]);
    const res = await api.getClassroomStudents(selectedClassroom.id, 1, 100);
    setClassroomStudents(res.items);
    await loadClassrooms();
  }

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((item) => item !== studentId)
        : [...current, studentId]
    );
  }

  function renderTeacherField(
    value: string,
    onChange: (value: string) => void,
    placeholder: string
  ) {
    if (!isAdmin) return null;
    return (
      <div className="space-y-2">
        <Label>关联老师</Label>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{placeholder}</option>
          {teacherOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} {item.phone ? `(${item.phone})` : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
              班级管理
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="搜索班级名称"
                  className="w-64 pl-9"
                />
              </div>
              <Button
                onClick={() => {
                  resetDialogs();
                  setCreateForm({
                    ...emptyForm,
                    teacherId: !isAdmin ? teacher?.id || '' : '',
                  });
                  setShowCreate(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                新建班级
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classrooms.map((classroom) => (
              <Card key={classroom.id} className="border shadow-sm">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{classroom.name}</h3>
                      <div className="flex items-center gap-2">
                        {classroom.gradeYear ? <Badge variant="secondary">{classroom.gradeYear} 年级</Badge> : null}
                        <Badge variant="outline">{classroom.studentCount || 0} 名学生</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(classroom)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(classroom)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <div>班级老师：{classroom.teacher?.name || '未关联'}</div>
                    <div>联系方式：{classroom.teacher?.phone || '--'}</div>
                    <div className="mt-2">{classroom.description || '暂无班级描述'}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openStudentsDialog(classroom)}>
                      <Users className="mr-1 h-3.5 w-3.5" />
                      班级成员
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openAssignDialog(classroom)}>
                      <UserPlus className="mr-1 h-3.5 w-3.5" />
                      添加学生
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {classrooms.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              {isLoading ? '正在加载班级数据...' : '暂无班级数据'}
            </div>
          ) : null}

          {total > 20 ? (
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                上一页
              </Button>
              <span className="px-3 py-1 text-sm text-gray-500">
                第 {page} 页 / 共 {Math.ceil(total / 20)} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => setPage((current) => current + 1)}
              >
                下一页
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建班级</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error ? <div className="rounded bg-red-50 p-2 text-sm text-red-500">{error}</div> : null}
            <div className="space-y-2">
              <Label>班级名称</Label>
              <Input
                value={createForm.name}
                onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="例如：周末提高班"
              />
            </div>
            <div className="space-y-2">
              <Label>年级</Label>
              <Input
                value={createForm.gradeYear}
                onChange={(event) => setCreateForm((current) => ({ ...current, gradeYear: event.target.value }))}
                placeholder="例如：3"
              />
            </div>
            {renderTeacherField(createForm.teacherId, (value) => setCreateForm((current) => ({ ...current, teacherId: value })), '选择负责老师')}
            <div className="space-y-2">
              <Label>描述</Label>
              <Input
                value={createForm.description}
                onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="班级特色、授课时间等"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              取消
            </Button>
            <Button onClick={handleCreate}>确认创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑班级</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error ? <div className="rounded bg-red-50 p-2 text-sm text-red-500">{error}</div> : null}
            <div className="space-y-2">
              <Label>班级名称</Label>
              <Input
                value={editForm.name}
                onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>年级</Label>
              <Input
                value={editForm.gradeYear}
                onChange={(event) => setEditForm((current) => ({ ...current, gradeYear: event.target.value }))}
              />
            </div>
            {renderTeacherField(editForm.teacherId, (value) => setEditForm((current) => ({ ...current, teacherId: value })), '选择负责老师')}
            <div className="space-y-2">
              <Label>描述</Label>
              <Input
                value={editForm.description}
                onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              取消
            </Button>
            <Button onClick={handleEdit}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStudents} onOpenChange={setShowStudents}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedClassroom?.name} - 班级成员</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {classroomStudents.length === 0 ? (
              <div className="py-10 text-center text-gray-400">当前班级还没有学生</div>
            ) : (
              classroomStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">
                      {student.phone} · 总分 {student.totalScore}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleRemoveStudent(student.id)}>
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>添加学生到 {selectedClassroom?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {unassignedStudents.length === 0 ? (
              <div className="py-10 text-center text-gray-400">当前没有未分班学生</div>
            ) : (
              unassignedStudents.map((student) => (
                <label key={student.id} className="flex cursor-pointer items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">
                      {student.phone} · 年级 {student.grade || '--'}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(false)}>
              取消
            </Button>
            <Button onClick={handleAssignStudents} disabled={selectedStudentIds.length === 0}>
              确认添加 ({selectedStudentIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
