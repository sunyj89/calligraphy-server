import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Medal, Upload, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { deriveTitle, getScoreTypeLabel } from '@/hooks/useScoreSystem';
import type { PracticeTarget, Student, Term, Work } from '@/types';

interface Book {
  id: string;
  name: string;
  orderNum: number;
}

interface Props {
  student: Student;
  onBack: () => void;
  onStudentUpdated?: (student: Student) => void;
}

export function StudentDetail({ student, onBack, onStudentUpdated }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [term, setTerm] = useState<Term>('spring');
  const [bookId, setBookId] = useState('');
  const [practiceTarget, setPracticeTarget] = useState<PracticeTarget>('root');
  const [practiceScore, setPracticeScore] = useState<5 | 20 | 50 | 70>(50);
  const [practiceRemark, setPracticeRemark] = useState('');
  const [homeworkName, setHomeworkName] = useState('');
  const [homeworkScore, setHomeworkScore] = useState(10);
  const [competitionName, setCompetitionName] = useState('');
  const [competitionScore, setCompetitionScore] = useState(80);
  const [workSlot, setWorkSlot] = useState<1 | 2>(1);
  const [workScore, setWorkScore] = useState(80);
  const [workScope, setWorkScope] = useState<'classroom' | 'school' | 'both'>('classroom');
  const [workDesc, setWorkDesc] = useState('');
  const [classRank, setClassRank] = useState<number | null>(null);
  const [schoolRank, setSchoolRank] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBook = useMemo(() => books.find((item) => item.id === bookId), [bookId, books]);

  async function reload() {
    const [bookRes, scoreRes, workRes, studentRes, classLb, schoolLb] = await Promise.all([
      api.getBooks(),
      api.getStudentScores(student.id, 1, 100, undefined, term),
      api.getStudentWorks(student.id, 1, 20, term),
      api.getStudent(student.id),
      student.classroomId ? api.getLeaderboard(100, student.classroomId) : Promise.resolve([]),
      api.getSchoolLeaderboard(100),
    ]);

    setBooks(bookRes.items as Book[]);
    setRecords(scoreRes.items);
    setWorks(workRes.items);
    if (!bookId && bookRes.items.length > 0) setBookId(bookRes.items[0].id);
    setClassRank(classLb.findIndex((item) => item.id === student.id) + 1 || null);
    setSchoolRank(schoolLb.findIndex((item) => item.id === student.id) + 1 || null);
    onStudentUpdated?.(studentRes);
  }

  useEffect(() => {
    void reload();
  }, [student.id, term]);

  async function submitPractice() {
    if (!bookId) return;
    setIsSubmitting(true);
    try {
      await api.addPracticeScore(student.id, {
        score: practiceScore,
        term,
        bookId,
        targetPart: practiceTarget,
        reason: practiceRemark || `${selectedBook?.name || '练习册'}录分`,
      });
      setPracticeRemark('');
      await reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitHomework() {
    setIsSubmitting(true);
    try {
      await api.addHomeworkScore(student.id, {
        score: homeworkScore,
        term,
        reason: homeworkName || '作业录分',
      });
      setHomeworkName('');
      setHomeworkScore(10);
      await reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitCompetition() {
    setIsSubmitting(true);
    try {
      await api.addCompetitionScore(student.id, {
        name: competitionName || '比赛录分',
        score: competitionScore,
        term,
      });
      setCompetitionName('');
      setCompetitionScore(80);
      await reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function uploadWork(file: File) {
    setIsSubmitting(true);
    try {
      const uploaded = await api.uploadImage(file);
      await api.createWork(student.id, {
        imageUrl: uploaded.url,
        description: workDesc || undefined,
        score: workScore,
        term,
        slotIndex: workSlot,
        galleryScope: workScope,
      });
      setWorkDesc('');
      await reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回学生列表
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{student.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-sm text-slate-500">手机号</div>
            <div className="mt-1 font-medium">{student.phone}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-sm text-slate-500">累计总分</div>
            <div className="mt-1 text-xl font-bold text-green-600">{student.totalScore}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-sm text-slate-500">班级排名</div>
            <div className="mt-1 flex items-center gap-1 font-medium">
              <Users className="h-4 w-4 text-blue-500" />
              {classRank ? `第 ${classRank} 名` : '暂无'}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-sm text-slate-500">学校排名</div>
            <div className="mt-1 flex items-center gap-1 font-medium">
              <Medal className="h-4 w-4 text-amber-500" />
              {schoolRank ? `第 ${schoolRank} 名` : '暂无'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>本学期操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Label>学期</Label>
            <Select value={term} onValueChange={(value) => setTerm(value as Term)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spring">春季</SelectItem>
                <SelectItem value="summer">暑假</SelectItem>
                <SelectItem value="autumn">秋季</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="practice">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="practice">练习册</TabsTrigger>
              <TabsTrigger value="homework">作业</TabsTrigger>
              <TabsTrigger value="competition">比赛</TabsTrigger>
              <TabsTrigger value="work">作品</TabsTrigger>
            </TabsList>

            <TabsContent value="practice" className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>练习册</Label>
                  <Select value={bookId} onValueChange={setBookId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择练习册" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.orderNum}. {book.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>计入部位</Label>
                  <Select value={practiceTarget} onValueChange={(value) => setPracticeTarget(value as PracticeTarget)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">树根</SelectItem>
                      <SelectItem value="trunk">树干</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>分值档位</Label>
                  <Select value={String(practiceScore)} onValueChange={(value) => setPracticeScore(Number(value) as 5 | 20 | 50 | 70)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 20, 50, 70].map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea value={practiceRemark} onChange={(event) => setPracticeRemark(event.target.value)} placeholder="备注，例如：重写后覆盖旧分" />
              <Button onClick={submitPractice} disabled={isSubmitting || !bookId}>
                保存练习册分数
              </Button>
            </TabsContent>

            <TabsContent value="homework" className="space-y-3">
              <Input value={homeworkName} onChange={(event) => setHomeworkName(event.target.value)} placeholder="作业名称" />
              <Input type="number" min={0} max={100} value={homeworkScore} onChange={(event) => setHomeworkScore(Number(event.target.value) || 0)} />
              <Button onClick={submitHomework} disabled={isSubmitting}>
                保存作业分数
              </Button>
            </TabsContent>

            <TabsContent value="competition" className="space-y-3">
              <Input value={competitionName} onChange={(event) => setCompetitionName(event.target.value)} placeholder="比赛名称" />
              <Input type="number" min={0} max={100} value={competitionScore} onChange={(event) => setCompetitionScore(Number(event.target.value) || 0)} />
              <Button onClick={submitCompetition} disabled={isSubmitting}>
                保存比赛分数
              </Button>
            </TabsContent>

            <TabsContent value="work" className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>作品位</Label>
                  <Select value={String(workSlot)} onValueChange={(value) => setWorkSlot(Number(value) as 1 | 2)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">作品位 1</SelectItem>
                      <SelectItem value="2">作品位 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>展示范围</Label>
                  <Select value={workScope} onValueChange={(value) => setWorkScope(value as 'classroom' | 'school' | 'both')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classroom">班级作品展</SelectItem>
                      <SelectItem value="school">学校作品展</SelectItem>
                      <SelectItem value="both">同时展示</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>作品分数</Label>
                  <Input type="number" min={0} max={100} value={workScore} onChange={(event) => setWorkScore(Number(event.target.value) || 0)} />
                </div>
              </div>
              <Input value={workDesc} onChange={(event) => setWorkDesc(event.target.value)} placeholder="作品说明" />
              <label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadWork(file);
                    event.currentTarget.value = '';
                  }}
                />
                <Button asChild disabled={isSubmitting}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    上传或替换作品
                  </span>
                </Button>
              </label>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>成长明细</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {records.length === 0 ? (
              <div className="text-sm text-slate-400">当前学期还没有记录</div>
            ) : (
              records.map((record) => (
                <div key={record.id} className="rounded-lg border p-3 text-sm">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{getScoreTypeLabel(record.scoreType)}</span>
                    <span className="font-medium">{deriveTitle(record)}</span>
                  </div>
                  <div className="text-slate-500">
                    生效分 {record.score}
                    {record.rawScore ? ` · 原始分 ${record.rawScore}` : ''}
                    {record.multiplier && record.multiplier > 1 ? ` · 倍率 x${record.multiplier}` : ''}
                    {record.targetPart ? ` · ${record.targetPart === 'root' ? '树根' : '树干'}` : ''}
                  </div>
                  <div className="text-slate-400">{new Date(record.createdAt).toLocaleString()}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>作品位</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {works.length === 0 ? (
              <div className="text-sm text-slate-400">当前学期还没有作品</div>
            ) : (
              works.map((work) => (
                <div key={work.id} className="rounded-lg border p-3 text-sm">
                  <img src={work.imageUrl} alt="work" className="mb-2 h-32 w-full rounded object-cover" />
                  <div>作品位 {work.slotIndex}</div>
                  <div>分数 {work.score}</div>
                  <div>范围 {work.galleryScope}</div>
                  <div className="text-slate-500">{work.description || '无说明'}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
