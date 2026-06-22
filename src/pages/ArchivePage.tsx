import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  Search,
  Filter,
  Calendar,
  Trophy,
  Swords,
  LayoutGrid,
  List,
  Clock,
  ChevronRight,
  ChevronLeft,
  Users,
  X,
  BarChart3,
  Target,
  Award,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import type {
  DebateFormat,
  TournamentType,
  ArchiveFilter,
  ArchivedTournament,
} from '@/types';

const formatLabels: Record<DebateFormat, string> = {
  parliamentary: '议会制',
  mandarin: '华语制',
  moot_court: '模拟法庭',
  british_parliamentary: '英国议会制',
};

const typeLabels: Record<TournamentType, string> = {
  single_elimination: '单败淘汰',
  round_robin: '循环赛',
  swiss: '瑞士轮',
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
}

interface SeasonGroup {
  year: number;
  season: string;
  label: string;
  tournaments: ArchivedTournament[];
  totalTeams: number;
  totalMatches: number;
  championTeamName?: string;
  latestTournament?: ArchivedTournament;
}

function SeasonCoverCard({
  group,
  isActive,
  onClick,
}: {
  group: SeasonGroup;
  isActive: boolean;
  onClick: () => void;
}) {
  const cover = group.latestTournament?.coverUrl;
  const seasonIcon = group.season === '春季赛' ? '🌸' : group.season === '夏季赛' ? '☀️' : group.season === '秋季赛' ? '🍂' : '❄️';

  return (
    <div
      onClick={onClick}
      className={`relative flex-shrink-0 w-52 cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 ${
        isActive
          ? 'ring-2 ring-gold-400 shadow-card-hover -translate-y-1'
          : 'ring-1 ring-navy-200 hover:ring-gold-300 hover:-translate-y-0.5'
      }`}
    >
      <div className="relative h-32 overflow-hidden">
        {cover ? (
          <img src={cover} alt={group.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-navy flex items-center justify-center">
            <span className="text-4xl">{seasonIcon}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-navy-900/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="text-white font-serif font-bold text-sm leading-tight">{group.label}</div>
          <div className="text-white/70 text-[10px] mt-0.5">
            {group.tournaments.length} 项赛事
          </div>
        </div>
      </div>
      <div className="p-3 bg-white">
        <div className="grid grid-cols-3 gap-1 text-center">
          <div>
            <div className="text-xs font-bold text-navy-800">{group.totalTeams}</div>
            <div className="text-[9px] text-navy-400">队伍</div>
          </div>
          <div>
            <div className="text-xs font-bold text-navy-800">{group.totalMatches}</div>
            <div className="text-[9px] text-navy-400">场次</div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-gold-600 truncate" title={group.championTeamName}>
              {group.championTeamName ?? '-'}
            </div>
            <div className="text-[9px] text-navy-400">冠军</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeasonDataOverview({ group }: { group: SeasonGroup }) {
  const avgMatchesPerRound = group.tournaments.length > 0
    ? Math.round(group.totalMatches / group.tournaments.reduce((s, t) => s + t.totalRounds, 0) * 10) / 10
    : 0;
  const uniqueFormats = new Set(group.tournaments.map((t) => t.format));
  const uniqueTypes = new Set(group.tournaments.map((t) => t.type));

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-gold-500" />
        <h3 className="font-serif text-base font-bold text-navy-900">
          {group.label} 数据概览
        </h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-xs text-white/70">赛事总数</span>
          </div>
          <div className="text-2xl font-bold">{group.tournaments.length}</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs text-white/70">参赛队伍</span>
          </div>
          <div className="text-2xl font-bold">{group.totalTeams}</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Swords className="w-4 h-4" />
            </div>
            <span className="text-xs text-white/70">比赛场次</span>
          </div>
          <div className="text-2xl font-bold">{group.totalMatches}</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-700 p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-xs text-white/70">场均轮次</span>
          </div>
          <div className="text-2xl font-bold">{avgMatchesPerRound}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs text-navy-500">
          <Award className="w-3.5 h-3.5 text-gold-500" />
          <span>赛制：</span>
          {Array.from(uniqueFormats).map((f) => (
            <span key={f} className="badge-blue text-[10px]">{formatLabels[f]}</span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-navy-500">
          <Swords className="w-3.5 h-3.5 text-emerald-500" />
          <span>类型：</span>
          {Array.from(uniqueTypes).map((t) => (
            <span key={t} className="badge-green text-[10px]">{typeLabels[t]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SeasonTimelineView({
  group,
  onTournamentClick,
}: {
  group: SeasonGroup;
  onTournamentClick: (id: string) => void;
}) {
  const sorted = [...group.tournaments].sort((a, b) => a.startDate - b.startDate);

  return (
    <div className="space-y-4">
      {sorted.map((t, idx) => (
        <div key={t.id} className="relative pl-10">
          <div className="absolute left-0 top-4 w-5 h-5 rounded-full bg-gradient-gold shadow-md border-[3px] border-white z-10" />
          {idx < sorted.length - 1 && (
            <div className="absolute left-[9px] top-9 bottom-0 w-0.5 bg-gradient-to-b from-gold-400 via-navy-200 to-navy-100" />
          )}

          <div
            onClick={() => onTournamentClick(t.id)}
            className="card cursor-pointer overflow-hidden group hover:border-gold-400 transition-all duration-200"
          >
            <div className="flex flex-col md:flex-row">
              {t.coverUrl && (
                <div className="md:w-48 h-32 md:h-auto flex-shrink-0 overflow-hidden">
                  <img
                    src={t.coverUrl}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="flex-1 p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
                  <div className="flex-shrink-0">
                    <div className="text-lg font-bold text-gold-600 font-serif">{t.year}</div>
                    <div className="text-xs text-navy-400">{t.season}</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="badge-blue text-[11px]">{formatLabels[t.format]}</span>
                      <span className="badge-green text-[11px]">{typeLabels[t.type]}</span>
                      <span className="text-[11px] text-navy-400">
                        {t.totalRounds} 轮 · {t.totalMatches} 场
                      </span>
                    </div>
                    <h3 className="font-serif text-base font-bold text-navy-900 line-clamp-1 group-hover:text-gold-600 transition-colors">
                      {t.name}
                    </h3>
                    {t.description && (
                      <p className="text-xs text-navy-500 line-clamp-1 mt-0.5">{t.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-gold-500" />
                      <span className="text-navy-600 font-medium">{t.championTeamName}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TournamentCard({
  tournament,
  onClick,
}: {
  tournament: ArchivedTournament;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer overflow-hidden group hover:border-gold-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      {tournament.coverUrl ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={tournament.coverUrl}
            alt={tournament.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            <span className="badge-gold text-[10px]">{tournament.season}</span>
            <span className="badge-blue text-[10px]">{formatLabels[tournament.format]}</span>
          </div>
        </div>
      ) : (
        <div className="h-24 bg-gradient-navy flex items-center justify-center relative">
          <Trophy className="w-8 h-8 text-white/30" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2">
            <span className="badge-gold text-[10px]">{tournament.season}</span>
            <span className="badge-blue text-[10px]">{formatLabels[tournament.format]}</span>
          </div>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-serif text-base font-bold text-navy-900 mb-2 line-clamp-2 group-hover:text-gold-600 transition-colors">
          {tournament.name}
        </h3>

        {tournament.description && (
          <p className="text-xs text-navy-500 line-clamp-2 mb-3">{tournament.description}</p>
        )}

        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="flex flex-col items-center p-1.5 rounded-lg bg-navy-50">
            <Trophy className="w-3.5 h-3.5 text-gold-500 mb-0.5" />
            <span className="text-navy-400 text-[10px]">冠军</span>
            <span className="font-semibold text-navy-700 truncate w-full text-center text-[10px]">
              {tournament.championTeamName ?? '-'}
            </span>
          </div>
          <div className="flex flex-col items-center p-1.5 rounded-lg bg-navy-50">
            <Users className="w-3.5 h-3.5 text-emerald-500 mb-0.5" />
            <span className="text-navy-400 text-[10px]">队伍</span>
            <span className="font-semibold text-navy-700 text-[10px]">{tournament.teams.length} 支</span>
          </div>
          <div className="flex flex-col items-center p-1.5 rounded-lg bg-navy-50">
            <Swords className="w-3.5 h-3.5 text-red-500 mb-0.5" />
            <span className="text-navy-400 text-[10px]">场次</span>
            <span className="font-semibold text-navy-700 text-[10px]">{tournament.totalMatches} 场</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-navy-400 pt-2 border-t border-navy-100">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(tournament.startDate)}</span>
          </div>
          <span className="inline-flex items-center gap-0.5 text-gold-500 font-medium group-hover:translate-x-0.5 transition-transform">
            详情 <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

function ListItem({
  tournament,
  onClick,
}: {
  tournament: ArchivedTournament;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="card cursor-pointer overflow-hidden group hover:border-gold-400 transition-all duration-200"
    >
      <div className="flex items-center gap-4 p-4">
        {tournament.coverUrl ? (
          <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden">
            <img
              src={tournament.coverUrl}
              alt={tournament.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-sm">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="badge-gold text-[11px]">{tournament.season}</span>
            <span className="badge-blue text-[11px]">{formatLabels[tournament.format]}</span>
            <span className="text-[11px] text-navy-400">{tournament.year}年</span>
          </div>
          <h3 className="font-serif text-base font-bold text-navy-900 line-clamp-1 group-hover:text-gold-600 transition-colors">
            {tournament.name}
          </h3>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-xs flex-shrink-0">
          <div className="text-center">
            <div className="font-bold text-navy-700">{tournament.teams.length}</div>
            <div className="text-navy-400">参赛队</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-navy-700">{tournament.totalMatches}</div>
            <div className="text-navy-400">比赛场</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-navy-700">{tournament.totalRounds}</div>
            <div className="text-navy-400">轮次</div>
          </div>
          <div className="text-center min-w-[100px]">
            <div className="font-bold text-gold-600 truncate">{tournament.championTeamName}</div>
            <div className="text-navy-400">冠军</div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>
    </div>
  );
}

type ViewMode = 'season' | 'grid' | 'list';

export default function ArchivePage() {
  const navigate = useNavigate();
  const archivedTournaments = useDebateStore((s) => s.archivedTournaments);
  const filterArchivedTournaments = useDebateStore((s) => s.filterArchivedTournaments);
  const getArchiveYears = useDebateStore((s) => s.getArchiveYears);
  const getArchiveSeasons = useDebateStore((s) => s.getArchiveSeasons);
  const getArchiveFormats = useDebateStore((s) => s.getArchiveFormats);
  const getArchiveTypes = useDebateStore((s) => s.getArchiveTypes);

  const [filter, setFilter] = useState<ArchiveFilter>({});
  const [viewMode, setViewMode] = useState<ViewMode>('season');
  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeSeasonIdx, setActiveSeasonIdx] = useState(0);

  const years = useMemo(() => getArchiveYears(), [archivedTournaments]);
  const seasons = useMemo(() => getArchiveSeasons(), [archivedTournaments]);
  const formats = useMemo(() => getArchiveFormats(), [archivedTournaments]);
  const types = useMemo(() => getArchiveTypes(), [archivedTournaments]);

  const filteredTournaments = useMemo(() => {
    const f = { ...filter };
    if (searchValue.trim()) {
      f.keyword = searchValue.trim();
    }
    return filterArchivedTournaments(f).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.startDate - a.startDate;
    });
  }, [filter, searchValue, archivedTournaments]);

  const seasonGroups = useMemo(() => {
    const map = new Map<string, ArchivedTournament[]>();
    filteredTournaments.forEach((t) => {
      const key = `${t.year}-${t.season}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });

    const seasonOrder = ['春季赛', '夏季赛', '秋季赛', '冬季赛', '存档'];
    const groups: SeasonGroup[] = [];

    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      const [yearA, seasonA] = a.split('-');
      const [yearB, seasonB] = b.split('-');
      if (yearB !== yearA) return Number(yearB) - Number(yearA);
      return (seasonOrder.indexOf(seasonA) ?? 99) - (seasonOrder.indexOf(seasonB) ?? 99);
    });

    for (const key of sortedKeys) {
      const tournaments = map.get(key)!;
      const [yearStr, season] = key.split('-');
      const year = Number(yearStr);
      const totalTeams = tournaments.reduce((s, t) => s + t.teams.length, 0);
      const totalMatches = tournaments.reduce((s, t) => s + t.totalMatches, 0);
      const latestTournament = tournaments.reduce((a, b) => (a.startDate > b.startDate ? a : b));
      const championTeam = tournaments.find((t) => t.championTeamName)?.championTeamName;

      groups.push({
        year,
        season,
        label: `${year} ${season}`,
        tournaments,
        totalTeams,
        totalMatches,
        championTeamName: championTeam,
        latestTournament,
      });
    }

    return groups;
  }, [filteredTournaments]);

  const activeSeason = seasonGroups[activeSeasonIdx] ?? null;

  const scrollSeasonCards = (dir: 'left' | 'right') => {
    const container = document.getElementById('season-cards-scroll');
    if (container) {
      container.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
    }
  };

  const handleTournamentClick = (id: string) => {
    navigate(`/archive/${id}`);
  };

  const hasActiveFilters =
    filter.year || filter.season || filter.format || filter.type || searchValue;

  const clearFilters = () => {
    setFilter({});
    setSearchValue('');
  };

  return (
    <div className="space-y-6 stagger-fade-in">
      <div className="card-navy p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold-400/10 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gold-400/10 translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-gold shadow-lg">
            <Archive className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-white mb-1">
              赛事历史档案馆
            </h1>
            <p className="text-white/70 text-sm">
              按赛季浏览历届赛事，查看赛季时间轴与关键数据概览
            </p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜索赛事名称、冠军队伍..."
              className="input pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary text-sm ${hasActiveFilters ? 'ring-2 ring-gold-400' : ''}`}
            >
              <Filter className="w-4 h-4" />
              筛选
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-gold-500 text-white text-[10px] flex items-center justify-center">
                  {[filter.year, filter.season, filter.format, filter.type].filter(Boolean).length + (searchValue ? 1 : 0)}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-secondary text-sm">
                <X className="w-4 h-4" />
                清除
              </button>
            )}

            <div className="flex items-center bg-navy-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('season')}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                  viewMode === 'season'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
              >
                <Clock className="w-4 h-4 inline-block mr-1" />
                赛季
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4 inline-block mr-1" />
                网格
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
              >
                <List className="w-4 h-4 inline-block mr-1" />
                列表
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-navy-100 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-navy-600 mb-1.5 block">年份</label>
              <select
                value={filter.year ?? ''}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    year: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="input text-sm"
              >
                <option value="">全部年份</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y} 年</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-navy-600 mb-1.5 block">赛季</label>
              <select
                value={filter.season ?? ''}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    season: e.target.value || undefined,
                  }))
                }
                className="input text-sm"
              >
                <option value="">全部赛季</option>
                {seasons.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-navy-600 mb-1.5 block">赛制</label>
              <select
                value={filter.format ?? ''}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    format: (e.target.value as DebateFormat) || undefined,
                  }))
                }
                className="input text-sm"
              >
                <option value="">全部赛制</option>
                {formats.map((fmt) => (
                  <option key={fmt} value={fmt}>{formatLabels[fmt]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-navy-600 mb-1.5 block">赛事类型</label>
              <select
                value={filter.type ?? ''}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    type: (e.target.value as TournamentType) || undefined,
                  }))
                }
                className="input text-sm"
              >
                <option value="">全部类型</option>
                {types.map((t) => (
                  <option key={t} value={t}>{typeLabels[t]}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-navy-500">
        <span>
          共 <span className="font-semibold text-navy-700">{filteredTournaments.length}</span> 项历史赛事
          {seasonGroups.length > 0 && viewMode === 'season' && (
            <>，<span className="font-semibold text-navy-700">{seasonGroups.length}</span> 个赛季</>
          )}
        </span>
        {hasActiveFilters && (
          <span>筛选结果：{filteredTournaments.length} 项</span>
        )}
      </div>

      {filteredTournaments.length > 0 ? (
        <>
          {viewMode === 'season' && (
            <div className="space-y-6">
              <div className="relative">
                <button
                  onClick={() => scrollSeasonCards('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-card border border-navy-100 flex items-center justify-center text-navy-500 hover:text-gold-500 hover:border-gold-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollSeasonCards('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-card border border-navy-100 flex items-center justify-center text-navy-500 hover:text-gold-500 hover:border-gold-300 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div
                  id="season-cards-scroll"
                  className="flex gap-4 overflow-x-auto scroll-thin px-8 py-2"
                >
                  {seasonGroups.map((g, idx) => (
                    <SeasonCoverCard
                      key={g.label}
                      group={g}
                      isActive={idx === activeSeasonIdx}
                      onClick={() => setActiveSeasonIdx(idx)}
                    />
                  ))}
                </div>
              </div>

              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent" />
                <div className="relative flex items-center gap-3 z-10 bg-ivory-100 px-4">
                  <div className="w-3 h-3 rounded-full bg-gradient-gold shadow-sm" />
                  <span className="text-sm font-serif font-bold text-navy-700">
                    {activeSeason?.label ?? ''}
                  </span>
                  <div className="w-3 h-3 rounded-full bg-gradient-gold shadow-sm" />
                </div>
              </div>

              {activeSeason && (
                <>
                  <SeasonDataOverview group={activeSeason} />
                  <SeasonTimelineView
                    group={activeSeason}
                    onTournamentClick={handleTournamentClick}
                  />
                </>
              )}
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTournaments.map((t) => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  onClick={() => handleTournamentClick(t.id)}
                />
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-3">
              {filteredTournaments.map((t) => (
                <ListItem
                  key={t.id}
                  tournament={t}
                  onClick={() => handleTournamentClick(t.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-navy-50 text-navy-300 mb-4">
            <Archive className="w-10 h-10" />
          </div>
          <h3 className="font-serif text-xl font-bold text-navy-700 mb-2">暂无匹配的历史赛事</h3>
          <p className="text-navy-500 text-sm mb-4">尝试调整筛选条件或搜索关键词</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-gold text-sm">
              清除筛选条件
            </button>
          )}
        </div>
      )}
    </div>
  );
}
