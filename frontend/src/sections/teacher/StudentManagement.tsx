import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, TrendingUp, Award, Users, Calendar, Trash2, Plus, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { Student, GrowthStage, Statistics } from '@/types';
import { api } from '@/lib/api';

interface StudentManagementProps {
  onSelectStudent: (student: Student) => void;
}

const stageConfig: Record<GrowthStage, { label: string; color: string; icon: string; minScore: number; maxScore: number }> = {
  sprout: { label: '萌芽宝宝', color: 'bg-emerald-100 text-emerald-600', icon: '🌱', minScore: 0, maxScore: 1499 },
  seedling: { label: '努力伸腰', color: 'bg-green-100 text-green-600', icon: '🌿', minScore: 1500, maxScore: 2999 },
  small: { label: '撑起小伞', color: 'bg-teal-100 text-teal-600', icon: '☂️', minScore: 3000, maxScore: 4499 },
  medium: { label: '有模有样', color: 'bg-cyan-100 text-cyan-600', icon: '🌲', minScore: 4500, maxScore: 5999 },
  large: { label: '披上绿袍', color: 'bg-green-100 text-green-600', icon: '🌳', minScore: 6000, maxScore: 7499 },
  xlarge: { label: '绿意满满', color: 'bg-lime-100 text-lime-600', icon: '🌴', minScore: 7500, maxScore: 8999 },
  fruitful: { label: '硕果累累', color: 'bg-amber-100 text-amber-600', icon: '🍎', minScore: 9000, maxScore: 999999 },
};

const stageOrder: GrowthStage[] = ['sprout', 'seedling', 'small', 'medium', 'large', 'xlarge', 'fruitful'];

const getNextStageTarget = (stage: GrowthStage): number | null => {
  const currentIndex = stageOrder.indexOf(stage);
  if (currentIndex < stageOrder.length - 1) {
    return stageConfig[stageOrder[currentIndex + 1]].minScore;
  }
  return null;
};

export function StudentManagement({ onSelectStudent }: StudentManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({ totalStudents: 0, seniorStudents: 0 });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    phone: '',
    password: '',
    address: '',
    school: '',
    grade: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 加载学生列表
  const loadStudents = useCallback(async (search?: string) => {
    try {
      const res = await api.getStudents(1, 100, search || undefined);
      setStudents(res.items);
    } catch (err) {
      console.error('加载学生列表失败:', err);
    }
  }, []);

  // 加载统计数据
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await api.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStudents();
      void loadStatistics();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadStudents, loadStatistics]);

  // 搜索防抖
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      loadStudents(searchQuery);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, loadStudents]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('仅支持 JPG 和 PNG 格式的图片');
      return;
    }

    if (file.size > 1024 * 1024) {
      alert('图片大小不能超过 1MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.name.trim() || !newStudent.phone.trim() || !newStudent.password.trim()) return;

    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const uploadRes = await api.uploadImage(avatarFile);
        avatarUrl = uploadRes.url;
      }

      await api.createStudent({
        name: newStudent.name,
        phone: newStudent.phone,
        password: newStudent.password,
        avatar: avatarUrl,
        address: newStudent.address || undefined,
        school: newStudent.school || undefined,
        grade: newStudent.grade || undefined,
      });

      setNewStudent({ name: '', phone: '', password: '', address: '', school: '', grade: '' });
      setAvatarPreview(null);
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsAddDialogOpen(false);

      await loadStudents(searchQuery);
      await loadStatistics();
    } catch (err) {
      alert(err instanceof Error ? err.message : '添加学员失败');
    }
  };

  const handleDeleteStudent = async (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除该学员吗？')) return;
    try {
      await api.deleteStudent(studentId);
      await loadStudents(searchQuery);
      await loadStatistics();
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除学员失败');
    }
  };

  const statCards = [
    { title: '总学员数', value: statistics.totalStudents, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: '今日新增', value: statistics.newToday ?? '--', icon: User, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: '活跃学员', value: statistics.activeStudents ?? '--', icon: TrendingUp, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { title: '资深学员', value: statistics.seniorStudents, icon: Award, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            学员列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索学员姓名/手机号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
              data-testid="add-student-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加学员
            </Button>
          </div>

          {/* 学员表格 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">学员</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">当前总分</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">成长阶段</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">加入时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody data-testid="student-list">
                {students.map((student, index) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => onSelectStudent(student)}
                    data-testid="student-row"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>{student.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-green-600">{student.totalScore}</span>
                        {getNextStageTarget(student.stage) ? (
                          <span className="text-sm text-gray-400">→ {getNextStageTarget(student.stage)}</span>
                        ) : (
                          <span className="text-sm text-amber-500">✓ 已满级</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {stageConfig[student.stage] ? (
                        <Badge className={`${stageConfig[student.stage].color} border-0`}>
                          <span className="mr-1">{stageConfig[student.stage].icon}</span>
                          {stageConfig[student.stage].label}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600 border-0">🌱 萌芽宝宝</Badge>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '--'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudent(student);
                          }}
                        >
                          管理
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={(e) => handleDeleteStudent(student.id, e)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {students.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500">暂无学员数据</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加学员对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加新学员</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <Label>头像</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="头像预览" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="w-10 h-10" />
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
                    id="avatar-upload"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    选择图片
                  </Button>
                  {avatarPreview && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveAvatar} className="text-red-500 hover:text-red-600">
                      <X className="w-4 h-4 mr-2" />
                      移除
                    </Button>
                  )}
                  <p className="text-xs text-gray-400">格式: JPG/PNG，大小: 不超过 1MB</p>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input id="name" placeholder="请输入学员姓名" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} data-testid="new-student-name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">电话 *</Label>
              <Input id="phone" placeholder="请输入学员电话" value={newStudent.phone} onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })} data-testid="new-student-phone" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">初始密码 *</Label>
              <Input id="password" type="password" placeholder="请设置学生初始密码" value={newStudent.password} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} data-testid="new-student-password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">住址</Label>
              <Input id="address" placeholder="请输入学员住址" value={newStudent.address} onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="school">学校</Label>
              <Input id="school" placeholder="请输入就读学校" value={newStudent.school} onChange={(e) => setNewStudent({ ...newStudent, school: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grade">年级</Label>
              <Input id="grade" placeholder="请输入年级" value={newStudent.grade} onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddStudent} className="bg-green-600 hover:bg-green-700" disabled={!newStudent.name.trim() || !newStudent.phone.trim() || !newStudent.password.trim()} data-testid="confirm-add-student">
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
