import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Search,
  Medal,
  Trophy,
  ChevronRight,
  Filter,
  Users,
  Award,
  GitCompare,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import RankBadge from '@/components/ui/RankBadge';
import Empty from '@/components/ui/Empty';
import { cn } from '@/lib/utils';

export default function PlayersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const store = useDebateStore();
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'avgScore' | 'mvpCount' | 'totalMatches'>('avgScore');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const compareWithParam = searchParams.get('compareWith');

  const playerRankings = store.playerRankings();

  const allPlayers = useMemo(() => {
    const players: {
      playerId: string;
      playerName: string;
      teamId: string;
      teamName: string;
      institution: string;
      role: string;
      totalMatches: number;
      totalScore: number;
      avgScore: number;
      mvpCount: number;
      rank?: number;
    }[] = [];

    store.teams.forEach((team) => {
      team.players.forEach((player) => {
        const ranking = playerRankings.find((r) => r.playerId === player.id);
        players.push({
          playerId: player.id,
          playerName: player.name,
          teamId: team.id,
          teamName: team.name,
          institution: team.institution,
          role: player.role,
          totalMatches: ranking?.totalMatches ?? 0,
          totalScore: ranking?.totalScore ?? 0,
          avgScore: ranking?.avgScore ?? 0,
          mvpCount: ranking?.mvpCount ?? 0,
          rank: ranking?.rank,
        });
      });
    });

    return players;
  }, [store.teams, playerRankings]);

  const filteredPlayers = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    let result = allPlayers;

    if (k) {
      result = result.filter(
        (p) =>
          p.playerName.toLowerCase().includes(k) ||
          p.teamName.toLowerCase().includes(k) ||
          p.institution.toLowerCase().includes(k)
      );
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'avgScore') return b.avgScore - a.avgScore;
      if (sortBy === 'mvpCount') return b.mvpCount - a.mvpCount;
      if (sortBy === 'totalMatches') return b.totalMatches - a.totalMatches;
      return 0;
    });

    return result;
  }, [allPlayers, keyword, sortBy]);

  const top3Players = useMemo(() => {
    return [...allPlayers].sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
  }, [allPlayers]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }, []);

  const startCompare = () => {
    if (selectedIds.length === 2) {
      navigate(`/player/compare/${selectedIds[0]}/${selectedIds[1]}`);
    }
  };

  const startCompareWithPreselect = (idA: string, idB: string) => {
    navigate(`/player/compare/${idA}/${idB}`);
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900 flex items-center gap-2">
            <User className="w-7 h-7 text-gold-500" />
            辩手数据中心
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            共 {allPlayers.length} 位辩手，查看个人数据画像
          </p>
        </div>
        <button
          onClick={() => {
            if (compareMode) {
              setSelectedIds([]);
            }
            setCompareMode(!compareMode);
          }}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors',
            compareMode
              ? 'bg-gold-500 text-white hover:bg-gold-600'
              : 'bg-gold-50 text-gold-600 hover:bg-gold-100'
          )}
        >
          <GitCompare className="w-4 h-4" />
          {compareMode ? '退出对比' : '横向对比'}
        </button>
      </div>

      {compareMode && (
        <div className="card p-4 bg-gradient-to-r from-gold-50 to-navy-50 border-gold-200 stagger-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <GitCompare className="w-5 h-5 text-gold-600" />
              <span className="text-sm font-medium text-navy-800">
                对比模式：选择 2 位辩手进行横向对比
              </span>
              <span className="text-sm text-navy-500">
                已选 {selectedIds.length}/2
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="flex items-center gap-1 text-xs text-navy-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                  清除选择
                </button>
              )}
              <button
                onClick={startCompare}
                disabled={selectedIds.length < 2}
                className={cn(
                  'btn-primary text-sm',
                  selectedIds.length < 2 && 'opacity-50 cursor-not-allowed'
                )}
              >
                <GitCompare className="w-4 h-4" />
                开始对比
              </button>
            </div>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-navy-100/60">
              {selectedIds.map((id) => {
                const p = allPlayers.find((x) => x.playerId === id);
                if (!p) return null;
                return (
                  <div key={id} className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-lg">
                    <User className="w-4 h-4 text-navy-400" />
                    <span className="text-sm font-medium text-navy-800">{p.playerName}</span>
                    <button
                      onClick={() => toggleSelect(id)}
                      className="text-navy-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {compareWithParam && !compareMode && (
        <div className="card p-4 bg-gold-50 border-gold-200 stagger-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gold-700">
              已预选一位辩手，再选一位即可开始对比
            </span>
            <button
              onClick={() => {
                setCompareMode(true);
                setSelectedIds([compareWithParam]);
              }}
              className="btn-primary text-sm"
            >
              <GitCompare className="w-4 h-4" />
              进入对比模式
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-fade-in">
        {top3Players.map((player, index) => (
          <div
            key={player.playerId}
            onClick={() => {
              if (compareMode) {
                toggleSelect(player.playerId);
              } else {
                navigate(`/player/${player.playerId}`);
              }
            }}
            className={cn(
              'card p-5 cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 relative',
              index === 0 && 'bg-gradient-to-br from-gold-50 to-gold-100/40 border-gold-200',
              index === 1 && 'bg-gradient-to-br from-navy-50 to-navy-100/30 border-navy-200',
              index === 2 && 'bg-gradient-to-br from-amber-50 to-amber-100/30 border-amber-200',
              compareMode && selectedIds.includes(player.playerId) && 'ring-2 ring-gold-500 ring-offset-2'
            )}
          >
            {compareMode && (
              <div className="absolute top-3 right-3">
                {selectedIds.includes(player.playerId) ? (
                  <CheckSquare className="w-5 h-5 text-gold-600" />
                ) : (
                  <Square className="w-5 h-5 text-navy-300" />
                )}
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center shadow-md',
                    index === 0 && 'bg-gradient-gold',
                    index === 1 && 'bg-gradient-navy',
                    index === 2 && 'bg-gradient-to-br from-amber-400 to-amber-600'
                  )}
                >
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <RankBadge rank={index + 1} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-bold text-navy-900 truncate">
                  {player.playerName}
                </h3>
                <p className="text-xs text-navy-500 truncate">{player.teamName}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm font-bold text-gold-600">
                    {player.avgScore.toFixed(1)}
                    <span className="text-xs font-normal text-navy-500 ml-1">均分</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-navy-500">
                    <Medal className="w-3 h-3 text-gold-500" />
                    {player.mvpCount} MVP
                  </span>
                </div>
              </div>
              {!compareMode && <ChevronRight className="w-5 h-5 text-navy-300 flex-shrink-0" />}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索辩手姓名、队伍、学校..."
            className="input-base pl-10"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-navy-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input-base py-2 px-3 text-sm w-auto"
            >
              <option value="avgScore">按平均分</option>
              <option value="mvpCount">按MVP次数</option>
              <option value="totalMatches">按出场次数</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-fade-in">
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <div
              key={player.playerId}
              onClick={() => {
                if (compareMode) {
                  toggleSelect(player.playerId);
                } else {
                  navigate(`/player/${player.playerId}`);
                }
              }}
              className={cn(
                'card p-5 cursor-pointer hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 group',
                compareMode && selectedIds.includes(player.playerId) && 'ring-2 ring-gold-500 ring-offset-2'
              )}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-navy flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <User className="w-6 h-6 text-gold-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif font-bold text-navy-900 truncate">
                      {player.playerName}
                    </h3>
                    {player.rank && player.rank <= 10 && (
                      <RankBadge rank={player.rank} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge badge-gold text-xs">{player.role}</span>
                    <span className="text-xs text-navy-500 truncate">{player.teamName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-xs text-navy-500">出场</p>
                      <p className="text-sm font-bold text-navy-800">
                        {player.totalMatches}
                      </p>
                    </div>
                    <div className="text-center border-x border-navy-100">
                      <p className="text-xs text-navy-500">MVP</p>
                      <p className="text-sm font-bold text-gold-600">
                        {player.mvpCount}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-navy-500">均分</p>
                      <p className="text-sm font-bold text-emerald-600">
                        {player.avgScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
                {compareMode && (
                  <div className="flex-shrink-0">
                    {selectedIds.includes(player.playerId) ? (
                      <CheckSquare className="w-5 h-5 text-gold-600" />
                    ) : (
                      <Square className="w-5 h-5 text-navy-300 group-hover:text-gold-400 transition-colors" />
                    )}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-navy-100/60 flex items-center justify-between">
                <span className="text-xs text-navy-400 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {player.institution}
                </span>
                {!compareMode && (
                  <ChevronRight className="w-4 h-4 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-0.5 transition-all" />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12">
            <Empty
              icon={<Users className="h-10 w-10 text-navy-300" />}
              title={keyword ? '未找到匹配的辩手' : '暂无辩手数据'}
              description={keyword ? '试试其他关键词' : '添加队伍后将显示辩手信息'}
            />
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-gold-500" />
          <h3 className="font-serif text-lg font-semibold text-navy-900">数据统计</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-navy-50/60 rounded-xl">
            <p className="text-3xl font-bold text-navy-900 font-serif">
              {allPlayers.length}
            </p>
            <p className="text-xs text-navy-500 mt-1">辩手总数</p>
          </div>
          <div className="text-center p-4 bg-gold-50/60 rounded-xl">
            <p className="text-3xl font-bold text-gold-700 font-serif">
              {allPlayers.filter((p) => p.mvpCount > 0).length}
            </p>
            <p className="text-xs text-navy-500 mt-1">获得过MVP</p>
          </div>
          <div className="text-center p-4 bg-emerald-50/60 rounded-xl">
            <p className="text-3xl font-bold text-emerald-700 font-serif">
              {allPlayers.reduce((sum, p) => sum + p.totalMatches, 0)}
            </p>
            <p className="text-xs text-navy-500 mt-1">总出场次数</p>
          </div>
          <div className="text-center p-4 bg-amber-50/60 rounded-xl">
            <p className="text-3xl font-bold text-amber-700 font-serif">
              {allPlayers.reduce((sum, p) => sum + p.mvpCount, 0)}
            </p>
            <p className="text-xs text-navy-500 mt-1">MVP总数</p>
          </div>
        </div>
      </div>
    </div>
  );
}
