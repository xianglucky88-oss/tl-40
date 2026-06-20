import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Swords,
  Users,
  Calendar,
  Award,
  ChevronRight,
  Clock,
  Medal,
  BarChart3,
  Star,
  Target,
  TrendingUp,
  Crown,
  Layers,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import type {
  DebateFormat,
  TournamentType,
  ArchivedMatch,
  ArchivedTeam,
} from '@/types';

const formatLabels: Record<DebateFormat, string> = {
  parliamentary: '议会制',
  mandarin: '华语制',
  moot_court: '模拟法庭',
  british_parliamentary: '英国议会制',
};

const typeLabels: Record<TournamentType, string> = {
  single_elimination: '单败淘汰赛',
  round_robin: '循环赛',
  swiss: '瑞士轮',
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function MatchItem({
  match,
  onClick,
}: {
  match: ArchivedMatch;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer p-4 group hover:border-gold-400 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="badge-gold text-[11px]">第{match.round}轮</span>
          <span className="text-[11px] text-navy-400">#{match.matchNumber}</span>
        </div>
        <span className="badge-green text-[11px]">
          <Trophy className="w-3 h-3" />
          已结束
        </span>
      </div>

      <div className="mb-3">
        <p className="font-serif text-sm font-semibold text-navy-800 line-clamp-2 group-hover:text-gold-600 transition-colors">
          {match.topicTitle}
        </p>
      </div>

      <div className="relative flex items-stretch gap-2 mb-3">
        <div className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50/50 p-2">
          <div className="text-[10px] font-semibold text-emerald-600 mb-0.5">正方</div>
          <div className="font-serif font-bold text-navy-800 text-xs line-clamp-1">
            {match.proTeamName}
          </div>
          {match.scores && (
            <div className="text-lg font-bold text-emerald-600 mt-1">
              {match.scores.proTeamTotal}
            </div>
          )}
        </div>

        <div className="relative flex items-center justify-center px-1">
          <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-gold text-white shadow-sm">
            <Swords className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex-1 rounded-lg border border-red-200 bg-red-50/50 p-2 text-right">
          <div className="text-[10px] font-semibold text-red-500 mb-0.5">反方</div>
          <div className="font-serif font-bold text-navy-800 text-xs line-clamp-1">
            {match.conTeamName}
          </div>
          {match.scores && (
            <div className="text-lg font-bold text-red-500 mt-1">
              {match.scores.conTeamTotal}
            </div>
          )}
        </div>
      </div>

      {match.winner && (
        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-navy-100">
          <Medal className="w-3.5 h-3.5 text-gold-500" />
          <span className="text-xs font-semibold">
            {match.winner === 'pro' && (
              <span className="text-emerald-600">正方 {match.proTeamName} 获胜</span>
            )}
            {match.winner === 'con' && (
              <span className="text-red-600">反方 {match.conTeamName} 获胜</span>
            )}
            {match.winner === 'draw' && (
              <span className="text-navy-600">平局</span>
            )}
          </span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-navy-100 flex items-center justify-between text-[11px] text-navy-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatTime(match.startedAt)} - {formatTime(match.finishedAt)}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-gold-500 font-medium group-hover:translate-x-0.5 transition-transform">
          查看详情
          <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

function TeamRankingItem({
  team,
  rank,
}: {
  team: ArchivedTeam;
  rank: number;
}) {
  const getRankBadge = () => {
    if (rank === 1) return 'bg-gradient-gold text-white';
    if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-400 text-white';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
    return 'bg-navy-100 text-navy-600';
  };

  const winRate =
    team.wins + team.losses + team.draws > 0
      ? Math.round((team.wins / (team.wins + team.losses + team.draws)) * 100)
      : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-navy-50 transition-colors">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${getRankBadge()}`}
      >
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-serif font-semibold text-navy-800 text-sm line-clamp-1">
          {team.name}
        </div>
        <div className="text-[11px] text-navy-400">{team.institution}</div>
      </div>

      <div className="flex items-center gap-4 text-xs flex-shrink-0">
        <div className="text-center">
          <div className="font-bold text-emerald-600">{team.wins}</div>
          <div className="text-navy-400 text-[10px]">胜</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-red-500">{team.losses}</div>
          <div className="text-navy-400 text-[10px]">负</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-navy-600">{team.draws}</div>
          <div className="text-navy-400 text-[10px]">平</div>
        </div>
        <div className="text-center min-w-[50px]">
          <div className="font-bold text-gold-600">{winRate}%</div>
          <div className="text-navy-400 text-[10px]">胜率</div>
        </div>
      </div>
    </div>
  );
}

export default function ArchivedTournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getArchivedTournamentById = useDebateStore((s) => s.getArchivedTournamentById);

  const tournament = useMemo(() => (id ? getArchivedTournamentById(id) : undefined), [
    id,
    getArchivedTournamentById,
  ]);

  const [activeRound, setActiveRound] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'matches' | 'ranking' | 'stats'>('matches');

  const rounds = useMemo(() => {
    if (!tournament) return [];
    const roundSet = new Set(tournament.matches.map((m) => m.round));
    return Array.from(roundSet).sort((a, b) => a - b);
  }, [tournament]);

  const roundMatches = useMemo(() => {
    if (!tournament) return [];
    return tournament.matches
      .filter((m) => m.round === activeRound)
      .sort((a, b) => a.matchNumber - b.matchNumber);
  }, [tournament, activeRound]);

  const sortedTeams = useMemo(() => {
    if (!tournament) return [];
    return [...tournament.teams].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.draws !== a.draws) return b.draws - a.draws;
      return b.players.reduce((sum, p) => sum + p.avgScore, 0) - a.players.reduce((sum, p) => sum + p.avgScore, 0);
    });
  }, [tournament]);

  if (!tournament) {
    return (
      <div className="card p-12 text-center">
        <Trophy className="w-16 h-16 text-navy-200 mx-auto mb-4" />
        <h3 className="font-serif text-xl font-bold text-navy-700 mb-2">赛事不存在</h3>
        <p className="text-navy-500 text-sm mb-4">找不到该历史赛事记录</p>
        <button onClick={() => navigate('/archive')} className="btn-gold text-sm">
          <ArrowLeft className="w-4 h-4" />
          返回档案馆
        </button>
      </div>
    );
  }

  const handleMatchClick = (matchId: string) => {
    navigate(`/archive/${tournament.id}/match/${matchId}`);
  };

  return (
    <div className="space-y-6 stagger-fade-in">
      <button
        onClick={() => navigate('/archive')}
        className="inline-flex items-center gap-1.5 text-navy-500 hover:text-navy-700 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回历史档案馆
      </button>

      <div className="card-navy p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold-400/10 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gold-400/10 translate-y-1/2 -translate-x-1/4" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="badge bg-gold-400/20 text-gold-200 ring-1 ring-gold-300/30">
              {tournament.season}
            </span>
            <span className="badge bg-white/10 text-gold-100 ring-1 ring-white/10">
              {formatLabels[tournament.format]}
            </span>
            <span className="badge bg-white/10 text-white/70 ring-1 ring-white/10">
              {typeLabels[tournament.type]}
            </span>
            <span className="text-white/60 text-sm">· {tournament.year}年</span>
          </div>

          <h1 className="font-serif text-2xl md:text-3xl font-bold text-white mb-3">
            {tournament.name}
          </h1>

          {tournament.description && (
            <p className="text-white/70 text-sm mb-6 max-w-2xl">
              {tournament.description}
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <Trophy className="w-4 h-4 text-gold-400" />
                <span>冠军</span>
              </div>
              <div className="font-serif font-bold text-white line-clamp-1">
                {tournament.championTeamName ?? '-'}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>参赛队伍</span>
              </div>
              <div className="font-serif font-bold text-white">
                {tournament.teams.length} 支
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <Swords className="w-4 h-4 text-red-400" />
                <span>总场次</span>
              </div>
              <div className="font-serif font-bold text-white">
                {tournament.totalMatches} 场
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>赛期</span>
              </div>
              <div className="font-serif font-bold text-white text-sm">
                {formatDate(tournament.startDate)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-1">
        <div className="flex items-center bg-navy-50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'matches'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <Layers className="w-4 h-4 inline-block mr-1.5" />
            赛事进程
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'ranking'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline-block mr-1.5" />
            队伍排行
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'stats'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-1.5" />
            数据统计
          </button>
        </div>
      </div>

      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-gold-500" />
              选择轮次
            </h3>
            <div className="flex flex-wrap gap-2">
              {rounds.map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRound(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeRound === r
                      ? 'bg-gradient-gold text-white shadow-md'
                      : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                  }`}
                >
                  第 {r} 轮
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2">
                  <Swords className="w-5 h-5 text-gold-500" />
                  第 {activeRound} 轮比赛
                </h3>
                <p className="mt-1 text-sm text-navy-500">
                  共 {roundMatches.length} 场比赛
                </p>
              </div>
            </div>

            {roundMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roundMatches.map((m) => (
                  <MatchItem
                    key={m.id}
                    match={m}
                    onClick={() => handleMatchClick(m.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Swords className="w-12 h-12 text-navy-200 mx-auto mb-3" />
                <p className="text-navy-500 text-sm">该轮暂无比赛</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ranking' && (
        <div className="card p-5">
          <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-5">
            <Crown className="w-5 h-5 text-gold-500" />
            最终排行榜
          </h3>

          <div className="space-y-1">
            {sortedTeams.map((team, idx) => (
              <TeamRankingItem key={team.id} team={team} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-gold-500" />
              赛事概览
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-navy-50">
                <span className="text-navy-500 text-sm">赛事名称</span>
                <span className="font-medium text-navy-800">{tournament.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-navy-50">
                <span className="text-navy-500 text-sm">比赛赛制</span>
                <span className="font-medium text-navy-800">{formatLabels[tournament.format]}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-navy-50">
                <span className="text-navy-500 text-sm">赛事类型</span>
                <span className="font-medium text-navy-800">{typeLabels[tournament.type]}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-navy-50">
                <span className="text-navy-500 text-sm">参赛队伍</span>
                <span className="font-medium text-navy-800">{tournament.teams.length} 支</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-navy-50">
                <span className="text-navy-500 text-sm">总场次</span>
                <span className="font-medium text-navy-800">{tournament.totalMatches} 场</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-navy-50">
                <span className="text-navy-500 text-sm">总轮数</span>
                <span className="font-medium text-navy-800">{tournament.totalRounds} 轮</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-navy-50">
                <span className="text-navy-500 text-sm">每场评委数</span>
                <span className="font-medium text-navy-800">{tournament.judgesPerMatch} 位</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-navy-500 text-sm">举办时间</span>
                <span className="font-medium text-navy-800">
                  {formatDate(tournament.startDate)} ~ {formatDate(tournament.endDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-gold-500" />
              冠亚军
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gold-50 to-amber-50 border border-gold-200">
                <div className="w-14 h-14 rounded-full bg-gradient-gold flex items-center justify-center shadow-lg flex-shrink-0">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gold-600 font-semibold mb-1">冠军</div>
                  <div className="font-serif font-bold text-navy-900 text-lg line-clamp-1">
                    {tournament.championTeamName ?? '-'}
                  </div>
                </div>
                <Medal className="w-8 h-8 text-gold-500" />
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-md flex-shrink-0">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500 font-semibold mb-1">亚军</div>
                  <div className="font-serif font-bold text-navy-800 line-clamp-1">
                    {tournament.runnerUpTeamName ?? '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
