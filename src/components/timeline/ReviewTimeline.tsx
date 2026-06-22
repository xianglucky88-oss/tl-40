import { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  Clock,
  User,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ReviewTimelineEvent,
  TimelineEventType,
  DebateStageConfig,
} from '@/types';
import { EVENT_TYPE_CONFIG } from './timelineEventConfig';

const SIDE_COLORS = {
  pro: { label: '正方', badge: 'bg-emerald-100 text-emerald-700' },
  con: { label: '反方', badge: 'bg-red-100 text-red-700' },
  both: { label: '双方', badge: 'bg-purple-100 text-purple-700' },
  judge: { label: '评委', badge: 'bg-navy-100 text-navy-700' },
};

interface ReviewTimelineProps {
  events: ReviewTimelineEvent[];
  stages?: DebateStageConfig[];
  onAddEvent?: (stageIndex?: number) => void;
  onEditEvent?: (event: ReviewTimelineEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  readOnly?: boolean;
}

function formatEventTime(timestamp: number, baseTime?: number): string {
  if (baseTime == null) {
    const d = new Date(timestamp);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  }
  const diff = Math.floor((timestamp - baseTime) / 1000);
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function ImportanceStars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3 h-3',
            i < level ? 'text-gold-500 fill-gold-400' : 'text-navy-200'
          )}
        />
      ))}
    </div>
  );
}

