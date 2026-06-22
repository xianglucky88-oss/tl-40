import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Clock,
  MessageSquare,
  Trophy,
  Swords,
  FileText,
  Gavel,
  Plus,
  X,
  Eye,
  Edit2,
  Save,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Target,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebateStore } from '@/store/debateStore';
import { getFormatRules } from '@/engines/formatRules';
import ReviewTimeline from '@/components/timeline/ReviewTimeline';
import { EVENT_TYPE_CONFIG } from '@/components/timeline/timelineEventConfig';
import TimelineEventModal from '@/components/timeline/TimelineEventModal';
import ShareReviewModal from '@/components/timeline/ShareReviewModal';
import type {
  DebateStageConfig,
  ReviewTimelineEvent,
  ReviewShareData,
} from '@/types';

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function MatchReviewPage() {
  const { tournamentId, matchId } = useParams<{ tournamentId: string; matchId: string }>();
  const navigate = useNavigate();

  const getArchivedTournamentById = useDebateStore((s) => s.getArchivedTournamentById);
  const getArchivedMatchById = useDebateStore((s) => s.getArchivedMatchById);
  const getTimelineEventsByMatch = useDebateStore((s) => s.getTimelineEventsByMatch);
  const addTimelineEvent = useDebateStore((s) => s.addTimelineEvent);
  const updateTimelineEvent = useDebateStore((s) => s.updateTimelineEvent);
  const removeTimelineEvent = useDebateStore((s) => s.removeTimelineEvent);
  const getReviewByMatchId = useDebateStore((s) => s.getReviewByMatchId);
  const addMatchReview = useDebateStore((s) => s.addMatchReview);
  const updateMatchReview = useDebateStore((s) => s.updateMatchReview);
  const generateShareLink = useDebateStore((s) => s.generateShareLink);

  const tournament = useMemo(
    () => (tournamentId ? getArchivedTournamentById(tournamentId) : undefined),
    [tournamentId, getArchivedTournamentById]
  );

  const match = useMemo(
    () => (matchId ? getArchivedMatchById(matchId) : undefined),
    [matchId, getArchivedMatchById]
  );

  const events = useMemo(
    () => (matchId ? getTimelineEventsByMatch(matchId) : []),
    [matchId, getTimelineEventsByMatch]
  );

  const existingReview = useMemo(
    () => (matchId ? getReviewByMatchId(matchId) : undefined),
    [matchId, getReviewByMatchId]
  );

  const formatRules = useMemo(() => {
    if (!tournament) return null;
    return getFormatRules(tournament.format);
  }, [tournament]);

  const [activeTab, setActiveTab] = useState<'timeline' | 'summary'>('timeline');
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ReviewTimelineEvent | null>(null);
  const [defaultStageIndex, setDefaultStageIndex] = useState<number>(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<ReviewShareData | null>(null);

  const [editingSummary, setEditingSummary] = useState(false);
  const [overallComment, setOverallComment] = useState(existingReview?.overallComment ?? '');
  const [winnerAnalysis, setWinnerAnalysis] = useState(existingReview?.winnerAnalysis ?? '');
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(existingReview?.keyTakeaways ?? ['', '', '']);
  const [createdBy, setCreatedBy] = useState(existingReview?.createdBy ?? '复盘者');

  const stats = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    let proCount = 0;
    let conCount = 0;
    let totalImportance = 0;
    events.forEach((e) => {
      typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1;
      if (e.side === 'pro') proCount++;
      if (e.side === 'con') conCount++;
      totalImportance += e.importance;
    });
    return {
      typeCounts,
      proCount,
      conCount,
      avgImportance: events.length > 0 ? (totalImportance / events.length).toFixed(1) : '0',
    };
  }, [events]);

  if (!match || !tournament) {
    return (
      <div className="card p-12 text-center">
        <Trophy className="w-16 h-16 text-navy-200 mx-auto mb-4" />
        <h3 className="font-serif text-xl font-bold text-navy-700 mb-2">比赛不存在</h3>
        <p className="text-navy-500 text-sm mb-4">找不到该场比赛记录</p>
        <button
          onClick={() => navigate(tournamentId ? `/archive/${tournamentId}` : '/archive')}
          className="btn-gold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
      </div>
    );
  }

  const handleOpenAddEvent = (stageIndex?: number) => {
    setEditingEvent(null);
    setDefaultStageIndex(stageIndex ?? 0);
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (event: ReviewTimelineEvent) => {
    setEditingEvent(event);
    setDefaultStageIndex(event.stageIndex);
    setEventModalOpen(true);
  };

  const handleSubmitEvent = (data: Omit<ReviewTimelineEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingEvent) {
      updateTimelineEvent(editingEvent.id, data);
    } else {
      addTimelineEvent(data);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('确定要删除该事件吗？')) {
      removeTimelineEvent(eventId);
    }
  };

  const handleOpenShare = () => {
    if (!existingReview) {
      // 先自动创建一个基础复盘
      const newReview = addMatchReview({
        matchId: match.id,
        tournamentId: tournament.id,
        matchTitle: `第${match.round}轮 #${match.matchNumber} ${match.topicTitle}`,
        proTeamName: match.proTeamName,
        conTeamName: match.conTeamName,
        topicTitle: match.topicTitle,
        overallComment: overallComment || '暂无整体评价',
        winnerAnalysis: winnerAnalysis || '暂无胜负分析',
        keyTakeaways: keyTakeaways.filter(Boolean),
        createdBy: createdBy || '复盘者',
        isPublic: true,
      });
      const sd = generateShareLink(newReview.id);
      setShareData(sd);
    } else {
      // 如果编辑了，先保存
      if (editingSummary) {
        handleSaveSummary();
      }
      const sd = generateShareLink(existingReview.id);
      setShareData(sd);
    }
    setShareModalOpen(true);
  };

  const handleSaveSummary = () => {
    const validTakeaways = keyTakeaways.filter(Boolean);
    if (existingReview) {
      updateMatchReview(existingReview.id, {
        overallComment,
        winnerAnalysis,
        keyTakeaways: validTakeaways,
        createdBy,
      });
    } else {
      addMatchReview({
        matchId: match.id,
        tournamentId: tournament.id,
        matchTitle: `第${match.round}轮 #${match.matchNumber} ${match.topicTitle}`,
        proTeamName: match.proTeamName,
        conTeamName: match.conTeamName,
        topicTitle: match.topicTitle,
        overallComment,
        winnerAnalysis,
        keyTakeaways: validTakeaways,
        createdBy,
        isPublic: true,
      });
    }
    setEditingSummary(false);
  };

  const handleUpdateTakeaway = (idx: number, value: string) => {
    const next = [...keyTakeaways];
    next[idx] = value;
    setKeyTakeaways(next);
  };

  const handleAddTakeaway = () => {
    if (keyTakeaways.length < 8) {
      setKeyTakeaways([...keyTakeaways, '']);
    }
  };

  const handleRemoveTakeaway = (idx: number) => {
    if (keyTakeaways.length > 1) {
      setKeyTakeaways(keyTakeaways.filter((_, i) => i !== idx));
    }
  };

  const proScore = match.scores?.proTeamTotal ?? 0;
  const conScore = match.scores?.conTeamTotal ?? 0;

  return (
    <div className="space-y-6 stagger-fade-in">
      <button
        onClick={() => navigate(`/archive/${tournamentId}/match/${matchId}`)}
        className="inline-flex items-center gap-1.5 text-navy-500 hover:text-navy-700 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回比赛详情
      </button>

      <div className="card-navy p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold-400/10 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-gold-400/10 translate-y-1/2 -translate-x-1/4" />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="badge-gold">第{match.round}轮</span>
              <span className="badge bg-white/10 text-white/80 ring-1 ring-white/20">
                #{match.matchNumber}
              </span>
              <span className="badge-green">
                <Trophy className="w-3 h-3" />
                复盘模式
              </span>
            </div>
            <button onClick={handleOpenShare} className="btn-gold text-sm">
              <Share2 className="w-4 h-4" />
              分享复盘
            </button>
          </div>

          <div className="flex items-start gap-3 mb-6">
            <MessageSquare className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
            <h1 className="font-serif text-xl md:text-2xl font-bold text-white leading-snug">
              {match.topicTitle}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-6 md:gap-12">
            <div className="text-center">
              <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                正方 PRO
              </div>
              <div className="font-serif text-lg md:text-xl font-bold text-white mb-1">
                {match.proTeamName}
              </div>
              <div className="text-3xl md:text-4xl font-bold text-emerald-300 font-serif mt-2">
                {proScore}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[11px] font-semibold text-red-300 uppercase tracking-wider mb-2">
                反方 CON
              </div>
              <div className="font-serif text-lg md:text-xl font-bold text-white mb-1">
                {match.conTeamName}
              </div>
              <div className="text-3xl md:text-4xl font-bold text-red-300 font-serif mt-2">
                {conScore}
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative z-10 mx-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-gold flex items-center justify-center shadow-xl">
                <Swords className="w-7 h-7 md:w-9 md:h-9 text-white" />
              </div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>

          {match.winner && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-400/20 ring-1 ring-gold-400/40">
                <Trophy className="w-5 h-5 text-gold-400" />
                <span className="font-semibold text-gold-200">
                  {match.winner === 'pro' && `正方 ${match.proTeamName} 获胜`}
                  {match.winner === 'con' && `反方 ${match.conTeamName} 获胜`}
                  {match.winner === 'draw' && '平局'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-xs text-navy-400">事件总数</div>
            <div className="font-bold text-navy-800">{events.length} 个</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-navy-400">正方事件</div>
            <div className="font-bold text-emerald-600">{stats.proCount} 个</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <div className="text-xs text-navy-400">反方事件</div>
            <div className="font-bold text-red-600">{stats.conCount} 个</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-navy-400">平均重要度</div>
            <div className="font-bold text-navy-800">{stats.avgImportance} / 5</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Gavel className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <div className="text-xs text-navy-400">比赛时间</div>
            <div className="font-bold text-navy-800 text-xs">{formatTime(match.startedAt)}</div>
          </div>
        </div>
      </div>

      <div className="card p-1">
        <div className="flex items-center bg-navy-50 rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <Clock className="w-4 h-4 inline-block mr-1.5" />
            时间轴
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-1.5" />
            复盘总结
          </button>
        </div>
      </div>

      {activeTab === 'timeline' && (
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-gold-500" />
              比赛时间轴
              {formatRules && (
                <span className="text-sm font-normal text-navy-500">· {formatRules.label}</span>
              )}
            </h3>
            <p className="text-xs text-navy-500">
              标注比赛中的关键节点，帮助复盘和学习
            </p>
          </div>

          {events.length > 0 && (
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {(Object.keys(EVENT_TYPE_CONFIG) as Array<keyof typeof EVENT_TYPE_CONFIG>).map((type) => {
                const cfg = EVENT_TYPE_CONFIG[type];
                const Icon = cfg.icon;
                const count = stats.typeCounts[type] ?? 0;
                return (
                  <div
                    key={type}
                    className={cn(
                      'rounded-lg border p-2.5 flex items-center gap-2',
                      cfg.bgColor,
                      cfg.borderColor
                    )}
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', cfg.color)} />
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-[10px] font-medium truncate', cfg.color)}>
                        {cfg.label}
                      </div>
                      <div className={cn('text-sm font-bold', cfg.color)}>{count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <ReviewTimeline
            events={events}
            stages={formatRules?.stages as DebateStageConfig[]}
            onAddEvent={handleOpenAddEvent}
            onEditEvent={handleOpenEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold-500" />
                复盘总结
              </h3>
              <div className="flex items-center gap-2">
                {editingSummary ? (
                  <>
                    <button
                      onClick={() => setEditingSummary(false)}
                      className="btn-secondary text-sm"
                    >
                      <X className="w-4 h-4" />
                      取消
                    </button>
                    <button onClick={handleSaveSummary} className="btn-gold text-sm">
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingSummary(true)}
                    className="btn-secondary text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </button>
                )}
              </div>
            </div>

            {!editingSummary ? (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-navy-400" />
                    <span className="text-sm font-medium text-navy-700">整体评价</span>
                  </div>
                  <div className="rounded-lg bg-navy-50 p-4">
                    {overallComment ? (
                      <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap">
                        {overallComment}
                      </p>
                    ) : (
                      <p className="text-sm text-navy-400 italic">暂无整体评价，点击"编辑"添加</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-navy-400" />
                    <span className="text-sm font-medium text-navy-700">胜负分析</span>
                  </div>
                  <div className="rounded-lg bg-navy-50 p-4">
                    {winnerAnalysis ? (
                      <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap">
                        {winnerAnalysis}
                      </p>
                    ) : (
                      <p className="text-sm text-navy-400 italic">暂无胜负分析，点击"编辑"添加</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-gold-500" />
                    <span className="text-sm font-medium text-navy-700">关键收获</span>
                  </div>
                  <div className="space-y-2">
                    {keyTakeaways.filter(Boolean).length > 0 ? (
                      keyTakeaways
                        .filter(Boolean)
                        .map((k, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-gold-50/50 border border-gold-200 p-3 flex items-start gap-2"
                          >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-gold text-white text-xs font-bold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <p className="text-sm text-navy-700 leading-relaxed">{k}</p>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-navy-400 italic">
                        暂无关键收获，点击"编辑"添加
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-navy-100 text-xs text-navy-500">
                  记录人：{createdBy || '复盘者'}
                  {existingReview && (
                    <span className="ml-3">
                      最后更新：{new Date(existingReview.updatedAt).toLocaleString('zh-CN')}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="label-base">记录人</label>
                  <input
                    type="text"
                    value={createdBy}
                    onChange={(e) => setCreatedBy(e.target.value)}
                    className="input-base"
                    placeholder="您的称呼"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="label-base">整体评价</label>
                  <textarea
                    value={overallComment}
                    onChange={(e) => setOverallComment(e.target.value)}
                    rows={4}
                    className="input-base resize-none"
                    placeholder="描述整场比赛的整体观感、双方的表现特点..."
                    maxLength={1000}
                  />
                  <div className="mt-1 text-right text-xs text-navy-400">
                    {overallComment.length} / 1000
                  </div>
                </div>
                <div>
                  <label className="label-base">胜负分析</label>
                  <textarea
                    value={winnerAnalysis}
                    onChange={(e) => setWinnerAnalysis(e.target.value)}
                    rows={4}
                    className="input-base resize-none"
                    placeholder="分析胜方获胜的关键因素、败方的不足..."
                    maxLength={1000}
                  />
                  <div className="mt-1 text-right text-xs text-navy-400">
                    {winnerAnalysis.length} / 1000
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label-base mb-0">关键收获（最多 8 条）</label>
                    {keyTakeaways.length < 8 && (
                      <button
                        type="button"
                        onClick={handleAddTakeaway}
                        className="text-xs text-gold-600 hover:text-gold-700 inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        添加一条
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {keyTakeaways.map((k, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-gold text-white text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <input
                          type="text"
                          value={k}
                          onChange={(e) => handleUpdateTakeaway(i, e.target.value)}
                          className="input-base flex-1"
                          placeholder={`输入第 ${i + 1} 条关键收获`}
                          maxLength={200}
                        />
                        {keyTakeaways.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTakeaway(i)}
                            className="p-1.5 rounded-lg text-navy-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-gold-500" />
                导出与分享
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleOpenShare}
                className="flex items-center gap-3 p-4 rounded-xl border border-navy-200 bg-white hover:border-gold-300 hover:bg-gold-50/30 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-navy-800 text-sm">生成分享链接</div>
                  <div className="text-xs text-navy-500">一键分享完整复盘</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {matchId && (
        <TimelineEventModal
          open={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          onSubmit={handleSubmitEvent}
          matchId={matchId}
          stages={formatRules?.stages as DebateStageConfig[]}
          initialEvent={editingEvent}
          defaultStageIndex={defaultStageIndex}
        />
      )}

      <ShareReviewModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareData={shareData}
      />
    </div>
  );
}
