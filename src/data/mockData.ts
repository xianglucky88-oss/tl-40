import {
  Team,
  Judge,
  Topic,
  TournamentConfig,
  MatchPairing,
  DebateFormat,
  TournamentType,
  TopicCategory,
  ArchivedTournament,
  ArchivedMatch,
  ArchivedTeam,
  Winner,
  PlayerScore,
  JudgeScore,
  MatchScore,
} from '@/types';
import { uid } from '@/engines/scoringEngine';
import { getFormatRules } from '@/engines/formatRules';

const now = Date.now();

const roleOptions: ('一辩' | '二辩' | '三辩' | '四辩')[] = ['一辩', '二辩', '三辩', '四辩'];

const INSTITUTIONS = [
  '北京大学', '清华大学', '复旦大学', '上海交通大学',
  '浙江大学', '南京大学', '武汉大学', '中山大学',
  '中国人民大学', '北京师范大学', '厦门大学', '同济大学',
  '四川大学', '南开大学', '西安交通大学', '华中科技大学',
];

const TEAM_NAME_PREFIXES = [
  '青锋', '明辨', '知行', '弘毅', '求是', '博雅', '经纬', '星芒',
  '格致', '云帆', '弘毅', '晨光', '百川', '观澜', '北辰', '远志',
];

const PLAYER_NAMES = [
  '思远', '子轩', '嘉怡', '浩然', '若涵', '雨泽', '梓涵', '星宇',
  '诗涵', '伟祺', '雅婷', '明辉', '晨曦', '瑞杰', '佳宁', '博文',
  '欣怡', '奕辰', '婉清', '嘉豪', '梦琪', '振宇', '雅琴', '景行',
  '芷若', '逸凡', '佳琪', '承恩', '沐阳', '语桐', '俊杰', '雪莹',
];

const buildPlayers = (teamIdx: number): Team['players'] => {
  const base = teamIdx * 4;
  return (roleOptions.map((role, i) => ({
    id: `p_${teamIdx}_${i}`,
    name: `${PLAYER_NAMES[(base + i) % PLAYER_NAMES.length]}`,
    role,
    contact: `player${base + i}@debate.edu`,
    scores: [],
  })));
};

export const buildInitialTeams = (count = 8): Team[] => {
  return Array.from({ length: count }, (_, i) => {
    const inst = INSTITUTIONS[i % INSTITUTIONS.length];
    const name = TEAM_NAME_PREFIXES[i % TEAM_NAME_PREFIXES.length];
    return {
      id: `t_${i}`,
      name: `${inst}${name}队`,
      institution: inst,
      players: buildPlayers(i),
      seed: i + 1,
      createdAt: now - 1000 * 60 * 60 * (24 + i),
    };
  });
};

const JUDGE_INFO = [
  { name: '张秉文', inst: '中国社会科学院', title: '研究员' },
  { name: '李明远', inst: '清华大学法学院', title: '副教授' },
  { name: '王雅琴', inst: '北京大学政府管理学院', title: '教授' },
  { name: '赵思琪', inst: '复旦大学新闻学院', title: '讲师' },
  { name: '陈守正', inst: '上海交通大学', title: '校辩论队总教练' },
  { name: '周怀安', inst: '浙江大学光华法学院', title: '副教授' },
  { name: '吴若兰', inst: '南京大学文学院', title: '副研究员' },
  { name: '郑怀瑾', inst: '武汉大学', title: '资深辩论导师' },
  { name: '孙敬之', inst: '中国人民大学', title: '特聘研究员' },
  { name: '林婉清', inst: '厦门大学', title: '辩论队指导老师' },
];

export const buildInitialJudges = (): Judge[] => {
  return JUDGE_INFO.map((j, i) => ({
    id: `j_${i}`,
    name: j.name,
    institution: j.inst,
    title: j.title,
    avoidTeams: i % 3 === 0 ? [`t_${i % 8}`] : [],
    avoidInstitutions: i % 4 === 1 ? [INSTITUTIONS[(i + 2) % INSTITUTIONS.length]] : [],
    avoidPlayers: i === 5 ? ['p_0_0', 'p_0_1'] : [],
  }));
};

