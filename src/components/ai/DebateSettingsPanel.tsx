import { useState } from 'react';
import { Swords, Sparkles, Brain, Zap, Shield, Target, ChevronRight } from 'lucide-react';
import { AIDebateSettings, AIDebateMode, AIDifficulty, AISide } from '@/types';
import { useDebateStore } from '@/store/debateStore';
import { cn } from '@/lib/utils';

interface DebateSettingsPanelProps {
  onStart: (settings: AIDebateSettings) => void;
}

const MODES: { value: AIDebateMode; label: string; description: string; icon: typeof Swords }[] = [
  { value: 'practice', label: '练习模式', description: '边练边学，附带提示和讲解', icon: Sparkles },
  { value: 'challenge', label: '挑战模式', description: '正式对决，考验你的辩论实力', icon: Swords },
  { value: 'casual', label: '休闲模式', description: '轻松交流，随意探讨观点', icon: Zap },
];

const DIFFICULTIES: { value: AIDifficulty; label: string; description: string; stars: number }[] = [
  { value: 'easy', label: '入门级', description: '适合新手，论点简单直接', stars: 1 },
  { value: 'medium', label: '进阶级', description: '有一定深度，需要思考应对', stars: 2 },
  { value: 'hard', label: '高级', description: '逻辑严密，论证体系完整', stars: 3 },
  { value: 'expert', label: '专家级', description: '学理深厚，堪比专业辩手', stars: 4 },
];

const SIDES: { value: AISide; label: string; description: string; color: string }[] = [
  { value: 'pro', label: '正方', description: '支持辩题立场', color: 'emerald' },
  { value: 'con', label: '反方', description: '反对辩题立场', color: 'red' },
];

const THINK_TIMES = [
  { value: 30, label: '30秒' },
  { value: 60, label: '1分钟' },
  { value: 120, label: '2分钟' },
  { value: 180, label: '3分钟' },
];

