import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, ImagePlus, Medal, RefreshCw, Trees, Upload, User, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getScoreTypeLabel } from '@/hooks/useScoreSystem';
import { api, type StudentDetailAggregate } from '@/lib/api';
import type { Classroom, LeaderboardEntry, PracticeTarget, ScoreRecord, Student, Term, Work } from '@/types';

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

type WorkScope = 'classroom' | 'school' | 'both';

const termLabels: Record<Term, string> = {
  spring: '春季学期',
  summer: '暑假学期',
  autumn: '秋季学期',
};

const scopeLabels: Record<WorkScope, string> = {
  classroom: '班级作品墙',
  school: '学校作品墙',
  both: '班级和学校同时展示',
};

function getTermLabel(term: Term) {
  return termLabels[term];
}

function getGenderLabel(gender?: string) {
  if (gender === 'male') return '男';
  if (gender === 'female') return '女';
  return gender || '--';
}

function getClassroomName(classrooms: Classroom[], classroomId?: string) {
  if (!classroomId) return '未分班';
  return classrooms.find((item) => item.id === classroomId)?.name ?? '已关联班级';
}

function getRankFromLeaderboard(entries: LeaderboardEntry[], studentId: string) {
  const matched = entries.find((item) => item.id === studentId);
  return matched?.rank ?? null;
}

