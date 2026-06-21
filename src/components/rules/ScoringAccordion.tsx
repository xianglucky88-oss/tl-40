import { useState } from 'react';
import { ChevronDown, ChevronUp, Award, CheckCircle2, Star, Target, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScoringSection, ScoringSubItem } from '@/data/rulesHandbook';

interface SubItemCardProps {
  subItem: ScoringSubItem;
  index: number;
  searchKeyword?: string;
}

function SubItemCard({ subItem, index, searchKeyword }: SubItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const kw = searchKeyword?.toLowerCase() || '';
  const highlighted =
    kw &&
    (subItem.name.toLowerCase().includes(kw) ||
      subItem.description.toLowerCase().includes(kw) ||
      subItem.keyPoints.some((k) => k.toLowerCase().includes(kw)));

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-300 overflow-hidden',
        highlighted
          ? 'border-gold-300 bg-gold-50/50 ring-2 ring-gold-200'
          : 'border-navy-100 bg-white hover:border-navy-200',
      )}
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-navy-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-600">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className={cn('font-semibold text-sm text-navy-900', highlighted && 'text-gold-700')}>
            {subItem.name}
          </h5>
          <p className="text-xs text-navy-500 mt-0.5 truncate">{subItem.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full ring-1 ring-gold-200">
            {subItem.maxScore}分
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-navy-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-navy-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-0 animate-fade-in">
          <div className="ml-10 pl-3 border-l-2 border-navy-100 space-y-2">
            <p className="text-sm text-navy-700 leading-relaxed">{subItem.description}</p>
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-medium text-navy-600 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                评分要点
              </p>
              <ul className="space-y-1">
                {subItem.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-navy-600 leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SectionAccordionProps {
  section: ScoringSection;
  index: number;
  defaultExpanded?: boolean;
  searchKeyword?: string;
}

function SectionAccordion({ section, index, defaultExpanded = false, searchKeyword }: SectionAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const kw = searchKeyword?.toLowerCase() || '';
  const highlighted =
    kw &&
    (section.name.toLowerCase().includes(kw) ||
      section.description.toLowerCase().includes(kw) ||
      section.subItems.some(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          s.description.toLowerCase().includes(kw) ||
          s.keyPoints.some((k) => k.toLowerCase().includes(kw)),
      ));

  const totalWeight = section.weight * 100;

  return (
    <div
      className={cn(
        'rounded-xl border-2 transition-all duration-300 overflow-hidden',
        highlighted
          ? 'border-gold-300 bg-gradient-to-br from-gold-50/80 to-ivory-50'
          : 'border-navy-200 bg-white',
        index === 0 ? '' : 'mt-4',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-4 p-4 cursor-pointer transition-colors',
          !highlighted && 'hover:bg-navy-50/50',
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
            highlighted ? 'bg-gradient-navy' : 'bg-gradient-to-br from-navy-500 to-navy-700',
          )}
        >
          <BarChart3 className="w-6 h-6 text-gold-200" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className={cn('font-serif text-lg font-bold', highlighted ? 'text-gold-800' : 'text-navy-900')}>
              {section.name}
            </h4>
            <span className="text-xs text-navy-500 bg-navy-100 px-2 py-0.5 rounded-full">
              第 {index + 1} 大项
            </span>
          </div>
          <p className="text-sm text-navy-600">{section.description}</p>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-gold-500 fill-gold-400" />
            <span className="font-bold text-navy-900">{section.maxScore}</span>
            <span className="text-xs text-navy-500">分</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-navy-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-400 to-gold-500 rounded-full"
                style={{ width: `${totalWeight}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gold-600">{Math.round(totalWeight)}%</span>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-navy-400 mt-1" />
          ) : (
            <ChevronDown className="w-5 h-5 text-navy-400 mt-1" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-navy-50 to-ivory-50 border border-navy-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-navy-600" />
                <span className="text-sm font-medium text-navy-800">评分占比详情</span>
              </div>
              <div className="text-sm text-navy-600">
                共 <span className="font-bold text-navy-900">{section.subItems.length}</span> 个评分细项
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {section.subItems.map((subItem, i) => (
              <SubItemCard key={subItem.id} subItem={subItem} index={i} searchKeyword={searchKeyword} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ScoringAccordionProps {
  sections: ScoringSection[];
  formatName: string;
  searchKeyword?: string;
}

export default function ScoringAccordion({ sections, formatName, searchKeyword }: ScoringAccordionProps) {
  const totalMax = sections.reduce((sum, s) => sum + s.maxScore, 0);
  const totalWeight = sections.reduce((sum, s) => sum + s.weight, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-xl font-bold text-navy-900 mb-1">{formatName} · 评分标准</h3>
        <p className="text-sm text-navy-500">点击各大项可展开查看详细评分细项和评分要点</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-navy-500 mb-1">总分上限</p>
          <p className="text-2xl font-bold text-navy-900">{totalMax}<span className="text-sm font-normal text-navy-500 ml-1">分</span></p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-navy-500 mb-1">评分大项</p>
          <p className="text-2xl font-bold text-navy-900">{sections.length}<span className="text-sm font-normal text-navy-500 ml-1">项</span></p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-navy-500 mb-1">评分细项</p>
          <p className="text-2xl font-bold text-navy-900">
            {sections.reduce((s, sec) => s + sec.subItems.length, 0)}
            <span className="text-sm font-normal text-navy-500 ml-1">项</span>
          </p>
        </div>
      </div>

      <div className="card p-4">
        <p className="text-xs font-medium text-navy-600 mb-2">权重分布</p>
        <div className="flex h-3 rounded-full overflow-hidden bg-navy-100">
          {sections.map((section, i) => (
            <div
              key={section.id}
              className="h-full transition-all hover:opacity-80 cursor-pointer"
              style={{
                width: `${section.weight * 100}%`,
                background: `linear-gradient(90deg, hsl(${45 + i * 20}, 80%, 60%), hsl(${35 + i * 20}, 85%, 50%))`,
              }}
              title={`${section.name}: ${Math.round(section.weight * 100)}%`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {sections.map((section, i) => (
            <div key={section.id} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{
                  background: `linear-gradient(90deg, hsl(${45 + i * 20}, 80%, 60%), hsl(${35 + i * 20}, 85%, 50%))`,
                }}
              />
              <span className="text-xs text-navy-700">
                {section.name} <span className="text-navy-400">({Math.round(section.weight * 100)}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-0">
        {sections.map((section, i) => (
          <SectionAccordion
            key={section.id}
            section={section}
            index={i}
            defaultExpanded={i === 0}
            searchKeyword={searchKeyword}
          />
        ))}
      </div>

      <div className="rounded-xl bg-gradient-to-br from-navy-50 to-ivory-50 border border-navy-100 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-navy-100 flex items-center justify-center">
            <Award className="w-5 h-5 text-navy-600" />
          </div>
          <div className="flex-1">
            <h5 className="font-semibold text-sm text-navy-900 mb-1">评分说明</h5>
            <p className="text-xs text-navy-600 leading-relaxed">
              各项权重总和为 {Math.round(totalWeight * 100)}%。评委将根据每个细项的评分要点进行打分，
              最终得分 = Σ(细项得分 × 对应权重占比)。建议评委在打分时参考评分要点，确保评分客观公正。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
