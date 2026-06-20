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
  Gavel,
  Users,
  Award,
  X,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import type {
  DebateFormat,
  TournamentType,
  ArchiveFilter,
  ArchiveViewMode,
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
      className="card cursor-pointer p-5 group hover:border-gold-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge-gold">{tournament.season}</span>
          <span className="badge-blue">{formatLabels[tournament.format]}</span>
        </div>
        <div className="text-xs text-navy-400 font-mono">{tournament.year}</div>
      </div>

      <h3 className="font-serif text-lg font-bold text-navy-900 mb-2 line-clamp-2 group-hover:text-gold-600 transition-colors">
        {tournament.name}
      </h3>

      {tournament.description && (
        <p className="text-sm text-navy-500 line-clamp-2 mb-4">
          {tournament.description}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="flex flex-col items-center p-2 rounded-lg bg-navy-50">
          <Trophy className="w-4 h-4 text-gold-500 mb-1" />
          <span className="text-navy-400">冠军</span>
          <span className="font-semibold text-navy-700 truncate w-full text-center">
            {tournament.championTeamName ?? '-'}
          </span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-navy-50">
          <Users className="w-4 h-4 text-emerald-500 mb-1" />
          <span className="text-navy-400">队伍</span>
          <span className="font-semibold text-navy-700">{tournament.teams.length} 支</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-navy-50">
          <Swords className="w-4 h-4 text-red-500 mb-1" />
          <span className="text-navy-400">场次</span>
          <span className="font-semibold text-navy-700">{tournament.totalMatches} 场</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-navy-400 pt-3 border-t border-navy-100">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-gold-500 font-medium group-hover:translate-x-0.5 transition-transform">
          查看详情
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}

function TimelineItem({
  tournament,
  isFirst,
  isLast,
  onClick,
}: {
  tournament: ArchivedTournament;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative pl-10">
      <div className="absolute left-0 top-4 w-5 h-5 rounded-full bg-gradient-gold shadow-md border-3 border-white z-10" />
      {!isLast && (
        <div className="absolute left-[9px] top-9 bottom-0 w-0.5 bg-gradient-to-b from-gold-400 via-navy-200 to-navy-100" />
      )}

      <div
        onClick={onClick}
        className="card cursor-pointer p-4 mb-4 group hover:border-gold-400 transition-all duration-200"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
          <div className="flex-shrink-0 w-24">
            <div className="text-lg font-bold text-gold-600 font-serif">
              {tournament.year}
            </div>
            <div className="text-xs text-navy-400">{tournament.season}</div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="badge-blue text-[11px]">{formatLabels[tournament.format]}</span>
              <span className="badge-green text-[11px]">{typeLabels[tournament.type]}</span>
              <span className="text-[11px] text-navy-400">
                {tournament.totalRounds} 轮 · {tournament.totalMatches} 场
              </span>
            </div>
            <h3 className="font-serif text-base font-bold text-navy-900 line-clamp-1 group-hover:text-gold-600 transition-colors">
              {tournament.name}
            </h3>
            {tournament.description && (
              <p className="text-xs text-navy-500 line-clamp-1 mt-0.5">
                {tournament.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-gold-500" />
              <span className="text-navy-600 font-medium">{tournament.championTeamName}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all" />
          </div>
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
      className="card cursor-pointer p-4 group hover:border-gold-400 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-sm">
          <Trophy className="w-6 h-6 text-white" />
        </div>

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

export default function ArchivePage() {
  const navigate = useNavigate();
  const archivedTournaments = useDebateStore((s) => s.archivedTournaments);
  const filterArchivedTournaments = useDebateStore((s) => s.filterArchivedTournaments);
  const getArchiveYears = useDebateStore((s) => s.getArchiveYears);
  const getArchiveSeasons = useDebateStore((s) => s.getArchiveSeasons);
  const getArchiveFormats = useDebateStore((s) => s.getArchiveFormats);
  const getArchiveTypes = useDebateStore((s) => s.getArchiveTypes);

  const [filter, setFilter] = useState<ArchiveFilter>({});
  const [viewMode, setViewMode] = useState<ArchiveViewMode>('timeline');
  const [searchValue, setSearchValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
              浏览历届赛事记录，按赛季、年份、赛制筛选，回顾经典对决
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
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
              >
                <Clock className="w-4 h-4 inline-block mr-1" />
                时间轴
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
                  <option key={y} value={y}>
                    {y} 年
                  </option>
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
                  <option key={s} value={s}>
                    {s}
                  </option>
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
                  <option key={fmt} value={fmt}>
                    {formatLabels[fmt]}
                  </option>
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
                  <option key={t} value={t}>
                    {typeLabels[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-navy-500">
        <span>
          共 <span className="font-semibold text-navy-700">{filteredTournaments.length}</span> 项历史赛事
        </span>
        {hasActiveFilters && (
          <span>筛选结果：{filteredTournaments.length} 项</span>
        )}
      </div>

      {filteredTournaments.length > 0 ? (
        <>
          {viewMode === 'timeline' && (
            <div className="card p-6">
              <h2 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-gold-500" />
                时间轴浏览
              </h2>
              <div className="space-y-2">
                {filteredTournaments.map((t, idx) => (
                  <TimelineItem
                    key={t.id}
                    tournament={t}
                    isFirst={idx === 0}
                    isLast={idx === filteredTournaments.length - 1}
                    onClick={() => handleTournamentClick(t.id)}
                  />
                ))}
              </div>
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
          <p className="text-navy-500 text-sm mb-4">
            尝试调整筛选条件或搜索关键词
          </p>
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
