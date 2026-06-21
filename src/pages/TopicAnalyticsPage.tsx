import { useMemo, useState } from 'react';
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
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
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
  Sparkles,
  Search,
  Scale,
  AlertTriangle,
  Gauge,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import StatCard from '@/components/ui/StatCard';
import type { TopicCategory, Winner, DebateFormat, RecommendationContext, TopicRecommendation } from '@/types';
import { FORMAT_RULES } from '@/engines/formatRules';
import { cn } from '@/lib/utils';
import { analyzeJudges, getTendencyLabel, getTendencyColor, getTendencyBgColor } from '@/engines/judgeAnalysisEngine';
import { recommendTopics, getRoundDifficultyHint } from '@/engines/topicRecommendationEngine';

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

interface TopicMeta {
  id: string;
  title: string;
  category: TopicCategory[];
  difficulty: number;
  formats: DebateFormat[];
}

interface AllMatch {
  topicId: string;
  winner?: Winner;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export default function TopicAnalyticsPage() {
  const navigate = useNavigate();
  const topics = useDebateStore((s) => s.topics);
  const matches = useDebateStore((s) => s.matches);
  const archivedTournaments = useDebateStore((s) => s.archivedTournaments);

  const topicMap = useMemo(() => {
    const map = new Map<string, TopicMeta>();
    topics.forEach((t) => {
      map.set(t.id, {
        id: t.id,
        title: t.title,
        category: [...t.category],
        difficulty: t.difficulty,
        formats: [...t.formats],
      });
    });
    archivedTournaments.forEach((at) => {
      at.matches.forEach((m) => {
        if (!map.has(m.topicId)) {
          map.set(m.topicId, {
            id: m.topicId,
            title: m.topicTitle,
            category: m.topicCategory ?? [],
            difficulty: m.topicDifficulty ?? 3,
            formats: m.topicFormats ?? [],
          });
        }
      });
    });
    return map;
  }, [topics, archivedTournaments]);

  const allMatches = useMemo(() => {
    const result: AllMatch[] = [];
    matches.forEach((m) => {
      if (m.status === 'finished') {
        result.push({ topicId: m.topicId, winner: m.winner });
      }
    });
    archivedTournaments.forEach((t) => {
      t.matches.forEach((m) => {
        if (m.status === 'finished') {
          result.push({ topicId: m.topicId, winner: m.winner });
        }
      });
    });
    return result;
  }, [matches, archivedTournaments]);

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

  const tournament = useDebateStore((s) => s.tournament);
  const judges = useDebateStore((s) => s.judges);

  const [recFilter, setRecFilter] = useState<{
    round: number;
    preferredCategories: TopicCategory[];
    preferredDifficulty?: number;
    showFilters: boolean;
    expandedRecId: string | null;
    expandedJudgeId: string | null;
  }>({
    round: tournament.currentRound,
    preferredCategories: [],
    showFilters: false,
    expandedRecId: null,
    expandedJudgeId: null,
  });

  const recContext: RecommendationContext = useMemo(() => ({
    format: tournament.format,
    tournamentType: tournament.type,
    round: recFilter.round,
    totalRounds: tournament.totalRounds,
    preferredCategories: recFilter.preferredCategories.length > 0 ? recFilter.preferredCategories : undefined,
    preferredDifficulty: recFilter.preferredDifficulty,
  }), [tournament, recFilter]);

  const recommendations = useMemo<TopicRecommendation[]>(() => {
    return recommendTopics(topics, recContext, matches, archivedTournaments, 8);
  }, [topics, recContext, matches, archivedTournaments]);

  const judgeAnalysis = useMemo(() => {
    return analyzeJudges(matches, archivedTournaments, judges);
  }, [matches, archivedTournaments, judges]);

  const difficultyDistribution = useMemo(() => {
    const result = [];
    for (let d = 1; d <= 5; d++) {
      const topicCount = topics.filter((t) => t.difficulty === d).length;
      const usedCount = allMatches.filter((m) => {
        const meta = topicMap.get(m.topicId);
        return meta && meta.difficulty === d;
      }).length;
      const catBreakdown: Record<string, number> = {};
      CATEGORIES.forEach((c) => { catBreakdown[c] = 0; });
      topics.filter((t) => t.difficulty === d).forEach((t) => {
        t.category.forEach((c) => { catBreakdown[c]++; });
      });
      result.push({
        name: `★${d}`,
        difficulty: d,
        辩题数: topicCount,
        使用次数: usedCount,
        占比: topics.length > 0 ? Math.round((topicCount / topics.length) * 100) : 0,
        ...catBreakdown,
      });
    }
    return result;
  }, [topics, allMatches, topicMap]);

  const difficultyScatterData = useMemo(() => {
    return topics.map((t) => {
      const usage = allMatches.filter((m) => m.topicId === t.id).length;
      let proWins = 0;
      let conWins = 0;
      allMatches
        .filter((m) => m.topicId === t.id)
        .forEach((m) => {
          if (m.winner === 'pro') proWins++;
          else if (m.winner === 'con') conWins++;
        });
      const total = proWins + conWins || 1;
      const winBias = Math.round((proWins / total) * 100) - 50;
      return {
        x: t.difficulty,
        y: usage,
        z: Math.abs(winBias) + 5,
        name: t.title,
        category: t.category[0],
        difficulty: t.difficulty,
        usage,
        winBias,
        fill: CATEGORY_COLORS[t.category[0]],
      };
    });
  }, [topics, allMatches]);

  const categoryDifficultyHeatmap = useMemo(() => {
    const data: { category: string; difficulty: number; count: number; fill: string }[] = [];
    CATEGORIES.forEach((cat) => {
      for (let d = 1; d <= 5; d++) {
        const count = topics.filter((t) => t.category.includes(cat) && t.difficulty === d).length;
        const intensity = count > 0 ? Math.min(1, count / 3) : 0;
        data.push({
          category: cat,
          difficulty: d,
          count,
          fill: count > 0 ? `rgba(50, 101, 164, ${0.2 + intensity * 0.7})` : 'rgba(219, 230, 244, 0.3)',
        });
      }
    });
    return data;
  }, [topics]);

  const tendencyDistribution = useMemo(() => {
    const counts = { strict: 0, lenient: 0, normal: 0 };
    judgeAnalysis.judgeStats.forEach((j) => {
      counts[j.tendency]++;
    });
    return [
      { name: '打分偏严', value: counts.strict, fill: '#ef4444' },
      { name: '打分正常', value: counts.normal, fill: '#3265a4' },
      { name: '打分偏松', value: counts.lenient, fill: '#10b981' },
    ];
  }, [judgeAnalysis]);

  const categoryUsageData = useMemo(() => {
    const counts: Record<TopicCategory, number> = {
      政策: 0,
      价值: 0,
      事实: 0,
      模拟法庭: 0,
    };
    allMatches.forEach((m) => {
      const meta = topicMap.get(m.topicId);
      if (meta) {
        meta.category.forEach((c) => {
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
  }, [allMatches, topicMap, topics]);

  const difficultyData = useMemo(() => {
    const result = [];
    for (let d = 1; d <= 5; d++) {
      const topicCount = topics.filter((t) => t.difficulty === d).length;
      const usedCount = allMatches.filter((m) => {
        const meta = topicMap.get(m.topicId);
        return meta && meta.difficulty === d;
      }).length;
      result.push({
        name: `★${d}`,
        辩题数: topicCount,
        使用次数: usedCount,
      });
    }
    return result;
  }, [topics, allMatches, topicMap]);

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
      const meta = topicMap.get(m.topicId);
      if (meta) {
        meta.formats.forEach((f) => {
          const label = FORMAT_RULES[f]?.label ?? f;
          formatCount[label] = (formatCount[label] ?? 0) + 1;
        });
      }
    });
    return Object.entries(formatCount).map(([name, 使用次数]) => ({ name, 使用次数 }));
  }, [allMatches, topicMap]);

  const radarData = useMemo(() => {
    return CATEGORIES.map((c) => {
      const catMatches = allMatches.filter((m) => {
        const meta = topicMap.get(m.topicId);
        return meta && meta.category.includes(c);
      });
      let pro = 0;
      let con = 0;
      catMatches.forEach((m) => {
        if (m.winner === 'pro') pro++;
        else if (m.winner === 'con') con++;
      });
      const total = catMatches.length || 1;
      const heatRaw = (catMatches.length / Math.max(1, allMatches.length)) * 100;
      return {
        类别: c,
        正方胜率: Math.round((pro / total) * 100),
        反方胜率: Math.round((con / total) * 100),
        使用热度: clamp(Math.round(heatRaw), 0, 100),
      };
    });
  }, [allMatches, topicMap]);

  const difficultyWinTrend = useMemo(() => {
    const result = [];
    for (let d = 1; d <= 5; d++) {
      const diffMatches = allMatches.filter((m) => {
        const meta = topicMap.get(m.topicId);
        return meta && meta.difficulty === d;
      });
      let pro = 0;
      let con = 0;
      diffMatches.forEach((m) => {
        if (m.winner === 'pro') pro++;
        else if (m.winner === 'con') con++;
      });
      const decided = pro + con || 1;
      result.push({
        name: `难度 ${d}`,
        正方胜率: Math.round((pro / decided) * 100),
        反方胜率: Math.round((con / decided) * 100),
        比赛数: diffMatches.length,
      });
    }
    return result;
  }, [allMatches, topicMap]);

  const hotTopics = useMemo(() => {
    const countMap: Record<string, number> = {};
    allMatches.forEach((m) => {
      countMap[m.topicId] = (countMap[m.topicId] ?? 0) + 1;
    });
    return Object.entries(countMap)
      .map(([topicId, 使用次数]) => {
        const meta = topicMap.get(topicId);
        let pro = 0;
        let con = 0;
        allMatches
          .filter((m) => m.topicId === topicId)
          .forEach((m) => {
            if (m.winner === 'pro') pro++;
            else if (m.winner === 'con') con++;
          });
        const decided = pro + con || 1;
        return {
          topicId,
          title: meta?.title ?? '未知辩题',
          使用次数,
          正方胜率: Math.round((pro / decided) * 100),
          反方胜率: Math.round((con / decided) * 100),
          difficulty: meta?.difficulty ?? 3,
        };
      })
      .sort((a, b) => b.使用次数 - a.使用次数)
      .slice(0, 8);
  }, [allMatches, topicMap]);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Star className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-900">难度分布统计</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={difficultyDistribution}>
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
                formatter={(value: number, name: string) => {
                  if (name === '占比') return [`${value}%`, '占比'];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="辩题数" fill="#3265a4" radius={[6, 6, 0, 0]} />
              <Bar dataKey="使用次数" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="占比" fill="#c2874f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
              <Gauge className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-900">难度 × 使用频率</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe6f4" />
              <XAxis
                type="number"
                dataKey="x"
                name="难度"
                stroke="#5485bf"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0.5, 5.5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(v) => `★${v}`}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="使用次数"
                stroke="#5485bf"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ZAxis
                type="number"
                dataKey="z"
                range={[30, 300]}
                name="胜率偏差"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #dbe6f4',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value: any, name: string) => {
                  if (name === '难度') return [`★${value}`, name];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Scatter
                name="辩题"
                data={difficultyScatterData}
                fill="#3265a4"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6 xl:col-span-1">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
              <PieChartIcon className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-900">类别 × 难度 热力图</h3>
          </div>
          <div className="h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="py-2 px-2 text-left text-xs font-semibold text-navy-500">类别</th>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <th key={d} className="py-2 px-1 text-center text-xs font-semibold text-navy-500">★{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map((cat) => (
                  <tr key={cat}>
                    <td className="py-2 px-2 text-navy-700 font-medium text-xs">{cat}</td>
                    {[1, 2, 3, 4, 5].map((d) => {
                      const cell = categoryDifficultyHeatmap.find((c) => c.category === cat && c.difficulty === d);
                      return (
                        <td key={d} className="py-2 px-1 text-center">
                          <div
                            className="w-8 h-8 mx-auto rounded-md flex items-center justify-center text-xs font-semibold transition-transform hover:scale-110"
                            style={{ backgroundColor: cell?.fill }}
                          >
                            {cell && cell.count > 0 ? cell.count : ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-center gap-3 mt-4 text-xs text-navy-500">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(219, 230, 244, 0.3)' }} />
                <span>0</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(50, 101, 164, 0.4)' }} />
                <span>1-2</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(50, 101, 164, 0.9)' }} />
                <span>≥3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
          <span className="text-xs text-navy-500">按使用次数排序 · TOP 8 · 胜率仅计决胜场</span>
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

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-navy-900">智能辩题推荐</h3>
              <p className="text-xs text-navy-500">
                {getRoundDifficultyHint(recFilter.round, tournament.totalRounds)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRecFilter((f) => ({ ...f, showFilters: !f.showFilters }))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-navy-50 text-navy-600 hover:bg-navy-100 transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>筛选条件</span>
              {recFilter.showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => setRecFilter((f) => ({ ...f, round: tournament.currentRound, preferredCategories: [], preferredDifficulty: undefined }))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-navy-50 text-navy-600 hover:bg-navy-100 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>重置</span>
            </button>
          </div>
        </div>

        {recFilter.showFilters && (
          <div className="mb-5 p-4 bg-navy-50/50 rounded-xl border border-navy-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-navy-600 mb-1.5">目标轮次</label>
                <select
                  value={recFilter.round}
                  onChange={(e) => setRecFilter((f) => ({ ...f, round: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-navy-200 bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-300"
                >
                  {Array.from({ length: tournament.totalRounds }, (_, i) => i + 1).map((r) => (
                    <option key={r} value={r}>第 {r} 轮</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-600 mb-1.5">偏好类别</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const selected = recFilter.preferredCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setRecFilter((f) => ({
                            ...f,
                            preferredCategories: selected
                              ? f.preferredCategories.filter((c) => c !== cat)
                              : [...f.preferredCategories, cat],
                          }));
                        }}
                        className={cn(
                          'px-2.5 py-1.5 text-xs rounded-md transition-colors',
                          selected
                            ? 'bg-navy-600 text-white'
                            : 'bg-white text-navy-600 border border-navy-200 hover:bg-navy-50'
                        )}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-600 mb-1.5">偏好难度</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      onClick={() => setRecFilter((f) => ({
                        ...f,
                        preferredDifficulty: f.preferredDifficulty === d ? undefined : d,
                      }))}
                      className={cn(
                        'flex-1 py-1.5 text-xs rounded-md transition-colors',
                        recFilter.preferredDifficulty === d
                          ? 'bg-gold-500 text-white'
                          : 'bg-white text-navy-600 border border-navy-200 hover:bg-navy-50'
                      )}
                    >
                      ★{d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => {
              const isExpanded = recFilter.expandedRecId === rec.topicId;
              const matchScoreColor =
                rec.matchScore >= 80 ? 'text-emerald-600' : rec.matchScore >= 60 ? 'text-gold-600' : 'text-navy-600';
              const matchScoreBg =
                rec.matchScore >= 80 ? 'bg-emerald-50' : rec.matchScore >= 60 ? 'bg-gold-50' : 'bg-navy-50';
              return (
                <div
                  key={rec.topicId}
                  className="border border-navy-100 rounded-xl overflow-hidden hover:border-navy-300 transition-colors"
                >
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-navy-50/50 transition-colors"
                    onClick={() => setRecFilter((f) => ({
                      ...f,
                      expandedRecId: f.expandedRecId === rec.topicId ? null : rec.topicId,
                    }))}
                  >
                    <span
                      className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold flex-shrink-0',
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-navy-900 truncate">{rec.title}</p>
                        <span className={cn('badge text-xs', matchScoreColor, matchScoreBg)}>
                          匹配度 {rec.matchScore.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-navy-500">
                        <div className="flex items-center gap-1">
                          <span className="text-navy-400">类别:</span>
                          {rec.category.map((c) => (
                            <span key={c} className="px-1.5 py-0.5 rounded bg-navy-100 text-navy-600 text-[10px]">
                              {c}
                            </span>
                          ))}
                        </div>
                        <span>难度 {renderStars(rec.difficulty)}</span>
                        <span>使用 {rec.usageCount} 次</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-navy-500 mb-0.5">历史胜率</div>
                        <div className="flex items-center gap-2 text-xs">
                          <span style={{ color: PRO_COLOR }} className="font-semibold">正方 {rec.proWinRate}%</span>
                          <span className="text-navy-300">vs</span>
                          <span style={{ color: CON_COLOR }} className="font-semibold">{rec.conWinRate}% 反方</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-navy-400" /> : <ChevronDown className="h-4 w-4 text-navy-400" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-navy-100 bg-navy-50/30">
                      <div className="pt-4 space-y-3">
                        <div>
                          <div className="text-xs font-medium text-navy-600 mb-2">推荐理由</div>
                          <div className="flex flex-wrap gap-2">
                            {rec.reasons.map((reason, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-navy-200 text-xs text-navy-700"
                              >
                                <Sparkles className="h-3 w-3 text-gold-500" />
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-navy-600 mb-2">适用赛制</div>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.formats.map((fmt) => (
                              <span
                                key={fmt}
                                className="px-2.5 py-1 rounded bg-white border border-navy-200 text-[11px] text-navy-600"
                              >
                                {FORMAT_RULES[fmt]?.label ?? fmt}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-navy-400">暂无符合条件的辩题推荐</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-navy-900">评委打分倾向分析</h3>
                <p className="text-xs text-navy-500">
                  分析 {judgeAnalysis.totalMatchesAnalyzed} 场比赛 · 平均分 {judgeAnalysis.overallAvgScore.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          {judgeAnalysis.judgeStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-100">
                    <th className="py-3 px-3 text-left font-semibold text-navy-700">评委</th>
                    <th className="py-3 px-3 text-center font-semibold text-navy-700">执裁场次</th>
                    <th className="py-3 px-3 text-center font-semibold text-navy-700">平均分</th>
                    <th className="py-3 px-3 text-center font-semibold text-navy-700">打分偏差</th>
                    <th className="py-3 px-3 text-center font-semibold text-navy-700">倾向</th>
                    <th className="py-3 px-3 text-center font-semibold text-navy-700">争议率</th>
                    <th className="py-3 px-3 text-center font-semibold text-navy-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {judgeAnalysis.judgeStats.map((j) => {
                    const isExpanded = recFilter.expandedJudgeId === j.judgeId;
                    return (
                      <>
                        <tr
                          key={j.judgeId}
                          className="border-b border-navy-50 hover:bg-navy-50/30 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="font-medium text-navy-800">{j.judgeName}</div>
                          </td>
                          <td className="py-3 px-3 text-center text-navy-700">{j.totalMatches}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-semibold text-navy-800">{j.overallAvgScore.toFixed(1)}</span>
                            <div className="text-[10px] text-navy-400 mt-0.5">
                              正 {j.avgProScore.toFixed(0)} · 反 {j.avgConScore.toFixed(0)}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={cn(
                              'font-semibold',
                              j.tendencyScore < -3 ? 'text-red-600' : j.tendencyScore > 3 ? 'text-emerald-600' : 'text-navy-700'
                            )}>
                              {j.tendencyScore > 0 ? '+' : ''}{j.tendencyScore.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={cn(
                              'badge ring-1 text-xs',
                              getTendencyColor(j.tendency),
                              getTendencyBgColor(j.tendency)
                            )}>
                              {getTendencyLabel(j.tendency)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold text-navy-800">{j.splitDecisionRate}%</span>
                              <div className="w-16 h-1.5 rounded-full bg-navy-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-red-400"
                                  style={{ width: `${Math.min(j.splitDecisionRate, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setRecFilter((f) => ({
                                ...f,
                                expandedJudgeId: f.expandedJudgeId === j.judgeId ? null : j.judgeId,
                              }))}
                              className="p-1.5 rounded-lg hover:bg-navy-100 text-navy-400 hover:text-navy-600 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-navy-50/50">
                            <td colSpan={7} className="py-4 px-6">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg p-3 border border-navy-100">
                                  <div className="text-xs text-navy-500 mb-1">打分标准差</div>
                                  <div className="text-xl font-bold text-navy-800">{j.scoreStdDev.toFixed(2)}</div>
                                  <div className="text-[10px] text-navy-400 mt-0.5">
                                    {j.scoreStdDev < 3 ? '打分稳定' : j.scoreStdDev < 6 ? '打分波动适中' : '打分波动较大'}
                                  </div>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-navy-100">
                                  <div className="text-xs text-navy-500 mb-1">正方平均分</div>
                                  <div className="text-xl font-bold" style={{ color: PRO_COLOR }}>{j.avgProScore.toFixed(1)}</div>
                                  <div className="w-full h-1.5 rounded-full bg-navy-100 mt-2 overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${(j.avgProScore / 100) * 100}%`, backgroundColor: PRO_COLOR }}
                                    />
                                  </div>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-navy-100">
                                  <div className="text-xs text-navy-500 mb-1">反方平均分</div>
                                  <div className="text-xl font-bold" style={{ color: CON_COLOR }}>{j.avgConScore.toFixed(1)}</div>
                                  <div className="w-full h-1.5 rounded-full bg-navy-100 mt-2 overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{ width: `${(j.avgConScore / 100) * 100}%`, backgroundColor: CON_COLOR }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-navy-400">暂无足够的比赛数据进行评委分析</div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
              <PieChartIcon className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy-900">评委倾向分布</h3>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tendencyDistribution.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#b8cfe8' }}
                >
                  {tendencyDistribution.map((entry, index) => (
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
          <div className="grid grid-cols-3 gap-2 mt-4">
            {tendencyDistribution.map((item) => (
              <div key={item.name} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-navy-600">{item.name}</span>
                </div>
                <div className="text-lg font-bold text-navy-800">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-navy-900">争议判决识别</h3>
              <p className="text-xs text-navy-500">
                识别评委意见分歧较大、存在打分异常的比赛
              </p>
            </div>
          </div>
          <span className="text-xs text-navy-500">
            共 {judgeAnalysis.controversialMatches.length} 场争议比赛
          </span>
        </div>

        {judgeAnalysis.controversialMatches.length > 0 ? (
          <div className="space-y-4">
            {judgeAnalysis.controversialMatches.slice(0, 6).map((match) => (
              <div
                key={match.matchId}
                className="border border-red-100 rounded-xl p-4 bg-red-50/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-semibold">
                        争议判决
                      </span>
                      <span className="text-xs text-navy-500">
                        {match.tournamentName} · 第{match.round}轮
                      </span>
                    </div>
                    <p className="font-medium text-navy-900 truncate">{match.topicTitle}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className="text-xs text-navy-500">最大分差</div>
                    <div className="text-lg font-bold text-red-600">{match.maxScoreDiff}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  <div className="bg-white rounded-lg p-2.5 border border-navy-100">
                    <div className="text-[10px] text-navy-500">分数标准差</div>
                    <div className="text-base font-bold text-navy-800">{match.scoreVariance}</div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-navy-100">
                    <div className="text-[10px] text-navy-500">票数分布</div>
                    <div className="text-base font-bold text-navy-800">
                      <span style={{ color: PRO_COLOR }}>{match.splitVotes.pro}</span>
                      <span className="text-navy-300 mx-1">:</span>
                      <span style={{ color: CON_COLOR }}>{match.splitVotes.con}</span>
                      {match.splitVotes.draw > 0 && (
                        <span className="text-navy-400 ml-1">({match.splitVotes.draw}平)</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-navy-100 sm:col-span-1 col-span-2">
                    <div className="text-[10px] text-navy-500">判决类型</div>
                    <div className="text-base font-bold text-navy-800">
                      {match.hasSplitDecision ? (
                        <span className="text-red-600">分裂判决 ⚠️</span>
                      ) : (
                        <span className="text-gold-600">打分差异大</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-navy-100">
                  <div className="text-[10px] text-navy-500 mb-2">评委打分详情</div>
                  <div className="space-y-2">
                    {match.judgeScores.map((js, idx) => (
                      <div key={js.judgeId} className="flex items-center gap-3 text-xs">
                        <span className="w-20 truncate text-navy-700">{js.judgeName}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <span className="w-8 text-right font-medium" style={{ color: PRO_COLOR }}>{js.proScore}</span>
                          <div className="flex-1 h-2 bg-navy-100 rounded-full overflow-hidden flex">
                            <div
                              className="h-full"
                              style={{
                                width: `${(js.proScore / (js.proScore + js.conScore)) * 100}%`,
                                backgroundColor: PRO_COLOR,
                              }}
                            />
                            <div
                              className="h-full"
                              style={{
                                width: `${(js.conScore / (js.proScore + js.conScore)) * 100}%`,
                                backgroundColor: CON_COLOR,
                              }}
                            />
                          </div>
                          <span className="w-8 font-medium" style={{ color: CON_COLOR }}>{js.conScore}</span>
                        </div>
                        <span className={cn(
                          'w-12 text-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                          js.vote === 'pro' ? 'bg-navy-100 text-navy-600' : js.vote === 'con' ? 'bg-gold-100 text-gold-700' : 'bg-navy-50 text-navy-500'
                        )}>
                          {js.vote === 'pro' ? '投正方' : js.vote === 'con' ? '投反方' : '平局'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-navy-400">
            <Scale className="h-12 w-12 mx-auto mb-3 text-navy-200" />
            <p>暂无争议判决记录</p>
            <p className="text-xs mt-1">评委打分一致性良好</p>
          </div>
        )}
      </div>
    </div>
  );
}
