import {
  JudgeScore,
  PlayerScore,
  ScoringCriterion,
  MatchScore,
  MatchPairing,
  Team,
  TeamRanking,
  PlayerRanking,
  Player,
  DebateFormat,
  BPRole,
} from '@/types';
import { getFormatRules } from './formatRules';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const isBPFormat = (format: DebateFormat): boolean =>
  format === 'british_parliamentary';

const BP_ROLES: BPRole[] = ['og', 'oo', 'cg', 'co'];
const BP_ROLE_LABELS: Record<BPRole, string> = {
  og: '正方上院',
  oo: '反方上院',
  cg: '正方下院',
  co: '反方下院',
};

export { BP_ROLE_LABELS };

export const createEmptyPlayerScore = (criteria: ScoringCriterion[]): PlayerScore => {
  const criteriaScores: Record<string, number> = {};
  criteria.forEach((c) => {
    criteriaScores[c.id] = 0;
  });
  return { criteriaScores, total: 0 };
};

export const calculatePlayerTotal = (
  criteriaScores: Record<string, number>,
  criteria: ScoringCriterion[]
): number => {
  return criteria.reduce((sum, c) => {
    const score = criteriaScores[c.id] ?? 0;
    return sum + score * c.weight;
  }, 0);
};

export const createEmptyJudgeScore = (
  judgeId: string,
  format: DebateFormat,
  proPlayers: Player[],
  conPlayers: Player[],
  bpPlayers?: Record<BPRole, Player[]>
): JudgeScore => {
  const rules = getFormatRules(format);
  const criteria = rules.scoringCriteria;

  const proPlayerScores: Record<string, PlayerScore> = {};
  proPlayers.forEach((p) => {
    proPlayerScores[p.id] = createEmptyPlayerScore(criteria);
  });

  const conPlayerScores: Record<string, PlayerScore> = {};
  conPlayers.forEach((p) => {
    conPlayerScores[p.id] = createEmptyPlayerScore(criteria);
  });

  const base: JudgeScore = {
    id: uid(),
    judgeId,
    proTeamScore: 0,
    conTeamScore: 0,
    proPlayerScores,
    conPlayerScores,
    comments: { pro: '', con: '', general: '' },
    submittedAt: 0,
  };

  if (isBPFormat(format) && bpPlayers) {
    const fourTeamScores = { og: 0, oo: 0, cg: 0, co: 0 };
    const fourTeamPlayerScores: Record<BPRole, Record<string, PlayerScore>> = {
      og: {}, oo: {}, cg: {}, co: {},
    };
    BP_ROLES.forEach((role) => {
      const players = bpPlayers[role] ?? [];
      players.forEach((p) => {
        fourTeamPlayerScores[role][p.id] = createEmptyPlayerScore(criteria);
      });
    });
    const fourTeamRankings = { og: 1, oo: 2, cg: 3, co: 4 };

    base.fourTeamScores = fourTeamScores;
    base.fourTeamPlayerScores = fourTeamPlayerScores;
    base.fourTeamRankings = fourTeamRankings;
  }

  return base;
};

