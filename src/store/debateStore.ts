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
  TournamentType,
} from '@/types';
import {
  buildInitialTeams,
  buildInitialJudges,
  buildInitialTopics,
  buildInitialTournament,
  buildSampleMatches,
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
  uid,
  finalizeJudgeScore,
  createEmptyJudgeScore,
} from '@/engines/scoringEngine';
import { createTimerState } from '@/engines/timerEngine';
import { getFormatRules } from '@/engines/formatRules';

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

  initIfEmpty: () => void;

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
  finalizeMatch: (matchId: string) => void;
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
}

const defaultTournament = buildInitialTournament();
const defaultTeams = buildInitialTeams(8);
const defaultJudges = buildInitialJudges();
const defaultTopics = buildInitialTopics();
const defaultMatches = buildSampleMatches(defaultTeams, defaultJudges, defaultTopics, defaultTournament);

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
        if (judgeScores.length === 0) return;

        const match = s.matches.find((m) => m.id === matchId);
        if (!match) return;

        const matchScore = calculateMatchResult(match, judgeScores);
        const winner = determineWinner(matchScore);

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
      }),
    }
  )
);

export { getFormatRules };
