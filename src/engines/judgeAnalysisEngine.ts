import type {
  Judge,
  MatchPairing,
  ArchivedTournament,
  ArchivedMatch,
  JudgeScore,
  Winner,
  JudgeAnalysisResult,
  JudgeScoringStat,
  MatchJudgeScoreDiff,
  JudgeTendency,
} from '@/types';

const calculateStdDev = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
};

const getJudgeVote = (js: JudgeScore): Winner => {
  if (js.proTeamScore > js.conTeamScore) return 'pro';
  if (js.conTeamScore > js.proTeamScore) return 'con';
  return 'draw';
};

interface ProcessedMatch {
  matchId: string;
  topicTitle: string;
  tournamentName: string;
  round: number;
  judgeScores: JudgeScore[];
  judgeNames: Map<string, string>;
}

const processMatches = (
  currentMatches: MatchPairing[],
  archivedTournaments: ArchivedTournament[],
  judges: Judge[]
): ProcessedMatch[] => {
  const judgeNameMap = new Map<string, string>();
  judges.forEach((j) => judgeNameMap.set(j.id, j.name));

  const result: ProcessedMatch[] = [];

  currentMatches.forEach((match) => {
    if (match.status !== 'finished' || !match.scores) return;
    const topicTitle = match.topicId;
    result.push({
      matchId: match.id,
      topicTitle,
      tournamentName: '当前赛事',
      round: match.round,
      judgeScores: match.scores.judgeScores,
      judgeNames: new Map(judgeNameMap),
    });
  });

  archivedTournaments.forEach((tournament) => {
    const archJudgeNames = new Map<string, string>();
    tournament.matches.forEach((m) => {
      m.judgeIds.forEach((jid, idx) => {
        if (m.judgeNames[idx]) {
          archJudgeNames.set(jid, m.judgeNames[idx]);
        }
      });
    });

    tournament.matches.forEach((match) => {
      if (match.status !== 'finished' || !match.scores) return;
      result.push({
        matchId: match.id,
        topicTitle: match.topicTitle,
        tournamentName: tournament.name,
        round: match.round,
        judgeScores: match.scores.judgeScores,
        judgeNames: archJudgeNames,
      });
    });
  });

  return result;
};

const analyzeMatchScores = (
  match: ProcessedMatch
): MatchJudgeScoreDiff | null => {
  const { judgeScores, judgeNames } = match;
  if (judgeScores.length < 2) return null;

  const scores = judgeScores.map((js) => {
    const vote = getJudgeVote(js);
    return {
      judgeId: js.judgeId,
      judgeName: judgeNames.get(js.judgeId) || '未知评委',
      proScore: js.proTeamScore,
      conScore: js.conTeamScore,
      vote,
      diff: js.proTeamScore - js.conTeamScore,
    };
  });

  const allScores = scores.flatMap((s) => [s.proScore, s.conScore]);
  const diffs = scores.map((s) => s.diff);
  const scoreVariance = calculateStdDev(allScores);
  const maxScoreDiff = Math.max(...diffs) - Math.min(...diffs);

  const splitVotes = { pro: 0, con: 0, draw: 0 };
  scores.forEach((s) => {
    splitVotes[s.vote]++;
  });

  const hasSplitDecision =
    splitVotes.pro > 0 && splitVotes.con > 0;
  const isControversial = hasSplitDecision || maxScoreDiff > 15 || scoreVariance > 8;

  return {
    matchId: match.matchId,
    topicTitle: match.topicTitle,
    tournamentName: match.tournamentName,
    round: match.round,
    judgeScores: scores,
    scoreVariance: Math.round(scoreVariance * 100) / 100,
    maxScoreDiff: Math.round(maxScoreDiff * 100) / 100,
    isControversial,
    splitVotes,
    hasSplitDecision,
  };
};

