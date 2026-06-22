import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Swords,
  Users,
  Clock,
  MessageSquare,
  Star,
  Award,
  Gavel,
  BarChart3,
  FileText,
  Target,
  Clock as ClockIcon,
  GitBranch,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import { getFormatRules } from '@/engines/formatRules';
import type { DebateStageConfig } from '@/types';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatDuration(start: number, end: number): string {
  const diff = Math.floor((end - start) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
}

function ScoreBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-navy-600 font-medium">{label}</span>
        <span className="font-bold text-navy-800">{value}</span>
      </div>
      <div className="h-2 bg-navy-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function MatchArchiveDetailPage() {
  const { tournamentId, matchId } = useParams<{ tournamentId: string; matchId: string }>();
  const navigate = useNavigate();
  const getArchivedTournamentById = useDebateStore((s) => s.getArchivedTournamentById);
  const getArchivedMatchById = useDebateStore((s) => s.getArchivedMatchById);

  const tournament = useMemo(
    () => (tournamentId ? getArchivedTournamentById(tournamentId) : undefined),
    [tournamentId, getArchivedTournamentById]
  );

  const match = useMemo(
    () => (matchId ? getArchivedMatchById(matchId) : undefined),
    [matchId, getArchivedMatchById]
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'stages' | 'scores' | 'judges'>('overview');

  const proTeam = useMemo(() => {
    if (!tournament || !match) return null;
    return tournament.teams.find((t) => t.id === match.proTeamId);
  }, [tournament, match]);

  const conTeam = useMemo(() => {
    if (!tournament || !match) return null;
    return tournament.teams.find((t) => t.id === match.conTeamId);
  }, [tournament, match]);

  const formatRules = useMemo(() => {
    if (!tournament) return null;
    return getFormatRules(tournament.format);
  }, [tournament]);

  const proPlayerMatchScores = useMemo(() => {
    if (!match?.scores || !proTeam) return [];
    return proTeam.players.map((p) => {
      const scores: number[] = [];
      match.scores.judgeScores.forEach((js) => {
        const ps = js.proPlayerScores[p.id];
        if (ps) scores.push(ps.total);
      });
      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
      return { ...p, matchAvgScore: avgScore, matchScores: scores };
    });
  }, [match?.scores, proTeam]);

  const conPlayerMatchScores = useMemo(() => {
    if (!match?.scores || !conTeam) return [];
    return conTeam.players.map((p) => {
      const scores: number[] = [];
      match.scores.judgeScores.forEach((js) => {
        const ps = js.conPlayerScores[p.id];
        if (ps) scores.push(ps.total);
      });
      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
      return { ...p, matchAvgScore: avgScore, matchScores: scores };
    });
  }, [match?.scores, conTeam]);

  const mvpPlayerId = match?.scores?.mvpPlayerId;

  if (!match || !tournament) {
    return (
      <div className="card p-12 text-center">
        <Trophy className="w-16 h-16 text-navy-200 mx-auto mb-4" />
        <h3 className="font-serif text-xl font-bold text-navy-700 mb-2">比赛不存在</h3>
        <p className="text-navy-500 text-sm mb-4">找不到该场比赛记录</p>
        <button
          onClick={() => navigate(`/archive/${tournamentId}`)}
          className="btn-gold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回赛事详情
        </button>
      </div>
    );
  }

  const proScore = match.scores?.proTeamTotal ?? 0;
  const conScore = match.scores?.conTeamTotal ?? 0;
  const maxScore = Math.max(proScore, conScore, 100);

  return (
    <div className="space-y-6 stagger-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate(`/archive/${tournamentId}`)}
          className="inline-flex items-center gap-1.5 text-navy-500 hover:text-navy-700 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回 {tournament.name}
        </button>
        <button
          onClick={() => navigate(`/archive/${tournamentId}/match/${matchId}/review`)}
          className="btn-gold text-sm"
        >
          <GitBranch className="w-4 h-4" />
          进入复盘模式
        </button>
      </div>

      <div className="card-navy p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold-400/10 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gold-400/10 translate-y-1/2 -translate-x-1/4" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="badge-gold">第{match.round}轮</span>
            <span className="badge bg-white/10 text-white/80 ring-1 ring-white/20">
              #{match.matchNumber}
            </span>
            <span className="badge-green">
              <Trophy className="w-3 h-3" />
              已结束
            </span>
          </div>

          <div className="flex items-start gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
            <h1 className="font-serif text-xl md:text-2xl font-bold text-white leading-snug">
              {match.topicTitle}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-6 md:gap-12">
            <div className="text-center">
              <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                正方 PRO
              </div>
              <div className="font-serif text-lg md:text-xl font-bold text-white mb-1">
                {match.proTeamName}
              </div>
              <div className="text-white/60 text-sm">{match.proTeamInstitution}</div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-semibold text-red-300 uppercase tracking-wider mb-2">
                反方 CON
              </div>
              <div className="font-serif text-lg md:text-xl font-bold text-white mb-1">
                {match.conTeamName}
              </div>
              <div className="text-white/60 text-sm">{match.conTeamInstitution}</div>
            </div>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative z-10 mx-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-gold flex items-center justify-center shadow-xl">
                <Swords className="w-7 h-7 md:w-9 md:h-9 text-white" />
              </div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-6 md:gap-12 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-emerald-300 font-serif">
                {proScore}
              </div>
              <div className="text-white/60 text-sm mt-1">正方总分</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-red-300 font-serif">
                {conScore}
              </div>
              <div className="text-white/60 text-sm mt-1">反方总分</div>
            </div>
          </div>

          {match.winner && (
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-400/20 ring-1 ring-gold-400/40">
                <Trophy className="w-5 h-5 text-gold-400" />
                <span className="font-semibold text-gold-200">
                  {match.winner === 'pro' && `正方 ${match.proTeamName} 获胜`}
                  {match.winner === 'con' && `反方 ${match.conTeamName} 获胜`}
                  {match.winner === 'draw' && '平局'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-xs text-navy-400">参赛队伍</div>
            <div className="font-bold text-navy-800">2 支</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Gavel className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-xs text-navy-400">评委人数</div>
            <div className="font-bold text-navy-800">{match.judgeNames.length} 位</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <div className="text-xs text-navy-400">比赛时长</div>
            <div className="font-bold text-navy-800">{formatDuration(match.startedAt, match.finishedAt)}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-navy-400">比赛时间</div>
            <div className="font-bold text-navy-800 text-xs">{formatTime(match.startedAt)}</div>
          </div>
        </div>
      </div>

      <div className="card p-1">
        <div className="flex items-center bg-navy-50 rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-1.5" />
            比赛概览
          </button>
          <button
            onClick={() => setActiveTab('stages')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'stages'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <ClockIcon className="w-4 h-4 inline-block mr-1.5" />
            赛程回顾
          </button>
          <button
            onClick={() => setActiveTab('scores')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'scores'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline-block mr-1.5" />
            选手评分
          </button>
          <button
            onClick={() => setActiveTab('judges')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'judges'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <Gavel className="w-4 h-4 inline-block mr-1.5" />
            评委名单
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-gold-500" />
              辩题详情
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-navy-600 mb-2">辩题</div>
                <div className="font-serif text-navy-800 leading-relaxed">{match.topicTitle}</div>
              </div>
              <div className="pt-4 border-t border-navy-100">
                <div className="flex items-start gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span className="text-sm font-semibold text-emerald-700">正方立场</span>
                </div>
                <p className="text-sm text-navy-600 ml-4">{match.topicProSide}</p>
              </div>
              <div className="pt-4 border-t border-navy-100">
                <div className="flex items-start gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-600">反方立场</span>
                </div>
                <p className="text-sm text-navy-600 ml-4">{match.topicConSide}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gold-500" />
              比分详情
            </h3>
            <div className="space-y-5">
              <ScoreBar
                label={`正方总分`}
                value={proScore}
                maxValue={maxScore}
                color="bg-gradient-to-r from-emerald-400 to-emerald-500"
              />
              <ScoreBar
                label={`反方总分`}
                value={conScore}
                maxValue={maxScore}
                color="bg-gradient-to-r from-red-400 to-red-500"
              />

              <div className="pt-4 border-t border-navy-100">
                <div className="flex items-center justify-between">
                <span className="text-navy-500 text-sm">分差</span>
                <span className={`font-bold text-lg ${
                  proScore > conScore ? 'text-emerald-600' :
                  conScore > proScore ? 'text-red-600' : 'text-navy-600'
                }`}>
                  {Math.abs(proScore - conScore)} 分
                </span>
              </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gold-500" />
              正方队伍
            </h3>
            {proTeam ? (
              <div className="space-y-3">
                <div className="font-serif font-bold text-navy-800 text-lg">{proTeam.name}</div>
                <div className="text-sm text-navy-500">{proTeam.institution}</div>
                <div className="space-y-2 pt-3 border-t border-navy-100">
                  {proPlayerMatchScores.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                          {p.role}
                        </span>
                        <span className="text-sm text-navy-700">{p.name}</span>
                        {mvpPlayerId === p.id && (
                          <Award className="w-3.5 h-3.5 text-gold-500" />
                        )}
                      </div>
                      <div className="text-xs font-semibold text-emerald-600">
                        本场 {p.matchAvgScore.toFixed(1)} 分
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-navy-400 text-sm">队伍信息暂无</p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gold-500" />
              反方队伍
            </h3>
            {conTeam ? (
              <div className="space-y-3">
                <div className="font-serif font-bold text-navy-800 text-lg">{conTeam.name}</div>
                <div className="text-sm text-navy-500">{conTeam.institution}</div>
                <div className="space-y-2 pt-3 border-t border-navy-100">
                  {conPlayerMatchScores.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                          {p.role}
                        </span>
                        <span className="text-sm text-navy-700">{p.name}</span>
                        {mvpPlayerId === p.id && (
                          <Award className="w-3.5 h-3.5 text-gold-500" />
                        )}
                      </div>
                      <div className="text-xs font-semibold text-red-600">
                        本场 {p.matchAvgScore.toFixed(1)} 分
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-navy-400 text-sm">队伍信息暂无</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stages' && (
        <div className="card p-5">
          <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-gold-500" />
            赛程回顾
            {formatRules && (
              <span className="text-sm font-normal text-navy-500">· {formatRules.label}</span>
            )}
          </h3>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-400 via-navy-200 to-transparent" />
            {formatRules?.stages.map((stage: DebateStageConfig, idx: number) => {
              const sideLabel =
                stage.side === 'pro' ? '正方' :
                stage.side === 'con' ? '反方' :
                stage.side === 'judge' ? '评委' : '双方';
              const durationMin = Math.floor(stage.duration / 60);
              const durationSec = stage.duration % 60;
              const durationStr = durationSec > 0
                ? `${durationMin}分${durationSec}秒`
                : `${durationMin}分钟`;
              return (
                <div key={stage.id} className="relative">
                  <div className="absolute -left-[1px] top-2.5 w-[15px] h-[15px] rounded-full border-2 border-white shadow-sm bg-gradient-gold" />
                  <div className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          stage.side === 'pro' ? 'bg-emerald-100 text-emerald-700' :
                          stage.side === 'con' ? 'bg-red-100 text-red-700' :
                          stage.side === 'judge' ? 'bg-navy-100 text-navy-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {sideLabel}
                        </span>
                        <span className="font-serif font-semibold text-navy-800">{stage.name}</span>
                        {stage.bpRole && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-100 text-gold-700 font-medium">
                            {stage.bpRole.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-navy-400 font-mono">{durationStr}</span>
                    </div>
                    {stage.crossExamine?.enabled && (
                      <p className="text-xs text-purple-600 mb-1.5">
                        * 含盘问环节 {stage.crossExamine.duration ? `(${Math.floor(stage.crossExamine.duration / 60)}分钟)` : ''}
                      </p>
                    )}
                    <p className="text-sm text-navy-500 ml-0">
                      {stage.speakerIndex != null && `${['一辩', '二辩', '三辩', '四辩'][stage.speakerIndex] || ''}发言`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'scores' && (
        <div className="card p-5">
          <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-5">
            <Star className="w-5 h-5 text-gold-500" />
            选手评分
            {match?.scores && (
              <span className="text-sm font-normal text-navy-500">
                · 单场评分
              </span>
            )}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                正方选手
              </h4>
              <div className="space-y-3">
                {proPlayerMatchScores.map((p) => (
                <div key={p.id} className="card p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                          {p.role}
                        </span>
                        <div>
                          <span className="font-medium text-navy-800">{p.name}</span>
                          {mvpPlayerId === p.id && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-gold-600">
                              <Award className="w-3 h-3" />
                              MVP
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-600 font-serif">
                          {p.matchAvgScore.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-navy-400 flex-wrap">
                      {p.matchScores.length > 0 && (
                        <span>
                          评委评分: {p.matchScores.map(s => s.toFixed(0)).join(' / ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                反方选手
              </h4>
              <div className="space-y-3">
                {conPlayerMatchScores.map((p) => (
                <div key={p.id} className="card p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                          {p.role}
                        </span>
                        <div>
                          <span className="font-medium text-navy-800">{p.name}</span>
                          {mvpPlayerId === p.id && (
                            <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-gold-600">
                              <Award className="w-3 h-3" />
                              MVP
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-500 font-serif">
                          {p.matchAvgScore.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-navy-400 flex-wrap">
                      {p.matchScores.length > 0 && (
                        <span>
                          评委评分: {p.matchScores.map(s => s.toFixed(0)).join(' / ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'judges' && (
        <div className="card p-5">
          <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-5">
            <Gavel className="w-5 h-5 text-gold-500" />
            评委团
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {match.judgeNames.map((name, idx) => (
              <div key={idx} className="card p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center flex-shrink-0">
                  <Gavel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-serif font-semibold text-navy-800">{name}</div>
                  <div className="text-xs text-navy-400">评委 #{idx + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