export default function DebateSettingsPanel({ onStart }: DebateSettingsPanelProps) {
  const topics = useDebateStore((s) => s.topics);
  const [mode, setMode] = useState<AIDebateMode>('practice');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [userSide, setUserSide] = useState<AISide>('pro');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || '');
  const [thinkTime, setThinkTime] = useState(60);
  const [customTopic, setCustomTopic] = useState('');
  const [useCustomTopic, setUseCustomTopic] = useState(false);

  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  const handleStart = () => {
    const topic = useCustomTopic
      ? customTopic.trim()
      : selectedTopic?.title || '';

    if (!topic) return;

    const settings: AIDebateSettings = {
      topic,
      mode,
      userSide,
      difficulty,
      thinkTimeSeconds: thinkTime,
    };

    onStart(settings);
  };

  const canStart = useCustomTopic ? customTopic.trim().length > 0 : !!selectedTopicId;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-100 to-gold-50 text-gold-700 text-sm font-medium">
          <Brain className="w-4 h-4" />
          AI 辩论对手
        </div>
        <h1 className="font-serif text-3xl font-bold text-navy-900">
          选择你的对战配置
        </h1>
        <p className="text-navy-500">
          设定辩题、立场和难度，开始与 AI 进行一场精彩的辩论
        </p>
      </div>

      <div className="space-y-6">
        <div className="card p-6 space-y-4">
          <h3 className="font-serif text-lg font-semibold text-navy-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-gold-500" />
            选择辩题
          </h3>

          <div className="flex gap-2">
            <button
              onClick={() => setUseCustomTopic(false)}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
                !useCustomTopic
                  ? 'bg-gradient-navy text-white shadow-card'
                  : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
              )}
            >
              从题库选择
            </button>
            <button
              onClick={() => setUseCustomTopic(true)}
              className={cn(
                'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
                useCustomTopic
                  ? 'bg-gradient-navy text-white shadow-card'
                  : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
              )}
            >
              自定义辩题
            </button>
          </div>

          {!useCustomTopic ? (
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="input-base"
            >
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.title}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="请输入你想辩论的辩题..."
              className="input-base"
            />
          )}

          {!useCustomTopic && selectedTopic && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="text-emerald-700 font-medium mb-1">正方立场</div>
                <div className="text-emerald-600 text-sm">{selectedTopic.proSide}</div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="text-red-700 font-medium mb-1">反方立场</div>
                <div className="text-red-600 text-sm">{selectedTopic.conSide}</div>
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="font-serif text-lg font-semibold text-navy-900 flex items-center gap-2">
            <Swords className="w-5 h-5 text-gold-500" />
            对战模式
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {MODES.map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    isActive
                      ? 'border-gold-400 bg-gold-50 shadow-md'
                      : 'border-navy-100 bg-white hover:border-navy-200 hover:bg-navy-50'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6 mb-2',
                      isActive ? 'text-gold-500' : 'text-navy-400'
                    )}
                  />
                  <div
                    className={cn(
                      'font-semibold text-sm',
                      isActive ? 'text-navy-900' : 'text-navy-700'
                    )}
                  >
                    {m.label}
                  </div>
                  <div
                    className={cn(
                      'text-xs mt-1',
                      isActive ? 'text-navy-600' : 'text-navy-400'
                    )}
                  >
                    {m.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="font-serif text-lg font-semibold text-navy-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold-500" />
            你的立场
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {SIDES.map((s) => {
              const isActive = userSide === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setUserSide(s.value)}
                  className={cn(
                    'p-5 rounded-xl border-2 transition-all text-center',
                    isActive && s.color === 'emerald' && 'border-emerald-400 bg-emerald-50 shadow-md',
                    isActive && s.color === 'red' && 'border-red-400 bg-red-50 shadow-md',
                    !isActive && 'border-navy-100 bg-white hover:border-navy-200 hover:bg-navy-50'
                  )}
                >
                  <div
                    className={cn(
                      'font-serif text-xl font-bold mb-1',
                      isActive && s.color === 'emerald' && 'text-emerald-700',
                      isActive && s.color === 'red' && 'text-red-700',
                      !isActive && 'text-navy-700'
                    )}
                  >
                    {s.label}
                  </div>
                  <div
                    className={cn(
                      'text-sm',
                      isActive && s.color === 'emerald' && 'text-emerald-600',
                      isActive && s.color === 'red' && 'text-red-600',
                      !isActive && 'text-navy-400'
                    )}
                  >
                    {s.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="font-serif text-lg font-semibold text-navy-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-500" />
            AI 难度
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {DIFFICULTIES.map((d) => {
              const isActive = difficulty === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-center',
                    isActive
                      ? 'border-gold-400 bg-gold-50 shadow-md'
                      : 'border-navy-100 bg-white hover:border-navy-200 hover:bg-navy-50'
                  )}
                >
                  <div className="flex justify-center gap-0.5 mb-2">
                    {Array.from({ length: d.stars }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          'text-lg',
                          isActive ? 'text-gold-400' : 'text-navy-300'
                        )}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div
                    className={cn(
                      'font-semibold text-sm',
                      isActive ? 'text-navy-900' : 'text-navy-700'
                    )}
                  >
                    {d.label}
                  </div>
                  <div
                    className={cn(
                      'text-xs mt-1 leading-tight',
                      isActive ? 'text-navy-600' : 'text-navy-400'
                    )}
                  >
                    {d.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="font-serif text-lg font-semibold text-navy-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold-500" />
            思考时间
          </h3>
          <div className="flex gap-2">
            {THINK_TIMES.map((t) => {
              const isActive = thinkTime === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setThinkTime(t.value)}
                  className={cn(
                    'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-gradient-navy text-white shadow-card'
                      : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-navy-400">
            每次发言的倒计时时间，超时将自动发送当前输入
          </p>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!canStart}
        className="w-full btn-gold py-4 text-base font-semibold"
      >
        开始辩论
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
