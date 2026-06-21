import { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Landmark,
  MessageCircle,
  Scale,
  Crown,
  Lightbulb,
  AlertTriangle,
  X,
  Clock,
  FileText,
  GitBranch,
  Award,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import type { DebateFormat } from '@/types';
import { RULES_HANDBOOK, searchHandbook, type RuleSection } from '@/data/rulesHandbook';
import RuleTreeNav from '@/components/rules/RuleTreeNav';
import TimelineFlow from '@/components/rules/TimelineFlow';
import ScoringAccordion from '@/components/rules/ScoringAccordion';
import { cn } from '@/lib/utils';

type ViewMode = 'content' | 'flow' | 'scoring' | 'tips';

const FORMAT_TABS: { format: DebateFormat; label: string; shortName: string; icon: typeof Landmark }[] = [
  { format: 'parliamentary', label: '议会制辩论', shortName: '议会制', icon: Landmark },
  { format: 'mandarin', label: '华语辩论', shortName: '普通话赛', icon: MessageCircle },
  { format: 'moot_court', label: '模拟法庭', shortName: '模拟法庭', icon: Scale },
  { format: 'british_parliamentary', label: '英国议会制', shortName: 'BP赛制', icon: Crown },
];

function findSectionById(sections: RuleSection[], id: string): RuleSection | null {
  for (const s of sections) {
    if (s.id === id) return s;
    if (s.children) {
      const found = findSectionById(s.children, id);
      if (found) return found;
    }
  }
  return null;
}

function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword) return text;
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-gold-200 text-navy-900 rounded px-0.5 font-medium">
        {text.slice(idx, idx + keyword.length)}
      </mark>
      {text.slice(idx + keyword.length)}
    </>
  );
}