export const finalizeJudgeScore = (
  judgeScore: JudgeScore,
  format: DebateFormat
): JudgeScore => {
  const rules = getFormatRules(format);
  const criteria = rules.scoringCriteria;

  const finalizedPro: Record<string, PlayerScore> = {};
  Object.entries(judgeScore.proPlayerScores).forEach(([pid, ps]) => {
    finalizedPro[pid] = {
      ...ps,
      total: calculatePlayerTotal(ps.criteriaScores, criteria),
    };
  });

  const finalizedCon: Record<string, PlayerScore> = {};
  Object.entries(judgeScore.conPlayerScores).forEach(([pid, ps]) => {
    finalizedCon[pid] = {
      ...ps,
      total: calculatePlayerTotal(ps.criteriaScores, criteria),
    };
  });

  const proPlayerAvg =
    Object.values(finalizedPro).reduce((s, p) => s + p.total, 0) /
    Math.max(1, Object.keys(finalizedPro).length);
  const conPlayerAvg =
    Object.values(finalizedCon).reduce((s, p) => s + p.total, 0) /
    Math.max(1, Object.keys(finalizedCon).length);

  const result: JudgeScore = {
    ...judgeScore,
    proTeamScore: judgeScore.proTeamScore > 0 ? judgeScore.proTeamScore : proPlayerAvg,
    conTeamScore: judgeScore.conTeamScore > 0 ? judgeScore.conTeamScore : conPlayerAvg,
    proPlayerScores: finalizedPro,
    conPlayerScores: finalizedCon,
    submittedAt: Date.now(),
  };

  if (isBPFormat(format) && judgeScore.fourTeamPlayerScores) {
    const finalizedFourTeamPlayerScores: Record<BPRole, Record<string, PlayerScore>> = {
      og: {}, oo: {}, cg: {}, co: {},
    };
    const teamAvgs: Record<BPRole, number> = { og: 0, oo: 0, cg: 0, co: 0 };

    BP_ROLES.forEach((role) => {
      const roleScores = judgeScore.fourTeamPlayerScores![role] ?? {};
      Object.entries(roleScores).forEach(([pid, ps]) => {
        finalizedFourTeamPlayerScores[role][pid] = {
          ...ps,
          total: calculatePlayerTotal(ps.criteriaScores, criteria),
        };
      });
      const vals = Object.values(finalizedFourTeamPlayerScores[role]);
      teamAvgs[role] = vals.length > 0
        ? vals.reduce((s, p) => s + p.total, 0) / vals.length
        : 0;
    });

    const fourTeamScores = { ...judgeScore.fourTeamScores };
    BP_ROLES.forEach((role) => {
      if (!fourTeamScores[role] || fourTeamScores[role] === 0) {
        fourTeamScores[role] = Math.round(teamAvgs[role] * 10) / 10;
      }
    });

    const ranked = BP_ROLES.slice().sort((a, b) => fourTeamScores[b] - fourTeamScores[a]);
    const fourTeamRankings = { og: 0, oo: 0, cg: 0, co: 0 };
    ranked.forEach((role, idx) => {
      fourTeamRankings[role] = idx + 1;
    });

    result.fourTeamScores = fourTeamScores;
    result.fourTeamPlayerScores = finalizedFourTeamPlayerScores;
    result.fourTeamRankings = fourTeamRankings;
  }

  return result;
};

export const calculateMatchResult = (
  match: MatchPairing,
  judgeScores: JudgeScore[]
): MatchScore => {
  const isBP = match.bpTeams != null;

  if (isBP && judgeScores.some((js) => js.fourTeamScores)) {
    return calculateBPMatchResult(match, judgeScores);
  }

  const proTeamTotals = judgeScores.map((js) => js.proTeamScore);
  const conTeamTotals = judgeScores.map((js) => js.conTeamScore);
  const proTeamTotal = proTeamTotals.reduce((a, b) => a + b, 0) / Math.max(1, proTeamTotals.length);
  const conTeamTotal = conTeamTotals.reduce((a, b) => a + b, 0) / Math.max(1, conTeamTotals.length);

  const allPlayerIds = new Set<string>();
  judgeScores.forEach((js) => {
    Object.keys(js.proPlayerScores).forEach((id) => allPlayerIds.add(id));
    Object.keys(js.conPlayerScores).forEach((id) => allPlayerIds.add(id));
  });

  const playerScores = Array.from(allPlayerIds).map((playerId) => {
    const scores: number[] = [];
    let mvpVotes = 0;
    judgeScores.forEach((js) => {
      const proScore = js.proPlayerScores[playerId];
      const conScore = js.conPlayerScores[playerId];
      if (proScore) scores.push(proScore.total);
      if (conScore) scores.push(conScore.total);
    });
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const avgScore = totalScore / Math.max(1, scores.length);
    return { playerId, totalScore, avgScore, mvpVotes };
  });

  let mvpPlayerId: string | undefined;
  if (playerScores.length > 0) {
    const sorted = [...playerScores].sort((a, b) => b.avgScore - a.avgScore);
    mvpPlayerId = sorted[0].playerId;
  }

  return {
    matchId: match.id,
    judgeScores,
    proTeamTotal,
    conTeamTotal,
    playerScores,
    mvpPlayerId,
  };
};

