import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  FileText,
  TrendingUp,
  ShieldHalf,
  Star,
  ArrowLeft,
  Swords,
  Trophy,
  PieChart as PieChartIcon,
  Activity,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import StatCard from '@/components/ui/StatCard';
import type { TopicCategory, Winner, ArchivedMatch, MatchPairing, Topic } from '@/types';
import { FORMAT_RULES } from '@/engines/formatRules';
import { cn } from '@/lib/utils';

const CATEGORIES: TopicCategory[] = ['政策', '价值', '事实', '模拟法庭'];
const CATEGORY_COLORS: Record<TopicCategory, string> = {
  政策: '#3265a4',
  价值: '#c2874f',
  事实: '#10b981',
  模拟法庭: '#ef4444',
};
const PRO_COLOR = '#3265a4';
const CON_COLOR = '#c2874f';
const DRAW_COLOR = '#94a3b8';

interface AllMatch {
  topicId: string;
  winner?: Winner;
}

function collectAllMatches(
  matches: MatchPairing[],
  archivedTournaments: ReturnType<typeof useDebateStore.getState>['archivedTournaments']
): AllMatch[] {
  const result: AllMatch[] = [];
  matches.forEach((m) => {
    if (m.status === 'finished') {
      result.push({ topicId: m.topicId, winner: m.winner });
    }
  });
  archivedTournaments.forEach((t) => {
    t.matches.forEach((m: ArchivedMatch) => {
      if (m.status === 'finished') {
        result.push({ topicId: m.topicId, winner: m.winner });
      }
    });
  });
  return result;
}

function getTopicByIdSafe(
  id: string,
  topics: Topic[],
  archivedTournaments: ReturnType<typeof useDebateStore.getState>['archivedTournaments']
): Topic | null {
  const found = topics.find((t) => t.id === id);
  if (found) return found;
  for (const at of archivedTournaments) {
    for (const m of at.matches) {
      if (m.topicId === id) {
        return {
          id: m.topicId,
          title: m.topicTitle,
          proSide: m.topicProSide,
          conSide: m.topicConSide,
          category: ['价值'],
          formats: [],
          difficulty: 3,
        };
      }
    }
  }
  return null;
}

