import { useState, useEffect } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import type { LeaderboardEntry, Classroom } from '@/types';

const STAGE_LABELS: Record<string, string> = {
  sprout: '种子',
  seedling: '发芽',
  small: '幼苗',
  medium: '小树',
  large: '大树',
  xlarge: '参天大树',
  fruitful: '硕果累累',
};

const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  2: 'bg-gray-100 text-gray-600 border-gray-300',
  3: 'bg-orange-100 text-orange-700 border-orange-300',
};

const RANK_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getClassrooms(1, 100).then(res => setClassrooms(res.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const classroomId = selectedClassroom === 'all' ? undefined : selectedClassroom;
        const data = await api.getLeaderboard(50, classroomId);
        setEntries(data);
      } catch {
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [selectedClassroom]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              积分排行榜
            </CardTitle>
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="筛选班级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部班级</SelectItem>
                {classrooms.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无排行数据</div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const isTop3 = entry.rank <= 3;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                      isTop3 ? RANK_STYLES[entry.rank] + ' border' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-10 text-center shrink-0">
                      {isTop3 ? (
                        <span className="text-2xl">{RANK_ICONS[entry.rank]}</span>
                      ) : (
                        <span className="text-lg font-bold text-gray-400">{entry.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={entry.avatar || ''} />
                      <AvatarFallback>{entry.name[0]}</AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isTop3 ? 'text-base' : 'text-sm'}`}>{entry.name}</span>
                        {entry.isSenior && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">资深</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{STAGE_LABELS[entry.stage] || entry.stage}</p>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <span className={`font-bold ${isTop3 ? 'text-xl' : 'text-lg'}`}>{entry.totalScore}</span>
                      <span className="text-xs text-gray-400 ml-1">分</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
