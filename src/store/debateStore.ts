import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Team,
  Judge,
  Topic,
  TournamentConfig,
  MatchPairing,
  TimerState,
  JudgeScore,
  Player,
  AvoidanceConflict,
  DebateFormat,
  Danmaku,
  DanmakuChannelMessage,
  ArchivedTournament,
  ArchiveFilter,
  ArchivedMatch,
  TournamentType,
  ArgumentNode,
  ArgumentSide,
  ArgumentTree,
} from '@/types';
import {
  buildInitialTeams,
  buildInitialJudges,
  buildInitialTopics,
  buildInitialTournament,
  buildSampleMatches,
  buildArchivedTournaments,
  buildInitialArguments,
} from '@/data/mockData';
import {
  generateSingleElimination,
  generateRoundRobin,
  generateSwissRound,
  checkAvoidanceConflicts,
  advanceSingleElimination,
  assignJudges,
} from '@/engines/tournamentEngine';
import {
  calculateMatchResult,
  determineWinner,
  calculateTeamRankings,
  calculatePlayerRankings,
  calculatePlayerDetail,
  uid,
  finalizeJudgeScore,
  createEmptyJudgeScore,
} from '@/engines/scoringEngine';
import { createTimerState } from '@/engines/timerEngine';
import { getFormatRules } from '@/engines/formatRules';
import { sanitizeDanmakuContent, escapeHtml } from '@/lib/utils';

interface DebateState {
  teams: Team[];
  judges: Judge[];
  topics: Topic[];
  tournament: TournamentConfig;
  matches: MatchPairing[];
  currentTimer: TimerState | null;
  activeMatchId: string | null;
  judgeScoresByMatch: Record<string, JudgeScore[]>;
  lastInitialized: boolean;

  danmakuList: Danmaku[];
  danmakuEnabledByMatch: Record<string, boolean>;

  archivedTournaments: ArchivedTournament[];

  initIfEmpty: () => void;
  getAllJudgesSubmitted: (matchId: string) => boolean;
  getUnsubmittedJudges: (matchId: string) => string[];

  setActiveMatch: (matchId: string | null) => void;
  initTimer: (format: DebateFormat, stageIndex?: number) => void;
  setTimer: (t: TimerState) => void;

  addTeam: (team: Omit<Team, 'id' | 'createdAt'>) => void;
  updateTeam: (id: string, patch: Partial<Team>) => void;
  removeTeam: (id: string) => void;
  bulkAddTeams: (teams: Omit<Team, 'id' | 'createdAt'>[]) => void;

  addJudge: (j: Omit<Judge, 'id'>) => void;
  updateJudge: (id: string, patch: Partial<Judge>) => void;
  removeJudge: (id: string) => void;

  addTopic: (t: Omit<Topic, 'id'>) => void;
  updateTopic: (id: string, patch: Partial<Topic>) => void;
  removeTopic: (id: string) => void;

  updateTournament: (patch: Partial<TournamentConfig>) => void;
  regenerateAllMatches: () => void;
  generateNextRound: () => void;
  updateMatch: (id: string, patch: Partial<MatchPairing>) => void;

  checkMatchConflicts: (matchId: string) => AvoidanceConflict[];

  submitJudgeScore: (matchId: string, judgeId: string, score: JudgeScore) => void;
  finalizeMatch: (matchId: string) => { success: boolean; error?: string };
  getOrCreateJudgeScore: (matchId: string, judgeId: string) => JudgeScore;

  getTeamById: (id: string) => Team | undefined;
  getPlayerById: (id: string) => Player | undefined;
  getTopicById: (id: string) => Topic | undefined;
  getJudgeById: (id: string) => Judge | undefined;
  getMatchesByRound: (round: number) => MatchPairing[];
  getCurrentRoundMatches: () => MatchPairing[];
  isCurrentRoundFinished: () => boolean;

