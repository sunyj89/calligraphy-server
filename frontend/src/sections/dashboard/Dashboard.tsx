import { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { OverviewStatistics } from '@/types';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const STAGE_LABELS: Record<string, string> = {
  sprout: '种子',
  seedling: '发芽',
  small: '幼苗',
  medium: '小树',
  large: '大树',
  xlarge: '参天大树',
  fruitful: '硕果累累',
};

const STAGE_COLORS = ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d'];

export function Dashboard() {
  const [stats, setStats] = useState<OverviewStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getOverviewStatistics();
        setStats(data);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-20 text-gray-400">加载统计数据失败</div>;
  }

  // 饼图数据
  const pieData = Object.entries(stats.stageDistribution || {}).map(([stage, count]) => ({
    name: STAGE_LABELS[stage] || stage,
    value: count,
  }));

  // 趋势图数据
  const trendData = (stats.scoreTrend || []).map(item => ({
    date: item.date.slice(5), // MM-DD
    count: item.count,
    totalScore: item.totalScore,
  }));

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总学员数</p>
                <p className="text-3xl font-bold">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">教师数</p>
                <p className="text-3xl font-bold">{stats.totalTeachers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班级数</p>
                <p className="text-3xl font-bold">{stats.totalClassrooms}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本周活跃</p>
                <p className="text-3xl font-bold">{stats.activeThisWeek}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表行 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 成长阶段分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">成长阶段分布</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无数据</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 近30天积分趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">近30天积分趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无数据</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" name="操作次数" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalScore" name="积分总量" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 资深学员统计 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌟</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">资深学员</p>
              <p className="text-2xl font-bold">{stats.seniorStudents} <span className="text-sm font-normal text-gray-500">/ {stats.totalStudents} 总学员</span></p>
              <p className="text-xs text-gray-400 mt-1">
                {stats.totalStudents > 0
                  ? `占比 ${((stats.seniorStudents / stats.totalStudents) * 100).toFixed(1)}%`
                  : '暂无学员'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
