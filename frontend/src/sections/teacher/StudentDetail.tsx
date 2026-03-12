import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, TreePine, Leaf, History, CheckCircle, AlertCircle, Award, Image, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Student, GrowthStage, Work } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useScoreSystem, deriveTitle } from '@/hooks/useScoreSystem';

const stageImageMap: Record<GrowthStage, string> = {
  sprout: '/images/stage01.png',
  seedling: '/images/stage02.png',
  small: '/images/stage03.png',
  medium: '/images/stage04.png',
  large: '/images/stage05.png',
  xlarge: '/images/stage06.png',
  fruitful: '/images/stage07.png',
};

interface BackendBook {
  id: string;
  name: string;
  orderNum: number;
}

interface StudentDetailProps {
  student: Student;
  onBack: () => void;
  onStudentUpdated?: (student: Student) => void;
}

export function StudentDetail({ student, onBack, onStudentUpdated }: StudentDetailProps) {
  const { teacher } = useAuth();
  const { student: currentStudent, records, isLoading, loadRecords, addBasicPracticeScore, addHomeworkScore, addCompetitionScore, addAdjustment } = useScoreSystem(student);
  const [activeTab, setActiveTab] = useState('basic');
  const [books, setBooks] = useState<BackendBook[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [previewWork, setPreviewWork] = useState<string | null>(null);

  const [basicForm, setBasicForm] = useState({ bookId: '', score: 50 as 5 | 20 | 50, remark: '' });
  const [homeworkForm, setHomeworkForm] = useState({ name: '', score: 2 });
  const [competitionForm, setCompetitionForm] = useState({ name: '', score: 40 });
  const [adjustmentForm, setAdjustmentForm] = useState({ type: '', score: 0, reason: '' });

  useEffect(() => {
    loadRecords(student.id);
    api.getBooks().then(res => {
      setBooks(res.items);
      setBasicForm(prev => (
        prev.bookId || res.items.length === 0
          ? prev
          : { ...prev, bookId: res.items[0].id }
      ));
    }).catch(() => {});
    api.getStudentWorks(student.id, 1, 50).then(res => {
      setWorks(res.items as unknown as Work[]);
    }).catch(() => {});
  }, [student.id, loadRecords]);

  const refreshAndNotify = async () => {
    const updated = await api.getStudent(student.id);
    onStudentUpdated?.(updated);
  };

  const handleUploadWork = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await api.uploadImage(file);
      await api.createWork(student.id, { imageUrl: url });
      const res = await api.getStudentWorks(student.id, 1, 50);
      setWorks(res.items as unknown as Work[]);
    } catch (err) {
      alert(err instanceof Error ? err.message : '上传失败');
    }
    e.target.value = '';
  };

  const handleDeleteWork = async (workId: string) => {
    if (!confirm('确认删除该作品？')) return;
    try {
      await api.deleteWork(workId);
      setWorks(prev => prev.filter(w => w.id !== workId));
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleBasicSubmit = async () => {
    if (await addBasicPracticeScore(basicForm)) {
      setBasicForm(prev => ({ ...prev, remark: '' }));
      refreshAndNotify();
    }
  };

  const handleHomeworkSubmit = async () => {
    if (await addHomeworkScore(homeworkForm)) {
      setHomeworkForm({ name: '', score: 2 });
      refreshAndNotify();
    }
  };

  const handleCompetitionSubmit = async () => {
    if (await addCompetitionScore(competitionForm)) {
      setCompetitionForm({ name: '', score: 40 });
      refreshAndNotify();
    }
  };

  const handleAdjustmentSubmit = async () => {
    if (await addAdjustment(adjustmentForm)) {
      setAdjustmentForm({ type: '', score: 0, reason: '' });
      refreshAndNotify();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'basic': case 'root': case 'trunk': return 'bg-blue-100 text-blue-600';
      case 'homework': case 'leaf': return 'bg-green-100 text-green-600';
      case 'competition': case 'fruit': return 'bg-amber-100 text-amber-600';
      case 'adjustment': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'basic': case 'root': case 'trunk': return '基础练习';
      case 'homework': case 'leaf': return '日常作业';
      case 'competition': case 'fruit': return '比赛作品';
      case 'adjustment': return '积分调整';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回学员列表
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={currentStudent.avatar} />
                  <AvatarFallback>{currentStudent.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{currentStudent.name}</h2>
                  <p className="text-gray-500">{currentStudent.phone}</p>
                  <p className="text-sm text-gray-400">加入时间: {currentStudent.createdAt ? new Date(currentStudent.createdAt).toLocaleDateString() : '--'}</p>
                </div>
              </div>

              <div className="relative h-48 bg-gradient-to-b from-sky-100 to-white rounded-xl overflow-hidden mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img src={stageImageMap[currentStudent.stage] || stageImageMap.sprout} alt="成长树" className="h-40 w-auto object-contain" />
                </div>
                {currentStudent.isSenior && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                      <Award className="w-3 h-3 mr-1" />
                      资深学员
                    </Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 mb-1"><TreePine className="w-4 h-4" /><span className="text-sm">累计总分</span></div>
                  <p className="text-2xl font-bold text-green-700">{currentStudent.totalScore}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-1"><BookOpen className="w-4 h-4" /><span className="text-sm">树根得分</span></div>
                  <p className="text-2xl font-bold text-blue-700">{currentStudent.rootScore}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-600 mb-1"><TreePine className="w-4 h-4" /><span className="text-sm">树干得分</span></div>
                  <p className="text-2xl font-bold text-amber-700">{currentStudent.trunkScore}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-600 mb-1"><Leaf className="w-4 h-4" /><span className="text-sm">树叶数</span></div>
                  <p className="text-2xl font-bold text-purple-700">{currentStudent.leafCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                积分操作
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="basic">基础练习</TabsTrigger>
                  <TabsTrigger value="homework">日常作业</TabsTrigger>
                  <TabsTrigger value="competition">比赛作品</TabsTrigger>
                  <TabsTrigger value="adjustment">积分调整</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-2">
                    <Label>选择练习册</Label>
                    <Select value={basicForm.bookId} onValueChange={(v) => setBasicForm({ ...basicForm, bookId: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {books.map((book) => (
                          <SelectItem key={book.id} value={book.id}>
                            第{book.orderNum}册: {book.name} {book.orderNum <= 16 ? '(树根)' : '(树干)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>得分等级</Label>
                    <RadioGroup value={basicForm.score.toString()} onValueChange={(v) => setBasicForm({ ...basicForm, score: parseInt(v) as 5 | 20 | 50 })} className="flex gap-4">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="5" id="score5" /><Label htmlFor="score5">5分</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="20" id="score20" /><Label htmlFor="score20">20分</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="50" id="score50" /><Label htmlFor="score50">50分</Label></div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>备注 (选填)</Label>
                    <Textarea placeholder="如：悬针竖写得很直" value={basicForm.remark} onChange={(e) => setBasicForm({ ...basicForm, remark: e.target.value })} />
                  </div>
                  <Button onClick={handleBasicSubmit} className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading} data-testid="submit-basic">
                    {isLoading ? '提交中...' : '确认加分'}
                  </Button>
                </TabsContent>

                <TabsContent value="homework" className="space-y-4">
                  <div className="space-y-2">
                    <Label>作业名称</Label>
                    <Input placeholder="如：第5课 课后练习" value={homeworkForm.name} onChange={(e) => setHomeworkForm({ ...homeworkForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>得分: {homeworkForm.score}分</Label>
                    <Slider value={[homeworkForm.score]} onValueChange={([v]) => setHomeworkForm({ ...homeworkForm, score: v })} min={1} max={3} step={0.5} />
                    <div className="flex justify-between text-sm text-gray-500"><span>1分</span><span>2分</span><span>3分</span></div>
                  </div>
                  {currentStudent.isSenior && (
                    <div className="bg-amber-50 p-3 rounded-lg flex items-center gap-2 text-amber-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">该学员为资深学员，作业得分将自动翻倍</span>
                    </div>
                  )}
                  <Button onClick={handleHomeworkSubmit} className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading} data-testid="submit-homework">
                    {isLoading ? '提交中...' : '确认加分'}
                  </Button>
                </TabsContent>

                <TabsContent value="competition" className="space-y-4">
                  <div className="space-y-2">
                    <Label>作品/比赛名称</Label>
                    <Input placeholder="如：校艺术节书法展" value={competitionForm.name} onChange={(e) => setCompetitionForm({ ...competitionForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>得分 (30-50分)</Label>
                    <Input type="number" min={30} max={50} value={competitionForm.score} onChange={(e) => setCompetitionForm({ ...competitionForm, score: parseInt(e.target.value) || 30 })} />
                  </div>
                  <Button onClick={handleCompetitionSubmit} className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading} data-testid="submit-competition">
                    {isLoading ? '提交中...' : '确认加分'}
                  </Button>
                </TabsContent>

                <TabsContent value="adjustment" className="space-y-4">
                  <div className="space-y-2">
                    <Label>调整类型</Label>
                    <Select value={adjustmentForm.type} onValueChange={(v) => setAdjustmentForm({ ...adjustmentForm, type: v })}>
                      <SelectTrigger><SelectValue placeholder="选择调整类型" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="系统修正">系统修正</SelectItem>
                        <SelectItem value="课堂纪律扣分">课堂纪律扣分</SelectItem>
                        <SelectItem value="补录分数">补录分数</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>调整数值 (支持负数)</Label>
                    <Input type="number" placeholder="如：-10" value={adjustmentForm.score} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, score: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>调整原因 (必填)</Label>
                    <Textarea placeholder="请输入调整原因..." value={adjustmentForm.reason} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })} />
                  </div>
                  <Button onClick={handleAdjustmentSubmit} className="w-full bg-red-500 hover:bg-red-600" disabled={isLoading} data-testid="submit-adjustment">
                    {isLoading ? '提交中...' : '提交调整'}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                操作记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {records.map((record, index) => (
                    <div key={record.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg animate-in fade-in slide-in-from-left" style={{ animationDelay: `${index * 50}ms` }}>
                      <Badge className={`${getTypeColor(record.scoreType)} border-0 shrink-0`}>
                        {getTypeLabel(record.scoreType)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{deriveTitle(record)}</p>
                        {record.reason && <p className="text-xs text-gray-500 mt-1">{record.reason}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {record.createdAt ? new Date(record.createdAt).toLocaleString() : '--'} · {teacher?.name || '--'}
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${record.score >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {record.score >= 0 ? '+' : ''}{record.score}
                      </div>
                    </div>
                  ))}
                  {records.length === 0 && <div className="text-center py-8 text-gray-400">暂无操作记录</div>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="w-5 h-5 text-purple-600" />
                  学生作品
                </CardTitle>
                <label>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadWork} />
                  <Button variant="outline" size="sm" asChild>
                    <span><Upload className="w-3.5 h-3.5 mr-1" />上传作品</span>
                  </Button>
                </label>
              </div>
            </CardHeader>
            <CardContent>
              {works.length === 0 ? (
                <div className="text-center py-8 text-gray-400">暂无作品</div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {works.map(w => (
                    <div key={w.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={w.thumbnailUrl || w.imageUrl}
                        alt="作品"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewWork(w.imageUrl)}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="text-white" onClick={() => handleDeleteWork(w.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="absolute bottom-0 left-0 right-0 text-xs text-white bg-black/50 px-2 py-1 truncate">
                        {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 作品预览 */}
      <Dialog open={!!previewWork} onOpenChange={() => setPreviewWork(null)}>
        <DialogContent className="max-w-3xl p-2">
          {previewWork && <img src={previewWork} alt="作品预览" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