const calculateBPMatchResult = (
  match: MatchPairing,
  judgeScores: JudgeScore[]
): MatchScore => {
  const roleTotals: Record<BPRole, number[]> = { og: [], oo: [], cg: [], co: [] };
  const roleRankPoints: Record<BPRole, number[]> = { og: [], oo: [], cg: [], co: [] };

  judgeScores.forEach((js) => {
    if (!js.fourTeamScores) return;
    BP_ROLES.forEach((role) => {
      roleTotals[role].push(js.fourTeamScores[role]);
      if (js.fourTeamRankings) {
        roleRankPoints[role].push(5 - js.fourTeamRankings[role]);
      }
    });
  });

  const avgScores: Record<BPRole, number> = { og: 0, oo: 0, cg: 0, co: 0 };
  BP_ROLES.forEach((role) => {
    const arr = roleTotals[role];
    avgScores[role] = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  });

  const proTeamTotal = (avgScores.og + avgScores.cg) / 2;
  const conTeamTotal = (avgScores.oo + avgScores.co) / 2;

  const allPlayerIds = new Set<string>();
  judgeScores.forEach((js) => {
    if (js.fourTeamPlayerScores) {
      BP_ROLES.forEach((role) => {
        Object.keys(js.fourTeamPlayerScores[role] ?? {}).forEach((id) => allPlayerIds.add(id));
      });
    }
    Object.keys(js.proPlayerScores).forEach((id) => allPlayerIds.add(id));
    Object.keys(js.conPlayerScores).forEach((id) => allPlayerIds.add(id));
  });

  const playerScores = Array.from(allPlayerIds).map((playerId) => {
    const scores: number[] = [];
    judgeScores.forEach((js) => {
      if (js.fourTeamPlayerScores) {
        BP_ROLES.forEach((role) => {
          const ps = js.fourTeamPlayerScores[role]?.[playerId];
          if (ps) scores.push(ps.total);
        });
      }
      const proScore = js.proPlayerScores[playerId];
      const conScore = js.conPlayerScores[playerId];
      if (proScore) scores.push(proScore.total);
      if (conScore) scores.push(conScore.total);
    });
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const avgScore = totalScore / Math.max(1, scores.length);
    return { playerId, totalScore, avgScore, mvpVotes: 0 };
  });

  let mvpPlayerId: string | undefined;
  if (playerScores.length > 0) {
    const sorted = [...playerScores].sort((a, b) => b.avgScore - a.avgScore);
    mvpPlayerId = sorted[0].playerId;
  }

  return {
    matchId: match.id,
    judgeScores,
    proTeamTotal,
    conTeamTotal,
    playerScores,
    mvpPlayerId,
  };
};

export const determineWinner = (score: MatchScore, match?: MatchPairing): 'pro' | 'con' | 'draw' => {
  if (match?.bpTeams) {
    const judgeScores = score.judgeScores.filter((js) => js.fourTeamRankings);
    if (judgeScores.length === 0) {
      if (score.proTeamTotal > score.conTeamTotal) return 'pro';
      if (score.conTeamTotal > score.proTeamTotal) return 'con';
      return 'draw';
    }

    const rankPoints: Record<BPRole, number> = { og: 0, oo: 0, cg: 0, co: 0 };
    judgeScores.forEach((js) => {
      if (!js.fourTeamRankings) return;
      BP_ROLES.forEach((role) => {
        rankPoints[role] += 5 - js.fourTeamRankings![role];
      });
    });

    const proPoints = rankPoints.og + rankPoints.cg;
    const conPoints = rankPoints.oo + rankPoints.co;
    if (proPoints > conPoints) return 'pro';
    if (conPoints > proPoints) return 'con';
    return 'draw';
  }

  if (score.proTeamTotal > score.conTeamTotal) return 'pro';
  if (score.conTeamTotal > score.proTeamTotal) return 'con';
  return 'draw';
};

