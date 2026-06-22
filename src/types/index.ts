export type DebateFormat = 'parliamentary' | 'mandarin' | 'moot_court' | 'british_parliamentary';
export type TournamentType = 'single_elimination' | 'swiss' | 'round_robin';
export type MatchStatus = 'pending' | 'ongoing' | 'finished';
export type Side = 'pro' | 'con' | 'both' | 'judge';
export type Winner = 'pro' | 'con' | 'draw';

export type BPRole = 'og' | 'oo' | 'cg' | 'co'; // 正方上院/反方上院/正方下院/反方下院

export interface BPTeamAssignment {
  og: string; // 正方上院 teamId
  oo: string; // 反方上院 teamId
  cg: string; // 正方下院 teamId
  co: string; // 反方下院 teamId
}

export interface Player {
  id: string;
  name: string;
  role: '一辩' | '二辩' | '三辩' | '四辩' | '替补';
  contact?: string;
  scores: PlayerScoreRecord[];
}

export interface Team {
  id: string;
  name: string;
  institution: string;
  players: Player[];
  seed: number;
  createdAt: number;
}

export interface Judge {
  id: string;
  name: string;
  institution: string;
  title?: string;
  avoidTeams: string[];
  avoidInstitutions: string[];
  avoidPlayers: string[];
}

export type TopicCategory = '政策' | '价值' | '事实' | '模拟法庭';

export interface TopicCategoryConfig {
  name: TopicCategory;
  label: string;
  color: string;
  bgColor: string;
  ringColor: string;
  description: string;
  keywords: string[];
  order: number;
}

export interface ClassificationSuggestion {
  topicId: string;
  currentCategories: TopicCategory[];
  suggestedCategories: TopicCategory[];
  confidence: number;
  reasons: string[];
}

export type BatchOperationType = 'delete' | 'updateCategory' | 'updateDifficulty' | 'updateFormat' | 'addClassification';

export interface BatchUpdatePayload {
  type: BatchOperationType;
  topicIds: string[];
  category?: TopicCategory[];
  difficulty?: 1 | 2 | 3 | 4 | 5;
  formats?: DebateFormat[];
  addCategory?: TopicCategory[];
  removeCategory?: TopicCategory[];
}