function describeScoreRecord(record: ScoreRecord, books: Book[]) {
  const typeLabel = getScoreTypeLabel(record.scoreType);

  if (record.scoreType === 'practice') {
    const bookName = books.find((item) => item.id === record.bookId)?.name;
    const targetLabel = record.targetPart === 'trunk' ? '树干' : '树根';
    return {
      title: `${typeLabel}录分`,
      detail: [
        bookName ? `练习册：${bookName}` : null,
        `计入部位：${targetLabel}`,
        record.reason ? `备注：${record.reason}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    };
  }

  if (record.scoreType === 'homework') {
    return {
      title: `${typeLabel}录分`,
      detail: record.reason ? `项目：${record.reason}` : '常规作业记分',
    };
  }

  if (record.scoreType === 'competition') {
    return {
      title: `${typeLabel}录分`,
      detail: record.reason ? `项目：${record.reason}` : '比赛成绩记分',
    };
  }

  if (record.scoreType === 'work') {
    const slotLabel = record.reason?.startsWith('slot:') ? `作品位 ${record.reason.split(':')[1]}` : '作品分';
    return {
      title: '作品更新',
      detail: [slotLabel, record.workId ? '已关联作品记录' : null].filter(Boolean).join(' · '),
    };
  }

  return {
    title: typeLabel,
    detail: record.reason || '无附加说明',
  };
}

function buildWorkSlots(works: Work[]) {
  return [1, 2].map((slot) => ({
    slot,
    work: works.find((item) => item.slotIndex === slot),
  }));
}

export function StudentDetail({ student, onBack, onStudentUpdated }: Props) {
  const [currentStudent, setCurrentStudent] = useState<Student>(student);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [detailContext, setDetailContext] = useState<StudentDetailAggregate | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
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
  const [workScope, setWorkScope] = useState<WorkScope>('classroom');
  const [workDesc, setWorkDesc] = useState('');
  const [classRank, setClassRank] = useState<number | null>(null);
  const [schoolRank, setSchoolRank] = useState<number | null>(null);
  const [rankNotice, setRankNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const selectedBook = useMemo(() => books.find((item) => item.id === bookId), [bookId, books]);
  const workSlots = useMemo(() => buildWorkSlots(works), [works]);

  async function reload(activeTerm = term) {
    setIsLoading(true);
    setError('');
    setRankNotice('');

    try {
      const [detailRes, classroomRes, bookRes, scoreRes, workRes] = await Promise.all([
        api.getStudentDetail(student.id),
        api.getClassrooms(1, 100),
        api.getBooks(),
        api.getStudentScores(student.id, 1, 100, undefined, activeTerm),
        api.getStudentWorks(student.id, 1, 20, activeTerm),
      ]);

      setCurrentStudent(detailRes.student);
      setDetailContext(detailRes);
      setClassrooms(classroomRes.items);
      setBooks(bookRes.items as Book[]);
      setRecords(scoreRes.items.length > 0 ? scoreRes.items : detailRes.growthDetail.items);
      setWorks(workRes.items.length > 0 ? workRes.items : detailRes.works.items);

      if (!bookId && bookRes.items.length > 0) {
        setBookId(bookRes.items[0].id);
      }

      onStudentUpdated?.(detailRes.student);

      const rankTasks: Promise<void>[] = [];

      if (detailRes.student.classroomId) {
        rankTasks.push(
          api
            .getLeaderboard(100, detailRes.student.classroomId)
            .then((entries) => setClassRank(getRankFromLeaderboard(entries, detailRes.student.id)))
            .catch(() => {
              setClassRank(null);
              setRankNotice('排行榜接口暂不可用时，将只显示基础资料。');
            })
        );
      } else {
        setClassRank(null);
      }

      rankTasks.push(
        api
          .getSchoolLeaderboard(100)
          .then((entries) => setSchoolRank(getRankFromLeaderboard(entries, detailRes.student.id)))
          .catch(() => {
            setSchoolRank(null);
            setRankNotice('排行榜接口暂不可用时，将只显示基础资料。');
          })
      );

      await Promise.all(rankTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : '学生详情加载失败');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setCurrentStudent(student);
  }, [student]);

  useEffect(() => {
    void reload(term);
  }, [student.id, term]);

  async function submitPractice() {
    if (!bookId) {
      setError('请先选择练习册');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setFeedback('');

    try {
      await api.addPracticeScore(student.id, {
        score: practiceScore,
        term,
        bookId,
        targetPart: practiceTarget,
        reason: practiceRemark || `${selectedBook?.name || '练习册'}录分`,
      });
      setPracticeRemark('');
      setFeedback('练习册分数已保存');
      await reload(term);
    } catch (err) {
      setError(err instanceof Error ? err.message : '练习册录分失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitHomework() {
    setIsSubmitting(true);
    setError('');
    setFeedback('');

    try {
      await api.addHomeworkScore(student.id, {
        score: homeworkScore,
        term,
        reason: homeworkName || '作业录分',
      });
      setHomeworkName('');
      setHomeworkScore(10);
      setFeedback('作业分数已保存');
      await reload(term);
    } catch (err) {
      setError(err instanceof Error ? err.message : '作业录分失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitCompetition() {
    setIsSubmitting(true);
    setError('');
    setFeedback('');

    try {
      await api.addCompetitionScore(student.id, {
        name: competitionName || '比赛录分',
        score: competitionScore,
        term,
      });
      setCompetitionName('');
      setCompetitionScore(80);
      setFeedback('比赛分数已保存');
      await reload(term);
    } catch (err) {
      setError(err instanceof Error ? err.message : '比赛录分失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function uploadWork(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setFeedback('');

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
      setFeedback(`作品位 ${workSlot} 已${workSlots.find((item) => item.slot === workSlot)?.work ? '替换' : '上传'}`);
      await reload(term);
    } catch (err) {
      setError(err instanceof Error ? err.message : '作品上传失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  const profileItems = [
    { label: '手机号', value: currentStudent.phone, icon: User },
    {
      label: '所在班级',
      value: detailContext?.classroom?.name || getClassroomName(classrooms, currentStudent.classroomId),
      icon: Users,
    },
    {
      label: '负责老师',
      value: detailContext?.teacher?.name || '未关联老师',
      icon: User,
    },
    { label: '学校', value: currentStudent.school || '--', icon: BookOpen },
    { label: '年级 / 性别', value: `${currentStudent.grade || '--'} / ${getGenderLabel(currentStudent.gender)}`, icon: Trees },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回学生列表
        </Button>
        <Button variant="outline" onClick={() => void reload(term)} disabled={isLoading || isSubmitting}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          刷新详情
        </Button>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
      {rankNotice ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{rankNotice}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{currentStudent.name}</span>
            <Badge variant="outline">{getTermLabel(term)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {profileItems.map((item) => (
              <div key={item.label} className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
                <div className="mt-1 font-medium">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-sm text-slate-500">累计总分</div>
              <div className="mt-1 text-2xl font-bold text-green-600">{currentStudent.totalScore}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-sm text-slate-500">树根 / 树干</div>
              <div className="mt-1 font-medium">
                {currentStudent.rootScore} / {currentStudent.trunkScore}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-sm text-slate-500">班级排名</div>
              <div className="mt-1 flex items-center gap-1 font-medium">
                <Users className="h-4 w-4 text-blue-500" />
                {currentStudent.classroomId ? (classRank ? `第 ${classRank} 名` : '暂无') : '未分班'}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="text-sm text-slate-500">学校排名</div>
              <div className="mt-1 flex items-center gap-1 font-medium">
                <Medal className="h-4 w-4 text-amber-500" />
                {schoolRank ? `第 ${schoolRank} 名` : '暂无'}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-600">
              生日：{currentStudent.birthday || '--'}
            </div>
            <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-600">
              地址：{currentStudent.address || '--'}
            </div>
            <div className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-600">
              当前阶段：{currentStudent.stage}（{currentStudent.isSenior ? '资深学员' : '成长中'}）
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>本学期录入</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <Label>学期</Label>
            <Select value={term} onValueChange={(value) => setTerm(value as Term)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spring">春季学期</SelectItem>
                <SelectItem value="summer">暑假学期</SelectItem>
                <SelectItem value="autumn">秋季学期</SelectItem>
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
              {books.length === 0 ? (
                <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  当前没有可用练习册，暂时无法录入练习册分数。
                </div>
              ) : null}
              <Textarea value={practiceRemark} onChange={(event) => setPracticeRemark(event.target.value)} placeholder="备注，例如：树根专项补录" />
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
                  <Select value={workScope} onValueChange={(value) => setWorkScope(value as WorkScope)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classroom">班级作品墙</SelectItem>
                      <SelectItem value="school">学校作品墙</SelectItem>
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
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadWork(file);
                    }
                    event.currentTarget.value = '';
                  }}
                />
                <Button asChild disabled={isSubmitting}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    上传或替换作品位 {workSlot}
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
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-500">当前查看：{getTermLabel(term)}，共 {records.length} 条记录</div>
            {isLoading ? (
              <div className="text-sm text-slate-400">正在加载成长明细...</div>
            ) : records.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400">
                当前学期还没有成长记录。
              </div>
            ) : (
              records.map((record) => {
                const description = describeScoreRecord(record, books);
                return (
                  <div key={record.id} className="rounded-lg border p-3 text-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary">{getScoreTypeLabel(record.scoreType)}</Badge>
                      {record.term ? <Badge variant="outline">{getTermLabel(record.term as Term)}</Badge> : null}
                    </div>
                    <div className="font-medium">{description.title}</div>
                    <div className="mt-1 text-slate-500">{description.detail}</div>
                    <div className="mt-2 text-slate-500">
                      生效分 {record.score}
                      {record.rawScore !== undefined && record.rawScore !== null ? ` · 原始分 ${record.rawScore}` : ''}
                      {record.multiplier && record.multiplier > 1 ? ` · 倍率 x${record.multiplier}` : ''}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{new Date(record.createdAt).toLocaleString()}</div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>作品位状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-slate-500">当前查看：{getTermLabel(term)} 的作品位 1 / 2 状态</div>
            {workSlots.map(({ slot, work }) => (
              <div key={slot} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium">
                    <ImagePlus className="h-4 w-4 text-blue-500" />
                    作品位 {slot}
                  </div>
                  <Badge variant={work ? 'secondary' : 'outline'}>{work ? '已上传' : '空位'}</Badge>
                </div>

                {work ? (
                  <div className="space-y-2 text-sm">
                    <img src={work.imageUrl} alt={`作品位 ${slot}`} className="h-40 w-full rounded object-cover" />
                    <div>分数：{work.score}</div>
                    <div>范围：{scopeLabels[work.galleryScope as WorkScope] || work.galleryScope}</div>
                    <div>说明：{work.description || '--'}</div>
                    <div className="text-xs text-slate-400">更新时间：{new Date(work.createdAt).toLocaleString()}</div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400">
                    当前学期作品位 {slot} 还未上传。
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