export const calculateTeamRankings = (
  matches: MatchPairing[],
  teams: Team[]
): TeamRanking[] => {
  const stats: Record<string, TeamRanking> = {};

  teams.forEach((t) => {
    stats[t.id] = {
      teamId: t.id,
      teamName: t.name,
      institution: t.institution,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      totalScore: 0,
      avgScore: 0,
      ballots: 0,
    };
  });

  const totalMatchesForTeam: Record<string, number> = {};
  teams.forEach((t) => (totalMatchesForTeam[t.id] = 0));

  matches.forEach((match) => {
    if (match.status !== 'finished' || !match.scores || !match.winner) return;

    if (match.bpTeams) {
      const bp = match.bpTeams;
      const participatingTeamIds = [bp.og, bp.oo, bp.cg, bp.co];
      const judgeScores = match.scores.judgeScores;

      participatingTeamIds.forEach((teamId) => {
        if (!stats[teamId]) return;
        totalMatchesForTeam[teamId]++;
        const s = stats[teamId];

        let teamScore = 0;
        let rankPoints = 0;
        judgeScores.forEach((js) => {
          if (js.fourTeamScores && js.fourTeamRankings) {
            BP_ROLES.forEach((role) => {
              if (bp[role] === teamId) {
                teamScore += js.fourTeamScores[role];
                rankPoints += 5 - js.fourTeamRankings[role];
              }
            });
          }
        });
        const avgTeamScore = judgeScores.length > 0 ? teamScore / judgeScores.length : 0;
        s.totalScore += avgTeamScore;
        s.ballots += rankPoints;
      });

      const firstPlaceRank = 1;
      judgeScores.forEach((js) => {
        if (!js.fourTeamRankings) return;
        BP_ROLES.forEach((role) => {
          if (js.fourTeamRankings![role] === firstPlaceRank) {
            const teamId = bp[role];
            if (stats[teamId]) stats[teamId].wins++;
          } else if (js.fourTeamRankings![role] === 4) {
            const teamId = bp[role];
            if (stats[teamId]) stats[teamId].losses++;
          } else {
            const teamId = bp[role];
            if (stats[teamId]) stats[teamId].draws++;
          }
        });
      });
      return;
    }

    const { proTeamId, conTeamId, scores, winner } = match;
    const proStat = stats[proTeamId];
    const conStat = stats[conTeamId];
    if (!proStat || !conStat) return;

    totalMatchesForTeam[proTeamId]++;
    totalMatchesForTeam[conTeamId]++;

    proStat.totalScore += scores.proTeamTotal;
    conStat.totalScore += scores.conTeamTotal;

    const proBallots = scores.judgeScores.filter(
      (js) => js.proTeamScore > js.conTeamScore
    ).length;
    const conBallots = scores.judgeScores.filter(
      (js) => js.conTeamScore > js.proTeamScore
    ).length;
    proStat.ballots += proBallots;
    conStat.ballots += conBallots;

    if (winner === 'pro') {
      proStat.wins++;
      conStat.losses++;
    } else if (winner === 'con') {
      conStat.wins++;
      proStat.losses++;
    } else {
      proStat.draws++;
      conStat.draws++;
    }
  });

  Object.values(stats).forEach((s) => {
    const total = totalMatchesForTeam[s.teamId] || 0;
    s.avgScore = total > 0 ? s.totalScore / total : 0;
    const winPlusDraw = s.wins + s.draws * 0.5;
    s.winRate = total > 0 ? winPlusDraw / total : 0;
  });

  const rankings = Object.values(stats).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.ballots !== a.ballots) return b.ballots - a.ballots;
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    return b.totalScore - a.totalScore;
  });

  return rankings.map((r, i) => ({ ...r, rank: i + 1 }));
};

export const calculatePlayerRankings = (
  matches: MatchPairing[],
  teams: Team[]
): PlayerRanking[] => {
  const playerMap: Record<string, { player: Player; teamName: string; teamId: string }> = {};
  teams.forEach((team) => {
    team.players.forEach((p) => {
      playerMap[p.id] = { player: p, teamName: team.name, teamId: team.id };
    });
  });

  const stats: Record<string, { total: number; count: number; mvp: number }> = {};
  Object.keys(playerMap).forEach((pid) => {
    stats[pid] = { total: 0, count: 0, mvp: 0 };
  });

  matches.forEach((match) => {
    if (match.status !== 'finished' || !match.scores) return;
    const { playerScores, mvpPlayerId } = match.scores;
    playerScores.forEach((ps) => {
      const s = stats[ps.playerId];
      if (!s) return;
      s.total += ps.avgScore;
      s.count++;
      if (mvpPlayerId === ps.playerId) s.mvp++;
    });
  });

  const rankings: PlayerRanking[] = [];
  Object.entries(playerMap).forEach(([pid, info]) => {
    const s = stats[pid];
    rankings.push({
      playerId: pid,
      playerName: info.player.name,
      teamName: info.teamName,
      teamId: info.teamId,
      totalMatches: s.count,
      totalScore: s.total,
      avgScore: s.count > 0 ? s.total / s.count : 0,
      mvpCount: s.mvp,
    });
  });

  rankings.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
    return b.totalMatches - a.totalMatches;
  });

  return rankings.map((r, i) => ({ ...r, rank: i + 1 }));
};

