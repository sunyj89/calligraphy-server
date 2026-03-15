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

function getStudentClassroomLabel(student: Student, classrooms: Classroom[], currentClassroomId: string) {
  if (!student.classroomId) return '未分班';
  if (student.classroomId === currentClassroomId) return '当前班级';
  return classrooms.find((item) => item.id === student.classroomId)?.name ?? '其他班级';
}

export function ClassroomManagement() {
  const { teacher } = useAuth();
  const isAdmin = teacher?.role === 'admin';
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [candidateStudents, setCandidateStudents] = useState<Student[]>([]);
  const [assignSearch, setAssignSearch] = useState('');
  const [classroomStudents, setClassroomStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMemberLoading, setIsMemberLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [createForm, setCreateForm] = useState<ClassroomFormState>(emptyForm);
  const [editForm, setEditForm] = useState<ClassroomFormState>(emptyForm);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);

  const teacherOptions = useMemo(() => teachers.filter((item) => item.role === 'teacher'), [teachers]);
  const filteredCandidates = useMemo(() => {
    const keyword = assignSearch.trim().toLowerCase();
    if (!keyword) return candidateStudents;
    return candidateStudents.filter((student) => {
      return student.name.toLowerCase().includes(keyword) || student.phone.toLowerCase().includes(keyword);
    });
  }, [candidateStudents, assignSearch]);

  const loadClassrooms = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.getClassrooms(page, 20, search || undefined);
      setClassrooms(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '班级列表加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  const loadTeachers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.getTeachers(1, 100);
      setTeachers(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : '老师列表加载失败');
    }
  }, [isAdmin]);

  const loadClassroomStudents = useCallback(async (classroom: Classroom) => {
    setIsMemberLoading(true);
    try {
      const res = await api.getClassroomStudents(classroom.id, 1, 100);
      setClassroomStudents(res.items);
      return res.items;
    } catch (err) {
      setError(err instanceof Error ? err.message : '班级成员加载失败');
      setClassroomStudents([]);
      return [];
    } finally {
      setIsMemberLoading(false);
    }
  }, []);

  const loadCandidateStudents = useCallback(async (classroom: Classroom) => {
    try {
      const res = await api.getStudents(1, 200);
      setCandidateStudents(res.items.filter((item) => item.classroomId !== classroom.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '可选学生加载失败');
      setCandidateStudents([]);
    }
  }, []);

  useEffect(() => {
    void loadClassrooms();
  }, [loadClassrooms]);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  function resetStatus() {
    setError('');
    setFeedback('');
  }

  function resetSelection() {
    setSelectedStudentIds([]);
    setCandidateStudents([]);
    setClassroomStudents([]);
  }

  async function handleCreate() {
    resetStatus();
    if (!createForm.name.trim()) {
      setError('请填写班级名称');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createClassroom({
        name: createForm.name.trim(),
        gradeYear: createForm.gradeYear || undefined,
        description: createForm.description || undefined,
        teacherId: isAdmin ? createForm.teacherId || undefined : undefined,
      });
      setCreateForm(emptyForm);
      setShowCreate(false);
      setFeedback('班级已创建');
      await loadClassrooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建班级失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!editingClassroom) return;
    resetStatus();

    if (!editForm.name.trim()) {
      setError('请填写班级名称');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateClassroom(editingClassroom.id, {
        name: editForm.name.trim(),
        gradeYear: editForm.gradeYear || undefined,
        description: editForm.description || undefined,
        teacherId: isAdmin ? editForm.teacherId || undefined : undefined,
      });
      setShowEdit(false);
      setEditingClassroom(null);
      setFeedback('班级信息已更新');
      await loadClassrooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新班级失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(classroom: Classroom) {
    if (!confirm(`确认删除班级“${classroom.name}”吗？`)) return;
    resetStatus();
    try {
      await api.deleteClassroom(classroom.id);
      setFeedback('班级已删除');
      await loadClassrooms();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除班级失败');
    }
  }

  function openEditDialog(classroom: Classroom) {
    resetStatus();
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
    resetStatus();
    resetSelection();
    setSelectedClassroom(classroom);
    setShowStudents(true);
    await loadClassroomStudents(classroom);
  }

  async function openAssignDialog(classroom: Classroom) {
    resetStatus();
    resetSelection();
    setAssignSearch('');
    setSelectedClassroom(classroom);
    setShowAssign(true);
    await loadCandidateStudents(classroom);
  }

  async function refreshClassroomContext(classroom: Classroom) {
    const updated = await api.getClassrooms(page, 20, search || undefined);
    setClassrooms(updated.items);
    setTotal(updated.total);
    const nextSelected = updated.items.find((item) => item.id === classroom.id) ?? classroom;
    setSelectedClassroom(nextSelected);
    return nextSelected;
  }

  async function handleAssignStudents() {
    if (!selectedClassroom || selectedStudentIds.length === 0) return;
    resetStatus();
    setIsSubmitting(true);
    try {
      await api.assignStudentsToClassroom(selectedClassroom.id, selectedStudentIds);
      const nextSelected = await refreshClassroomContext(selectedClassroom);
      await Promise.all([loadCandidateStudents(nextSelected), loadClassroomStudents(nextSelected)]);
      setSelectedStudentIds([]);
      setFeedback(`已为 ${nextSelected.name} 添加 ${selectedStudentIds.length} 名学生`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加学生失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveStudent(studentId: string) {
    if (!selectedClassroom) return;
    if (!confirm('确认将该学生移出当前班级吗？')) return;
    resetStatus();
    setIsSubmitting(true);
    try {
      await api.removeStudentsFromClassroom(selectedClassroom.id, [studentId]);
      const nextSelected = await refreshClassroomContext(selectedClassroom);
      await Promise.all([loadClassroomStudents(nextSelected), loadCandidateStudents(nextSelected)]);
      setFeedback('学生已移出班级');
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除学生失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId) ? current.filter((item) => item !== studentId) : [...current, studentId]
    );
  }

  function selectAllVisibleCandidates() {
    const visibleIds = filteredCandidates.map((student) => student.id);
    setSelectedStudentIds((current) => {
      const set = new Set([...current, ...visibleIds]);
      return [...set];
    });
  }

  function clearVisibleSelections() {
    const visibleIdSet = new Set(filteredCandidates.map((student) => student.id));
    setSelectedStudentIds((current) => current.filter((id) => !visibleIdSet.has(id)));
  }

  function renderTeacherField(value: string, onChange: (value: string) => void, placeholder: string) {
    if (!isAdmin) return null;
    return (
      <div className="space-y-2">
        <Label>负责老师</Label>
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
                  resetStatus();
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
        <CardContent className="space-y-4">
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}
          {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classrooms.map((classroom) => (
              <Card key={classroom.id} className="border shadow-sm">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{classroom.name}</h3>
                      <div className="flex items-center gap-2">
                        {classroom.gradeYear ? <Badge variant="secondary">{classroom.gradeYear} 年级</Badge> : null}
                        <Badge variant="outline">{classroom.studentCount ?? 0} 名学生</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(classroom)} aria-label={`编辑班级 ${classroom.name}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => handleDelete(classroom)}
                        aria-label={`删除班级 ${classroom.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <div>负责老师：{classroom.teacher?.name || '未关联'}</div>
                    <div>联系方式：{classroom.teacher?.phone || '--'}</div>
                    <div className="mt-2 line-clamp-2">{classroom.description || '暂无班级说明'}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => openStudentsDialog(classroom)}>
                      <Users className="mr-1 h-3.5 w-3.5" />
                      查看成员
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
            <div className="space-y-2">
              <Label>班级名称</Label>
              <Input
                value={createForm.name}
                onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="例如：春季提高班"
              />
            </div>
            <div className="space-y-2">
              <Label>年级</Label>
              <Input
                value={createForm.gradeYear}
                onChange={(event) => setCreateForm((current) => ({ ...current, gradeYear: event.target.value }))}
                placeholder="例如：2"
              />
            </div>
            {renderTeacherField(createForm.teacherId, (value) => setCreateForm((current) => ({ ...current, teacherId: value })), '选择负责老师')}
            <div className="space-y-2">
              <Label>班级说明</Label>
              <Input
                value={createForm.description}
                onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="班级特点、上课时间等"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              确认创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑班级</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>班级名称</Label>
              <Input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>年级</Label>
              <Input value={editForm.gradeYear} onChange={(event) => setEditForm((current) => ({ ...current, gradeYear: event.target.value }))} />
            </div>
            {renderTeacherField(editForm.teacherId, (value) => setEditForm((current) => ({ ...current, teacherId: value })), '选择负责老师')}
            <div className="space-y-2">
              <Label>班级说明</Label>
              <Input value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              取消
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStudents} onOpenChange={setShowStudents}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedClassroom?.name || '班级'} 成员详情
              {selectedClassroom ? `（${selectedClassroom.studentCount ?? classroomStudents.length} 人）` : ''}
            </DialogTitle>
          </DialogHeader>

          {selectedClassroom ? (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <div>负责老师：{selectedClassroom.teacher?.name || '未关联'}</div>
              <div>联系方式：{selectedClassroom.teacher?.phone || '--'}</div>
            </div>
          ) : null}

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {isMemberLoading ? (
              <div className="py-10 text-center text-gray-400">正在加载班级成员...</div>
            ) : classroomStudents.length === 0 ? (
              <div className="py-10 text-center text-gray-400">当前班级还没有学生</div>
            ) : (
              classroomStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                  <div className="space-y-1">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">
                      {student.phone} · 总分 {student.totalScore}
                    </div>
                    <div className="text-xs text-gray-400">
                      年级 {student.grade || '--'} · 学校 {student.school || '--'}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500" disabled={isSubmitting} onClick={() => handleRemoveStudent(student.id)}>
                    <UserMinus className="mr-1 h-4 w-4" />
                    移除
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加学生到 {selectedClassroom?.name || '班级'}</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <div>支持添加未分班学生，也支持将学生从其他班级调整到当前班级。</div>
            <div>已选择 {selectedStudentIds.length} 名学生</div>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={assignSearch}
                onChange={(event) => setAssignSearch(event.target.value)}
                placeholder="搜索学生姓名或手机号"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-600">
              <div>
                当前可见 {filteredCandidates.length} 人，已选择 {selectedStudentIds.length} 人
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllVisibleCandidates} disabled={filteredCandidates.length === 0}>
                  全选当前结果
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearVisibleSelections} disabled={filteredCandidates.length === 0}>
                  清空当前结果选择
                </Button>
              </div>
            </div>
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {filteredCandidates.length === 0 ? (
              <div className="py-10 text-center text-gray-400">当前没有可调整的学生</div>
            ) : (
              filteredCandidates.map((student) => (
                <label key={student.id} className="flex cursor-pointer items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">
                      {student.phone} · 年级 {student.grade || '--'}
                    </div>
                    <div className="text-xs text-gray-400">
                      当前归属：{selectedClassroom ? getStudentClassroomLabel(student, classrooms, selectedClassroom.id) : '未知'}
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
            <Button onClick={handleAssignStudents} disabled={isSubmitting || selectedStudentIds.length === 0}>
              批量添加已选学生 ({selectedStudentIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
