import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Award, Calendar, Plus, Search, Trash2, TrendingUp, Upload, User, Users, X } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import type { Classroom, GrowthStage, Statistics, Student, Teacher } from '@/types';

interface StudentManagementProps {
  onSelectStudent: (student: Student) => void;
}

const stageConfig: Record<GrowthStage, { label: string; color: string; icon: string; minScore: number }> = {
  sprout: { label: '萌芽宝贝', color: 'bg-emerald-100 text-emerald-600', icon: '芽', minScore: 0 },
  seedling: { label: '努力伸展', color: 'bg-green-100 text-green-600', icon: '苗', minScore: 1500 },
  small: { label: '长成小树', color: 'bg-teal-100 text-teal-600', icon: '树', minScore: 3000 },
  medium: { label: '有模有样', color: 'bg-cyan-100 text-cyan-600', icon: '木', minScore: 4500 },
  large: { label: '披上绿装', color: 'bg-green-100 text-green-600', icon: '林', minScore: 6000 },
  xlarge: { label: '绿意满满', color: 'bg-lime-100 text-lime-600', icon: '森', minScore: 7500 },
  fruitful: { label: '硕果累累', color: 'bg-amber-100 text-amber-600', icon: '果', minScore: 9000 },
};

const stageOrder: GrowthStage[] = ['sprout', 'seedling', 'small', 'medium', 'large', 'xlarge', 'fruitful'];

function getNextStageTarget(stage: GrowthStage): number | null {
  const currentIndex = stageOrder.indexOf(stage);
  if (currentIndex < 0 || currentIndex >= stageOrder.length - 1) return null;
  return stageConfig[stageOrder[currentIndex + 1]].minScore;
}

function getClassroomDisplay(classrooms: Classroom[], classroomId?: string) {
  if (!classroomId) return '未分班';
  return classrooms.find((item) => item.id === classroomId)?.name || '未知班级';
}

function getTeacherDisplay(
  student: Student,
  classrooms: Classroom[],
  teacherMap: Map<string, Teacher>
) {
  if (!student.classroomId) return '未绑定';
  const classroom = classrooms.find((item) => item.id === student.classroomId);
  if (!classroom?.teacherId) return '未绑定';
  return classroom.teacher?.name || teacherMap.get(classroom.teacherId)?.name || '未绑定';
}

