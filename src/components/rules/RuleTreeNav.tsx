import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, FolderOpen, Folder, GitBranch, Award, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RuleSection } from '@/data/rulesHandbook';

interface TreeNodeProps {
  section: RuleSection;
  level: number;
  activeId: string;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  searchKeyword?: string;
}

function TreeNode({ section, level, activeId, onSelect, expandedIds, onToggleExpand, searchKeyword }: TreeNodeProps) {
  const hasChildren = section.children && section.children.length > 0;
  const isExpanded = expandedIds.has(section.id);
  const isActive = activeId === section.id;

  const containsKeyword = (s: RuleSection, kw: string): boolean => {
    if (!kw) return false;
    const low = kw.toLowerCase();
    if (s.title.toLowerCase().includes(low)) return true;
    if (s.content.some((c) => c.toLowerCase().includes(low))) return true;
    if (s.children && s.children.some((c) => containsKeyword(c, kw))) return true;
    return false;
  };

  const highlighted = containsKeyword(section, searchKeyword || '');

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-all text-sm',
          isActive
            ? 'bg-gradient-navy text-white shadow-sm'
            : highlighted
            ? 'bg-gold-50 text-navy-900 font-medium'
            : 'text-navy-700 hover:bg-navy-50',
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          onSelect(section.id);
          if (hasChildren) onToggleExpand(section.id);
        }}
      >
        {hasChildren ? (
          <button
            className="shrink-0 p-0.5 rounded hover:bg-navy-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(section.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className={cn('w-3.5 h-3.5', isActive ? 'text-white' : 'text-navy-500')} />
            ) : (
              <ChevronRight className={cn('w-3.5 h-3.5', isActive ? 'text-white' : 'text-navy-500')} />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className={cn('w-4 h-4 shrink-0', isActive ? 'text-gold-200' : 'text-gold-500')} />
          ) : (
            <Folder className={cn('w-4 h-4 shrink-0', isActive ? 'text-gold-200' : 'text-gold-500')} />
          )
        ) : (
          <FileText className={cn('w-4 h-4 shrink-0', isActive ? 'text-gold-200' : 'text-navy-400')} />
        )}
        <span className="truncate flex-1">{section.title}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className="animate-fade-in">
          {section.children!.map((child) => (
            <TreeNode
              key={child.id}
              section={child}
              level={level + 1}
              activeId={activeId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              searchKeyword={searchKeyword}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface RuleTreeNavProps {
  sections: RuleSection[];
  activeId: string;
  onSelect: (id: string) => void;
  searchKeyword?: string;
  onScoringClick?: () => void;
  onFlowClick?: () => void;
  onTipsClick?: () => void;
  scoringActive?: boolean;
  flowActive?: boolean;
  tipsActive?: boolean;
}

export default function RuleTreeNav({
  sections,
  activeId,
  onSelect,
  searchKeyword,
  onScoringClick,
  onFlowClick,
  onTipsClick,
  scoringActive,
  flowActive,
  tipsActive,
}: RuleTreeNavProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    sections.forEach((s) => initial.add(s.id));
    return initial;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {sections.map((section) => (
        <TreeNode
          key={section.id}
          section={section}
          level={0}
          activeId={activeId}
          onSelect={onSelect}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpand}
          searchKeyword={searchKeyword}
        />
      ))}

      <div className="pt-3 mt-3 border-t border-navy-100 space-y-1">
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all text-sm',
            flowActive ? 'bg-gradient-navy text-white shadow-sm' : 'text-navy-700 hover:bg-navy-50',
          )}
          onClick={onFlowClick}
        >
          <GitBranch className={cn('w-4 h-4 shrink-0', flowActive ? 'text-gold-200' : 'text-navy-500')} />
          <span className="flex-1">比赛流程图</span>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all text-sm',
            scoringActive ? 'bg-gradient-navy text-white shadow-sm' : 'text-navy-700 hover:bg-navy-50',
          )}
          onClick={onScoringClick}
        >
          <Award className={cn('w-4 h-4 shrink-0', scoringActive ? 'text-gold-200' : 'text-navy-500')} />
          <span className="flex-1">评分标准</span>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all text-sm',
            tipsActive ? 'bg-gradient-navy text-white shadow-sm' : 'text-navy-700 hover:bg-navy-50',
          )}
          onClick={onTipsClick}
        >
          <Lightbulb className={cn('w-4 h-4 shrink-0', tipsActive ? 'text-gold-200' : 'text-navy-500')} />
          <span className="flex-1">技巧与误区</span>
        </div>
      </div>
    </div>
  );
}