export interface Topic {
  id: string;
  title: string;
  proSide: string;
  conSide: string;
  category: TopicCategory[];
  formats: DebateFormat[];
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface DebateStageConfig {
  id: string;
  name: string;
  side?: Side;
  speakerIndex?: number;
  duration: number;
  crossExamine?: {
    enabled: boolean;
    duration?: number;
  };
  bpRole?: 'og' | 'oo' | 'cg' | 'co';
}

export interface ScoringCriterion {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  description?: string;
}

export interface FormatRules {
  format: DebateFormat;
  label: string;
  description: string;
  stages: DebateStageConfig[];
  scoringCriteria: ScoringCriterion[];
  teamScoreMax: number;
  isFourTeamFormat?: boolean; // BP赛制为true，支持4队（OG/OO/CG/CO）
}

export interface TournamentConfig {
  id: string;
  name: string;
  format: DebateFormat;
  type: TournamentType;
  totalRounds: number;
  judgesPerMatch: number;
  createdAt: number;
  currentRound: number;
  description?: string;
  coverUrl?: string;
}

export interface PlayerScore {
  criteriaScores: Record<string, number>;
  total: number;
}

export interface JudgeScore {
  id: string;
  judgeId: string;
  proTeamScore: number;
  conTeamScore: number;
  proPlayerScores: Record<string, PlayerScore>;
  conPlayerScores: Record<string, PlayerScore>;
  comments: {
    pro?: string;
    con?: string;
    general?: string;
  };
  submittedAt: number;
  // BP四队制专用字段
  fourTeamScores?: {
    og: number;
    oo: number;
    cg: number;
    co: number;
  };
  fourTeamPlayerScores?: {
    og: Record<string, PlayerScore>;
    oo: Record<string, PlayerScore>;
    cg: Record<string, PlayerScore>;
    co: Record<string, PlayerScore>;
  };
  fourTeamRankings?: {
    og: number; // 1-4名
    oo: number;
    cg: number;
    co: number;
  };
}

export interface PlayerMatchScore {
  playerId: string;
  totalScore: number;
  avgScore: number;
  mvpVotes: number;
}

export interface MatchScore {
  matchId: string;
  judgeScores: JudgeScore[];
  proTeamTotal: number;
  conTeamTotal: number;
  playerScores: PlayerMatchScore[];
  mvpPlayerId?: string;
}

export interface MatchPairing {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  proTeamId: string;
  conTeamId: string;
  topicId: string;
  judgeIds: string[];
  status: MatchStatus;
  scores?: MatchScore;
  winner?: Winner;
  scheduledAt?: number;
  startedAt?: number;
  finishedAt?: number;
  currentStageIndex?: number;
  // BP四队制专用字段
  bpTeams?: BPTeamAssignment;
}

export interface PlayerScoreRecord {
  matchId: string;
  score: number;
  isMVP: boolean;
}

export interface TeamRanking {
  teamId: string;
  teamName: string;
  institution: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalScore: number;
  avgScore: number;
  ballots: number;
  rank?: number;
}

export interface PlayerRanking {
  playerId: string;
  playerName: string;
  teamName: string;
  teamId: string;
  totalMatches: number;
  totalScore: number;
  avgScore: number;
  mvpCount: number;
  rank?: number;
}

export interface PlayerMatchRecord {
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  round: number;
  matchNumber: number;
  topicTitle: string;
  side: 'pro' | 'con';
  actualRole: string;
  teamName: string;
  opponentTeamName: string;
  score: number;
  isMVP: boolean;
  isWin: boolean;
  isDraw: boolean;
  date: number;
}

export interface PlayerRoleStat {
  role: string;
  count: number;
  avgScore: number;
}

export interface PlayerScoreTrend {
  matchIndex: number;
  matchLabel: string;
  score: number;
  avgScore: number;
}

export interface PlayerDetail {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  institution: string;
  role: string;
  contact?: string;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalScore: number;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
  mvpCount: number;
  mvpRate: number;
  rank?: number;
  roleStats: PlayerRoleStat[];
  scoreTrend: PlayerScoreTrend[];
  matchRecords: PlayerMatchRecord[];
}

export interface TimerStageState {
  stageIndex: number;
  stageConfig: DebateStageConfig;
  remainingSeconds: number;
  totalSeconds: number;
}

export interface TimerState {
  current: TimerStageState;
  isRunning: boolean;
  isFinished: boolean;
  hasStarted: boolean;
  format: DebateFormat;
}

export interface AvoidanceConflict {
  judgeId: string;
  judgeName: string;
  teamId: string;
  teamName: string;
  reason: string;
  type: 'team' | 'institution' | 'player' | 'time';
  conflictingMatchId?: string;
  conflictingMatchTime?: number;
}

export interface DanmakuFilter {
  blockedKeywords: string[];
  regexPatterns: string[];
  visibleSides: ('pro' | 'con' | 'neutral')[];
  enabled: boolean;
}

export interface Danmaku {
  id: string;
  matchId: string;
  content: string;
  senderName: string;
  senderSide?: 'pro' | 'con' | 'neutral';
  color?: string;
  createdAt: number;
}

export interface DanmakuChannelMessage {
  type: 'danmaku' | 'clear' | 'ping';
  data?: Danmaku;
  matchId: string;
  timestamp: number;
}

export interface ArchivedMatch {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  proTeamId: string;
  conTeamId: string;
  proTeamName: string;
  conTeamName: string;
  proTeamInstitution: string;
  conTeamInstitution: string;
  topicId: string;
  topicTitle: string;
  topicProSide: string;
  topicConSide: string;
  topicCategory: TopicCategory[];
  topicDifficulty: number;
  topicFormats: DebateFormat[];
  judgeIds: string[];
  judgeNames: string[];
  status: MatchStatus;
  winner?: Winner;
  startedAt: number;
  finishedAt: number;
  scores?: MatchScore;
  stageRecords?: DebateStageConfig[];
}

export interface ArchivedTeam {
  id: string;
  name: string;
  institution: string;
  players: {
    id: string;
    name: string;
    role: string;
    avgScore: number;
    totalMatches: number;
    mvpCount: number;
  }[];
  finalRank?: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface ArchivedTournament {
  id: string;
  name: string;
  format: DebateFormat;
  type: TournamentType;
  season: string;
  year: number;
  totalRounds: number;
  totalMatches: number;
  judgesPerMatch: number;
  startDate: number;
  endDate: number;
  description?: string;
  championTeamId?: string;
  championTeamName?: string;
  runnerUpTeamId?: string;
  runnerUpTeamName?: string;
  mvpPlayerId?: string;
  mvpPlayerName?: string;
  coverUrl?: string;
  teams: ArchivedTeam[];
  matches: ArchivedMatch[];
}

export interface ArchiveFilter {
  year?: number;
  season?: string;
  format?: DebateFormat;
  type?: TournamentType;
  keyword?: string;
}

export type ArchiveViewMode = 'timeline' | 'grid' | 'list';

export type AIDebateMode = 'practice' | 'challenge' | 'casual';
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type AISide = 'pro' | 'con';
export type ChatMessageRole = 'user' | 'ai' | 'system';

export interface AIDebateSettings {
  topic: string;
  mode: AIDebateMode;
  userSide: AISide;
  difficulty: AIDifficulty;
  thinkTimeSeconds: number;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: number;
  side?: AISide;
}

export interface AIDebateState {
  settings: AIDebateSettings | null;
  messages: ChatMessage[];
  isStarted: boolean;
  isAIGenerating: boolean;
  roundNumber: number;
}

export type ArgumentSide = 'pro' | 'con';

export interface ArgumentNode {
  id: string;
  topicId: string;
  side: ArgumentSide;
  parentId: string | null;
  content: string;
  author: string;
  votes: number;
  voters: string[];
  children: ArgumentNode[];
  createdAt: number;
}

export interface ArgumentTree {
  topicId: string;
  proRoots: ArgumentNode[];
  conRoots: ArgumentNode[];
}

export type JudgeTendency = 'strict' | 'lenient' | 'normal';

export interface JudgeScoringStat {
  judgeId: string;
  judgeName: string;
  totalMatches: number;
  avgProScore: number;
  avgConScore: number;
  overallAvgScore: number;
  scoreStdDev: number;
  tendency: JudgeTendency;
  tendencyScore: number;
  controversialCount: number;
  splitDecisionRate: number;
}

export interface MatchJudgeScoreDiff {
  matchId: string;
  topicTitle: string;
  tournamentName: string;
  round: number;
  judgeScores: {
    judgeId: string;
    judgeName: string;
    proScore: number;
    conScore: number;
    vote: Winner;
  }[];
  scoreVariance: number;
  maxScoreDiff: number;
  isControversial: boolean;
  splitVotes: { pro: number; con: number; draw: number };
  hasSplitDecision: boolean;
}

export interface JudgeAnalysisResult {
  judgeStats: JudgeScoringStat[];
  controversialMatches: MatchJudgeScoreDiff[];
  overallAvgScore: number;
  totalMatchesAnalyzed: number;
}

export interface TopicRecommendation {
  topicId: string;
  title: string;
  category: TopicCategory[];
  difficulty: number;
  formats: DebateFormat[];
  matchScore: number;
  reasons: string[];
  usageCount: number;
  proWinRate: number;
  conWinRate: number;
}

export interface RecommendationContext {
  format: DebateFormat;
  tournamentType: TournamentType;
  round: number;
  totalRounds: number;
  teamStrengths?: { teamId: string; strength: number }[];
  preferredCategories?: TopicCategory[];
  preferredDifficulty?: number;
  excludeTopicIds?: string[];
  maxDifficulty?: number;
  minDifficulty?: number;
}