export function StudentManagement({ onSelectStudent }: StudentManagementProps) {
  const { teacher } = useAuth();
  const isAdmin = teacher?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({ totalStudents: 0, seniorStudents: 0 });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    phone: '',
    password: '',
    address: '',
    school: '',
    grade: '',
    gender: 'male',
    birthday: '',
    classroomId: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const teacherMap = useMemo(() => new Map(teachers.map((item) => [item.id, item])), [teachers]);
  const teacherOptions = useMemo(() => teachers.filter((item) => item.role === 'teacher'), [teachers]);

  const loadStudents = useCallback(async (search?: string, classroomId?: string, teacherId?: string) => {
    const response = await api.getStudents(1, 200, search || undefined, classroomId || undefined, teacherId || undefined);
    setStudents(response.items);
  }, []);

  const loadStatistics = useCallback(async () => {
    const response = await api.getStatistics();
    setStatistics(response);
  }, []);

  const loadClassrooms = useCallback(async () => {
    const response = await api.getClassrooms(1, 200);
    setClassrooms(response.items);
  }, []);

  const loadTeachers = useCallback(async () => {
    if (!isAdmin) {
      setTeachers([]);
      return;
    }
    try {
      const response = await api.getTeachers(1, 200);
      setTeachers(response.items);
    } catch {
      setTeachers([]);
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadStatistics();
    void loadClassrooms();
    void loadTeachers();
  }, [loadClassrooms, loadStatistics, loadTeachers]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      void loadStudents(searchQuery.trim(), selectedClassroomId, selectedTeacherId);
    }, 250);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [loadStudents, searchQuery, selectedClassroomId, selectedTeacherId]);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('仅支持 JPG 或 PNG 图片');
      return;
    }
    if (file.size > 1024 * 1024) {
      alert('图片不能超过 1MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (loadEvent) => setAvatarPreview(loadEvent.target?.result as string);
    reader.readAsDataURL(file);
  }

  function resetCreateForm() {
    setNewStudent({
      name: '',
      phone: '',
      password: '',
      address: '',
      school: '',
      grade: '',
      gender: 'male',
      birthday: '',
      classroomId: '',
    });
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function refreshStudentList() {
    await loadStudents(searchQuery.trim(), selectedClassroomId, selectedTeacherId);
  }

  async function handleAddStudent() {
    if (!newStudent.name.trim() || !newStudent.phone.trim()) return;
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const uploadResponse = await api.uploadImage(avatarFile);
        avatarUrl = uploadResponse.url;
      }

      await api.createStudent({
        name: newStudent.name.trim(),
        phone: newStudent.phone.trim(),
        password: newStudent.password.trim() || undefined,
        avatar: avatarUrl,
        address: newStudent.address || undefined,
        school: newStudent.school || undefined,
        grade: newStudent.grade || undefined,
        gender: newStudent.gender || undefined,
        birthday: newStudent.birthday || undefined,
        classroomId: newStudent.classroomId || undefined,
      });

      resetCreateForm();
      setIsAddDialogOpen(false);
      await refreshStudentList();
      await loadStatistics();
      await loadClassrooms();
    } catch (error) {
      alert(error instanceof Error ? error.message : '添加学生失败');
    }
  }

  async function handleDeleteStudent(studentId: string, event: React.MouseEvent) {
    event.stopPropagation();
    if (!confirm('确定删除该学生吗？')) return;
    await api.deleteStudent(studentId);
    await refreshStudentList();
    await loadStatistics();
  }

  const statCards = [
    { title: '总学员数', value: statistics.totalStudents, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: '今日新增', value: statistics.newToday ?? '--', icon: User, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: '活跃学员', value: statistics.activeStudents ?? '--', icon: TrendingUp, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { title: '资深学员', value: statistics.seniorStudents, icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} rounded-xl p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-green-600" />
            学员管理台
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索学员姓名或手机号"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <select
              value={selectedClassroomId}
              onChange={(event) => setSelectedClassroomId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">全部班级</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
            <select
              value={selectedTeacherId}
              onChange={(event) => setSelectedTeacherId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={!isAdmin}
            >
              <option value="">{isAdmin ? '全部老师' : '当前账号不可切换老师筛选'}</option>
              {teacherOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
            <div className="text-sm text-slate-600">当前结果：{students.length} 人</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClassroomId('');
                  setSelectedTeacherId('');
                }}
              >
                清空筛选
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700" data-testid="add-student-btn">
                <Plus className="mr-2 h-4 w-4" />
                添加学员
              </Button>
            </div>
          </div>

          <div className="space-y-3" data-testid="student-list">
            {students.map((student) => (
              <div
                key={student.id}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                data-testid="student-row"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{student.name}</p>
                      <p className="truncate text-sm text-gray-500">{student.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      onClick={() => onSelectStudent(student)}
                    >
                      查看详情
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-200 text-green-600 hover:bg-green-50"
                      onClick={() => onSelectStudent(student)}
                    >
                      管理
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={(event) => void handleDeleteStudent(student.id, event)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-500">所在班级</div>
                    <div className="mt-1 font-medium">{getClassroomDisplay(classrooms, student.classroomId)}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-500">负责老师</div>
                    <div className="mt-1 font-medium">{getTeacherDisplay(student, classrooms, teacherMap)}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-500">当前总分</div>
                    <div className="mt-1 font-semibold text-green-600">{student.totalScore}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-500">成长阶段</div>
                    <div className="mt-1">
                      <Badge className={`${stageConfig[student.stage].color} border-0`}>
                        <span className="mr-1">{stageConfig[student.stage].icon}</span>
                        {stageConfig[student.stage].label}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-500">下阶段目标</div>
                    <div className="mt-1 font-medium">
                      {getNextStageTarget(student.stage) ? (
                        <span>{getNextStageTarget(student.stage)}</span>
                      ) : (
                        <span className="text-amber-500">已满级</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  创建时间：{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '--'}
                </div>
              </div>
            ))}
          </div>

          {students.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-6xl">空</div>
              <p className="text-gray-500">当前筛选条件下没有学员</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>添加新学员</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <Label>头像</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-50">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="头像预览" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <User className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    选择图片
                  </Button>
                  {avatarPreview ? (
                    <Button type="button" variant="ghost" size="sm" onClick={resetCreateForm} className="text-red-500 hover:text-red-600">
                      <X className="mr-2 h-4 w-4" />
                      清空
                    </Button>
                  ) : null}
                  <p className="text-xs text-gray-400">格式：JPG/PNG，大小不超过 1MB</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">姓名</Label>
              <Input id="name" value={newStudent.name} onChange={(event) => setNewStudent((current) => ({ ...current, name: event.target.value }))} data-testid="new-student-name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">手机号</Label>
              <Input id="phone" value={newStudent.phone} onChange={(event) => setNewStudent((current) => ({ ...current, phone: event.target.value }))} data-testid="new-student-phone" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">初始密码</Label>
              <Input
                id="password"
                type="password"
                value={newStudent.password}
                onChange={(event) => setNewStudent((current) => ({ ...current, password: event.target.value }))}
                placeholder="不填则使用 111111"
                data-testid="new-student-password"
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="grade">年级</Label>
                <Input id="grade" value={newStudent.grade} onChange={(event) => setNewStudent((current) => ({ ...current, grade: event.target.value }))} placeholder="例如：2" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gender">性别</Label>
                <select
                  id="gender"
                  value={newStudent.gender}
                  onChange={(event) => setNewStudent((current) => ({ ...current, gender: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="birthday">生日</Label>
                <Input id="birthday" type="date" value={newStudent.birthday} onChange={(event) => setNewStudent((current) => ({ ...current, birthday: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="classroom">所属班级</Label>
                <select
                  id="classroom"
                  value={newStudent.classroomId}
                  onChange={(event) => setNewStudent((current) => ({ ...current, classroomId: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">暂不分班</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="school">学校</Label>
              <Input id="school" value={newStudent.school} onChange={(event) => setNewStudent((current) => ({ ...current, school: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">地址</Label>
              <Input id="address" value={newStudent.address} onChange={(event) => setNewStudent((current) => ({ ...current, address: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void handleAddStudent()} className="bg-green-600 hover:bg-green-700" disabled={!newStudent.name.trim() || !newStudent.phone.trim()} data-testid="confirm-add-student">
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