type TopicCat = '政策' | '价值' | '事实' | '模拟法庭';
const TOPIC_DATA: {
  title: string;
  pro: string;
  con: string;
  cats: TopicCat[];
  difficulty: 1 | 2 | 3 | 4 | 5;
}[] = [
  {
    title: '人工智能的发展对人类未来利大于弊/弊大于利',
    pro: '人工智能的发展对人类未来利大于弊',
    con: '人工智能的发展对人类未来弊大于利',
    cats: ['价值', '政策'] as const,
    difficulty: 3,
  },
  {
    title: '当今社会，更需要英雄主义/集体主义',
    pro: '当今社会，更需要英雄主义',
    con: '当今社会，更需要集体主义',
    cats: ['价值'] as const,
    difficulty: 2,
  },
  {
    title: '应该/不应该全面禁止未成年人网络游戏',
    pro: '应该全面禁止未成年人网络游戏',
    con: '不应该全面禁止未成年人网络游戏',
    cats: ['政策', '事实'] as const,
    difficulty: 3,
  },
  {
    title: '短视频的流行提升/降低了当代人的认知能力',
    pro: '短视频的流行提升了当代人的认知能力',
    con: '短视频的流行降低了当代人的认知能力',
    cats: ['价值', '事实'] as const,
    difficulty: 2,
  },
  {
    title: '全球化时代，母语教育比外语教育更/更不重要',
    pro: '全球化时代，母语教育比外语教育更重要',
    con: '全球化时代，母语教育不如外语教育重要',
    cats: ['价值'] as const,
    difficulty: 3,
  },
  {
    title: '应该/不应该在全国推行免费大学教育',
    pro: '应该在全国推行免费大学教育',
    con: '不应该在全国推行免费大学教育',
    cats: ['政策'] as const,
    difficulty: 4,
  },
  {
    title: '科技进步使人更/更不自由',
    pro: '科技进步使人更自由',
    con: '科技进步使人更不自由',
    cats: ['价值'] as const,
    difficulty: 4,
  },
  {
    title: '原告甲公司诉被告乙公司侵犯商业秘密案',
    pro: '原告：甲公司主张乙公司构成侵权并请求赔偿',
    con: '被告：乙公司主张未侵权并请求驳回原告诉求',
    cats: ['模拟法庭'] as const,
    difficulty: 5,
  },
  {
    title: '应该/不应该赋予AI生成作品版权保护',
    pro: '应该赋予AI生成作品版权保护',
    con: '不应该赋予AI生成作品版权保护',
    cats: ['政策', '价值'] as const,
    difficulty: 5,
  },
  {
    title: '城市化进程中，保留/拆除老旧居民区更重要',
    pro: '城市化进程中，保留老旧居民区更重要',
    con: '城市化进程中，拆除老旧居民区更重要',
    cats: ['政策', '价值'] as const,
    difficulty: 3,
  },
  {
    title: '知识付费能/不能缓解当代年轻人的焦虑',
    pro: '知识付费能缓解当代年轻人的焦虑',
    con: '知识付费不能缓解当代年轻人的焦虑',
    cats: ['事实', '价值'] as const,
    difficulty: 2,
  },
  {
    title: '离婚率上升是/不是社会进步的体现',
    pro: '离婚率上升是社会进步的体现',
    con: '离婚率上升不是社会进步的体现',
    cats: ['价值', '事实'] as const,
    difficulty: 4,
  },
];

const ALL_FORMATS: DebateFormat[] = ['parliamentary', 'mandarin', 'moot_court', 'british_parliamentary'];

export const buildInitialTopics = (): Topic[] => {
  return TOPIC_DATA.map((t, i) => {
    const formats: DebateFormat[] = [];
    if (t.cats.includes('模拟法庭')) {
      formats.push('moot_court');
    } else {
      formats.push(ALL_FORMATS.filter((f) => f !== 'moot_court')[(i + 1) % 3]);
      formats.push(ALL_FORMATS.filter((f) => f !== 'moot_court')[i % 3]);
    }
    return {
      id: `topic_${i}`,
      title: t.title,
      proSide: t.pro,
      conSide: t.con,
      category: [...t.cats] as TopicCategory[],
      formats: Array.from(new Set(formats)),
      difficulty: t.difficulty as 1 | 2 | 3 | 4 | 5,
    };
  });
};

