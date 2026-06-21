import type {
  Topic,
  MatchPairing,
  ArchivedTournament,
  RecommendationContext,
  TopicRecommendation,
  Winner,
  TopicCategory,
  DebateFormat,
} from '@/types';

interface TopicUsageStats {
  usageCount: number;
  proWins: number;
  conWins: number;
  draws: number;
  avgMargin: number;
}

const buildUsageStats = (
  topics: Topic[],
  currentMatches: MatchPairing[],
  archivedTournaments: ArchivedTournament[]
): Map<string, TopicUsageStats> => {
  const stats = new Map<string, TopicUsageStats>();

  topics.forEach((t) => {
    stats.set(t.id, {
      usageCount: 0,
      proWins: 0,
      conWins: 0,
      draws: 0,
      avgMargin: 0,
    });
  });

  const processMatch = (topicId: string, winner?: Winner, proScore?: number, conScore?: number) => {
    const stat = stats.get(topicId);
    if (!stat) return;
    stat.usageCount++;
    if (winner === 'pro') stat.proWins++;
    else if (winner === 'con') stat.conWins++;
    else if (winner === 'draw') stat.draws++;
    if (proScore !== undefined && conScore !== undefined) {
      stat.avgMargin = (stat.avgMargin * (stat.usageCount - 1) + Math.abs(proScore - conScore)) / stat.usageCount;
    }
  };

  currentMatches.forEach((m) => {
    if (m.status === 'finished') {
      processMatch(m.topicId, m.winner, m.scores?.proTeamTotal, m.scores?.conTeamTotal);
    }
  });

  archivedTournaments.forEach((t) => {
    t.matches.forEach((m) => {
      if (m.status === 'finished') {
        processMatch(m.topicId, m.winner, m.scores?.proTeamTotal, m.scores?.conTeamTotal);
      }
    });
  });

  return stats;
};

const calculateFormatMatchScore = (topicFormats: DebateFormat[], targetFormat: DebateFormat): number => {
  if (topicFormats.includes(targetFormat)) return 100;
  return 0;
};

const calculateCategoryMatchScore = (
  topicCategories: TopicCategory[],
  preferredCategories?: TopicCategory[]
): number => {
  if (!preferredCategories || preferredCategories.length === 0) return 50;
  const matches = topicCategories.filter((c) => preferredCategories.includes(c)).length;
  return Math.round((matches / Math.max(1, preferredCategories.length)) * 100);
};

const calculateDifficultyScore = (
  topicDifficulty: number,
  round: number,
  totalRounds: number,
  preferredDifficulty?: number,
  minDifficulty?: number,
  maxDifficulty?: number
): number => {
  if (minDifficulty !== undefined && topicDifficulty < minDifficulty) return 0;
  if (maxDifficulty !== undefined && topicDifficulty > maxDifficulty) return 0;

  if (preferredDifficulty !== undefined) {
    const diff = Math.abs(topicDifficulty - preferredDifficulty);
    return Math.max(0, 100 - diff * 25);
  }

  const roundProgress = round / Math.max(1, totalRounds);
  const optimalDifficulty = Math.round(2 + roundProgress * 3);
  const diff = Math.abs(topicDifficulty - optimalDifficulty);
  return Math.max(0, 100 - diff * 20);
};

const calculateBalanceScore = (stats: TopicUsageStats): number => {
  const totalDecided = stats.proWins + stats.conWins;
  if (totalDecided === 0) return 70;
  const proRate = stats.proWins / totalDecided;
  const balance = 1 - Math.abs(proRate - 0.5) * 2;
  return Math.round(balance * 100);
};

const calculateNoveltyScore = (usageCount: number, totalMatches: number): number => {
  if (totalMatches === 0) return 80;
  const usageRate = usageCount / totalMatches;
  return Math.max(0, Math.round(100 - usageRate * 50));
};

