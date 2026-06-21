import { useState } from 'react';
import { ChevronDown, Clock, User, Users, Gavel, ArrowDown, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FlowNode } from '@/data/rulesHandbook';

const SIDE_COLORS = {
  pro: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-500', label: '正方' },
  con: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-700', dot: 'bg-rose-500', label: '反方' },
  both: { bg: 'bg-navy-50', border: 'border-navy-300', text: 'text-navy-700', dot: 'bg-navy-500', label: '双方' },
  judge: { bg: 'bg-gold-50', border: 'border-gold-300', text: 'text-gold-700', dot: 'bg-gold-500', label: '法官' },
};

const SIDE_ICON = {
  pro: User,
  con: User,
  both: Users,
  judge: Gavel,
};

interface FlowNodeCardProps {
  node: FlowNode;
  isActive: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  scale: number;
}

function FlowNodeCard({ node, isActive, isHovered, onClick, onHover, scale }: FlowNodeCardProps) {
  const side = node.side || 'both';
  const colors = SIDE_COLORS[side];
  const Icon = SIDE_ICON[side];

  return (
    <div
      className={cn(
        'relative flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all duration-300',
        colors.bg,
        colors.border,
        isActive && 'ring-4 ring-gold-300 ring-offset-2 shadow-lg scale-105 z-10',
        isHovered && !isActive && 'shadow-md scale-[1.02]',
        !isActive && !isHovered && 'shadow-sm hover:shadow-md',
      )}
      style={{ transform: `scale(${scale}) ${isActive ? ' scale(1.05)' : ''}` }}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
          isActive ? 'bg-gradient-navy shadow-md' : 'bg-white ring-2 ' + colors.border,
        )}
      >
        <Icon className={cn('w-5 h-5', isActive ? 'text-gold-200' : colors.text)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn('font-semibold text-base', colors.text)}>{node.label}</h4>
          {node.duration && (
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              'bg-white/80 ring-1',
              colors.border,
              colors.text,
            )}>
              <Clock className="w-3 h-3" />
              {node.duration}
            </span>
          )}
        </div>
        {node.description && (
          <p className={cn('text-sm leading-relaxed', isActive ? colors.text : 'text-navy-600')}>
            {node.description}
          </p>
        )}
      </div>

      <span className={cn(
        'flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-bold',
        isActive ? 'bg-gradient-navy text-white' : 'bg-white/90 ring-1 ' + colors.border + ' ' + colors.text,
      )}>
        {colors.label}
      </span>
    </div>
  );
}

interface TimelineFlowProps {
  nodes: FlowNode[];
  formatName: string;
}

export default function TimelineFlow({ nodes, formatName }: TimelineFlowProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [showLegend, setShowLegend] = useState(true);

  const activeIndex = nodes.findIndex((n) => n.id === activeNodeId);

  const zoomIn = () => setScale((s) => Math.min(s + 0.1, 1.5));
  const zoomOut = () => setScale((s) => Math.max(s - 0.1, 0.7));
  const reset = () => {
    setScale(1);
    setActiveNodeId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-navy-900">{formatName} · 比赛流程图</h3>
          <p className="text-sm text-navy-500 mt-1">点击节点可查看详情，鼠标悬停可预览</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-navy-200 text-navy-600 hover:bg-navy-50 transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-navy-700 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-navy-200 text-navy-600 hover:bg-navy-50 transition-colors"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={reset}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-navy-200 text-navy-600 hover:bg-navy-50 transition-colors"
            title="重置"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        onClick={() => setShowLegend(!showLegend)}
        className="flex items-center gap-2 text-sm font-medium text-navy-600 hover:text-navy-900 transition-colors"
      >
        <span>图例说明</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', showLegend && 'rotate-180')} />
      </button>

      {showLegend && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
          {(Object.keys(SIDE_COLORS) as Array<keyof typeof SIDE_COLORS>).map((side) => {
            const c = SIDE_COLORS[side];
            return (
              <div key={side} className={cn('flex items-center gap-2 p-3 rounded-lg border', c.bg, c.border)}>
                <span className={cn('w-3 h-3 rounded-full', c.dot)} />
                <span className={cn('text-sm font-medium', c.text)}>{c.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {activeNodeId && (
        <div className="rounded-xl bg-gradient-to-br from-gold-50 to-ivory-50 border border-gold-200 p-5 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-serif text-lg font-bold text-navy-900 mb-2">
                第 {activeIndex + 1} 环节：{nodes.find((n) => n.id === activeNodeId)?.label}
              </h4>
              <p className="text-sm text-navy-600 leading-relaxed">
                {nodes.find((n) => n.id === activeNodeId)?.description || '暂无详细说明'}
              </p>
              {nodes.find((n) => n.id === activeNodeId)?.duration && (
                <p className="text-sm text-gold-700 mt-2 font-medium">
                  时长：{nodes.find((n) => n.id === activeNodeId)?.duration}
                </p>
              )}
            </div>
            <button
              onClick={() => setActiveNodeId(null)}
              className="text-navy-400 hover:text-navy-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="relative space-y-3 py-4 overflow-x-auto">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-navy-200 via-navy-300 to-navy-200" style={{ display: 'none' }} />

        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const isActive = node.id === activeNodeId;
          const isHovered = node.id === hoveredNodeId;

          return (
            <div key={node.id} className="relative animate-fade-up" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                    isActive
                      ? 'bg-gradient-navy text-gold-200 border-gold-400 shadow-lg scale-110'
                      : 'bg-white text-navy-600 border-navy-300',
                  )}>
                    {index + 1}
                  </div>
                  {!isLast && (
                    <div className="flex-1 flex flex-col items-center py-1">
                      <ArrowDown className={cn('w-4 h-4', isActive ? 'text-gold-400' : 'text-navy-300')} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <FlowNodeCard
                    node={node}
                    isActive={isActive}
                    isHovered={isHovered}
                    onClick={() => setActiveNodeId(activeNodeId === node.id ? null : node.id)}
                    onHover={(h) => setHoveredNodeId(h ? node.id : null)}
                    scale={1}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-navy-50 p-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-navy-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-navy-800">比赛总环节</p>
            <p className="text-xs text-navy-500">共 {nodes.length} 个环节</p>
          </div>
        </div>
      </div>
    </div>
  );
}