export const buildInitialTournament = (): TournamentConfig => ({
  id: 'tourn_0',
  name: '2026·第二届全国高校华语辩论邀请赛',
  format: 'mandarin' as DebateFormat,
  type: 'single_elimination' as TournamentType,
  totalRounds: 3,
  judgesPerMatch: 3,
  createdAt: now - 1000 * 60 * 60 * 24 * 7,
  currentRound: 1,
  description: '年度最高规格华语辩论赛事，汇集全国顶尖高校辩论队伍',
});

export const buildSampleMatches = (
  teams: Team[],
  judges: Judge[],
  topics: Topic[],
  tournament: TournamentConfig
): MatchPairing[] => {
  const mandarinTopics = topics.filter((t) => t.formats.includes(tournament.format));
  const pairs: MatchPairing[] = [];

  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      const matchNum = i / 2 + 1;
      const judgeIds = judges.slice((matchNum - 1) * 3, matchNum * 3).map((j) => j.id);
      pairs.push({
        id: uid(),
        tournamentId: tournament.id,
        round: 1,
        matchNumber: matchNum,
        proTeamId: teams[i].id,
        conTeamId: teams[i + 1].id,
        topicId: mandarinTopics[(matchNum - 1) % mandarinTopics.length].id,
        judgeIds: judgeIds.length ? judgeIds : [judges[0].id, judges[1].id, judges[2].id],
        status: matchNum === 1 ? 'ongoing' : 'pending',
        startedAt: matchNum === 1 ? now - 1000 * 60 * 10 : undefined,
      });
    }
  }

  const totalRounds = tournament.totalRounds;
  for (let round = 2; round <= totalRounds; round++) {
    const count = Math.max(1, Math.floor(teams.length / Math.pow(2, round)));
    for (let m = 0; m < count; m++) {
      pairs.push({
        id: uid(),
        tournamentId: tournament.id,
        round,
        matchNumber: m + 1,
        proTeamId: `__tbd_r${round}_${m}_a`,
        conTeamId: `__tbd_r${round}_${m}_b`,
        topicId: mandarinTopics[m % mandarinTopics.length].id,
        judgeIds: [],
        status: 'pending',
      });
    }
  }

  return pairs;
};

const ARCHIVE_TOURNAMENT_DATA = [
  {
    name: '2024·首届全国高校华语辩论邀请赛',
    format: 'mandarin' as DebateFormat,
    type: 'single_elimination' as TournamentType,
    season: '春季赛',
    year: 2024,
    totalRounds: 4,
    totalMatches: 15,
    judgesPerMatch: 3,
    description: '首届全国高校华语辩论邀请赛，汇集全国顶尖高校辩论队伍，共16支队伍参赛',
  },
  {
    name: '2024·秋季辩论联赛',
    format: 'parliamentary' as DebateFormat,
    type: 'round_robin' as TournamentType,
    season: '秋季赛',
    year: 2024,
    totalRounds: 7,
    totalMatches: 28,
    judgesPerMatch: 3,
    description: '秋季辩论联赛，采用议会制赛制，8支队伍循环对决',
  },
  {
    name: '2025·春季冠军赛',
    format: 'mandarin' as DebateFormat,
    type: 'swiss' as TournamentType,
    season: '春季赛',
    year: 2025,
    totalRounds: 5,
    totalMatches: 20,
    judgesPerMatch: 3,
    description: '2025春季冠军赛，瑞士轮赛制，12支精英队伍角逐冠军',
  },
  {
    name: '2025·模拟法庭邀请赛',
    format: 'moot_court' as DebateFormat,
    type: 'single_elimination' as TournamentType,
    season: '夏季赛',
    year: 2025,
    totalRounds: 3,
    totalMatches: 7,
    judgesPerMatch: 5,
    description: '首届模拟法庭邀请赛，法学院校专业对决',
  },
  {
    name: '2025·秋季BP辩论赛',
    format: 'british_parliamentary' as DebateFormat,
    type: 'swiss' as TournamentType,
    season: '秋季赛',
    year: 2025,
    totalRounds: 4,
    totalMatches: 16,
    judgesPerMatch: 3,
    description: '英国议会制辩论赛，国际标准赛制，16支队伍四队对决',
  },
];