import type {
  PlayerDetail,
  PlayerMatchRecord,
  PlayerRoleStat,
  PlayerScoreTrend,
  Topic,
  TournamentConfig,
  ArchivedTournament,
  ArchivedMatch,
  ArchivedTeam,
} from '@/types';

const POSITION_ROLES = ['一辩', '二辩', '三辩', '四辩'] as const;

const inferRoleFromPosition = (playerIndex: number): string => {
  if (playerIndex >= 0 && playerIndex < POSITION_ROLES.length) {
    return POSITION_ROLES[playerIndex];
  }
  return '替补';
};

const findPlayerRoleInTeam = (
  playerId: string,
  team: Team | undefined
): string => {
  if (!team) return '替补';
  const idx = team.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return '替补';
  return team.players[idx].role || inferRoleFromPosition(idx);
};

const processCurrentMatch = (
  match: MatchPairing,
  playerId: string,
  team: Team,
  teams: Team[],
  topics: Topic[],
  tournament: TournamentConfig
): { record: PlayerMatchRecord; role: string } | null => {
  const scores = match.scores;
  if (!scores) return null;

  const playerScoreEntry = scores.playerScores.find(
    (ps) => ps.playerId === playerId
  );
  if (!playerScoreEntry) return null;

  const isPro = match.proTeamId === team.id;
  const isCon = match.conTeamId === team.id;
  if (!isPro && !isCon) return null;

  const side: 'pro' | 'con' = isPro ? 'pro' : 'con';
  const opponentTeamId = isPro ? match.conTeamId : match.proTeamId;
  const opponentTeam = teams.find((t) => t.id === opponentTeamId);
  const topic = topics.find((t) => t.id === match.topicId);

  const isWin = match.winner === side;
  const isDraw = match.winner === 'draw';
  const isMVP = scores.mvpPlayerId === playerId;

  const actualRole = findPlayerRoleInTeam(playerId, team);

  return {
    record: {
      matchId: match.id,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      round: match.round,
      matchNumber: match.matchNumber,
      topicTitle: topic?.title ?? '未知辩题',
      side,
      actualRole,
      teamName: team.name,
      opponentTeamName: opponentTeam?.name ?? '未知队伍',
      score: playerScoreEntry.avgScore,
      isMVP,
      isWin,
      isDraw,
      date: match.finishedAt ?? 0,
    },
    role: actualRole,
  };
};

const findArchivedPlayerRole = (
  playerName: string,
  archivedTeam: ArchivedTeam
): string => {
  const idx = archivedTeam.players.findIndex((p) => p.name === playerName);
  if (idx === -1) return '替补';
  return archivedTeam.players[idx].role || inferRoleFromPosition(idx);
};

const processArchivedMatch = (
  archivedMatch: ArchivedMatch,
  playerName: string,
  archivedTeam: ArchivedTeam,
  archivedTournament: ArchivedTournament
): { record: PlayerMatchRecord; role: string } | null => {
  const scores = archivedMatch.scores;
  if (!scores) return null;

  const archivedPlayer = archivedTeam.players.find(
    (p) => p.name === playerName
  );
  if (!archivedPlayer) return null;

  const playerScoreEntry = scores.playerScores.find(
    (ps) => ps.playerId === archivedPlayer.id
  );
  if (!playerScoreEntry) return null;

  const isPro = archivedMatch.proTeamId === archivedTeam.id;
  const isCon = archivedMatch.conTeamId === archivedTeam.id;
  if (!isPro && !isCon) return null;

  const side: 'pro' | 'con' = isPro ? 'pro' : 'con';
  const opponentTeamName = isPro
    ? archivedMatch.conTeamName
    : archivedMatch.proTeamName;

  const isWin = archivedMatch.winner === side;
  const isDraw = archivedMatch.winner === 'draw';
  const isMVP = scores.mvpPlayerId === archivedPlayer.id;

  const actualRole = findArchivedPlayerRole(playerName, archivedTeam);

  return {
    record: {
      matchId: archivedMatch.id,
      tournamentId: archivedTournament.id,
      tournamentName: archivedTournament.name,
      round: archivedMatch.round,
      matchNumber: archivedMatch.matchNumber,
      topicTitle: archivedMatch.topicTitle || '未知辩题',
      side,
      actualRole,
      teamName: archivedTeam.name,
      opponentTeamName,
      score: playerScoreEntry.avgScore,
      isMVP,
      isWin,
      isDraw,
      date: archivedMatch.finishedAt,
    },
    role: actualRole,
  };
};

