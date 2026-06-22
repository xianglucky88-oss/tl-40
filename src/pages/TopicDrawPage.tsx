import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Shuffle,
  History,
  Trash2,
  Star,
  ChevronDown,
  Trophy,
  Sparkles,
  Clock,
  RotateCcw,
  X,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import { cn } from '@/lib/utils';
import type { Topic, TopicCategory, DebateFormat } from '@/types';
import { FORMAT_RULES } from '@/engines/formatRules';
import { CATEGORY_CONFIGS } from '@/engines/topicClassificationEngine';

const CATEGORIES: TopicCategory[] = ['政策', '价值', '事实', '模拟法庭'];
const FORMAT_LIST: DebateFormat[] = ['parliamentary', 'mandarin', 'moot_court', 'british_parliamentary'];

interface DrawHistoryItem {
  id: string;
  topic: Topic;
  timestamp: number;
  drawNumber: number;
}

const CATEGORY_COLORS: Record<TopicCategory, string> = {
  政策: 'bg-navy-50 text-navy-700 ring-navy-600/20',
  价值: 'bg-gold-50 text-gold-700 ring-gold-600/30',
  事实: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  模拟法庭: 'bg-red-50 text-red-700 ring-red-600/20',
};

export default function TopicDrawPage() {
  const { topics } = useDebateStore();
  const [catFilter, setCatFilter] = useState<TopicCategory | ''>('');
  const [fmtFilter, setFmtFilter] = useState<DebateFormat | ''>('');
  const [diffFilter, setDiffFilter] = useState<number | ''>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<Topic | null>(null);
  const [finalTopic, setFinalTopic] = useState<Topic | null>(null);
  const [history, setHistory] = useState<DrawHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [drawCount, setDrawCount] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      if (catFilter && !t.category.includes(catFilter)) return false;
      if (fmtFilter && !t.formats.includes(fmtFilter)) return false;
      if (diffFilter !== '' && t.difficulty !== diffFilter) return false;
      return true;
    });
  }, [topics, catFilter, fmtFilter, diffFilter]);

  const randomTopic = useCallback(() => {
    if (filteredTopics.length === 0) return null;
    const idx = Math.floor(Math.random() * filteredTopics.length);
    return filteredTopics[idx];
  }, [filteredTopics]);

  const startDraw = useCallback(() => {
    if (filteredTopics.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setFinalTopic(null);
    startTimeRef.current = Date.now();

    const DRAW_DURATION = 2500;
    const INITIAL_INTERVAL = 60;
    const FINAL_INTERVAL = 250;

    let lastSwitch = 0;
    let currentInterval = INITIAL_INTERVAL;

    const animate = (timestamp: number) => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / DRAW_DURATION, 1);

      currentInterval = INITIAL_INTERVAL + (FINAL_INTERVAL - INITIAL_INTERVAL) * easeOutCubic(progress);

      if (timestamp - lastSwitch >= currentInterval) {
        setCurrentDisplay(randomTopic());
        lastSwitch = timestamp;
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        const result = randomTopic();
        setFinalTopic(result);
        setCurrentDisplay(result);
        setIsDrawing(false);
        setDrawCount((c) => c + 1);

        if (result) {
          const newItem: DrawHistoryItem = {
            id: `draw_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            topic: result,
            timestamp: Date.now(),
            drawNumber: drawCount + 1,
          };
          setHistory((prev) => [newItem, ...prev].slice(0, 50));
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [filteredTopics, isDrawing, randomTopic, drawCount]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const clearHistory = () => {
    setHistory([]);
    setDrawCount(0);
    setFinalTopic(null);
    setCurrentDisplay(null);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-gold text-white shadow-card">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-navy-900">辩题抽签</h2>
            <p className="text-sm text-navy-500">模拟真实赛事抽签仪式</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn('btn-secondary', showHistory && 'ring-2 ring-navy-400')}
          >
            <History className="h-4 w-4" />
            历史记录
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="card p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-navy-600">分类：</span>
                <button
                  onClick={() => setCatFilter('')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-all',
                    catFilter === ''
                      ? 'bg-gradient-navy text-white shadow-card'
                      : 'bg-white text-navy-600 ring-1 ring-navy-200 hover:bg-navy-50',
                  )}
                >
                  全部
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatFilter(catFilter === cat ? '' : cat)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-all',
                      catFilter === cat
                        ? 'bg-gradient-navy text-white shadow-card'
                        : 'bg-white text-navy-600 ring-1 ring-navy-200 hover:bg-navy-50',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-navy-600">赛制：</span>
                <select
                  value={fmtFilter}
                  onChange={(e) => setFmtFilter(e.target.value as DebateFormat | '')}
                  className="rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs text-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                >
                  <option value="">全部赛制</option>
                  {FORMAT_LIST.map((f) => (
                    <option key={f} value={f}>
                      {FORMAT_RULES[f].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-navy-600">难度：</span>
                <button
                  onClick={() => setDiffFilter('')}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-all',
                    diffFilter === ''
                      ? 'bg-gradient-navy text-white shadow-card'
                      : 'bg-white text-navy-600 ring-1 ring-navy-200 hover:bg-navy-50',
                  )}
                >
                  全部
                </button>
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiffFilter(diffFilter === d ? '' : d)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-all',
                      diffFilter === d
                        ? 'bg-gradient-navy text-white shadow-card'
                        : 'bg-white text-navy-600 ring-1 ring-navy-200 hover:bg-navy-50',
                    )}
                  >
                    ★{d}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 text-xs text-navy-400">
              符合条件的辩题：<span className="font-semibold text-navy-600">{filteredTopics.length}</span> 道
            </div>
          </div>

          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border-2 transition-all duration-500',
              isDrawing
                ? 'border-gold-400 shadow-[0_0_40px_rgba(251,191,36,0.3)]'
                : finalTopic
                  ? 'border-gold-300 shadow-[0_0_30px_rgba(251,191,36,0.2)]'
                  : 'border-navy-200',
            )}
          >
            <div
              className={cn(
                'relative bg-gradient-to-br from-ivory-50 via-white to-ivory-100 p-8',
                'min-h-[280px] flex flex-col items-center justify-center',
              )}
            >
              {isDrawing && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent animate-shimmer" />
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent animate-shimmer" style={{ animationDelay: '0.5s' }} />
                  <Sparkles className="absolute top-6 right-8 h-6 w-6 text-gold-400 animate-pulse-slow" />
                  <Sparkles className="absolute bottom-8 left-10 h-5 w-5 text-gold-300 animate-pulse-slow" style={{ animationDelay: '0.3s' }} />
                </div>
              )}

              {!currentDisplay && !isDrawing && (
                <div className="text-center space-y-3">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-navy-50 ring-1 ring-navy-200">
                    <Shuffle className="h-8 w-8 text-navy-400" />
                  </div>
                  <p className="text-navy-500 text-sm">点击下方按钮开始抽签</p>
                </div>
              )}

              {(currentDisplay || isDrawing) && (
                <div
                  className={cn(
                    'w-full max-w-xl text-center space-y-4 transition-all duration-200',
                    isDrawing && 'animate-card-pulse',
                  )}
                >
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {currentDisplay?.category.map((c) => (
                      <span
                        key={c}
                        className={cn(
                          'badge ring-1',
                          CATEGORY_COLORS[c],
                        )}
                      >
                        {c}
                      </span>
                    ))}
                    <span className="badge bg-navy-50 text-navy-600 ring-1 ring-navy-200/50 text-[11px]">
                      难度 ★{currentDisplay?.difficulty}
                    </span>
                  </div>

                  <h3
                    className={cn(
                      'font-serif text-2xl font-bold leading-relaxed transition-all',
                      finalTopic ? 'text-navy-900' : 'text-navy-700',
                      isDrawing && 'blur-[1px]',
                    )}
                  >
                    {currentDisplay?.title}
                  </h3>

                  {finalTopic && (
                    <div className="space-y-2.5 rounded-xl bg-gradient-to-br from-ivory-50 to-ivory-100 p-4 ring-1 ring-navy-100/50 animate-fade-up">
                      <div className="flex gap-2 text-sm text-left">
                        <span className="shrink-0 font-medium text-navy-600">正方：</span>
                        <span className="text-navy-800">{currentDisplay?.proSide}</span>
                      </div>
                      <div className="flex gap-2 text-sm text-left">
                        <span className="shrink-0 font-medium text-navy-600">反方：</span>
                        <span className="text-navy-800">{currentDisplay?.conSide}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {finalTopic && !isDrawing && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 animate-scale-in">
                  <Sparkles className="h-4 w-4 text-gold-500" />
                  <span className="text-sm font-semibold text-gold-600">抽签结果</span>
                </div>
              )}
            </div>

            <div className="border-t border-navy-100 bg-white/60 px-6 py-4">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={startDraw}
                  disabled={isDrawing || filteredTopics.length === 0}
                  className={cn(
                    'btn-gold text-base px-8 py-3',
                    isDrawing && 'opacity-80',
                  )}
                >
                  {isDrawing ? (
                    <>
                      <Shuffle className="h-5 w-5 animate-spin" />
                      抽签中...
                    </>
                  ) : finalTopic ? (
                    <>
                      <RotateCcw className="h-5 w-5" />
                      重新抽签
                    </>
                  ) : (
                    <>
                      <Shuffle className="h-5 w-5" />
                      开始抽签
                    </>
                  )}
                </button>

                {finalTopic && !isDrawing && (
                  <button
                    onClick={() => {
                      setFinalTopic(null);
                      setCurrentDisplay(null);
                    }}
                    className="btn-secondary"
                  >
                    <X className="h-4 w-4" />
                    清空
                  </button>
                )}
              </div>

              {history.length > 0 && !isDrawing && (
                <div className="mt-3 text-center text-xs text-navy-400">
                  本轮累计抽签 <span className="font-semibold text-navy-600">{drawCount}</span> 次
                </div>
              )}
            </div>
          </div>

          {filteredTopics.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-navy-500">没有符合筛选条件的辩题，请调整筛选条件</p>
            </div>
          )}
        </div>

        {showHistory && (
          <div className="card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-navy-500" />
                <h3 className="font-serif text-base font-semibold text-navy-900">抽签历史</h3>
                <span className="text-xs text-navy-400">{history.length}</span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1 text-xs text-navy-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  清空
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scroll-thin">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-10 w-10 text-navy-200 mb-3" />
                  <p className="text-sm text-navy-400">暂无抽签记录</p>
                  <p className="text-xs text-navy-300 mt-1">开始抽签后记录将显示在这里</p>
                </div>
              ) : (
                <div className="divide-y divide-navy-50">
                  {history.map((item, index) => (
                    <div
                      key={item.id}
                      className={cn(
                        'px-5 py-3.5 transition-all cursor-pointer',
                        index === 0 && 'bg-gold-50/50',
                        'hover:bg-navy-50/50',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                            index === 0
                              ? 'bg-gradient-gold text-white shadow-sm'
                              : 'bg-navy-100 text-navy-500',
                          )}
                        >
                          {index === 0 ? <Star className="h-3 w-3" /> : item.drawNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-800 line-clamp-2 leading-snug">
                            {item.topic.title}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            {item.topic.category.slice(0, 2).map((c) => (
                              <span
                                key={c}
                                className={cn(
                                  'badge ring-1 text-[10px]',
                                  CATEGORY_COLORS[c],
                                )}
                              >
                                {c}
                              </span>
                            ))}
                            <span className="text-[10px] text-navy-400">
                              {formatTime(item.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
