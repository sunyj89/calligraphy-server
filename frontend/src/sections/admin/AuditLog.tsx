import { useState, useEffect, useCallback } from 'react';
import { ScrollText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface AuditLogItem {
  id: string;
  teacherId: string;
  teacherName: string;
  action: string;
  targetType: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  add_score: '加分',
  reset_password: '重置密码',
  login: '登录',
};

const TARGET_LABELS: Record<string, string> = {
  student: '学员',
  teacher: '教师',
  classroom: '班级',
  book: '练习册',
  score: '积分',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  add_score: 'bg-amber-100 text-amber-700',
  reset_password: 'bg-purple-100 text-purple-700',
  login: 'bg-gray-100 text-gray-700',
};

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterTarget, setFilterTarget] = useState<string>('all');

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const action = filterAction === 'all' ? undefined : filterAction;
      const targetType = filterTarget === 'all' ? undefined : filterTarget;
      const res = await api.getAuditLogs(page, 20, action, targetType);
      setLogs(res.items);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [page, filterAction, filterTarget]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-blue-600" />
              操作日志
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="操作类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部操作</SelectItem>
                  <SelectItem value="create">创建</SelectItem>
                  <SelectItem value="update">更新</SelectItem>
                  <SelectItem value="delete">删除</SelectItem>
                  <SelectItem value="add_score">加分</SelectItem>
                  <SelectItem value="reset_password">重置密码</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTarget} onValueChange={(v) => { setFilterTarget(v); setPage(1); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="目标类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部目标</SelectItem>
                  <SelectItem value="student">学员</SelectItem>
                  <SelectItem value="teacher">教师</SelectItem>
                  <SelectItem value="classroom">班级</SelectItem>
                  <SelectItem value="book">练习册</SelectItem>
                  <SelectItem value="score">积分</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无操作日志</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Badge className={`${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'} border-0 shrink-0`}>
                    {ACTION_LABELS[log.action] || log.action}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.teacherName}</span>
                      <span className="text-gray-500 mx-1">
                        {ACTION_LABELS[log.action] || log.action}了
                      </span>
                      <span className="text-gray-600">
                        {TARGET_LABELS[log.targetType] || log.targetType}
                      </span>
                      {log.detail && typeof (log.detail as Record<string, unknown>).name === 'string' && (
                        <span className="text-gray-700 font-medium ml-1">
                          "{(log.detail as Record<string, string>).name}"
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '--'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </Button>
              <span className="text-sm text-gray-500">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