const ARCHIVE_TEAM_NAMES = [
  '北京大学青锋队', '清华大学明辨队', '复旦大学知行队', '上海交大卫国队',
  '浙江大学求是队', '南京大学博雅队', '武汉大学经纬队', '中山大学星芒队',
  '中国人民大学格致队', '北京师范大学云帆队', '厦门大学弘毅队', '同济大学晨光队',
  '四川大学百川队', '南开大学观澜队', '西安交大队', '华中科技大学北辰队',
];

const ARCHIVE_PLAYER_NAMES = [
  '陈思远', '李子轩', '王嘉怡', '赵浩然', '孙若涵', '周雨泽', '吴梓涵', '郑星宇',
  '冯诗涵', '陈伟祺', '褚雅婷', '卫明辉', '蒋晨曦', '沈瑞杰', '韩佳宁', '杨博文',
  '朱欣怡', '秦奕辰', '尤婉清', '许嘉豪', '何梦琪', '吕振宇', '施雅琴', '张景行',
  '孔芷若', '曹逸凡', '严佳琪', '华承恩', '金沐阳', '魏语桐', '陶俊杰', '姜雪莹',
];

const ARCHIVE_TOPICS = [
  { title: '人工智能的发展对人类未来利大于弊/弊大于利', pro: '利大于弊', con: '弊大于利' },
  { title: '当今社会，更需要英雄主义/集体主义', pro: '更需要英雄主义', con: '更需要集体主义' },
  { title: '应该全面禁止/不应该全面禁止未成年人网络游戏', pro: '应该全面禁止', con: '不应该全面禁止' },
  { title: '短视频的流行提升/降低了当代人的认知能力', pro: '提升了认知能力', con: '降低了认知能力' },
  { title: '全球化时代，母语教育比外语教育更/更不重要', pro: '母语教育更重要', con: '外语教育更重要' },
  { title: '应该/不应该在全国推行免费大学教育', pro: '应该推行', con: '不应该推行' },
  { title: '科技进步使人更/更不自由', pro: '使人更自由', con: '使人更不自由' },
  { title: '知识付费能/不能缓解当代年轻人的焦虑', pro: '能缓解焦虑', con: '不能缓解焦虑' },
];

const ARCHIVE_JUDGE_NAMES = [
  '张秉文', '李明远', '王雅琴', '赵思琪', '陈守正',
  '周怀安', '吴若兰', '郑怀瑾', '孙敬之', '林婉清',
];