export const calculatePlayerDetail = (
  playerId: string,
  matches: MatchPairing[],
  teams: Team[],
  topics: Topic[],
  tournament: TournamentConfig,
  archivedTournaments: ArchivedTournament[] = []
): PlayerDetail | null => {
  let player: Player | undefined;
  let team: Team | undefined;
  for (const t of teams) {
    const p = t.players.find((pp) => pp.id === playerId);
    if (p) {
      player = p;
      team = t;
      break;
    }
  }
  if (!player || !team) return null;

  const matchRecords: PlayerMatchRecord[] = [];
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalScore = 0;
  let mvpCount = 0;
  let highestScore = 0;
  let lowestScore = Infinity;
  const roleStatMap: Record<string, { total: number; count: number }> = {};

  const accumulateStats = (score: number, role: string, isWin: boolean, isDraw: boolean, isMVP: boolean) => {
    totalScore += score;
    if (score > highestScore) highestScore = score;
    if (score < lowestScore) lowestScore = score;
    if (isMVP) mvpCount++;
    if (isWin) wins++;
    else if (isDraw) draws++;
    else losses++;

    if (!roleStatMap[role]) {
      roleStatMap[role] = { total: 0, count: 0 };
    }
    roleStatMap[role].total += score;
    roleStatMap[role].count++;
  };

  const finishedMatches = matches.filter((m) => m.status === 'finished' && m.scores);
  for (const match of finishedMatches) {
    const result = processCurrentMatch(match, playerId, team, teams, topics, tournament);
    if (!result) continue;
    accumulateStats(result.record.score, result.role, result.record.isWin, result.record.isDraw, result.record.isMVP);
    matchRecords.push(result.record);
  }

  for (const archTournament of archivedTournaments) {
    const matchingArchTeam = archTournament.teams.find((at) =>
      at.players.some((p) => p.name === player!.name)
    );
    if (!matchingArchTeam) continue;

    for (const archMatch of archTournament.matches) {
      const result = processArchivedMatch(archMatch, player!.name, matchingArchTeam, archTournament);
      if (!result) continue;
      accumulateStats(result.record.score, result.role, result.record.isWin, result.record.isDraw, result.record.isMVP);
      matchRecords.push(result.record);
    }
  }

  matchRecords.sort((a, b) => a.date - b.date);

  const totalMatches = matchRecords.length;
  const avgScore = totalMatches > 0 ? totalScore / totalMatches : 0;
  const winRate = totalMatches > 0 ? (wins + draws * 0.5) / totalMatches : 0;
  const mvpRate = totalMatches > 0 ? mvpCount / totalMatches : 0;

  const roleStats: PlayerRoleStat[] = Object.entries(roleStatMap).map(([role, stat]) => ({
    role,
    count: stat.count,
    avgScore: stat.count > 0 ? stat.total / stat.count : 0,
  }));

  const scoreTrend: PlayerScoreTrend[] = matchRecords.map((record, index) => {
    const runningAvg =
      matchRecords.slice(0, index + 1).reduce((sum, r) => sum + r.score, 0) /
      (index + 1);
    const tName = record.tournamentName.length > 6
      ? record.tournamentName.slice(0, 6) + '…'
      : record.tournamentName;
    return {
      matchIndex: index + 1,
      matchLabel: `${tName} R${record.round}`,
      score: Number(record.score.toFixed(1)),
      avgScore: Number(runningAvg.toFixed(1)),
    };
  });

  const playerRankings = calculatePlayerRankings(matches, teams);
  const ranking = playerRankings.find((r) => r.playerId === playerId);

  return {
    playerId: player.id,
    playerName: player.name,
    teamId: team.id,
    teamName: team.name,
    institution: team.institution,
    role: player.role,
    contact: player.contact,
    totalMatches,
    wins,
    losses,
    draws,
    winRate,
    totalScore,
    avgScore,
    highestScore: totalMatches > 0 ? highestScore : 0,
    lowestScore: totalMatches > 0 ? lowestScore : 0,
    mvpCount,
    mvpRate,
    rank: ranking?.rank,
    roleStats,
    scoreTrend,
    matchRecords,
  };
};