export default function TopicAnalyticsPage() {
  const navigate = useNavigate();
  const topics = useDebateStore((s) => s.topics);
  const matches = useDebateStore((s) => s.matches);
  const archivedTournaments = useDebateStore((s) => s.archivedTournaments);

  const allMatches = useMemo(
    () => collectAllMatches(matches, archivedTournaments),
    [matches, archivedTournaments]
  );

  const stats = useMemo(() => {
    const usedTopicIds = new Set(allMatches.map((m) => m.topicId));
    const usedCount = usedTopicIds.size;
    const total = topics.length;

    let proWins = 0;
    let conWins = 0;
    let draws = 0;
    allMatches.forEach((m) => {
      if (m.winner === 'pro') proWins++;
      else if (m.winner === 'con') conWins++;
      else if (m.winner === 'draw') draws++;
    });
    const totalFinished = proWins + conWins + draws;
    const avgDifficulty =
      topics.length > 0
        ? (topics.reduce((sum, t) => sum + t.difficulty, 0) / topics.length).toFixed(1)
        : '0';
    const proWinRate = totalFinished > 0 ? Math.round((proWins / totalFinished) * 100) : 0;

    return {
      total,
      usedCount,
      avgDifficulty,
      proWinRate,
      proWins,
      conWins,
      draws,
      totalFinished,
    };
  }, [topics, allMatches]);

  const categoryUsageData = useMemo(() => {
    const counts: Record<TopicCategory, number> = {
      政策: 0,
      价值: 0,
      事实: 0,
      模拟法庭: 0,
    };
    allMatches.forEach((m) => {
      const topic = getTopicByIdSafe(m.topicId, topics, archivedTournaments);
      if (topic) {
        topic.category.forEach((c) => {
          counts[c]++;
        });
      }
    });
    return CATEGORIES.map((c) => ({
      name: c,
      使用次数: counts[c],
      辩题数: topics.filter((t) => t.category.includes(c)).length,
      fill: CATEGORY_COLORS[c],
    }));
  }, [allMatches, topics, archivedTournaments]);

  const difficultyData = useMemo(() => {
    const result = [];
    for (let d = 1; d <= 5; d++) {
      const topicCount = topics.filter((t) => t.difficulty === d).length;
      const usedCount = allMatches.filter((m) => {
        const t = getTopicByIdSafe(m.topicId, topics, archivedTournaments);
        return t && t.difficulty === d;
      }).length;
      result.push({
        name: `★${d}`,
        辩题数: topicCount,
        使用次数: usedCount,
      });
    }
    return result;
  }, [topics, allMatches, archivedTournaments]);

  const winBiasData = useMemo(() => {
    return [
      { name: '正方胜', value: stats.proWins, fill: PRO_COLOR },
      { name: '反方胜', value: stats.conWins, fill: CON_COLOR },
      { name: '平局', value: stats.draws, fill: DRAW_COLOR },
    ];
  }, [stats]);

  const formatUsageData = useMemo(() => {
    const formatCount: Record<string, number> = {};
    allMatches.forEach((m) => {
      const topic = getTopicByIdSafe(m.topicId, topics, archivedTournaments);
      if (topic) {
        topic.formats.forEach((f) => {
          const label = FORMAT_RULES[f]?.label ?? f;
          formatCount[label] = (formatCount[label] ?? 0) + 1;
        });
      }
    });
    return Object.entries(formatCount).map(([name, 使用次数]) => ({ name, 使用次数 }));
  }, [allMatches, topics, archivedTournaments]);

  const radarData = useMemo(() => {
    return CATEGORIES.map((c) => {
      const catMatches = allMatches.filter((m) => {
        const t = getTopicByIdSafe(m.topicId, topics, archivedTournaments);
        return t && t.category.includes(c);
      });
      let pro = 0;
      let con = 0;
      catMatches.forEach((m) => {
        if (m.winner === 'pro') pro++;
        else if (m.winner === 'con') con++;
      });
      const total = catMatches.length || 1;
      return {
        类别: c,
        正方胜率: Math.round((pro / total) * 100),
        反方胜率: Math.round((con / total) * 100),
        使用热度: Math.min(100, Math.round((catMatches.length / Math.max(1, allMatches.length)) * 200)),
      };
    });
  }, [allMatches, topics, archivedTournaments]);

  const difficultyWinTrend = useMemo(() => {
    const result = [];
    for (let d = 1; d <= 5; d++) {
      const diffMatches = allMatches.filter((m) => {
        const t = getTopicByIdSafe(m.topicId, topics, archivedTournaments);
        return t && t.difficulty === d;
      });
      let pro = 0;
      let con = 0;
      diffMatches.forEach((m) => {
        if (m.winner === 'pro') pro++;
        else if (m.winner === 'con') con++;
      });
      const total = pro + con || 1;
      result.push({
        name: `难度 ${d}`,
        正方胜率: Math.round((pro / total) * 100),
        反方胜率: Math.round((con / total) * 100),
        比赛数: diffMatches.length,
      });
    }
    return result;
  }, [allMatches, topics, archivedTournaments]);

  const hotTopics = useMemo(() => {
    const countMap: Record<string, number> = {};
    allMatches.forEach((m) => {
      countMap[m.topicId] = (countMap[m.topicId] ?? 0) + 1;
    });
    return Object.entries(countMap)
      .map(([topicId, 使用次数]) => {
        const topic = getTopicByIdSafe(topicId, topics, archivedTournaments);
        let pro = 0;
        let con = 0;
        let draw = 0;
        allMatches
          .filter((m) => m.topicId === topicId)
          .forEach((m) => {
            if (m.winner === 'pro') pro++;
            else if (m.winner === 'con') con++;
            else draw++;
          });
        const total = pro + con + draw || 1;
        return {
          topicId,
          title: topic?.title ?? '未知辩题',
          使用次数,
          正方胜率: Math.round((pro / total) * 100),
          反方胜率: Math.round((con / total) * 100),
          平局数: draw,
          difficulty: topic?.difficulty ?? 3,
        };
      })
      .sort((a, b) => b.使用次数 - a.使用次数)
      .slice(0, 8);
  }, [allMatches, topics, archivedTournaments]);

  const renderStars = (level: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < level ? 'fill-gold-400 text-gold-400' : 'text-navy-200'
          )}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/topics')}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-navy-600 shadow-card ring-1 ring-navy-100 hover:bg-navy-50 transition-colors"
            aria-label="返回辩题库"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-navy text-white shadow-card">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-navy-900">辩题热度分析看板</h2>
            <p className="text-sm text-navy-500">
              多维度分析辩题使用频率、难度分布与胜率偏向
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="辩题总数"
          value={stats.total}
          color="navy"
          icon={<FileText className="h-6 w-6" />}
          trend={`已使用 ${stats.usedCount} 道`}
        />
        <StatCard
          title="累计比赛场数"
          value={stats.totalFinished}
          color="emerald"
          icon={<Swords className="h-6 w-6" />}
          trend="所有已结束比赛"
        />
        <StatCard
          title="正方整体胜率"
          value={`${stats.proWinRate}%`}
          color="gold"
          icon={<Trophy className="h-6 w-6" />}
          trend={`正方 ${stats.proWins} / 反方 ${stats.conWins}`}
        />
        <StatCard
          title="平均难度"
          value={`★ ${stats.avgDifficulty}`}
          color="red"
          icon={<Star className="h-6 w-6" />}
          trend="辩题库平均评级"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-900">类别使用频率分布</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryUsageData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe6f4" vertical={false} />
              <XAxis dataKey="name" stroke="#5485bf" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#5485bf" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #dbe6f4',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="使用次数" fill="#3265a4" radius={[6, 6, 0, 0]} />
              <Bar dataKey="辩题数" fill="#c2874f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
              <PieChartIcon className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-900">整体胜率偏向</h3>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={winBiasData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: '#b8cfe8' }}
                >
                  {winBiasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #dbe6f4',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-sm mt-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PRO_COLOR }} />
              <span className="text-navy-600">正方胜 {stats.proWins}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CON_COLOR }} />
              <span className="text-navy-600">反方胜 {stats.conWins}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: DRAW_COLOR }} />
              <span className="text-navy-600">平局 {stats.draws}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Star className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-900">难度分布分析</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={difficultyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe6f4" vertical={false} />
              <XAxis dataKey="name" stroke="#5485bf" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#5485bf" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #dbe6f4',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="辩题数" fill="#3265a4" radius={[6, 6, 0, 0]} />
              <Bar dataKey="使用次数" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-900">难度与胜率趋势</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={difficultyWinTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe6f4" vertical={false} />
              <XAxis dataKey="name" stroke="#5485bf" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#5485bf" fontSize={12} tickLine={false} axisLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #dbe6f4',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="正方胜率"
                stroke={PRO_COLOR}
                strokeWidth={2.5}
                dot={{ r: 5, fill: PRO_COLOR }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="反方胜率"
                stroke={CON_COLOR}
                strokeWidth={2.5}
                dot={{ r: 5, fill: CON_COLOR }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
              <ShieldHalf className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-900">类别胜率雷达图</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#dbe6f4" />
              <PolarAngleAxis dataKey="类别" stroke="#5485bf" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#b8cfe8" fontSize={10} />
              <Radar
                name="正方胜率(%)"
                dataKey="正方胜率"
                stroke={PRO_COLOR}
                fill={PRO_COLOR}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="反方胜率(%)"
                dataKey="反方胜率"
                stroke={CON_COLOR}
                fill={CON_COLOR}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="使用热度"
                dataKey="使用热度"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #dbe6f4',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-900">赛制适用分布</h3>
          </div>
          {formatUsageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatUsageData} layout="vertical" barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe6f4" horizontal={false} />
                <XAxis type="number" stroke="#5485bf" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#5485bf"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #dbe6f4',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="使用次数" fill="#c2874f" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-navy-400 text-sm">
              暂无赛制使用数据
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-navy text-white">
              <Trophy className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-900">热门辩题 TOP 排行</h3>
          </div>
          <span className="text-xs text-navy-500">按使用次数排序 · TOP 8</span>
        </div>
        {hotTopics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="py-3 px-3 text-left font-semibold text-navy-700">排名</th>
                  <th className="py-3 px-3 text-left font-semibold text-navy-700">辩题</th>
                  <th className="py-3 px-3 text-center font-semibold text-navy-700">难度</th>
                  <th className="py-3 px-3 text-center font-semibold text-navy-700">使用次数</th>
                  <th className="py-3 px-3 text-center font-semibold text-navy-700">正方胜率</th>
                  <th className="py-3 px-3 text-center font-semibold text-navy-700">反方胜率</th>
                  <th className="py-3 px-3 text-center font-semibold text-navy-700">偏向</th>
                </tr>
              </thead>
              <tbody>
                {hotTopics.map((t, idx) => {
                  const bias =
                    t.正方胜率 > t.反方胜率 + 5
                      ? { label: '正方占优', color: 'text-navy-600', bg: 'bg-navy-50 ring-navy-200' }
                      : t.反方胜率 > t.正方胜率 + 5
                      ? { label: '反方占优', color: 'text-gold-700', bg: 'bg-gold-50 ring-gold-200' }
                      : { label: '势均力敌', color: 'text-emerald-700', bg: 'bg-emerald-50 ring-emerald-200' };
                  return (
                    <tr
                      key={t.topicId}
                      className="border-b border-navy-50 hover:bg-navy-50/30 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                            idx === 0
                              ? 'bg-gradient-rank-1 text-white'
                              : idx === 1
                              ? 'bg-gradient-rank-2 text-white'
                              : idx === 2
                              ? 'bg-gradient-rank-3 text-white'
                              : 'bg-navy-100 text-navy-600'
                          )}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-navy-800 font-medium max-w-md truncate">
                        {t.title}
                      </td>
                      <td className="py-3 px-3 text-center">{renderStars(t.difficulty)}</td>
                      <td className="py-3 px-3 text-center font-semibold text-navy-800">
                        {t.使用次数}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold" style={{ color: PRO_COLOR }}>
                            {t.正方胜率}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-navy-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${t.正方胜率}%`,
                                backgroundColor: PRO_COLOR,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold" style={{ color: CON_COLOR }}>
                            {t.反方胜率}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-navy-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${t.反方胜率}%`,
                                backgroundColor: CON_COLOR,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            'badge ring-1',
                            bias.color,
                            bias.bg
                          )}
                        >
                          {bias.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-navy-400">暂无比赛数据，完成比赛后将显示热门辩题排行</div>
        )}
      </div>
    </div>
  );
}
