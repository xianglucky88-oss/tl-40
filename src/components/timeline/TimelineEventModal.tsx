import { useState, useEffect } from 'react';
import { Star, X, Plus } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { EVENT_TYPE_CONFIG } from './timelineEventConfig';
import type {
  ReviewTimelineEvent,
  TimelineEventType,
  DebateStageConfig,
} from '@/types';

interface TimelineEventModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ReviewTimelineEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  matchId: string;
  stages?: DebateStageConfig[];
  initialEvent?: ReviewTimelineEvent | null;
  defaultStageIndex?: number;
}

const SIDE_OPTIONS: Array<{ value: 'pro' | 'con' | 'both' | 'judge'; label: string }> = [
  { value: 'pro', label: '正方' },
  { value: 'con', label: '反方' },
  { value: 'both', label: '双方' },
  { value: 'judge', label: '评委' },
];

export default function TimelineEventModal({
  open,
  onClose,
  onSubmit,
  matchId,
  stages,
  initialEvent,
  defaultStageIndex = 0,
}: TimelineEventModalProps) {
  const [type, setType] = useState<TimelineEventType>('argument');
  const [stageIndex, setStageIndex] = useState<number>(defaultStageIndex);
  const [timestampMinutes, setTimestampMinutes] = useState<number>(0);
  const [timestampSeconds, setTimestampSeconds] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [side, setSide] = useState<'pro' | 'con' | 'both' | 'judge'>('pro');
  const [speaker, setSpeaker] = useState<string>('');
  const [importance, setImportance] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [createdBy, setCreatedBy] = useState<string>('复盘者');

  const isEdit = !!initialEvent;

  useEffect(() => {
    if (!open) return;
    if (initialEvent) {
      setType(initialEvent.type);
      setStageIndex(initialEvent.stageIndex);
      const baseMinutes = Math.floor(initialEvent.timestamp / 60000);
      const baseSeconds = Math.floor((initialEvent.timestamp % 60000) / 1000);
      setTimestampMinutes(baseMinutes);
      setTimestampSeconds(baseSeconds);
      setTitle(initialEvent.title);
      setDescription(initialEvent.description);
      setSide(initialEvent.side ?? 'pro');
      setSpeaker(initialEvent.speaker ?? '');
      setImportance(initialEvent.importance);
      setTags(initialEvent.tags);
      setCreatedBy(initialEvent.createdBy);
    } else {
      setType('argument');
      setStageIndex(defaultStageIndex);
      setTimestampMinutes(0);
      setTimestampSeconds(0);
      setTitle('');
      setDescription('');
      setSide('pro');
      setSpeaker('');
      setImportance(3);
      setTags([]);
      setTagInput('');
      setCreatedBy('复盘者');
    }
  }, [open, initialEvent, defaultStageIndex]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    if (tags.length >= 8) return;
    setTags([...tags, trimmed]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const isValid = title.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    const timestamp = timestampMinutes * 60 * 1000 + timestampSeconds * 1000;
    onSubmit({
      matchId,
      type,
      stageIndex,
      timestamp,
      title: title.trim(),
      description: description.trim(),
      side,
      speaker: speaker.trim() || undefined,
      importance,
      tags,
      createdBy: createdBy.trim() || '复盘者',
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? '编辑关键事件' : '标注关键事件'}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary text-sm">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="btn-gold text-sm"
          >
            {isEdit ? '保存修改' : '添加事件'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="label-base">事件类型</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(EVENT_TYPE_CONFIG) as TimelineEventType[]).map((t) => {
              const cfg = EVENT_TYPE_CONFIG[t];
              const Icon = cfg.icon;
              const active = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-medium transition-all',
                    active
                      ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} ring-2 ring-offset-1 ring-current/30`
                      : 'bg-white text-navy-500 border-navy-200 hover:border-navy-300 hover:text-navy-700'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {stages && stages.length > 0 && (
          <div>
            <label className="label-base">所属环节</label>
            <select
              value={stageIndex}
              onChange={(e) => setStageIndex(Number(e.target.value))}
              className="input-base"
            >
              {stages.map((s, i) => (
                <option key={s.id} value={i}>
                  {i + 1}. {s.name}
                  {s.side === 'pro' ? '（正方）' : s.side === 'con' ? '（反方）' : s.side === 'judge' ? '（评委）' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-base">发生时间（分）</label>
            <input
              type="number"
              min={0}
              max={120}
              value={timestampMinutes}
              onChange={(e) => setTimestampMinutes(Math.max(0, Math.min(120, Number(e.target.value) || 0)))}
              className="input-base"
            />
          </div>
          <div>
            <label className="label-base">发生时间（秒）</label>
            <input
              type="number"
              min={0}
              max={59}
              value={timestampSeconds}
              onChange={(e) => setTimestampSeconds(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
              className="input-base"
            />
          </div>
        </div>

        <div>
          <label className="label-base">持方</label>
          <div className="grid grid-cols-4 gap-2">
            {SIDE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSide(opt.value)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                  side === opt.value
                    ? opt.value === 'pro'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-offset-1 ring-emerald-300/30'
                      : opt.value === 'con'
                      ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-offset-1 ring-red-300/30'
                      : opt.value === 'judge'
                      ? 'bg-navy-50 text-navy-700 border-navy-300 ring-2 ring-offset-1 ring-navy-300/30'
                      : 'bg-purple-50 text-purple-700 border-purple-300 ring-2 ring-offset-1 ring-purple-300/30'
                    : 'bg-white text-navy-500 border-navy-200 hover:border-navy-300 hover:text-navy-700'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label-base">事件标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="简洁描述关键事件，如：正方一辩开篇立论"
            className="input-base"
            maxLength={60}
          />
        </div>

        <div>
          <label className="label-base">详细描述 *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="详细描述事件内容、背景和影响..."
            rows={4}
            className="input-base resize-none"
            maxLength={500}
          />
          <div className="mt-1 text-right text-xs text-navy-400">
            {description.length} / 500
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-base">辩手（可选）</label>
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              placeholder="如：思远"
              className="input-base"
              maxLength={20}
            />
          </div>
          <div>
            <label className="label-base">记录人</label>
            <input
              type="text"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="您的昵称"
              className="input-base"
              maxLength={20}
            />
          </div>
        </div>

        <div>
          <label className="label-base">重要程度</label>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }, (_, i) => {
              const level = (i + 1) as 1 | 2 | 3 | 4 | 5;
              const active = i < importance;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImportance(level)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'w-7 h-7 transition-colors',
                      active ? 'text-gold-500 fill-gold-400' : 'text-navy-200 hover:text-navy-300'
                    )}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-sm text-navy-500">
              {['', '一般', '较重要', '重要', '很重要', '极其重要'][importance]}
            </span>
          </div>
        </div>

        <div>
          <label className="label-base">标签（最多 8 个）</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="输入标签后回车或点击添加"
              className="input-base flex-1"
              maxLength={15}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || tags.length >= 8}
              className="btn-secondary text-sm px-4"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gold-50 text-gold-700 ring-1 ring-gold-300"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-0.5 hover:text-gold-900 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
