import { useState } from 'react';
import { useDebateStore } from '@/store/debateStore';
import {
  Shield,
  Plus,
  X,
  AlertCircle,
  Regex,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Users,
  Check,
} from 'lucide-react';

interface DanmakuFilterPanelProps {
  matchId: string;
}

export const DanmakuFilterPanel = ({ matchId }: DanmakuFilterPanelProps) => {
  const getDanmakuFilter = useDebateStore((s) => s.getDanmakuFilter);
  const addBlockedKeyword = useDebateStore((s) => s.addBlockedKeyword);
  const removeBlockedKeyword = useDebateStore((s) => s.removeBlockedKeyword);
  const addRegexPattern = useDebateStore((s) => s.addRegexPattern);
  const removeRegexPattern = useDebateStore((s) => s.removeRegexPattern);
  const toggleFilterSide = useDebateStore((s) => s.toggleFilterSide);
  const setFilterEnabled = useDebateStore((s) => s.setFilterEnabled);

  const filter = getDanmakuFilter(matchId);

  const [keywordInput, setKeywordInput] = useState('');
  const [regexInput, setRegexInput] = useState('');
  const [regexError, setRegexError] = useState<string | null>(null);

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (!trimmed) return;
    addBlockedKeyword(matchId, trimmed);
    setKeywordInput('');
  };

  const handleAddRegex = () => {
    const trimmed = regexInput.trim();
    if (!trimmed) return;
    try {
      new RegExp(trimmed);
    } catch (e: unknown) {
      setRegexError(e instanceof Error ? e.message : '正则表达式无效');
      return;
    }
    setRegexError(null);
    addRegexPattern(matchId, trimmed);
    setRegexInput('');
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleRegexKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRegex();
    }
  };

  const sideConfig = [
    { side: 'pro' as const, label: '正方', icon: ThumbsUp, color: 'emerald' },
    { side: 'con' as const, label: '反方', icon: ThumbsDown, color: 'rose' },
    { side: 'neutral' as const, label: '中立', icon: Users, color: 'navy' },
  ];

  const blockedCount = filter.blockedKeywords.length;
  const regexCount = filter.regexPatterns.length;
  const activeRules = blockedCount + regexCount;

  return (
    <div className="px-4 py-3 border-b border-navy-100 bg-navy-50/30 space-y-4 animate-fade-in-scale">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gold-500" />
          <span className="text-xs font-bold text-navy-800">智能过滤</span>
          {filter.enabled && activeRules > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-100 text-gold-700 font-semibold">
              {activeRules} 条规则生效
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setFilterEnabled(matchId, !filter.enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            filter.enabled ? 'bg-gold-500' : 'bg-navy-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
              filter.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {!filter.enabled && (
        <div className="text-[11px] text-navy-400 py-1">
          开启后可屏蔽关键词、正则匹配及筛选立场弹幕
        </div>
      )}

      {filter.enabled && (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-navy-500" />
              <span className="text-xs font-semibold text-navy-700">关键词屏蔽</span>
              {blockedCount > 0 && (
                <span className="text-[10px] text-navy-400">{blockedCount} 个</span>
              )}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value.slice(0, 30))}
                onKeyDown={handleKeywordKeyDown}
                placeholder="输入关键词，回车添加"
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-navy-200 bg-white focus:outline-none focus:ring-2 focus:ring-gold-300 focus:border-gold-400 placeholder:text-navy-300"
                maxLength={30}
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                disabled={!keywordInput.trim()}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-navy text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {blockedCount > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {filter.blockedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeBlockedKeyword(matchId, kw)}
                      className="hover:text-red-900 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Regex className="w-3.5 h-3.5 text-navy-500" />
              <span className="text-xs font-semibold text-navy-700">正则过滤</span>
              {regexCount > 0 && (
                <span className="text-[10px] text-navy-400">{regexCount} 条</span>
              )}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={regexInput}
                onChange={(e) => {
                  setRegexInput(e.target.value);
                  setRegexError(null);
                }}
                onKeyDown={handleRegexKeyDown}
                placeholder="输入正则表达式，如 ^(666+|牛逼)$"
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-navy-200 bg-white focus:outline-none focus:ring-2 focus:ring-gold-300 focus:border-gold-400 placeholder:text-navy-300 font-mono"
              />
              <button
                type="button"
                onClick={handleAddRegex}
                disabled={!regexInput.trim()}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-navy text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {regexError && (
              <div className="flex items-start gap-1.5 text-[11px] text-red-600 bg-red-50 rounded-md px-2 py-1.5 border border-red-200">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{regexError}</span>
              </div>
            )}
            {regexCount > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {filter.regexPatterns.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 font-mono"
                  >
                    /{p}/
                    <button
                      type="button"
                      onClick={() => removeRegexPattern(matchId, p)}
                      className="hover:text-amber-900 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-navy-500" />
              <span className="text-xs font-semibold text-navy-700">立场筛选</span>
              <span className="text-[10px] text-navy-400">仅显示选中的立场</span>
            </div>
            <div className="flex gap-2">
              {sideConfig.map(({ side, label, icon: Icon, color }) => {
                const isActive = filter.visibleSides.includes(side);
                const colorMap: Record<string, { active: string; inactive: string }> = {
                  emerald: {
                    active: 'bg-emerald-500 text-white ring-2 ring-emerald-200',
                    inactive: 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50',
                  },
                  rose: {
                    active: 'bg-rose-500 text-white ring-2 ring-rose-200',
                    inactive: 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50',
                  },
                  navy: {
                    active: 'bg-navy-700 text-white ring-2 ring-navy-300',
                    inactive: 'bg-white text-navy-600 border border-navy-200 hover:bg-navy-50',
                  },
                };
                return (
                  <button
                    key={side}
                    type="button"
                    onClick={() => toggleFilterSide(matchId, side)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      isActive ? colorMap[color].active : colorMap[color].inactive
                    }`}
                  >
                    {isActive ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DanmakuFilterPanel;