const buildMatchScore = (
  matchId: string,
  proTeam: ArchivedTeam,
  conTeam: ArchivedTeam,
  judgeIds: string[],
  format: DebateFormat,
  matchIdx: number
): MatchScore => {
  const rules = getFormatRules(format);
  const criteria = rules.scoringCriteria;

  const judgeScores: JudgeScore[] = judgeIds.map((judgeId, jIdx) => {
    const proPlayerScores: Record<string, PlayerScore> = {};
    const conPlayerScores: Record<string, PlayerScore> = {};

    proTeam.players.forEach((p) => {
      const criteriaScores: Record<string, number> = {};
      criteria.forEach((c) => {
        criteriaScores[c.id] = Math.floor(Math.random() * (c.maxScore - 10)) + (c.maxScore - 25);
      });
      const total = criteria.reduce((sum, c) => sum + criteriaScores[c.id] * c.weight, 0);
      proPlayerScores[p.id] = { criteriaScores, total };
    });

    conTeam.players.forEach((p) => {
      const criteriaScores: Record<string, number> = {};
      criteria.forEach((c) => {
        criteriaScores[c.id] = Math.floor(Math.random() * (c.maxScore - 10)) + (c.maxScore - 25);
      });
      const total = criteria.reduce((sum, c) => sum + criteriaScores[c.id] * c.weight, 0);
      conPlayerScores[p.id] = { criteriaScores, total };
    });

    const proTeamScore = Math.round(
      Object.values(proPlayerScores).reduce((s, p) => s + p.total, 0) / Math.max(1, proTeam.players.length)
    );
    const conTeamScore = Math.round(
      Object.values(conPlayerScores).reduce((s, p) => s + p.total, 0) / Math.max(1, conTeam.players.length)
    );

    return {
      id: uid(),
      judgeId,
      proTeamScore,
      conTeamScore,
      proPlayerScores,
      conPlayerScores,
      comments: {
        pro: '',
        con: '',
        general: '',
      },
      submittedAt: Date.now(),
    };
  });

  const proTeamTotals = judgeScores.map((js) => js.proTeamScore);
  const conTeamTotals = judgeScores.map((js) => js.conTeamScore);
  const proTeamTotal = Math.round(
    proTeamTotals.reduce((a, b) => a + b, 0) / Math.max(1, proTeamTotals.length)
  );
  const conTeamTotal = Math.round(
    conTeamTotals.reduce((a, b) => a + b, 0) / Math.max(1, conTeamTotals.length)
  );

  const allPlayerIds = new Set<string>();
  proTeam.players.forEach((p) => allPlayerIds.add(p.id));
  conTeam.players.forEach((p) => allPlayerIds.add(p.id));

  const playerScores = Array.from(allPlayerIds).map((playerId) => {
    const scores: number[] = [];
    let mvpVotes = 0;
    judgeScores.forEach((js) => {
      const proScore = js.proPlayerScores[playerId];
      const conScore = js.conPlayerScores[playerId];
      if (proScore) {
        scores.push(proScore.total);
      }
      if (conScore) {
        scores.push(conScore.total);
      }
    });
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const avgScore = totalScore / Math.max(1, scores.length);
    if (Math.random() > 0.7) {
      mvpVotes = 1 + Math.floor(Math.random() * 2);
    }
    return { playerId, totalScore, avgScore, mvpVotes };
  });

  let mvpPlayerId: string | undefined;
  if (playerScores.length > 0) {
    const sorted = [...playerScores].sort((a, b) => b.avgScore - a.avgScore);
    mvpPlayerId = sorted[0].playerId;
  }

  return {
    matchId,
    judgeScores,
    proTeamTotal,
    conTeamTotal,
    playerScores,
    mvpPlayerId,
  };
};

const buildArchivedTeams = (count: number, tournamentIdx: number): ArchivedTeam[] => {
  const teams: ArchivedTeam[] = [];
  for (let i = 0; i < count; i++) {
    const teamIdx = (tournamentIdx * 4 + i) % ARCHIVE_TEAM_NAMES.length;
    const players: ArchivedTeam['players'] = [];
    for (let j = 0; j < 4; j++) {
      const playerIdx = (tournamentIdx * 16 + i * 4 + j) % ARCHIVE_PLAYER_NAMES.length;
      players.push({
        id: `ap_${tournamentIdx}_${i}_${j}`,
        name: ARCHIVE_PLAYER_NAMES[playerIdx],
        role: ['一辩', '二辩', '三辩', '四辩'][j],
        avgScore: 80 + Math.floor(Math.random() * 15),
        totalMatches: 3 + Math.floor(Math.random() * 5),
        mvpCount: Math.floor(Math.random() * 3),
      });
    }
    teams.push({
      id: `at_${tournamentIdx}_${i}`,
      name: ARCHIVE_TEAM_NAMES[teamIdx],
      institution: ARCHIVE_TEAM_NAMES[teamIdx].split(/大学|交大|师大/)[0] + '大学',
      players,
      finalRank: i + 1,
      wins: Math.max(0, count - i - 1 + Math.floor(Math.random() * 2)),
      losses: Math.min(i, count - 1),
      draws: Math.floor(Math.random() * 2),
    });
  }
  return teams;
};