const calculateJudgeStats = (
  processedMatches: ProcessedMatch[],
  judges: Judge[],
  overallAvg: number
): JudgeScoringStat[] => {
  const judgeData: Record<
    string,
    {
      judgeId: string;
      judgeName: string;
      scores: number[];
      proScores: number[];
      conScores: number[];
      matchesCount: number;
      controversialMatches: number;
      splitDecisions: number;
    }
  > = {};

  judges.forEach((j) => {
    judgeData[j.id] = {
      judgeId: j.id,
      judgeName: j.name,
      scores: [],
      proScores: [],
      conScores: [],
      matchesCount: 0,
      controversialMatches: 0,
      splitDecisions: 0,
    };
  });

  processedMatches.forEach((match) => {
    const matchAnalysis = analyzeMatchScores(match);
    match.judgeScores.forEach((js) => {
      const jid = js.judgeId;
      if (!judgeData[jid]) {
        judgeData[jid] = {
          judgeId: jid,
          judgeName: match.judgeNames.get(jid) || '未知评委',
          scores: [],
          proScores: [],
          conScores: [],
          matchesCount: 0,
          controversialMatches: 0,
          splitDecisions: 0,
        };
      }
      const data = judgeData[jid];
      data.scores.push(js.proTeamScore, js.conTeamScore);
      data.proScores.push(js.proTeamScore);
      data.conScores.push(js.conTeamScore);
      data.matchesCount++;
      if (matchAnalysis?.isControversial) {
        data.controversialMatches++;
      }
      if (matchAnalysis?.hasSplitDecision) {
        data.splitDecisions++;
      }
    });
  });

  return Object.values(judgeData)
    .filter((d) => d.matchesCount > 0)
    .map((d) => {
      const overallAvgScore =
        d.scores.length > 0
          ? d.scores.reduce((a, b) => a + b, 0) / d.scores.length
          : 0;
      const avgProScore =
        d.proScores.length > 0
          ? d.proScores.reduce((a, b) => a + b, 0) / d.proScores.length
          : 0;
      const avgConScore =
        d.conScores.length > 0
          ? d.conScores.reduce((a, b) => a + b, 0) / d.conScores.length
          : 0;
      const scoreStdDev = calculateStdDev(d.scores);

      const tendencyScore = overallAvgScore - overallAvg;
      let tendency: JudgeTendency = 'normal';
      if (tendencyScore < -3) tendency = 'strict';
      else if (tendencyScore > 3) tendency = 'lenient';

      return {
        judgeId: d.judgeId,
        judgeName: d.judgeName,
        totalMatches: d.matchesCount,
        avgProScore: Math.round(avgProScore * 100) / 100,
        avgConScore: Math.round(avgConScore * 100) / 100,
        overallAvgScore: Math.round(overallAvgScore * 100) / 100,
        scoreStdDev: Math.round(scoreStdDev * 100) / 100,
        tendency,
        tendencyScore: Math.round(tendencyScore * 100) / 100,
        controversialCount: d.controversialMatches,
        splitDecisionRate:
          d.matchesCount > 0
            ? Math.round((d.splitDecisions / d.matchesCount) * 10000) / 100
            : 0,
      };
    })
    .sort((a, b) => b.tendencyScore - a.tendencyScore);
};

export const analyzeJudges = (
  currentMatches: MatchPairing[],
  archivedTournaments: ArchivedTournament[],
  judges: Judge[]
): JudgeAnalysisResult => {
  const processedMatches = processMatches(
    currentMatches,
    archivedTournaments,
    judges
  );

  const allScores: number[] = [];
  processedMatches.forEach((m) => {
    m.judgeScores.forEach((js) => {
      allScores.push(js.proTeamScore, js.conTeamScore);
    });
  });

  const overallAvgScore =
    allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;

  const judgeStats = calculateJudgeStats(
    processedMatches,
    judges,
    overallAvgScore
  );

  const matchAnalyses = processedMatches
    .map((m) => analyzeMatchScores(m))
    .filter((m): m is MatchJudgeScoreDiff => m !== null && m.isControversial)
    .sort((a, b) => b.maxScoreDiff - a.maxScoreDiff);

  return {
    judgeStats,
    controversialMatches: matchAnalyses,
    overallAvgScore: Math.round(overallAvgScore * 100) / 100,
    totalMatchesAnalyzed: processedMatches.length,
  };
};

export const getTendencyLabel = (tendency: JudgeTendency): string => {
  const labels: Record<JudgeTendency, string> = {
    strict: '打分偏严',
    lenient: '打分偏松',
    normal: '打分正常',
  };
  return labels[tendency];
};

export const getTendencyColor = (tendency: JudgeTendency): string => {
  const colors: Record<JudgeTendency, string> = {
    strict: 'text-red-600',
    lenient: 'text-emerald-600',
    normal: 'text-navy-600',
  };
  return colors[tendency];
};

export const getTendencyBgColor = (tendency: JudgeTendency): string => {
  const colors: Record<JudgeTendency, string> = {
    strict: 'bg-red-50 ring-red-200',
    lenient: 'bg-emerald-50 ring-emerald-200',
    normal: 'bg-navy-50 ring-navy-200',
  };
  return colors[tendency];
};
