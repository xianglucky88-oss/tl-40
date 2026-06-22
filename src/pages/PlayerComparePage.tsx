import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Trophy,
  Medal,
  Target,
  Swords,
  TrendingUp,
  GitCompare,
  Search,
  Award,
  Check,
  X,
  BarChart3,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import RankBadge from '@/components/ui/RankBadge';
import { cn } from '@/lib/utils';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export default function PlayerComparePage() {
  const { idA, idB } = useParams<{ idA: string; idB: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const store = useDebateStore();
  const [selectingSlot, setSelectingSlot] = useState<'a' | 'b' | null>(null);
  const [searchKey, setSearchKey] = useState('');

  const slotA = idA || searchParams.get('idA') || '';
  const slotB = idB || searchParams.get('idB') || '';

  const detailA = slotA ? store.getPlayerDetail(slotA) : null;
  const detailB = slotB ? store.getPlayerDetail(slotB) : null;

  const playerRankings = store.playerRankings();

  const allPlayers = useMemo(() => {
    const players: {
      playerId: string;
      playerName: string;
      teamName: string;
      institution: string;
      avgScore: number;
      mvpCount: number;
    }[] = [];
    store.teams.forEach((team) => {
      team.players.forEach((player) => {
        const ranking = playerRankings.find((r) => r.playerId === player.id);
        players.push({
          playerId: player.id,
          playerName: player.name,
          teamName: team.name,
          institution: team.institution,
          avgScore: ranking?.avgScore ?? 0,
          mvpCount: ranking?.mvpCount ?? 0,
        });
      });
    });
    return players;
  }, [store.teams, playerRankings]);

  const filteredPlayers = useMemo(() => {
    const kw = searchKey.trim().toLowerCase();
    if (!kw) return allPlayers;
    return allPlayers.filter(
      (p) =>
        p.playerName.toLowerCase().includes(kw) ||
        p.teamName.toLowerCase().includes(kw) ||
        p.institution.toLowerCase().includes(kw)
    );
  }, [allPlayers, searchKey]);

  const radarData = useMemo(() => {
    if (!detailA || !detailB) return [];
    const maxMatches = Math.max(detailA.totalMatches, detailB.totalMatches, 1);
    const maxMvp = Math.max(detailA.mvpCount, detailB.mvpCount, 1);
    const maxWinRate = 1;
    const maxScore = Math.max(detailA.avgScore, detailB.avgScore, 1);
    return [
      {
        metric: '参赛场次',
        A: Number(((detailA.totalMatches / maxMatches) * 100).toFixed(1)),
        B: Number(((detailB.totalMatches / maxMatches) * 100).toFixed(1)),
      },
      {
        metric: '胜率',
        A: Number((detailA.winRate / maxWinRate * 100).toFixed(1)),
        B: Number((detailB.winRate / maxWinRate * 100).toFixed(1)),
      },
      {
        metric: '场均得分',
        A: Number(((detailA.avgScore / maxScore) * 100).toFixed(1)),
        B: Number(((detailB.avgScore / maxScore) * 100).toFixed(1)),
      },
      {
        metric: 'MVP次数',
        A: Number(((detailA.mvpCount / maxMvp) * 100).toFixed(1)),
        B: Number(((detailB.mvpCount / maxMvp) * 100).toFixed(1)),
      },
      {
        metric: '最高得分',
        A: Number(((detailA.highestScore / maxScore) * 100).toFixed(1)),
        B: Number(((detailB.highestScore / maxScore) * 100).toFixed(1)),
      },
    ];
  }, [detailA, detailB]);

  const scoreTrendData = useMemo(() => {
    if (!detailA || !detailB) return [];
    const maxLen = Math.max(detailA.scoreTrend.length, detailB.scoreTrend.length);
    const result: { matchIndex: number; scoreA?: number; scoreB?: number }[] = [];
    for (let i = 0; i < maxLen; i++) {
      result.push({
        matchIndex: i + 1,
        scoreA: detailA.scoreTrend[i]?.score,
        scoreB: detailB.scoreTrend[i]?.score,
      });
    }
    return result;
  }, [detailA, detailB]);

  const compareMetrics = detailA && detailB
    ? [
        { label: '参赛场次', a: detailA.totalMatches, b: detailB.totalMatches, format: (v: number) => String(v) },
        { label: '胜场', a: detailA.wins, b: detailB.wins, format: (v: number) => String(v) },
        { label: '负场', a: detailA.losses, b: detailB.losses, format: (v: number) => String(v) },
        { label: '胜率', a: detailA.winRate, b: detailB.winRate, format: (v: number) => `${(v * 100).toFixed(1)}%` },
        { label: '场均得分', a: detailA.avgScore, b: detailB.avgScore, format: (v: number) => v.toFixed(1) },
        { label: '最高得分', a: detailA.highestScore, b: detailB.highestScore, format: (v: number) => v.toFixed(1) },
        { label: '最低得分', a: detailA.lowestScore, b: detailB.lowestScore, format: (v: number) => v.toFixed(1) },
        { label: 'MVP次数', a: detailA.mvpCount, b: detailB.mvpCount, format: (v: number) => String(v) },
        { label: 'MVP率', a: detailA.mvpRate, b: detailB.mvpRate, format: (v: number) => `${(v * 100).toFixed(1)}%` },
      ]
    : [];

  const handleSelect = (playerId: string) => {
    if (selectingSlot === 'a') {
      navigate(`/player/compare/${playerId}/${slotB || ''}`, { replace: true });
    } else if (selectingSlot === 'b') {
      navigate(`/player/compare/${slotA || ''}/${playerId}`, { replace: true });
    }
    setSelectingSlot(null);
    setSearchKey('');
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-navy-600 hover:text-navy-900 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
      </div>

      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900 flex items-center gap-2">
          <GitCompare className="w-7 h-7 text-gold-500" />
          辩手横向对比
        </h1>
        <p className="mt-1 text-sm text-navy-500">选择两位辩手，全面对比比赛数据</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-navy-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gold-500" />
              辩手 A
            </h3>
            <button
              onClick={() => setSelectingSlot('a')}
              className="text-xs font-medium text-navy-500 hover:text-gold-600 bg-navy-50 hover:bg-gold-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {detailA ? '更换' : '选择辩手'}
            </button>
          </div>
          {detailA ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-gold flex items-center justify-center shadow-card flex-shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-serif font-bold text-navy-900 text-lg">{detailA.playerName}</span>
                  {detailA.rank && detailA.rank <= 10 && <RankBadge rank={detailA.rank} />}
                </div>
                <div className="flex items-center gap-2 text-sm text-navy-500">
                  <span className="badge badge-gold text-xs">{detailA.role}</span>
                  <span className="truncate">{detailA.teamName}</span>
                </div>
                <div className="text-xs text-navy-400 mt-1">{detailA.institution}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-navy-200 rounded-xl text-navy-400 text-sm">
              <Swords className="w-5 h-5 mr-2" />
              点击「选择辩手」
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-navy-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-navy-700" />
              辩手 B
            </h3>
            <button
              onClick={() => setSelectingSlot('b')}
              className="text-xs font-medium text-navy-500 hover:text-gold-600 bg-navy-50 hover:bg-gold-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {detailB ? '更换' : '选择辩手'}
            </button>
          </div>
          {detailB ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-navy flex items-center justify-center shadow-card flex-shrink-0">
                <User className="w-8 h-8 text-gold-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-serif font-bold text-navy-900 text-lg">{detailB.playerName}</span>
                  {detailB.rank && detailB.rank <= 10 && <RankBadge rank={detailB.rank} />}
                </div>
                <div className="flex items-center gap-2 text-sm text-navy-500">
                  <span className="badge badge-blue text-xs">{detailB.role}</span>
                  <span className="truncate">{detailB.teamName}</span>
                </div>
                <div className="text-xs text-navy-400 mt-1">{detailB.institution}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-navy-200 rounded-xl text-navy-400 text-sm">
              <Swords className="w-5 h-5 mr-2" />
              点击「选择辩手」
            </div>
          )}
        </div>
      </div>

      {selectingSlot && (
        <div className="card p-5 stagger-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-navy-900">
              选择{selectingSlot === 'a' ? '辩手 A' : '辩手 B'}
            </h3>
            <button
              onClick={() => { setSelectingSlot(null); setSearchKey(''); }}
              className="text-navy-400 hover:text-navy-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="搜索辩手姓名、队伍、学校…"
              className="input-base pl-10"
            />
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filteredPlayers.map((p) => {
              const isSelected = p.playerId === slotA || p.playerId === slotB;
              return (
                <button
                  key={p.playerId}
                  onClick={() => !isSelected && handleSelect(p.playerId)}
                  disabled={isSelected}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                    isSelected
                      ? 'bg-navy-50/60 opacity-50 cursor-not-allowed'
                      : 'hover:bg-gold-50 cursor-pointer'
                  )}
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-navy flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gold-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-navy-900">{p.playerName}</span>
                      {isSelected && <span className="text-xs text-navy-400">已选</span>}
                    </div>
                    <div className="text-xs text-navy-500 truncate">{p.teamName} · {p.institution}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gold-600">{p.avgScore.toFixed(1)}</p>
                    <p className="text-xs text-navy-400">均分</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-navy-300 flex-shrink-0" />}
                </button>
              );
            })}
            {filteredPlayers.length === 0 && (
              <div className="py-8 text-center text-sm text-navy-400">无匹配辩手</div>
            )}
          </div>
        </div>
      )}

      {detailA && detailB && (
        <>
          <div className="card p-6">
            <h3 className="flex items-center gap-2 mb-6 text-navy-900 font-serif text-lg font-semibold">
              <Target className="w-5 h-5 text-gold-500" />
              核心指标对比
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-navy-500 w-28">指标</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gold-600">
                      {detailA.playerName}
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-navy-700">
                      {detailB.playerName}
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-navy-500 w-20">优势</th>
                  </tr>
                </thead>
                <tbody>
                  {compareMetrics.map((m) => {
                    const aWins = m.a > m.b;
                    const bWins = m.b > m.a;
                    return (
                      <tr key={m.label} className="border-b border-navy-50 hover:bg-navy-50/40 transition-colors">
                        <td className="py-3 px-4 text-sm font-medium text-navy-700">{m.label}</td>
                        <td className={cn('py-3 px-4 text-center text-sm font-bold', aWins ? 'text-gold-600' : 'text-navy-600')}>
                          {m.format(m.a)}
                        </td>
                        <td className={cn('py-3 px-4 text-center text-sm font-bold', bWins ? 'text-navy-900' : 'text-navy-600')}>
                          {m.format(m.b)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {aWins && <span className="inline-flex items-center gap-1 text-xs font-medium text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full"><Trophy className="w-3 h-3" />A</span>}
                          {bWins && <span className="inline-flex items-center gap-1 text-xs font-medium text-navy-700 bg-navy-100 px-2 py-0.5 rounded-full"><Trophy className="w-3 h-3" />B</span>}
                          {!aWins && !bWins && <span className="text-xs text-navy-400">平</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="flex items-center gap-2 mb-4 text-navy-900 font-serif text-lg font-semibold">
                <BarChart3 className="w-5 h-5 text-gold-500" />
                综合能力雷达
              </h3>
              {radarData.length > 0 ? (
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#b8cfe8" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#1b3f6c' }} />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar
                        name={detailA.playerName}
                        dataKey="A"
                        stroke="#D4A574"
                        fill="#D4A574"
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                      <Radar
                        name={detailB.playerName}
                        dataKey="B"
                        stroke="#0F2944"
                        fill="#0F2944"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #b8cfe8',
                          boxShadow: '0 4px 20px -4px rgba(15,41,68,0.15)',
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-navy-400 text-sm">
                  暂无足够数据
                </div>
              )}
            </div>

            <div className="card p-6">
              <h3 className="flex items-center gap-2 mb-4 text-navy-900 font-serif text-lg font-semibold">
                <TrendingUp className="w-5 h-5 text-gold-500" />
                评分趋势对比
              </h3>
              {scoreTrendData.length > 0 ? (
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={scoreTrendData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0eaf5" />
                      <XAxis
                        dataKey="matchIndex"
                        tick={{ fontSize: 11, fill: '#1b3f6c' }}
                        axisLine={{ stroke: '#b8cfe8' }}
                        tickLine={false}
                        label={{ value: '第N场', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#6b8db5' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#1b3f6c' }}
                        axisLine={{ stroke: '#b8cfe8' }}
                        tickLine={false}
                        domain={['dataMin - 5', 'dataMax + 5']}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #b8cfe8',
                          boxShadow: '0 4px 20px -4px rgba(15,41,68,0.15)',
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: 8, fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey="scoreA"
                        name={detailA.playerName}
                        stroke="#D4A574"
                        strokeWidth={2.5}
                        dot={{ fill: '#D4A574', strokeWidth: 2, r: 3 }}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="scoreB"
                        name={detailB.playerName}
                        stroke="#0F2944"
                        strokeWidth={2.5}
                        dot={{ fill: '#0F2944', strokeWidth: 2, r: 3 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-navy-400 text-sm">
                  暂无足够数据
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="flex items-center gap-2 mb-6 text-navy-900 font-serif text-lg font-semibold">
              <Award className="w-5 h-5 text-gold-500" />
              角色偏好对比
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[detailA, detailB].map((detail, idx) =>
                detail ? (
                  <div key={detail.playerId}>
                    <p className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                      <div className={cn('w-2.5 h-2.5 rounded-full', idx === 0 ? 'bg-gold-500' : 'bg-navy-700')} />
                      {detail.playerName}
                    </p>
                    {detail.roleStats.length > 0 ? (
                      <div className="space-y-2">
                        {detail.roleStats.map((rs) => {
                          const maxCount = Math.max(...detail.roleStats.map((r) => r.count), 1);
                          const pct = (rs.count / maxCount) * 100;
                          return (
                            <div key={rs.role}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-medium text-navy-700">{rs.role}</span>
                                <span className="text-navy-500">{rs.count} 场 · 均分 {rs.avgScore.toFixed(1)}</span>
                              </div>
                              <div className="h-2 bg-navy-100 rounded-full overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full transition-all', idx === 0 ? 'bg-gold-500' : 'bg-navy-700')}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-navy-400">暂无角色数据</p>
                    )}
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="flex items-center gap-2 mb-6 text-navy-900 font-serif text-lg font-semibold">
              <Medal className="w-5 h-5 text-gold-500" />
              近期战绩对比
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[detailA, detailB].map((detail, idx) =>
                detail ? (
                  <div key={detail.playerId}>
                    <p className="text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
                      <div className={cn('w-2.5 h-2.5 rounded-full', idx === 0 ? 'bg-gold-500' : 'bg-navy-700')} />
                      {detail.playerName}
                    </p>
                    {detail.matchRecords.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {detail.matchRecords
                          .slice()
                          .sort((a, b) => b.date - a.date)
                          .slice(0, 8)
                          .map((r) => (
                            <div
                              key={r.matchId}
                              className="flex items-center gap-2 p-2.5 rounded-lg bg-navy-50/50 hover:bg-navy-50 transition-colors cursor-pointer"
                              onClick={() => navigate(`/archive/${r.tournamentId}/match/${r.matchId}`)}
                            >
                              <span
                                className={cn(
                                  'badge text-[10px] px-1.5 py-0.5',
                                  r.isWin ? 'badge-green' : r.isDraw ? 'badge-gold' : 'badge-red'
                                )}
                              >
                                {r.isWin ? '胜' : r.isDraw ? '平' : '负'}
                              </span>
                              <span className="text-xs text-navy700 flex-1 min-w-0 truncate">
                                {r.topicTitle}
                              </span>
                              <span className="text-xs font-bold text-navy-800 flex-shrink-0">
                                {r.score.toFixed(1)}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-xs text-navy-400">暂无参赛记录</p>
                    )}
                  </div>
                ) : null
              )}
            </div>
          </div>
        </>
      )}

      {!detailA && !detailB && !selectingSlot && (
        <div className="card p-12 text-center">
          <GitCompare className="w-12 h-12 text-navy-300 mx-auto mb-4" />
          <h3 className="font-serif text-lg font-semibold text-navy-700 mb-2">选择两位辩手开始对比</h3>
          <p className="text-sm text-navy-500 mb-6">在上方分别选择辩手 A 和辩手 B</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setSelectingSlot('a')}
              className="btn-primary"
            >
              <Swords className="w-4 h-4" />
              选择辩手 A
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