const buildArchivedMatches = (
  teams: ArchivedTeam[],
  tournament: typeof ARCHIVE_TOURNAMENT_DATA[0],
  tournamentIdx: number
): ArchivedMatch[] => {
  const matches: ArchivedMatch[] = [];
  const totalRounds = tournament.totalRounds;
  const baseTime = new Date(tournament.year, 2 + tournamentIdx, 1, 9, 0, 0).getTime();

  if (tournament.type === 'single_elimination') {
    let matchCounter = 0;
    for (let round = 1; round <= totalRounds; round++) {
      const matchCount = Math.max(1, Math.floor(teams.length / Math.pow(2, round)));
      for (let m = 0; m < matchCount; m++) {
        matchCounter++;
        const proIdx = (m * 2) % teams.length;
        const conIdx = (m * 2 + 1) % teams.length;
        const proTeam = teams[proIdx];
        const conTeam = teams[conIdx];
        const topicIdx = matchCounter % ARCHIVE_TOPICS.length;
        const matchId = `am_${tournamentIdx}_${matchCounter}`;

        const judgeIds = Array.from(
          { length: tournament.judgesPerMatch || 3 },
          (_, j) => `aj_${tournamentIdx}_${(matchCounter + j) % ARCHIVE_JUDGE_NAMES.length}`
        );
        const judgeNames = judgeIds.map(
          (_, j) => ARCHIVE_JUDGE_NAMES[(matchCounter + j) % ARCHIVE_JUDGE_NAMES.length]
        );

        const matchScore = buildMatchScore(
          matchId,
          proTeam,
          conTeam,
          judgeIds,
          tournament.format,
          matchCounter
        );

        const winner: Winner =
          matchScore.proTeamTotal > matchScore.conTeamTotal
            ? 'pro'
            : matchScore.conTeamTotal > matchScore.proTeamTotal
            ? 'con'
            : 'draw';

        matches.push({
          id: matchId,
          tournamentId: `arch_${tournamentIdx}`,
          round,
          matchNumber: m + 1,
          proTeamId: proTeam.id,
          conTeamId: conTeam.id,
          proTeamName: proTeam.name,
          conTeamName: conTeam.name,
          proTeamInstitution: proTeam.institution,
          conTeamInstitution: conTeam.institution,
          topicId: `atopic_${topicIdx}`,
          topicTitle: ARCHIVE_TOPICS[topicIdx].title,
          topicProSide: ARCHIVE_TOPICS[topicIdx].pro,
          topicConSide: ARCHIVE_TOPICS[topicIdx].con,
          judgeIds,
          judgeNames,
          status: 'finished',
          winner,
          startedAt: baseTime + (round - 1) * 86400000 + m * 3600000,
          finishedAt: baseTime + (round - 1) * 86400000 + m * 3600000 + 5400000,
          scores: matchScore,
        });
      }
    }
  } else if (tournament.type === 'round_robin') {
    let matchCounter = 0;
    for (let round = 1; round <= totalRounds; round++) {
      const matchesPerRound = Math.floor(teams.length / 2);
      for (let m = 0; m < matchesPerRound; m++) {
        matchCounter++;
        const proIdx = (round + m) % teams.length;
        const conIdx = (round + m + Math.floor(teams.length / 2)) % teams.length;
        const proTeam = teams[proIdx];
        const conTeam = teams[conIdx];
        const topicIdx = matchCounter % ARCHIVE_TOPICS.length;
        const matchId = `am_${tournamentIdx}_${matchCounter}`;

        const judgeIds = Array.from(
          { length: tournament.judgesPerMatch || 3 },
          (_, j) => `aj_${tournamentIdx}_${(matchCounter + j) % ARCHIVE_JUDGE_NAMES.length}`
        );
        const judgeNames = judgeIds.map(
          (_, j) => ARCHIVE_JUDGE_NAMES[(matchCounter + j) % ARCHIVE_JUDGE_NAMES.length]
        );

        const matchScore = buildMatchScore(
          matchId,
          proTeam,
          conTeam,
          judgeIds,
          tournament.format,
          matchCounter
        );

        const winner: Winner =
          matchScore.proTeamTotal > matchScore.conTeamTotal
            ? 'pro'
            : matchScore.conTeamTotal > matchScore.proTeamTotal
            ? 'con'
            : 'draw';

        matches.push({
          id: matchId,
          tournamentId: `arch_${tournamentIdx}`,
          round,
          matchNumber: m + 1,
          proTeamId: proTeam.id,
          conTeamId: conTeam.id,
          proTeamName: proTeam.name,
          conTeamName: conTeam.name,
          proTeamInstitution: proTeam.institution,
          conTeamInstitution: conTeam.institution,
          topicId: `atopic_${topicIdx}`,
          topicTitle: ARCHIVE_TOPICS[topicIdx].title,
          topicProSide: ARCHIVE_TOPICS[topicIdx].pro,
          topicConSide: ARCHIVE_TOPICS[topicIdx].con,
          judgeIds,
          judgeNames,
          status: 'finished',
          winner,
          startedAt: baseTime + (round - 1) * 86400000 * 2 + m * 5400000,
          finishedAt: baseTime + (round - 1) * 86400000 * 2 + m * 5400000 + 5400000,
          scores: matchScore,
        });
      }
    }
  } else {
    let matchCounter = 0;
    for (let round = 1; round <= totalRounds; round++) {
      const matchesPerRound = Math.floor(teams.length / 2);
      for (let m = 0; m < matchesPerRound; m++) {
        matchCounter++;
        const proIdx = (round + m * 2) % teams.length;
        const conIdx = (round + m * 2 + 1) % teams.length;
        const proTeam = teams[proIdx];
        const conTeam = teams[conIdx];
        const topicIdx = matchCounter % ARCHIVE_TOPICS.length;
        const matchId = `am_${tournamentIdx}_${matchCounter}`;

        const judgeIds = Array.from(
          { length: tournament.judgesPerMatch || 3 },
          (_, j) => `aj_${tournamentIdx}_${(matchCounter + j) % ARCHIVE_JUDGE_NAMES.length}`
        );
        const judgeNames = judgeIds.map(
          (_, j) => ARCHIVE_JUDGE_NAMES[(matchCounter + j) % ARCHIVE_JUDGE_NAMES.length]
        );

        const matchScore = buildMatchScore(
          matchId,
          proTeam,
          conTeam,
          judgeIds,
          tournament.format,
          matchCounter
        );

        const winner: Winner =
          matchScore.proTeamTotal > matchScore.conTeamTotal
            ? 'pro'
            : matchScore.conTeamTotal > matchScore.proTeamTotal
            ? 'con'
            : 'draw';

        matches.push({
          id: matchId,
          tournamentId: `arch_${tournamentIdx}`,
          round,
          matchNumber: m + 1,
          proTeamId: proTeam.id,
          conTeamId: conTeam.id,
          proTeamName: proTeam.name,
          conTeamName: conTeam.name,
          proTeamInstitution: proTeam.institution,
          conTeamInstitution: conTeam.institution,
          topicId: `atopic_${topicIdx}`,
          topicTitle: ARCHIVE_TOPICS[topicIdx].title,
          topicProSide: ARCHIVE_TOPICS[topicIdx].pro,
          topicConSide: ARCHIVE_TOPICS[topicIdx].con,
          judgeIds,
          judgeNames,
          status: 'finished',
          winner,
          startedAt: baseTime + (round - 1) * 86400000 * 3 + m * 5400000,
          finishedAt: baseTime + (round - 1) * 86400000 * 3 + m * 5400000 + 5400000,
          scores: matchScore,
        });
      }
    }
  }

  return matches;
};

export const buildArchivedTournaments = (): ArchivedTournament[] => {
  return ARCHIVE_TOURNAMENT_DATA.map((t, i) => {
    const teamCount = t.type === 'single_elimination'
      ? Math.pow(2, t.totalRounds)
      : t.type === 'round_robin'
      ? 8
      : 12;

    const teams = buildArchivedTeams(teamCount, i);
    const matches = buildArchivedMatches(teams, t, i);

    const sortedTeams = [...teams].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.draws - a.draws;
    });

    return {
      id: `arch_${i}`,
      name: t.name,
      format: t.format,
      type: t.type,
      season: t.season,
      year: t.year,
      totalRounds: t.totalRounds,
      totalMatches: matches.length,
      judgesPerMatch: 3,
      startDate: matches[0]?.startedAt ?? Date.now(),
      endDate: matches[matches.length - 1]?.finishedAt ?? Date.now(),
      description: t.description,
      championTeamId: sortedTeams[0]?.id,
      championTeamName: sortedTeams[0]?.name,
      runnerUpTeamId: sortedTeams[1]?.id,
      runnerUpTeamName: sortedTeams[1]?.name,
      teams,
      matches,
    };
  });
};