const generateReasons = (
  topic: Topic,
  context: RecommendationContext,
  scores: {
    format: number;
    category: number;
    difficulty: number;
    balance: number;
    novelty: number;
  },
  stats: TopicUsageStats
): string[] => {
  const reasons: string[] = [];

  if (scores.format === 100) {
    reasons.push('完全匹配赛事赛制要求');
  }

  if (scores.category >= 80) {
    reasons.push('符合指定的辩题类别偏好');
  }

  if (scores.difficulty >= 80) {
    const roundProgress = context.round / Math.max(1, context.totalRounds);
    if (roundProgress < 0.33) {
      reasons.push('难度适中，适合初赛阶段');
    } else if (roundProgress < 0.66) {
      reasons.push('难度适中，适合复赛阶段');
    } else {
      reasons.push('难度较高，适合决赛阶段');
    }
  }

  if (scores.balance >= 70 && stats.usageCount >= 3) {
    if (Math.abs((stats.proWins / Math.max(1, stats.proWins + stats.conWins)) - 0.5) < 0.15) {
      reasons.push('历史胜率均衡，无明显持方优势');
    }
  }

  if (scores.novelty >= 70 && stats.usageCount === 0) {
    reasons.push('全新辩题，尚未使用过');
  } else if (scores.novelty >= 70) {
    reasons.push('使用频率较低，保持新鲜感');
  }

  if (stats.avgMargin > 0 && stats.avgMargin < 5) {
    reasons.push('历史比赛分差较小，容易出现胶着战局');
  }

  if (reasons.length === 0) {
    reasons.push('综合评分较高，适合本场比赛');
  }

  return reasons.slice(0, 4);
};

export const recommendTopics = (
  topics: Topic[],
  context: RecommendationContext,
  currentMatches: MatchPairing[],
  archivedTournaments: ArchivedTournament[],
  limit = 8
): TopicRecommendation[] => {
  const usageStats = buildUsageStats(topics, currentMatches, archivedTournaments);
  const totalMatches = currentMatches.filter((m) => m.status === 'finished').length +
    archivedTournaments.reduce((sum, t) => sum + t.matches.filter((m) => m.status === 'finished').length, 0);

  const excludeSet = new Set(context.excludeTopicIds ?? []);

  const scored = topics
    .filter((t) => !excludeSet.has(t.id))
    .map((topic) => {
      const stats = usageStats.get(topic.id) ?? {
        usageCount: 0,
        proWins: 0,
        conWins: 0,
        draws: 0,
        avgMargin: 0,
      };

      const formatScore = calculateFormatMatchScore(topic.formats, context.format);
      const categoryScore = calculateCategoryMatchScore(topic.category, context.preferredCategories);
      const difficultyScore = calculateDifficultyScore(
        topic.difficulty,
        context.round,
        context.totalRounds,
        context.preferredDifficulty,
        context.minDifficulty,
        context.maxDifficulty
      );
      const balanceScore = calculateBalanceScore(stats);
      const noveltyScore = calculateNoveltyScore(stats.usageCount, totalMatches);

      const weights = {
        format: 0.3,
        category: 0.15,
        difficulty: 0.25,
        balance: 0.2,
        novelty: 0.1,
      };

      const totalScore =
        formatScore * weights.format +
        categoryScore * weights.category +
        difficultyScore * weights.difficulty +
        balanceScore * weights.balance +
        noveltyScore * weights.novelty;

      const reasons = generateReasons(
        topic,
        context,
        { format: formatScore, category: categoryScore, difficulty: difficultyScore, balance: balanceScore, novelty: noveltyScore },
        stats
      );

      const totalDecided = stats.proWins + stats.conWins;

      return {
        topicId: topic.id,
        title: topic.title,
        category: [...topic.category],
        difficulty: topic.difficulty,
        formats: [...topic.formats],
        matchScore: Math.round(totalScore * 100) / 100,
        reasons,
        usageCount: stats.usageCount,
        proWinRate: totalDecided > 0 ? Math.round((stats.proWins / totalDecided) * 100) : 50,
        conWinRate: totalDecided > 0 ? Math.round((stats.conWins / totalDecided) * 100) : 50,
      };
    })
    .filter((t) => t.matchScore > 20)
    .sort((a, b) => b.matchScore - a.matchScore);

  return scored.slice(0, limit);
};

export const getRoundDifficultyHint = (round: number, totalRounds: number): string => {
  const progress = round / Math.max(1, totalRounds);
  if (progress < 0.33) return '初赛阶段，推荐难度★★以下的辩题';
  if (progress < 0.66) return '复赛阶段，推荐难度★★★左右的辩题';
  return '决赛阶段，推荐难度★★★★以上的辩题';
};