  teamRankings: () => ReturnType<typeof calculateTeamRankings>;
  playerRankings: () => ReturnType<typeof calculatePlayerRankings>;
  getPlayerDetail: (playerId: string) => ReturnType<typeof calculatePlayerDetail>;

  sendDanmaku: (
    matchId: string,
    danmaku: Omit<Danmaku, 'id' | 'matchId' | 'createdAt'>
  ) => { success: boolean; error?: string; danmaku?: Danmaku };
  getDanmakuByMatch: (matchId: string) => Danmaku[];
  setDanmakuEnabled: (matchId: string, enabled: boolean) => void;
  isDanmakuEnabled: (matchId: string) => boolean;
  clearDanmakuByMatch: (matchId: string) => void;
  subscribeDanmakuChannel: (matchId: string, callback: (d: Danmaku) => void) => () => void;
  checkDanmakuRateLimit: (matchId: string, senderName: string) => { allowed: boolean; waitSeconds?: number };

  getArchivedTournamentById: (id: string) => ArchivedTournament | undefined;
  getArchivedMatchesByTournament: (tournamentId: string) => ArchivedMatch[];
  getArchivedMatchesByRound: (tournamentId: string, round: number) => ArchivedMatch[];
  getArchivedMatchById: (matchId: string) => ArchivedMatch | undefined;
  filterArchivedTournaments: (filter: ArchiveFilter) => ArchivedTournament[];
  getArchiveYears: () => number[];
  getArchiveSeasons: () => string[];
  getArchiveFormats: () => DebateFormat[];
  getArchiveTypes: () => TournamentType[];
  archiveCurrentTournament: () => { success: boolean; error?: string; archivedId?: string };

  arguments: ArgumentNode[];
  addArgument: (
    topicId: string,
    side: ArgumentSide,
    content: string,
    author: string,
    parentId?: string | null
  ) => ArgumentNode;
  updateArgument: (id: string, content: string) => void;
  removeArgument: (id: string) => void;
  voteArgument: (id: string, voterName: string) => { success: boolean; voted: boolean };
  getArgumentTreeByTopicId: (topicId: string) => ArgumentTree;
}

const defaultTournament = buildInitialTournament();
const defaultTeams = buildInitialTeams(8);
const defaultJudges = buildInitialJudges();
const defaultTopics = buildInitialTopics();
const defaultMatches = buildSampleMatches(defaultTeams, defaultJudges, defaultTopics, defaultTournament);
const defaultArchivedTournaments = buildArchivedTournaments();
const defaultArguments = buildInitialArguments();

const danmakuChannel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('debate-danmaku-channel')
    : null;

