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
} from '@/types';
import { getFormatRules } from './formatRules';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

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
  conPlayers: Player[]
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

  return {
    id: uid(),
    judgeId,
    proTeamScore: 0,
    conTeamScore: 0,
    proPlayerScores,
    conPlayerScores,
    comments: { pro: '', con: '', general: '' },
    submittedAt: 0,
  };
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

  return {
    ...judgeScore,
    proTeamScore: judgeScore.proTeamScore > 0 ? judgeScore.proTeamScore : proPlayerAvg,
    conTeamScore: judgeScore.conTeamScore > 0 ? judgeScore.conTeamScore : conPlayerAvg,
    proPlayerScores: finalizedPro,
    conPlayerScores: finalizedCon,
    submittedAt: Date.now(),
  };
};

export const calculateMatchResult = (
  match: MatchPairing,
  judgeScores: JudgeScore[]
): MatchScore => {
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
    return {
      playerId,
      totalScore,
      avgScore,
      mvpVotes,
    };
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

export const determineWinner = (score: MatchScore): 'pro' | 'con' | 'draw' => {
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

  let totalMatchesForTeam: Record<string, number> = {};
  teams.forEach((t) => (totalMatchesForTeam[t.id] = 0));

  matches.forEach((match) => {
    if (match.status !== 'finished' || !match.scores || !match.winner) return;
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
