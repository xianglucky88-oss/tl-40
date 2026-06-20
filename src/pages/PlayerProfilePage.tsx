import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  ArrowLeft,
  Trophy,
  Medal,
  Target,
  TrendingUp,
  TrendingDown,
  Swords,
  Clock,
  Award,
  BarChart3,
  PieChart,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import StatCard from '@/components/ui/StatCard';
import RankBadge from '@/components/ui/RankBadge';
import Empty from '@/components/ui/Empty';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

const ROLE_COLORS: Record<string, string> = {
  '一辩': '#0F2944',
  '二辩': '#D4A574',
  '三辩': '#5485bf',
  '四辩': '#8b5735',
  '替补': '#b8cfe8',
};

export default function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const store = useDebateStore();

  const playerDetail = playerId ? store.getPlayerDetail(playerId) : null;

  if (!playerDetail) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Empty
          icon={<User className="h-12 w-12" strokeWidth={1.5} />}
          title="未找到辩手信息"
          description="该辩手不存在或数据异常，请返回重试。"
          action={
            <button onClick={() => navigate(-1)} className="btn-primary">
              <ArrowLeft className="w-4 h-4" />返回
            </button>
          }
        />
      </div>
    );
  }

  const rolePieData = playerDetail.roleStats.map((rs) => ({
    name: rs.role,
    value: rs.count,
    avgScore: rs.avgScore.toFixed(1),
  }));

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-navy-600 hover:text-navy-900 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
      </div>

      <div className="card p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-navy flex items-center justify-center shadow-card flex-shrink-0">
            <User className="w-10 h-10 md:w-12 md:h-12 text-gold-300" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900">
                {playerDetail.playerName}
              </h1>
              {playerDetail.rank && playerDetail.rank <= 10 && (
                <RankBadge rank={playerDetail.rank} />
              )}
              <span className="badge badge-gold text-sm px-3 py-1">
                {playerDetail.role}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-navy-600">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-gold-500" />
                {playerDetail.teamName}
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-navy-400" />
                {playerDetail.institution}
              </span>
              {playerDetail.contact && (
                <span className="flex items-center gap-1.5">
                  <span className="text-navy-400">✉</span>
                  {playerDetail.contact}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xs text-navy-500 mb-1">综合评分</p>
              <p className="font-serif text-3xl md:text-4xl font-bold text-gold-600">
                {playerDetail.avgScore.toFixed(1)}
              </p>
            </div>
            <div className="text-xs text-navy-500">
              共 {playerDetail.totalMatches} 场比赛
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-fade-in">
        <StatCard
          title="参赛场次"
          value={playerDetail.totalMatches}
          icon={<Swords className="w-5 h-5" />}
          color="navy"
        />
        <StatCard
          title="胜场数"
          value={playerDetail.wins}
          icon={<Trophy className="w-5 h-5" />}
          color="gold"
        />
        <StatCard
          title="胜率"
          value={`${(playerDetail.winRate * 100).toFixed(1)}%`}
          icon={<Target className="w-5 h-5" />}
          color="emerald"
          trend={playerDetail.winRate >= 0.5 ? '+优秀' : '-需提升'}
        />
        <StatCard
          title="MVP次数"
          value={playerDetail.mvpCount}
          icon={<Medal className="w-5 h-5" />}
          color="gold"
          trend={`MVP率 ${(playerDetail.mvpRate * 100).toFixed(1)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="flex items-center gap-2 mb-4 text-navy-900 font-serif text-lg font-semibold">
            <TrendingUp className="w-5 h-5 text-gold-500" />
            评分趋势
          </h3>
          {playerDetail.scoreTrend.length > 0 ? (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={playerDetail.scoreTrend}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0eaf5" />
                  <XAxis
                    dataKey="matchLabel"
                    tick={{ fontSize: 11, fill: '#1b3f6c' }}
                    axisLine={{ stroke: '#b8cfe8' }}
                    tickLine={false}
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
                    labelStyle={{ color: '#0F2944', fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="单场得分"
                    stroke="#D4A574"
                    strokeWidth={2.5}
                    dot={{ fill: '#D4A574', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#D4A574' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    name="累计平均分"
                    stroke="#0F2944"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <Empty
                icon={<BarChart3 className="h-8 w-8 text-navy-300" />}
                title="暂无比赛数据"
                description="完成比赛后将显示评分趋势"
              />
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="flex items-center gap-2 mb-4 text-navy-900 font-serif text-lg font-semibold">
            <PieChart className="w-5 h-5 text-gold-500" />
            角色分布
          </h3>
          {playerDetail.roleStats.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div style={{ width: '100%', maxWidth: 240, height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={rolePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {rolePieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={ROLE_COLORS[entry.name] || '#b8cfe8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #b8cfe8',
                        boxShadow: '0 4px 20px -4px rgba(15,41,68,0.15)',
                      }}
                      formatter={(value: number, name: string, props: { payload: { avgScore: string } }) => [
                        `${value} 场 (平均 ${props.payload.avgScore} 分)`,
                        name,
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {playerDetail.roleStats.map((rs) => (
                  <div
                    key={rs.role}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-ivory-50/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ROLE_COLORS[rs.role] || '#b8cfe8' }}
                      />
                      <span className="text-sm font-medium text-navy-800">{rs.role}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-navy-900">{rs.count} 场</span>
                      <span className="text-xs text-navy-500 ml-2">
                        平均 {rs.avgScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <Empty
                icon={<PieChart className="h-8 w-8 text-navy-300" />}
                title="暂无角色数据"
                description="完成比赛后将显示角色分布"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-medium">胜场</p>
              <p className="text-2xl font-bold text-emerald-800">{playerDetail.wins}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-red-700 font-medium">负场</p>
              <p className="text-2xl font-bold text-red-800">{playerDetail.losses}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 bg-gradient-to-br from-gold-50 to-gold-100/50 border-gold-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center">
              <Medal className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gold-700 font-medium">平局</p>
              <p className="text-2xl font-bold text-gold-800">{playerDetail.draws}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-navy-100/60">
          <h3 className="flex items-center gap-2 text-navy-900 font-serif text-lg font-semibold">
            <Calendar className="w-5 h-5 text-gold-500" />
            参赛记录
            <span className="text-sm font-normal text-navy-500 ml-2">
              共 {playerDetail.matchRecords.length} 场
            </span>
          </h3>
        </div>

        {playerDetail.matchRecords.length > 0 ? (
          <div className="divide-y divide-navy-100/60">
            {playerDetail.matchRecords
              .slice()
              .sort((a, b) => b.date - a.date)
              .map((record, idx) => (
                <div
                  key={record.matchId}
                  className={cn(
                    'px-6 py-4 hover:bg-navy-50/40 transition-colors cursor-pointer',
                    'stagger-fade-in'
                  )}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  onClick={() => navigate(`/archive/${record.tournamentId}/match/${record.matchId}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={cn(
                            'badge text-xs',
                            record.isWin
                              ? 'badge-green'
                              : record.isDraw
                              ? 'badge-gold'
                              : 'badge-red'
                          )}
                        >
                          {record.isWin ? '胜' : record.isDraw ? '平' : '负'}
                        </span>
                        <span className="text-sm font-medium text-navy-800">
                          第{record.round}轮 · 第{record.matchNumber}场
                        </span>
                        {record.isMVP && (
                          <span className="badge badge-gold">
                            <Medal className="w-3 h-3" />
                            MVP
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-navy-600 truncate">{record.topicTitle}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-navy-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(record.date).toLocaleDateString('zh-CN')}
                        </span>
                        <span>·</span>
                        <span>
                          {record.side === 'pro' ? '正方' : '反方'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-navy-500 mb-0.5">对阵</p>
                        <p className="text-sm font-medium text-navy-700">
                          vs {record.opponentTeamName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-navy-500 mb-0.5">得分</p>
                        <p
                          className={cn(
                            'text-xl font-bold font-serif',
                            record.isWin
                              ? 'text-emerald-600'
                              : record.isDraw
                              ? 'text-gold-600'
                              : 'text-red-500'
                          )}
                        >
                          {record.score.toFixed(1)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-navy-300 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="py-12">
            <Empty
              icon={<Swords className="h-10 w-10 text-navy-300" />}
              title="暂无参赛记录"
              description="该辩手尚未参加任何比赛"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 text-center">
          <p className="text-xs text-navy-500 mb-1">最高得分</p>
          <p className="text-2xl font-bold text-emerald-600 font-serif">
            {playerDetail.highestScore > 0 ? playerDetail.highestScore.toFixed(1) : '-'}
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-navy-500 mb-1">最低得分</p>
          <p className="text-2xl font-bold text-red-500 font-serif">
            {playerDetail.lowestScore < Infinity ? playerDetail.lowestScore.toFixed(1) : '-'}
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-navy-500 mb-1">总得分</p>
          <p className="text-2xl font-bold text-navy-900 font-serif">
            {playerDetail.totalScore.toFixed(1)}
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-navy-500 mb-1">场均得分</p>
          <p className="text-2xl font-bold text-gold-600 font-serif">
            {playerDetail.avgScore.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}