export default function ReviewTimeline({
  events,
  stages,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  readOnly = false,
}: ReviewTimelineProps) {
  const [filterTypes, setFilterTypes] = useState<Set<TimelineEventType>>(new Set());
  const [filterSide, setFilterSide] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const baseTime = useMemo(() => {
    if (events.length === 0) return undefined;
    return Math.min(...events.map((e) => e.timestamp));
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterTypes.size > 0 && !filterTypes.has(e.type)) return false;
      if (filterSide && e.side !== filterSide) return false;
      return true;
    });
  }, [events, filterTypes, filterSide]);

  const toggleFilterType = (type: TimelineEventType) => {
    setFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setFilterTypes(new Set());
    setFilterSide(null);
  };

  const eventsByStage = useMemo(() => {
    const map = new Map<number, ReviewTimelineEvent[]>();
    filteredEvents.forEach((e) => {
      const list = map.get(e.stageIndex) ?? [];
      list.push(e);
      map.set(e.stageIndex, list);
    });
    return map;
  }, [filteredEvents]);

  const hasFilters = filterTypes.size > 0 || filterSide !== null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!readOnly && onAddEvent && (
            <button
              onClick={() => onAddEvent()}
              className="btn-gold text-sm"
            >
              <Plus className="w-4 h-4" />
              标注事件
            </button>
          )}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'btn-secondary text-sm',
              hasFilters && 'ring-2 ring-gold-400/50 border-gold-400'
            )}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-gold-400 text-white">
                {filterTypes.size + (filterSide ? 1 : 0)}
              </span>
            )}
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-navy-500 hover:text-navy-700 inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              清除筛选
            </button>
          )}
        </div>
        <div className="text-sm text-navy-500">
          共 {filteredEvents.length} / {events.length} 个事件
        </div>
      </div>

      {showFilter && (
        <div className="card p-4 space-y-4 animate-fade-in">
          <div>
            <div className="text-sm font-medium text-navy-700 mb-2">按类型筛选</div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EVENT_TYPE_CONFIG) as TimelineEventType[]).map((type) => {
                const cfg = EVENT_TYPE_CONFIG[type];
                const Icon = cfg.icon;
                const active = filterTypes.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleFilterType(type)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      active
                        ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} ring-2 ring-offset-1 ring-${cfg.dotColor.replace('bg-', '')}/30`
                        : 'bg-white text-navy-500 border-navy-200 hover:border-navy-300 hover:text-navy-700'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-navy-700 mb-2">按持方筛选</div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SIDE_COLORS) as Array<keyof typeof SIDE_COLORS>).map((side) => {
                const sc = SIDE_COLORS[side];
                const active = filterSide === side;
                return (
                  <button
                    key={side}
                    onClick={() => setFilterSide(active ? null : side)}
                    className={cn(
                      'inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      active
                        ? `${sc.badge} border-current ring-2 ring-offset-1 ring-current/30`
                        : 'bg-white text-navy-500 border-navy-200 hover:border-navy-300 hover:text-navy-700'
                    )}
                  >
                    {sc.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="card p-12 text-center">
          <Clock className="w-12 h-12 text-navy-200 mx-auto mb-3" />
          <h4 className="font-serif text-lg font-bold text-navy-700 mb-1">
            {events.length === 0 ? '暂无时间轴事件' : '没有符合筛选条件的事件'}
          </h4>
          <p className="text-sm text-navy-500">
            {events.length === 0
              ? '点击"标注事件"开始记录比赛关键节点'
              : '尝试调整筛选条件'}
          </p>
        </div>
      ) : (
        <div className="relative pl-8 space-y-2">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-400 via-navy-200 to-transparent" />

          {stages && stages.length > 0 ? (
            stages.map((stage, stageIdx) => {
              const stageEvents = eventsByStage.get(stageIdx) ?? [];
              const sideLabel =
                stage.side === 'pro' ? '正方' :
                stage.side === 'con' ? '反方' :
                stage.side === 'judge' ? '评委' : '双方';
              return (
                <div key={stage.id} className="space-y-3">
                  <div className="relative -ml-8">
                    <div className="absolute left-[3px] top-2.5 w-[17px] h-[17px] rounded-full border-2 border-white shadow-sm bg-gradient-navy z-10" />
                    <div className="ml-10 py-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold text-navy-800">
                          {stage.name}
                        </span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          stage.side === 'pro' ? 'bg-emerald-100 text-emerald-700' :
                          stage.side === 'con' ? 'bg-red-100 text-red-700' :
                          stage.side === 'judge' ? 'bg-navy-100 text-navy-700' :
                          'bg-purple-100 text-purple-700'
                        )}>
                          {sideLabel}
                        </span>
                        <span className="text-xs text-navy-400 font-mono">
                          {Math.floor(stage.duration / 60)}分{stage.duration % 60 > 0 ? `${stage.duration % 60}秒` : '钟'}
                        </span>
                        {!readOnly && onAddEvent && (
                          <button
                            onClick={() => onAddEvent(stageIdx)}
                            className="ml-2 text-xs text-gold-600 hover:text-gold-700 inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-gold-50 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            在此环节标注
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {stageEvents.map((event, idx) => {
                    const cfg = EVENT_TYPE_CONFIG[event.type];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={event.id}
                        className="relative animate-fade-up"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className={cn(
                          'absolute left-[3px] top-4 w-[17px] h-[17px] rounded-full border-2 border-white shadow-sm z-10',
                          cfg.dotColor
                        )} />
                        <div className={cn(
                          'ml-8 card p-4 transition-all hover:shadow-card-hover',
                          cfg.bgColor,
                          cfg.borderColor,
                          'border'
                        )}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                  cfg.bgColor,
                                  cfg.color,
                                  cfg.borderColor,
                                  'border'
                                )}>
                                  <Icon className="w-3 h-3" />
                                  {cfg.label}
                                </span>
                                {event.side && SIDE_COLORS[event.side] && (
                                  <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full font-medium',
                                    SIDE_COLORS[event.side].badge
                                  )}>
                                    {SIDE_COLORS[event.side].label}
                                  </span>
                                )}
                                <span className="text-xs text-navy-400 font-mono inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatEventTime(event.timestamp, baseTime)}
                                </span>
                                <ImportanceStars level={event.importance} />
                              </div>
                              <h4 className="font-serif font-bold text-navy-900 mb-1.5">
                                {event.title}
                              </h4>
                              <p className="text-sm text-navy-600 leading-relaxed whitespace-pre-wrap">
                                {event.description}
                              </p>
                              {event.speaker && (
                                <div className="mt-2 inline-flex items-center gap-1 text-xs text-navy-500">
                                  <User className="w-3 h-3" />
                                  {event.speaker}
                                </div>
                              )}
                              {event.tags.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                  {event.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-[11px] px-2 py-0.5 rounded-md bg-white/60 text-navy-600 ring-1 ring-navy-200"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {!readOnly && (
                              <div className="flex-shrink-0 flex items-center gap-1">
                                {onEditEvent && (
                                  <button
                                    onClick={() => onEditEvent(event)}
                                    className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-white/60 transition-colors"
                                    title="编辑"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                )}
                                {onDeleteEvent && (
                                  <button
                                    onClick={() => onDeleteEvent(event.id)}
                                    className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="删除"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            filteredEvents.map((event, idx) => {
              const cfg = EVENT_TYPE_CONFIG[event.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={event.id}
                  className="relative animate-fade-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={cn(
                    'absolute left-[3px] top-4 w-[17px] h-[17px] rounded-full border-2 border-white shadow-sm z-10',
                    cfg.dotColor
                  )} />
                  <div className={cn(
                    'ml-8 card p-4 transition-all hover:shadow-card-hover',
                    cfg.bgColor,
                    cfg.borderColor,
                    'border'
                  )}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            cfg.bgColor,
                            cfg.color,
                            cfg.borderColor,
                            'border'
                          )}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          {event.side && SIDE_COLORS[event.side] && (
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              SIDE_COLORS[event.side].badge
                            )}>
                              {SIDE_COLORS[event.side].label}
                            </span>
                          )}
                          <span className="text-xs text-navy-400 font-mono inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatEventTime(event.timestamp, baseTime)}
                          </span>
                          <ImportanceStars level={event.importance} />
                        </div>
                        <h4 className="font-serif font-bold text-navy-900 mb-1.5">
                          {event.title}
                        </h4>
                        <p className="text-sm text-navy-600 leading-relaxed whitespace-pre-wrap">
                          {event.description}
                        </p>
                        {event.speaker && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-navy-500">
                            <User className="w-3 h-3" />
                            {event.speaker}
                          </div>
                        )}
                        {event.tags.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {event.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-white/60 text-navy-600 ring-1 ring-navy-200"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {!readOnly && (
                        <div className="flex-shrink-0 flex items-center gap-1">
                          {onEditEvent && (
                            <button
                              onClick={() => onEditEvent(event)}
                              className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-white/60 transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteEvent && (
                            <button
                              onClick={() => onDeleteEvent(event.id)}
                              className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