export default function RulesHandbookPage() {
  const [activeFormat, setActiveFormat] = useState<DebateFormat>('parliamentary');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('content');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handbookData = RULES_HANDBOOK[activeFormat];

  const searchResults = useMemo(() => {
    if (!searchKeyword.trim()) return [];
    return searchHandbook(searchKeyword).slice(0, 30);
  }, [searchKeyword]);

  const activeSection = useMemo(() => {
    if (viewMode !== 'content') return null;
    if (!activeSectionId) {
      return handbookData.treeContent[0] || null;
    }
    return findSectionById(handbookData.treeContent, activeSectionId);
  }, [activeSectionId, viewMode, handbookData]);

  const handleFormatChange = (format: DebateFormat) => {
    setActiveFormat(format);
    setActiveSectionId('');
    setViewMode('content');
  };

  const handleSelectSection = (id: string) => {
    setActiveSectionId(id);
    setViewMode('content');
    setShowMobileSidebar(false);
  };

  const handleSearchResultClick = (format: DebateFormat, sectionId: string) => {
    setActiveFormat(format);
    setActiveSectionId(sectionId);
    setViewMode('content');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col gap-5 mb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-navy text-white shadow-card">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy-900">辩论规则手册</h2>
              <p className="text-sm text-navy-500">可搜索的交互式赛制规则百科全书</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="md:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-navy-200 text-navy-700 text-sm font-medium hover:bg-navy-50"
              onClick={() => setShowMobileSidebar(true)}
            >
              <FileText className="w-4 h-4" />
              目录
            </button>
          </div>
        </div>

        <div className="card p-4">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索规则、评分标准、技巧关键词..."
              className="input-base pl-10"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700 p-1 rounded-md hover:bg-navy-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 animate-fade-in">
              <p className="text-xs font-medium text-navy-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                搜索到 {searchResults.length} 条相关结果
              </p>
              <div className="max-h-60 overflow-y-auto space-y-1.5 scroll-thin">
                {searchResults.map((result, i) => {
                  const formatInfo = RULES_HANDBOOK[result.format];
                  return (
                    <button
                      key={i}
                      onClick={() => handleSearchResultClick(result.format, result.sectionId)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-navy-50 transition-colors flex items-start gap-3 group"
                    >
                      <span className="flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-md bg-navy-100 text-navy-600">
                        {formatInfo.shortName}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-900 truncate">{result.sectionTitle}</p>
                        <p className="text-xs text-navy-500 truncate mt-0.5">
                          {highlightText(result.matchText, searchKeyword)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {FORMAT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFormat === tab.format;
            return (
              <button
                key={tab.format}
                onClick={() => handleFormatChange(tab.format)}
                className={cn(
                  'flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left',
                  isActive
                    ? 'bg-gradient-navy text-white border-navy-700 shadow-card'
                    : 'bg-white border-navy-100 text-navy-700 hover:border-navy-300 hover:shadow-sm',
                )}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                    isActive ? 'bg-white/10' : 'bg-navy-50',
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive ? 'text-gold-200' : 'text-navy-500')} />
                </div>
                <div className="min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isActive ? 'text-white' : 'text-navy-900')}>
                    {tab.label}
                  </p>
                  <p className={cn('text-xs truncate', isActive ? 'text-gold-200/80' : 'text-navy-500')}>
                    {tab.shortName}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex gap-5 min-h-0">
        <div
          className={cn(
            'fixed inset-0 z-50 bg-black/40 md:hidden transition-opacity',
            showMobileSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
          onClick={() => setShowMobileSidebar(false)}
        />

        <aside
          className={cn(
            'fixed md:static top-0 bottom-0 left-0 z-50 w-[280px] md:w-64 bg-white md:bg-transparent',
            'md:!opacity-100 md:!translate-x-0 transition-transform duration-300',
            showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )}
        >
          <div className="h-full flex flex-col md:card md:p-4 md:sticky md:top-4 md:max-h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between p-4 md:p-0 md:pb-3 border-b border-navy-100 md:border-b">
              <h3 className="font-serif text-lg font-bold text-navy-900">手册目录</h3>
              <button
                className="md:hidden p-1.5 rounded-md hover:bg-navy-50 text-navy-500"
                onClick={() => setShowMobileSidebar(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-0 md:pt-2 scroll-thin">
              <RuleTreeNav
                sections={handbookData.treeContent}
                activeId={viewMode === 'content' ? activeSectionId : ''}
                onSelect={handleSelectSection}
                searchKeyword={searchKeyword}
                onFlowClick={() => {
                  setViewMode('flow');
                  setShowMobileSidebar(false);
                }}
                onScoringClick={() => {
                  setViewMode('scoring');
                  setShowMobileSidebar(false);
                }}
                onTipsClick={() => {
                  setViewMode('tips');
                  setShowMobileSidebar(false);
                }}
                flowActive={viewMode === 'flow'}
                scoringActive={viewMode === 'scoring'}
                tipsActive={viewMode === 'tips'}
              />
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="card p-6 animate-fade-up">
            {viewMode === 'content' && activeSection && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      {handbookData.shortName} · 规则内容
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-navy-900">
                      {activeSection.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="badge bg-navy-50 text-navy-600 ring-1 ring-navy-200/50">
                      {activeSection.content.length} 条规则
                    </span>
                    {activeSection.children && (
                      <span className="badge bg-gold-50 text-gold-600 ring-1 ring-gold-200/50">
                        {activeSection.children.length} 个子章节
                      </span>
                    )}
                  </div>
                </div>

                {activeSection.content.length > 0 && (
                  <div className="space-y-3">
                    {activeSection.content.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-ivory-50 to-white border border-navy-100 animate-fade-up"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-navy text-gold-200 text-sm font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="text-sm text-navy-700 leading-relaxed pt-0.5">
                          {highlightText(item, searchKeyword)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {activeSection.children && activeSection.children.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-semibold text-navy-600 flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4" />
                      子章节
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {activeSection.children.map((child, i) => (
                        <button
                          key={child.id}
                          onClick={() => handleSelectSection(child.id)}
                          className="text-left p-3.5 rounded-xl border border-navy-100 bg-white hover:border-navy-300 hover:bg-navy-50/50 transition-all group animate-fade-up"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <div className="flex items-start gap-2.5">
                            <FileText className="w-4.5 h-4.5 text-navy-400 group-hover:text-navy-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-navy-900 group-hover:text-navy-700">
                                {highlightText(child.title, searchKeyword)}
                              </p>
                              <p className="text-xs text-navy-500 mt-1">
                                {child.content.length} 条规则
                                {child.children && ` · ${child.children.length} 个子章节`}
                              </p>
                            </div>
                            <ArrowLeft className="w-4 h-4 text-navy-300 group-hover:text-navy-500 group-hover:translate-x-0.5 transition-all rotate-180 mt-0.5 flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection.content.length === 0 && !activeSection.children && (
                  <div className="py-12 text-center">
                    <FileText className="w-12 h-12 text-navy-300 mx-auto mb-3" />
                    <p className="text-sm text-navy-500">该章节暂无详细内容</p>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'content' && !activeSection && (
              <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-br from-navy-50 via-ivory-50 to-gold-50 border border-gold-200/50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-navy flex items-center justify-center">
                      <BookOpen className="w-7 h-7 text-gold-200" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-bold text-navy-900 mb-2">
                        {handbookData.label}
                      </h3>
                      <p className="text-sm text-navy-700 leading-relaxed">{handbookData.overview}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-navy-600 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-gold-500" />
                    历史起源
                  </h4>
                  <div className="p-4 rounded-xl bg-white border border-navy-100">
                    <p className="text-sm text-navy-700 leading-relaxed">{handbookData.origins}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setViewMode('flow')}
                    className="p-4 rounded-xl border border-navy-100 bg-white hover:border-navy-300 hover:shadow-sm transition-all text-left group"
                  >
                    <GitBranch className="w-6 h-6 text-navy-500 group-hover:text-navy-700 mb-2" />
                    <p className="text-sm font-semibold text-navy-900">比赛流程图</p>
                    <p className="text-xs text-navy-500 mt-1">
                      共 {handbookData.flowNodes.length} 个环节
                    </p>
                  </button>
                  <button
                    onClick={() => setViewMode('scoring')}
                    className="p-4 rounded-xl border border-navy-100 bg-white hover:border-navy-300 hover:shadow-sm transition-all text-left group"
                  >
                    <Award className="w-6 h-6 text-navy-500 group-hover:text-navy-700 mb-2" />
                    <p className="text-sm font-semibold text-navy-900">评分标准</p>
                    <p className="text-xs text-navy-500 mt-1">
                      {handbookData.scoringSections.length} 大评分维度
                    </p>
                  </button>
                  <button
                    onClick={() => setViewMode('tips')}
                    className="p-4 rounded-xl border border-navy-100 bg-white hover:border-navy-300 hover:shadow-sm transition-all text-left group"
                  >
                    <Lightbulb className="w-6 h-6 text-navy-500 group-hover:text-navy-700 mb-2" />
                    <p className="text-sm font-semibold text-navy-900">技巧与误区</p>
                    <p className="text-xs text-navy-500 mt-1">
                      {handbookData.tips.length} 条实用建议
                    </p>
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-navy-600 mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    选择左侧目录开始阅读
                  </h4>
                  <div className="space-y-2">
                    {handbookData.treeContent.slice(0, 3).map((section) => (
                      <button
                        key={section.id}
                        onClick={() => handleSelectSection(section.id)}
                        className="w-full p-3.5 rounded-xl border border-navy-100 bg-white hover:border-navy-300 hover:bg-navy-50/50 transition-all text-left group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4.5 h-4.5 text-navy-400 group-hover:text-navy-600" />
                            <p className="text-sm font-semibold text-navy-900">{section.title}</p>
                          </div>
                          <ArrowLeft className="w-4 h-4 text-navy-300 group-hover:text-navy-500 group-hover:translate-x-0.5 transition-all rotate-180" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'flow' && (
              <TimelineFlow nodes={handbookData.flowNodes} formatName={handbookData.shortName} />
            )}

            {viewMode === 'scoring' && (
              <ScoringAccordion
                sections={handbookData.scoringSections}
                formatName={handbookData.shortName}
                searchKeyword={searchKeyword}
              />
            )}

            {viewMode === 'tips' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-xl font-bold text-navy-900 mb-1">
                    {handbookData.shortName} · 技巧与误区
                  </h3>
                  <p className="text-sm text-navy-500">
                    来自资深辩手和评委的实战建议，以及需要避免的常见错误
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h4 className="font-semibold text-emerald-800">实用技巧</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {handbookData.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 animate-fade-up"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-emerald-900 leading-relaxed pt-0.5">
                            {highlightText(tip, searchKeyword)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      </div>
                      <h4 className="font-semibold text-rose-800">常见误区</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {handbookData.commonMistakes.map((mistake, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 animate-fade-up"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-sm text-rose-900 leading-relaxed pt-0.5">
                            {highlightText(mistake, searchKeyword)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