export const useDebateStore = create<DebateState>()(
  persist(
    (set, get) => ({
      teams: defaultTeams,
      judges: defaultJudges,
      topics: defaultTopics,
      tournament: defaultTournament,
      matches: defaultMatches,
      currentTimer: null,
      activeMatchId: null,
      judgeScoresByMatch: {},
      lastInitialized: false,

      danmakuList: [],
      danmakuEnabledByMatch: {},

      archivedTournaments: defaultArchivedTournaments,
      arguments: defaultArguments,

      getAllJudgesSubmitted: (matchId: string): boolean => {
        const s = get();
        const match = s.matches.find((m) => m.id === matchId);
        if (!match) return false;
        const submitted = s.judgeScoresByMatch[matchId] ?? [];
        return submitted.length >= match.judgeIds.length && match.judgeIds.length > 0;
      },

      getUnsubmittedJudges: (matchId: string): string[] => {
        const s = get();
        const match = s.matches.find((m) => m.id === matchId);
        if (!match) return [];
        const submitted = s.judgeScoresByMatch[matchId] ?? [];
        const submittedIds = new Set(submitted.map((s) => s.judgeId));
        return match.judgeIds.filter((jid) => !submittedIds.has(jid));
      },

      initIfEmpty: () => {
        if (get().lastInitialized) return;
        set({ lastInitialized: true });
      },

      setActiveMatch: (matchId) => set({ activeMatchId: matchId }),

      initTimer: (format, stageIndex = 0) => {
        set({ currentTimer: createTimerState(format, stageIndex) });
      },
      setTimer: (t) => set({ currentTimer: t }),

      addTeam: (team) =>
        set((s) => ({
          teams: [
            ...s.teams,
            { ...team, id: uid(), createdAt: Date.now() },
          ],
        })),
      updateTeam: (id, patch) =>
        set((s) => ({
          teams: s.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeTeam: (id) =>
        set((s) => ({ teams: s.teams.filter((t) => t.id !== id) })),
      bulkAddTeams: (list) =>
        set((s) => ({
          teams: [
            ...s.teams,
            ...list.map((t, i) => ({
              ...t,
              id: uid(),
              createdAt: Date.now() + i,
            })),
          ],
        })),

      addJudge: (j) => set((s) => ({ judges: [...s.judges, { ...j, id: uid() }] })),
      updateJudge: (id, patch) =>
        set((s) => ({
          judges: s.judges.map((j) => (j.id === id ? { ...j, ...patch } : j)),
        })),
      removeJudge: (id) => set((s) => ({ judges: s.judges.filter((j) => j.id !== id) })),

      addTopic: (t) => set((s) => ({ topics: [...s.topics, { ...t, id: uid() }] })),
      updateTopic: (id, patch) =>
        set((s) => ({
          topics: s.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeTopic: (id) => set((s) => ({ topics: s.topics.filter((t) => t.id !== id) })),

      updateTournament: (patch) =>
        set((s) => ({ tournament: { ...s.tournament, ...patch } })),

      regenerateAllMatches: () => {
        const s = get();
        const { teams, judges, topics, tournament } = s;
        const validTeams = teams.filter((t) => t.id !== '__bye__' && !t.id.startsWith('__'));
        if (validTeams.length < 2) return;

        let matches: MatchPairing[] = [];
        const fmt = tournament.format;
        const jpm = tournament.judgesPerMatch;
        const id = tournament.id;

        switch (tournament.type) {
          case 'single_elimination':
            matches = generateSingleElimination(validTeams, id, topics, judges, fmt, jpm);
            break;
          case 'round_robin':
            matches = generateRoundRobin(validTeams, id, topics, judges, fmt, jpm);
            break;
          case 'swiss':
            {
              const rankings = calculateTeamRankings([], validTeams);
              matches = generateSwissRound(
                validTeams,
                1,
                [],
                id,
                topics,
                judges,
                fmt,
                jpm,
                rankings
              );
            }
            break;
        }

        const totalRounds =
          tournament.type === 'round_robin'
            ? Math.max(...matches.map((m) => m.round), 1)
            : tournament.type === 'single_elimination'
            ? Math.max(...matches.map((m) => m.round), 1)
            : tournament.totalRounds;

        set({
          matches,
          tournament: {
            ...tournament,
            currentRound: 1,
            totalRounds,
          },
          judgeScoresByMatch: {},
        });
      },

      generateNextRound: () => {
        const s = get();
        const { matches, tournament, teams, judges, topics } = s;
        const { currentRound, type, format, judgesPerMatch, id, totalRounds } = tournament;
        const curMatches = matches.filter((m) => m.round === currentRound);
        const allFinished = curMatches.length > 0 && curMatches.every((m) => m.status === 'finished');
        if (!allFinished) return;
        if (currentRound >= totalRounds) return;

        const nextRound = currentRound + 1;
        const validTeams = teams.filter((t) => !t.id.startsWith('__'));

        if (type === 'single_elimination') {
          const advanced = advanceSingleElimination(matches, nextRound);
          const withJudges = advanced.map((m) => {
            if (m.round !== nextRound) return m;
            const pro = validTeams.find((t) => t.id === m.proTeamId);
            const con = validTeams.find((t) => t.id === m.conTeamId);
            const assignedIds = advanced
              .filter((mm) => mm.round === nextRound)
              .flatMap((mm) => mm.judgeIds);
            const js = assignJudges(pro ?? null, con ?? null, judges, assignedIds, judgesPerMatch);
            return { ...m, judgeIds: js.map((j) => j.id) };
          });
          set({
            matches: withJudges,
            tournament: { ...tournament, currentRound: nextRound },
          });
          return;
        }

        if (type === 'round_robin') {
          set({ tournament: { ...tournament, currentRound: nextRound } });
          return;
        }

        if (type === 'swiss') {
          const history = matches.filter((m) => m.status === 'finished');
          const rankings = calculateTeamRankings(matches, validTeams);
          const newMatches = generateSwissRound(
            validTeams,
            nextRound,
            history,
            id,
            topics,
            judges,
            format,
            judgesPerMatch,
            rankings
          );
          set({
            matches: [...matches, ...newMatches],
            tournament: { ...tournament, currentRound: nextRound },
          });
        }
      },

      updateMatch: (id, patch) =>
        set((s) => ({
          matches: s.matches.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      checkMatchConflicts: (matchId) => {
        const s = get();
        const m = s.matches.find((x) => x.id === matchId);
        if (!m) return [];
        return checkAvoidanceConflicts(m, s.teams, s.judges);
      },

      submitJudgeScore: (matchId, judgeId, score) => {
        const s = get();
        const finalized = finalizeJudgeScore(score, s.tournament.format);
        const existing = s.judgeScoresByMatch[matchId] ?? [];
        const others = existing.filter((x) => x.judgeId !== judgeId);
        set({
          judgeScoresByMatch: {
            ...s.judgeScoresByMatch,
            [matchId]: [...others, finalized],
          },
        });
      },

      finalizeMatch: (matchId) => {
        const s = get();
        const judgeScores = s.judgeScoresByMatch[matchId] ?? [];
        const match = s.matches.find((m) => m.id === matchId);
        if (!match) return { success: false, error: '比赛不存在' };

        if (judgeScores.length === 0) {
          return { success: false, error: '暂无评委提交评分，无法结束比赛' };
        }
        if (judgeScores.length < match.judgeIds.length) {
          const unsubmitted = s.getUnsubmittedJudges(matchId)
            .map((jid) => s.getJudgeById(jid)?.name)
            .filter(Boolean)
            .join('、');
          return {
            success: false,
            error: `还有 ${match.judgeIds.length - judgeScores.length} 位评委未提交评分：${unsubmitted}`,
          };
        }

        const matchScore = calculateMatchResult(match, judgeScores);
        const winner = determineWinner(matchScore, match);

        if (match.scores?.mvpPlayerId) {
          // ensure MVP reflected
        }

        set((st) => ({
          matches: st.matches.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  status: 'finished',
                  winner,
                  scores: matchScore,
                  finishedAt: Date.now(),
                }
              : m
          ),
        }));
        return { success: true };
      },

      getOrCreateJudgeScore: (matchId, judgeId) => {
        const s = get();
        const list = s.judgeScoresByMatch[matchId] ?? [];
        const found = list.find((x) => x.judgeId === judgeId);
        if (found) return found;

        const match = s.matches.find((m) => m.id === matchId);
        if (!match) return createEmptyJudgeScore(judgeId, s.tournament.format, [], []);

        const proTeam = s.teams.find((t) => t.id === match.proTeamId);
        const conTeam = s.teams.find((t) => t.id === match.conTeamId);

        if (match.bpTeams && s.tournament.format === 'british_parliamentary') {
          const bp = match.bpTeams;
          const bpPlayers: Record<string, Player[]> = {};
          (['og', 'oo', 'cg', 'co'] as const).forEach((role) => {
            const team = s.teams.find((t) => t.id === bp[role]);
            bpPlayers[role] = team?.players ?? [];
          });
          return createEmptyJudgeScore(
            judgeId,
            s.tournament.format,
            proTeam?.players ?? [],
            conTeam?.players ?? [],
            bpPlayers as Record<'og' | 'oo' | 'cg' | 'co', Player[]>
          );
        }

        return createEmptyJudgeScore(
          judgeId,
          s.tournament.format,
          proTeam?.players ?? [],
          conTeam?.players ?? []
        );
      },

      getTeamById: (id) => get().teams.find((t) => t.id === id),
      getPlayerById: (id) => {
        for (const t of get().teams) {
          const p = t.players.find((pp) => pp.id === id);
          if (p) return p;
        }
        return undefined;
      },
      getTopicById: (id) => get().topics.find((t) => t.id === id),
      getJudgeById: (id) => get().judges.find((j) => j.id === id),
      getMatchesByRound: (round) => get().matches.filter((m) => m.round === round),
      getCurrentRoundMatches: () => get().matches.filter((m) => m.round === get().tournament.currentRound),
      isCurrentRoundFinished: () => {
        const cur = get().getCurrentRoundMatches();
        return cur.length > 0 && cur.every((m) => m.status === 'finished');
      },

      teamRankings: () => calculateTeamRankings(get().matches, get().teams),
      playerRankings: () => calculatePlayerRankings(get().matches, get().teams),
      getPlayerDetail: (playerId) =>
        calculatePlayerDetail(playerId, get().matches, get().teams, get().topics, get().tournament, get().archivedTournaments),

      checkDanmakuRateLimit: (matchId, senderName) => {
        const now = Date.now();
        const MIN_INTERVAL_MS = 2000;
        const WINDOW_MS = 60_000;
        const MAX_PER_WINDOW = 15;
        const recent = get()
          .danmakuList.filter(
            (d) =>
              d.matchId === matchId &&
              d.senderName === senderName &&
              now - d.createdAt < WINDOW_MS
          )
          .sort((a, b) => b.createdAt - a.createdAt);
        if (recent.length > 0 && now - recent[0].createdAt < MIN_INTERVAL_MS) {
          return {
            allowed: false,
            waitSeconds: Math.ceil((MIN_INTERVAL_MS - (now - recent[0].createdAt)) / 1000),
          };
        }
        if (recent.length >= MAX_PER_WINDOW) {
          return {
            allowed: false,
            waitSeconds: Math.ceil((WINDOW_MS - (now - recent[recent.length - 1].createdAt)) / 1000),
          };
        }
        return { allowed: true };
      },

      sendDanmaku: (matchId, danmakuInput) => {
        const cleanContent = sanitizeDanmakuContent(danmakuInput.content);
        if (!cleanContent) {
          return { success: false, error: '弹幕内容不能为空' };
        }
        if (!danmakuInput.senderName || !danmakuInput.senderName.trim()) {
          return { success: false, error: '昵称不能为空' };
        }
        const rateCheck = get().checkDanmakuRateLimit(matchId, danmakuInput.senderName.trim());
        if (!rateCheck.allowed) {
          return {
            success: false,
            error: rateCheck.waitSeconds
              ? `发送太频繁啦，请 ${rateCheck.waitSeconds} 秒后再试`
              : '发送太频繁，请稍后再试',
          };
        }

        const newDanmaku: Danmaku = {
          id: uid(),
          matchId,
          content: cleanContent,
          senderName: escapeHtml(danmakuInput.senderName.trim().slice(0, 12)),
          senderSide: danmakuInput.senderSide ?? 'neutral',
          color: danmakuInput.color,
          createdAt: Date.now(),
        };

        set((s) => ({
          danmakuList: [...s.danmakuList, newDanmaku].slice(-500),
        }));

        const message: DanmakuChannelMessage = {
          type: 'danmaku',
          data: newDanmaku,
          matchId,
          timestamp: Date.now(),
        };

        danmakuChannel?.postMessage(message);

        try {
          const storageKey = 'debate-danmaku-event';
          localStorage.setItem(storageKey, JSON.stringify({ ...message, nonce: Math.random() }));
        } catch {
          // ignore
        }

        return { success: true, danmaku: newDanmaku };
      },

      getDanmakuByMatch: (matchId) => {
        return get().danmakuList.filter((d) => d.matchId === matchId);
      },

      setDanmakuEnabled: (matchId, enabled) => {
        set((s) => ({
          danmakuEnabledByMatch: {
            ...s.danmakuEnabledByMatch,
            [matchId]: enabled,
          },
        }));
      },

      isDanmakuEnabled: (matchId) => {
        const v = get().danmakuEnabledByMatch[matchId];
        return v === undefined ? true : v;
      },

      clearDanmakuByMatch: (matchId) => {
        set((s) => ({
          danmakuList: s.danmakuList.filter((d) => d.matchId !== matchId),
        }));

        const message: DanmakuChannelMessage = {
          type: 'clear',
          matchId,
          timestamp: Date.now(),
        };

        danmakuChannel?.postMessage(message);
      },

      subscribeDanmakuChannel: (matchId, callback) => {
        const handleMessage = (event: MessageEvent<DanmakuChannelMessage>) => {
          const msg = event.data;
          if (!msg || msg.matchId !== matchId) return;
          if (msg.type === 'danmaku' && msg.data) {
            callback(msg.data);
          } else if (msg.type === 'clear') {
            // no-op for individual danmaku callback, caller manages list
          }
        };

        const handleStorage = (e: StorageEvent) => {
          if (e.key !== 'debate-danmaku-event' || !e.newValue) return;
          try {
            const msg: DanmakuChannelMessage = JSON.parse(e.newValue);
            if (msg.matchId !== matchId) return;
            if (msg.type === 'danmaku' && msg.data) {
              const state = get();
              const alreadyExists = state.danmakuList.some((d) => d.id === msg.data!.id);
              if (!alreadyExists) {
                set((s) => ({
                  danmakuList: [...s.danmakuList, msg.data!].slice(-500),
                }));
              }
              callback(msg.data);
            }
          } catch {
            // ignore
          }
        };

        danmakuChannel?.addEventListener('message', handleMessage);
        window.addEventListener('storage', handleStorage);

        return () => {
          danmakuChannel?.removeEventListener('message', handleMessage);
          window.removeEventListener('storage', handleStorage);
        };
      },

      getArchivedTournamentById: (id) => {
        return get().archivedTournaments.find((t) => t.id === id);
      },

      getArchivedMatchesByTournament: (tournamentId) => {
        const tournament = get().getArchivedTournamentById(tournamentId);
        return tournament?.matches ?? [];
      },

      getArchivedMatchesByRound: (tournamentId, round) => {
        return get()
          .getArchivedMatchesByTournament(tournamentId)
          .filter((m) => m.round === round);
      },

      getArchivedMatchById: (matchId) => {
        for (const t of get().archivedTournaments) {
          const match = t.matches.find((m) => m.id === matchId);
          if (match) return match;
        }
        return undefined;
      },

      filterArchivedTournaments: (filter) => {
        const { year, season, format, type, keyword } = filter;
        return get().archivedTournaments.filter((t) => {
          if (year && t.year !== year) return false;
          if (season && t.season !== season) return false;
          if (format && t.format !== format) return false;
          if (type && t.type !== type) return false;
          if (keyword) {
            const kw = keyword.toLowerCase();
            if (
              !t.name.toLowerCase().includes(kw) &&
              !t.description?.toLowerCase().includes(kw) &&
              !t.championTeamName?.toLowerCase().includes(kw)
            ) {
              return false;
            }
          }
          return true;
        });
      },

      getArchiveYears: () => {
        const years = new Set(get().archivedTournaments.map((t) => t.year));
        return Array.from(years).sort((a, b) => b - a);
      },

      getArchiveSeasons: () => {
        const seasons = new Set(get().archivedTournaments.map((t) => t.season));
        return Array.from(seasons);
      },

      getArchiveFormats: () => {
        const formats = new Set(get().archivedTournaments.map((t) => t.format));
        return Array.from(formats);
      },

      getArchiveTypes: () => {
        const types = new Set(get().archivedTournaments.map((t) => t.type));
        return Array.from(types);
      },

      archiveCurrentTournament: () => {
        const s = get();
        const { tournament, matches, teams, judgeScoresByMatch } = s;

        const finishedMatches = matches.filter((m) => m.status === 'finished');
        if (finishedMatches.length === 0) {
          return { success: false, error: '当前赛事没有已完成的比赛，无法归档' };
        }

        const allFinished = matches.every((m) => m.status === 'finished');
        if (!allFinished) {
          return { success: false, error: '当前赛事还有未完成的比赛，请先完成所有比赛后再归档' };
        }

        const now = Date.now();
        const year = new Date(tournament.createdAt).getFullYear();

        const archivedTeams: ArchivedTournament['teams'] = teams
          .filter((t) => !t.id.startsWith('__'))
          .map((team) => {
            const teamMatches = finishedMatches.filter(
              (m) => m.proTeamId === team.id || m.conTeamId === team.id
            );
            const wins = teamMatches.filter(
              (m) =>
                (m.proTeamId === team.id && m.winner === 'pro') ||
                (m.conTeamId === team.id && m.winner === 'con')
            ).length;
            const losses = teamMatches.filter(
              (m) =>
                (m.proTeamId === team.id && m.winner === 'con') ||
                (m.conTeamId === team.id && m.winner === 'pro')
            ).length;
            const draws = teamMatches.filter((m) => m.winner === 'draw').length;

            return {
              id: team.id,
              name: team.name,
              institution: team.institution,
              players: team.players.map((p) => ({
                id: p.id,
                name: p.name,
                role: p.role,
                avgScore:
                  p.scores.length > 0
                    ? p.scores.reduce((sum, s) => sum + s.score, 0) / p.scores.length
                    : 0,
                totalMatches: p.scores.length,
                mvpCount: p.scores.filter((s) => s.isMVP).length,
              })),
              wins,
              losses,
              draws,
            };
          });

        const archivedMatches: ArchivedTournament['matches'] = finishedMatches.map((m) => {
          const proTeam = teams.find((t) => t.id === m.proTeamId);
          const conTeam = teams.find((t) => t.id === m.conTeamId);
          const topic = s.topics.find((t) => t.id === m.topicId);
          const judgeNames = m.judgeIds
            .map((jid) => s.judges.find((j) => j.id === jid)?.name)
            .filter(Boolean) as string[];

          return {
            id: m.id,
            tournamentId: tournament.id,
            round: m.round,
            matchNumber: m.matchNumber,
            proTeamId: m.proTeamId,
            conTeamId: m.conTeamId,
            proTeamName: proTeam?.name ?? '',
            conTeamName: conTeam?.name ?? '',
            proTeamInstitution: proTeam?.institution ?? '',
            conTeamInstitution: conTeam?.institution ?? '',
            topicId: m.topicId,
            topicTitle: topic?.title ?? '',
            topicProSide: topic?.proSide ?? '',
            topicConSide: topic?.conSide ?? '',
            topicCategory: topic?.category ?? [],
            topicDifficulty: topic?.difficulty ?? 3,
            topicFormats: topic?.formats ?? [],
            judgeIds: m.judgeIds,
            judgeNames,
            status: m.status,
            winner: m.winner,
            startedAt: m.startedAt ?? now,
            finishedAt: m.finishedAt ?? now,
            scores: m.scores,
          };
        });

        const sortedTeams = [...archivedTeams].sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return b.draws - a.draws;
        });

        const archivedTournament: ArchivedTournament = {
          id: `arch_${tournament.id}_${now}`,
          name: tournament.name,
          format: tournament.format,
          type: tournament.type,
          season: '存档',
          year,
          totalRounds: tournament.totalRounds,
          totalMatches: archivedMatches.length,
          judgesPerMatch: tournament.judgesPerMatch,
          startDate: archivedMatches[0]?.startedAt ?? now,
          endDate: archivedMatches[archivedMatches.length - 1]?.finishedAt ?? now,
          description: tournament.description,
          coverUrl: tournament.coverUrl,
          championTeamId: sortedTeams[0]?.id,
          championTeamName: sortedTeams[0]?.name,
          runnerUpTeamId: sortedTeams[1]?.id,
          runnerUpTeamName: sortedTeams[1]?.name,
          teams: archivedTeams,
          matches: archivedMatches,
        };

        set((st) => ({
          archivedTournaments: [...st.archivedTournaments, archivedTournament],
        }));

        return { success: true, archivedId: archivedTournament.id };
      },

      addArgument: (topicId, side, content, author, parentId = null) => {
        const newNode: ArgumentNode = {
          id: uid(),
          topicId,
          side,
          parentId,
          content: content.trim(),
          author: author.trim() || '匿名用户',
          votes: 0,
          voters: [],
          children: [],
          createdAt: Date.now(),
        };
        set((s) => ({ arguments: [...s.arguments, newNode] }));
        return newNode;
      },

      updateArgument: (id, content) => {
        set((s) => ({
          arguments: s.arguments.map((a) =>
            a.id === id ? { ...a, content: content.trim() } : a
          ),
        }));
      },

      removeArgument: (id) => {
        const collectIds = (nodeId: string, list: ArgumentNode[]): string[] => {
          const ids = [nodeId];
          list
            .filter((a) => a.parentId === nodeId)
            .forEach((child) => ids.push(...collectIds(child.id, list)));
          return ids;
        };
        set((s) => {
          const toRemove = new Set(collectIds(id, s.arguments));
          return { arguments: s.arguments.filter((a) => !toRemove.has(a.id)) };
        });
      },

      voteArgument: (id, voterName) => {
        const voter = voterName.trim() || '匿名用户';
        const s = get();
        const node = s.arguments.find((a) => a.id === id);
        if (!node) return { success: false, voted: false };
        const hasVoted = node.voters.includes(voter);
        set((st) => ({
          arguments: st.arguments.map((a) => {
            if (a.id !== id) return a;
            if (hasVoted) {
              return {
                ...a,
                votes: Math.max(0, a.votes - 1),
                voters: a.voters.filter((v) => v !== voter),
              };
            }
            return {
              ...a,
              votes: a.votes + 1,
              voters: [...a.voters, voter],
            };
          }),
        }));
        return { success: true, voted: !hasVoted };
      },

      getArgumentTreeByTopicId: (topicId): ArgumentTree => {
        const all = get().arguments.filter((a) => a.topicId === topicId);
        const buildTree = (parentId: string | null): ArgumentNode[] =>
          all
            .filter((a) => a.parentId === parentId)
            .sort((a, b) => b.votes - a.votes || b.createdAt - a.createdAt)
            .map((node) => ({ ...node, children: buildTree(node.id) }));
        return {
          topicId,
          proRoots: buildTree(null).filter((n) => n.side === 'pro'),
          conRoots: buildTree(null).filter((n) => n.side === 'con'),
        };
      },
    }),
    {
      name: 'debate-tournament-store',
      partialize: (state) => ({
        teams: state.teams,
        judges: state.judges,
        topics: state.topics,
        tournament: state.tournament,
        matches: state.matches,
        judgeScoresByMatch: state.judgeScoresByMatch,
        lastInitialized: state.lastInitialized,
        currentTimer: state.currentTimer,
        activeMatchId: state.activeMatchId,
        danmakuList: state.danmakuList,
        danmakuEnabledByMatch: state.danmakuEnabledByMatch,
        archivedTournaments: state.archivedTournaments,
        arguments: state.arguments,
      }),
    }
  )
);

export { getFormatRules };
