import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebateStore } from '@/store/debateStore';
import { MatchCard } from '@/components/cards/MatchCard';
import Empty from '@/components/ui/Empty';
import { AlertTriangle, Swords, ListTree, Sparkles, RefreshCw, Archive, CheckCircle, ImagePlus, X } from 'lucide-react';
import type { DebateFormat, TournamentType, MatchPairing, Team } from '@/types';

const formatOptions: { value: DebateFormat; label: string }[] = [
  { value: 'parliamentary', label: '议会制' },
  { value: 'mandarin', label: '华语' },
  { value: 'moot_court', label: '模拟法庭' },
  { value: 'british_parliamentary', label: 'BP' },
];

const typeOptions: { value: TournamentType; label: string }[] = [
  { value: 'single_elimination', label: '单败淘汰' },
  { value: 'swiss', label: '瑞士制' },
  { value: 'round_robin', label: '循环赛' },
];

const ConflictAlert = ({ matchId }: { matchId: string }) => {
  const checkMatchConflicts = useDebateStore((s) => s.checkMatchConflicts);
  const conflicts = useMemo(() => checkMatchConflicts(matchId), [matchId, checkMatchConflicts]);
  if (conflicts.length === 0) return null;
  return (
    <div className="mt-3 rounded-lg border border-red-200 bg-red-50/70 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-red-700 mb-1">回避冲突告警</p>
          <ul className="space-y-0.5">
            {conflicts.map((c, i) => (
              <li key={i} className="text-[11px] text-red-600 leading-tight">
                · 评委「{c.judgeName}」与「{c.teamName}」：{c.reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const BracketView = ({ matches, getTeamById }: {
  matches: MatchPairing[];
  getTeamById: (id: string) => Team | undefined;
}) => {
  const [hoveredMatchId, setHoveredMatchId] = useState<string | null>(null);

  const rounds = useMemo(() => {
    const maxR = Math.max(...matches.map((m) => m.round), 1);
    return Array.from({ length: maxR }, (_, i) => i + 1);
  }, [matches]);

  const matchesByRound = useMemo(() => {
    const map: Record<number, MatchPairing[]> = {};
    rounds.forEach((r) => {
      map[r] = matches.filter((m) => m.round === r);
    });
    return map;
  }, [matches, rounds]);

  const championPath = useMemo(() => {
    const pathSet = new Set<string>();
    const teamPathSet = new Set<string>();
    if (rounds.length === 0) return { matchIds: pathSet, teamIds: teamPathSet };

    const finalRound = rounds[rounds.length - 1];
    const finalMatch = matchesByRound[finalRound]?.[0];
    if (!finalMatch?.winner) return { matchIds: pathSet, teamIds: teamPathSet };

    let currentMatch = finalMatch;
    let currentSide = finalMatch.winner;

    while (currentMatch) {
      pathSet.add(currentMatch.id);
      const winnerTeamId = currentSide === 'pro' ? currentMatch.proTeamId : currentMatch.conTeamId;
      teamPathSet.add(winnerTeamId);

      const prevRound = currentMatch.round - 1;
      if (prevRound < 1) break;

      const prevMatches = matchesByRound[prevRound];
      if (!prevMatches) break;

      let foundMatch: MatchPairing | null = null;
      let foundSide: 'pro' | 'con' | null = null;

      for (const pm of prevMatches) {
        if (pm.winner === 'pro' && pm.proTeamId === winnerTeamId) {
          foundMatch = pm;
          foundSide = 'pro';
          break;
        }
        if (pm.winner === 'con' && pm.conTeamId === winnerTeamId) {
          foundMatch = pm;
          foundSide = 'con';
          break;
        }
      }

      if (!foundMatch) break;
      currentMatch = foundMatch;
      currentSide = foundSide;
    }

    return { matchIds: pathSet, teamIds: teamPathSet };
  }, [rounds, matchesByRound]);

  const getMatchPosition = useCallback((match: MatchPairing, roundMatches: MatchPairing[]) => {
    const matchHeight = 96;
    const gap = 24;
    const index = roundMatches.indexOf(match);
    const paddingTop = roundMatches.length === 1 ? 0 : (gap + matchHeight) * (Math.pow(2, rounds.length - match.round - 1) - 0.5);
    return {
      top: paddingTop + index * (matchHeight + gap) * Math.pow(2, rounds.length - match.round),
      height: matchHeight,
    };
  }, [rounds.length]);

  const renderConnectors = () => {
    const elements: JSX.Element[] = [];
    const cardWidth = 260;
    const gap = 32;

    for (let r = 1; r < rounds.length; r++) {
      const currentRound = matchesByRound[r];
      const nextRound = matchesByRound[r + 1];
      if (!currentRound || !nextRound) continue;

      for (let i = 0; i < currentRound.length; i += 2) {
        const matchA = currentRound[i];
        const matchB = currentRound[i + 1];
        const nextMatchIdx = Math.floor(i / 2);
        const nextMatch = nextRound[nextMatchIdx];
        if (!matchA || !nextMatch) continue;

        const posA = getMatchPosition(matchA, currentRound);
        const posB = matchB ? getMatchPosition(matchB, currentRound) : null;
        const posNext = getMatchPosition(nextMatch, nextRound);

        const startX = cardWidth;
        const endX = cardWidth + gap;

        const aY = posA.top + posA.height / 2;
        const bY = posB ? posB.top + posB.height / 2 : aY;
        const nextY = posNext.top + posNext.height / 2;

        const midX = startX + gap / 2;
        const isActivePath = championPath.matchIds.has(matchA.id) &&
                           (!matchB || championPath.matchIds.has(matchB.id)) &&
                           championPath.matchIds.has(nextMatch.id);

        const connectorClass = isActivePath ? 'bracket-connector-path' : 'bracket-connector';
        const strokeColor = isActivePath ? '#D4A574' : '#b8cfe8';
        const animationDelay = `${(r - 1) * 0.2 + i * 0.05}s`;

        if (matchB) {
          elements.push(
            <g key={`conn-${r}-${i}`}>
              <path
                d={`M ${startX} ${aY} L ${midX} ${aY} L ${midX} ${nextY} L ${endX} ${nextY}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isActivePath ? 3 : 2}
                className={connectorClass}
                style={{ animationDelay }}
              />
              <path
                d={`M ${startX} ${bY} L ${midX} ${bY} L ${midX} ${nextY} L ${endX} ${nextY}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isActivePath ? 3 : 2}
                className={connectorClass}
                style={{ animationDelay: `${parseFloat(animationDelay) + 0.05}s` }}
              />
              {isActivePath && (
                <circle r="4" fill="#D4A574" cx={endX} cy={nextY}>
                  <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin={animationDelay} />
                </circle>
              )}
            </g>
          );
        } else {
          elements.push(
            <path
              key={`conn-${r}-${i}`}
              d={`M ${startX} ${aY} L ${endX} ${nextY}`}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isActivePath ? 3 : 2}
              className={connectorClass}
              style={{ animationDelay }}
            />
          );
        }
      }
    }
    return elements;
  };

  const getRoundLabel = (round: number, totalRounds: number) => {
    if (round === totalRounds && totalRounds > 1) return '🏆 决赛';
    if (round === totalRounds - 1 && totalRounds > 2) return '半决赛';
    if (round === totalRounds - 2 && totalRounds > 3) return '四分之一决赛';
    if (round === 1) return '第一轮';
    return `R${round}`;
  };

  return (
    <div className="overflow-x-auto pb-6 scroll-thin">
      <div className="relative min-w-max p-6 pr-12" style={{ minHeight: Math.max(400, matches.length * 30 + 200) }}>
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        >
          {renderConnectors()}
        </svg>

        <div className="relative flex gap-8" style={{ zIndex: 2 }}>
          {rounds.map((round, roundIndex) => {
            const roundMatches = matchesByRound[round];
            const isFinalRound = round === rounds.length;
            return (
              <div key={round} className="flex flex-col" style={{ minWidth: 260 }}>
                <div className="text-center mb-4 bracket-round-label bracket-round-label-active">
                  <span className="badge-gold text-sm px-3 py-1">
                    {getRoundLabel(round, rounds.length)}
                  </span>
                </div>
                <div className="flex flex-col gap-6 flex-1 relative">
                  {roundMatches.map((m, matchIndex) => {
                    const pro = getTeamById(m.proTeamId);
                    const con = getTeamById(m.conTeamId);
                    const won = m.winner;
                    const isChampionMatch = championPath.matchIds.has(m.id);
                    const isHovered = hoveredMatchId === m.id;
                    const isProWinner = won === 'pro';
                    const isConWinner = won === 'con';
                    const isProInPath = championPath.teamIds.has(m.proTeamId);
                    const isConInPath = championPath.teamIds.has(m.conTeamId);
                    const isBye = m.conTeamId === '__bye__';

                    const animationDelay = `${roundIndex * 0.15 + matchIndex * 0.08}s`;
                    const isChampion = isFinalRound && (isProWinner || isConWinner);

                    return (
                      <div
                        key={m.id}
                        className={`relative card p-3 text-sm bracket-match ${
                          isChampionMatch ? 'winner-card' : ''
                        } ${isHovered ? 'ring-2 ring-gold-400/50' : ''}`}
                        style={{
                          animation: `slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${animationDelay} both`,
                        }}
                        onMouseEnter={() => setHoveredMatchId(m.id)}
                        onMouseLeave={() => setHoveredMatchId(null)}
                      >
                        {isChampion && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 champion-badge">
                            <span className="bg-gradient-gold text-white text-xs px-2 py-0.5 rounded-full shadow-lg font-bold">
                              👑 冠军
                            </span>
                          </div>
                        )}

                        {isBye ? (
                          <div className={`rounded-md px-2.5 py-2 border ${
                            isProInPath ? 'bracket-team-winner bracket-team' : 'bg-emerald-50/50 border border-emerald-100'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-navy-800 truncate">{pro?.name ?? '待定'}</span>
                              <span className="text-gold-600 text-xs font-medium">轮空晋级</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={`rounded-md px-2.5 py-1.5 mb-1 bracket-team border ${
                              isProWinner
                                ? 'bracket-team-winner'
                                : isConWinner
                                ? 'bracket-team-loser'
                                : 'bg-emerald-50/50 border-emerald-100'
                            } ${isProInPath && !isProWinner ? 'bracket-team-winner' : ''}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-navy-800 truncate">{pro?.name ?? '待定'}</span>
                                {isProWinner && (
                                  <span className="text-gold-600 text-xs font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
                                    晋级
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-center py-0.5">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-300/50 to-transparent" />
                              <span className="text-gold-500 text-[10px] font-semibold px-2">VS</span>
                              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-300/50 to-transparent" />
                            </div>

                            <div className={`rounded-md px-2.5 py-1.5 bracket-team border ${
                              isConWinner
                                ? 'bracket-team-winner'
                                : isProWinner
                                ? 'bracket-team-loser'
                                : 'bg-red-50/50 border-red-100'
                            } ${isConInPath && !isConWinner ? 'bracket-team-winner' : ''}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-navy-800 truncate">{con?.name ?? '待定'}</span>
                                {isConWinner && (
                                  <span className="text-gold-600 text-xs font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
                                    晋级
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function TournamentPage() {
  const tournament = useDebateStore((s) => s.tournament);
  const matches = useDebateStore((s) => s.matches);
  const updateTournament = useDebateStore((s) => s.updateTournament);
  const regenerateAllMatches = useDebateStore((s) => s.regenerateAllMatches);
  const generateNextRound = useDebateStore((s) => s.generateNextRound);
  const isCurrentRoundFinished = useDebateStore((s) => s.isCurrentRoundFinished);
  const getTeamById = useDebateStore((s) => s.getTeamById);
  const getMatchesByRound = useDebateStore((s) => s.getMatchesByRound);
  const archiveCurrentTournament = useDebateStore((s) => s.archiveCurrentTournament);
  const navigate = useNavigate();

  const [activeRound, setActiveRound] = useState<number>(tournament.currentRound);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('list');
  const [archiveResult, setArchiveResult] = useState<{ success: boolean; message: string } | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const totalRounds = tournament.totalRounds;
  const roundList = useMemo(
    () => Array.from({ length: totalRounds }, (_, i) => i + 1),
    [totalRounds]
  );
  const roundMatches = getMatchesByRound(activeRound);
  const canGenerateNext = useMemo(() => {
    if (tournament.currentRound >= totalRounds) return false;
    return isCurrentRoundFinished();
  }, [tournament.currentRound, totalRounds, isCurrentRoundFinished]);

  const allMatchesFinished = useMemo(() => {
    return matches.length > 0 && matches.every((m) => m.status === 'finished');
  }, [matches]);

  const handleArchive = () => {
    const result = archiveCurrentTournament();
    if (result.success) {
      setArchiveResult({ success: true, message: `赛事已成功归档！归档编号：${result.archivedId}` });
      setTimeout(() => {
        navigate(`/archive/${result.archivedId}`);
      }, 1500);
    } else {
      setArchiveResult({ success: false, message: result.error ?? '归档失败' });
      setTimeout(() => setArchiveResult(null), 4000);
    }
  };

  const isSingleElim = tournament.type === 'single_elimination';

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      updateTournament({ coverUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-xl font-bold text-navy-900 flex items-center gap-2">
              <Swords className="w-5 h-5 text-gold-500" />
              赛制编排
            </h2>
            <p className="text-sm text-navy-500 mt-0.5">配置赛事参数并自动生成对阵</p>
          </div>
          {isSingleElim && (
            <div className="flex items-center gap-1 rounded-lg bg-navy-50 p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-navy-900' : 'text-navy-500 hover:text-navy-700'}`}
              >
                <ListTree className="w-3.5 h-3.5 inline mr-1" />列表视图
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'tree' ? 'bg-white shadow-sm text-navy-900' : 'text-navy-500 hover:text-navy-700'}`}
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1" />对阵树视图
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">赛事名称</label>
              <input
                type="text"
                value={tournament.name}
                onChange={(e) => updateTournament({ name: e.target.value })}
                placeholder="请输入赛事名称"
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">辩论类型</label>
              <select
                value={tournament.format}
                onChange={(e) => updateTournament({ format: e.target.value as DebateFormat })}
                className="input-base"
              >
                {formatOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">赛制类型</label>
              <select
                value={tournament.type}
                onChange={(e) => updateTournament({ type: e.target.value as TournamentType })}
                className="input-base"
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">总轮次</label>
              <input
                type="number"
                min={1}
                max={20}
                value={tournament.totalRounds}
                onChange={(e) => updateTournament({ totalRounds: Math.max(1, parseInt(e.target.value) || 1) })}
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base">每场评委数</label>
              <input
                type="number"
                min={1}
                max={9}
                value={tournament.judgesPerMatch}
                onChange={(e) => updateTournament({ judgesPerMatch: Math.max(1, parseInt(e.target.value) || 1) })}
                className="input-base"
              />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={regenerateAllMatches} className="btn-gold flex-1">
                <Sparkles className="w-4 h-4" />
                应用配置并生成对阵
              </button>
            </div>
          </div>
          <div>
            <label className="label-base">赛事封面</label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
            {tournament.coverUrl ? (
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-navy-200 group">
                <img
                  src={tournament.coverUrl}
                  alt="赛事封面"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-navy-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/90 text-navy-800 text-xs font-medium hover:bg-white transition-colors"
                  >
                    更换封面
                  </button>
                  <button
                    onClick={() => updateTournament({ coverUrl: undefined })}
                    className="px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-medium hover:bg-red-500 transition-colors"
                  >
                    移除
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-navy-200 bg-navy-50/50 flex flex-col items-center justify-center gap-2 text-navy-400 hover:border-gold-400 hover:text-gold-500 hover:bg-gold-50/30 transition-all duration-200"
              >
                <ImagePlus className="w-8 h-8" />
                <span className="text-xs font-medium">上传赛事封面</span>
                <span className="text-[10px]">建议尺寸 800×600</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-navy-100">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={generateNextRound}
              disabled={!canGenerateNext}
              className="btn-primary"
            >
              <RefreshCw className="w-4 h-4" />
              一键生成下一轮
            </button>
            <span className="text-xs text-navy-400">
              当前进度：第 {tournament.currentRound} / {totalRounds} 轮
              {!canGenerateNext && tournament.currentRound < totalRounds && '（当前轮未结束）'}
            </span>

            <div className="flex-1" />

            <button
              onClick={handleArchive}
              disabled={!allMatchesFinished}
              className="btn-secondary"
            >
              <Archive className="w-4 h-4" />
              归档本届赛事
            </button>
          </div>

          {archiveResult && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                archiveResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}
            >
              {archiveResult.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{archiveResult.message}</span>
            </div>
          )}

          {!allMatchesFinished && matches.length > 0 && (
            <p className="mt-3 text-xs text-navy-400">
              * 所有比赛结束后可归档
            </p>
          )}
        </div>
      </div>

      {matches.length === 0 ? (
        <Empty
          title="暂无对阵数据"
          description="请先配置赛制参数并点击「应用配置并生成对阵」按钮"
        />
      ) : (
        <>
          <div className="flex items-center gap-1 border-b border-navy-200 overflow-x-auto">
            {roundList.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRound(r)}
                className={`px-5 py-3 text-sm font-medium transition-all whitespace-nowrap relative ${
                  activeRound === r
                    ? 'text-gold-600 font-semibold'
                    : 'text-navy-500 hover:text-navy-800'
                }`}
              >
                R{r}
                {activeRound === r && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-gold rounded-t" />
                )}
              </button>
            ))}
          </div>

          <div>
            {isSingleElim && viewMode === 'tree' ? (
              <BracketView matches={matches} getTeamById={getTeamById} />
            ) : roundMatches.length === 0 ? (
              <Empty title="本轮暂无对阵" description={`第${activeRound}轮尚未生成对阵`} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-fade-in">
                {roundMatches.map((m) => (
                  <div key={m.id}>
                    <MatchCard matchId={m.id} />
                    <ConflictAlert matchId={m.id} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
