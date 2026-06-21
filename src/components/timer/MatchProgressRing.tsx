import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle2, Play } from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import { getFormatRules } from '@/engines/formatRules';
import {
  getTimeDisplay,
  getStageSideColor,
  goToStage,
} from '@/engines/timerEngine';
import type { DebateStageConfig, DebateFormat } from '@/types';

interface MatchProgressRingProps {
  format?: DebateFormat;
  size?: number;
}

const RING_STROKE = 12;
const GAP_DEGREES = 2;

const getSideFillColor = (side?: string): string => {
  switch (side) {
    case 'pro': return '#059669';
    case 'con': return '#EF4444';
    case 'judge': return '#1e3a5f';
    case 'both': return '#c2874f';
    default: return '#64748b';
  }
};

const getSideLabel = (side?: string): string => {
  switch (side) {
    case 'pro': return '正方';
    case 'con': return '反方';
    case 'judge': return '法官';
    case 'both': return '双方';
    default: return '';
  }
};

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const angleRad = (angleDeg - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
};

const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number): string => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

interface StageArcData {
  stage: DebateStageConfig;
  index: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  status: 'done' | 'active' | 'upcoming';
  color: string;
  path: string;
  hitPath: string;
}

export const MatchProgressRing = ({ format, size = 200 }: MatchProgressRingProps) => {
  const currentTimer = useDebateStore((s) => s.currentTimer);
  const setTimer = useDebateStore((s) => s.setTimer);
  const tournament = useDebateStore((s) => s.tournament);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeFormat = format ?? currentTimer?.format ?? tournament.format;
  const rules = useMemo(() => getFormatRules(activeFormat), [activeFormat]);

  const totalDuration = useMemo(() => {
    return rules.stages.reduce((acc, s) => acc + s.duration, 0);
  }, [rules]);

  const currentStageIndex = currentTimer?.current.stageIndex ?? 0;
  const isRunning = currentTimer?.isRunning ?? false;
  const hasStarted = currentTimer?.hasStarted ?? false;

  const svgSize = size - 24;
  const center = svgSize / 2;
  const radius = (svgSize - RING_STROKE * 2) / 2;
  const hitRadius = radius + RING_STROKE * 0.5;

  const stageArcs = useMemo((): StageArcData[] => {
    const arcs: StageArcData[] = [];
    const stageCount = rules.stages.length;
    const totalGap = GAP_DEGREES * stageCount;
    const availableAngle = 360 - totalGap;

    let currentAngle = 0;
    rules.stages.forEach((stage, index) => {
      const stageAngle = (stage.duration / totalDuration) * availableAngle;
      const startAngle = currentAngle;
      const endAngle = currentAngle + stageAngle;
      const midAngle = (startAngle + endAngle) / 2;

      let status: 'done' | 'active' | 'upcoming';
      if (index < currentStageIndex) {
        status = 'done';
      } else if (index === currentStageIndex) {
        status = 'active';
      } else {
        status = 'upcoming';
      }

      const path = describeArc(center, center, radius, startAngle, endAngle);
      const hitPath = describeArc(center, center, hitRadius, startAngle, endAngle);

      let color: string;
      if (status === 'done') {
        color = getSideFillColor(stage.side);
      } else if (status === 'active') {
        color = getSideFillColor(stage.side);
      } else {
        color = '#E5D7B8';
      }

      arcs.push({
        stage,
        index,
        startAngle,
        endAngle,
        midAngle,
        status,
        color,
        path,
        hitPath,
      });

      currentAngle = endAngle + GAP_DEGREES;
    });

    return arcs;
  }, [rules, totalDuration, currentStageIndex, center, radius, hitRadius]);

  const handleArcHover = useCallback((index: number, e: React.MouseEvent) => {
    setHoveredIndex(index);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        top: e.clientY - rect.top,
        left: e.clientX - rect.left,
      });
    }
  }, []);

  const handleArcLeave = useCallback(() => {
    setHoveredIndex(null);
    setTooltipPos(null);
  }, []);

  const handleArcClick = useCallback((index: number) => {
    if (!currentTimer) return;
    if (index === currentStageIndex) return;

    if (isRunning || (hasStarted && currentTimer.current.remainingSeconds !== currentTimer.current.totalSeconds)) {
      setShowConfirmDialog(index);
    } else {
      setTimer(goToStage(currentTimer, index));
    }
  }, [currentTimer, currentStageIndex, isRunning, hasStarted, setTimer]);

  const confirmJump = useCallback(() => {
    if (showConfirmDialog === null || !currentTimer) return;
    setTimer(goToStage(currentTimer, showConfirmDialog));
    setShowConfirmDialog(null);
  }, [showConfirmDialog, currentTimer, setTimer]);

  const cancelJump = useCallback(() => {
    setShowConfirmDialog(null);
  }, []);

  const completedDuration = useMemo(() => {
    return rules.stages
      .filter((_, i) => i < currentStageIndex)
      .reduce((acc, s) => acc + s.duration, 0);
  }, [rules, currentStageIndex]);

  const overallProgress = useMemo(() => {
    const currentProgress = currentTimer
      ? 1 - (currentTimer.current.remainingSeconds / currentTimer.current.totalSeconds)
      : 0;
    const currentStageContribution = currentTimer
      ? currentProgress * (currentTimer.current.totalSeconds / totalDuration)
      : 0;
    return ((completedDuration / totalDuration) + currentStageContribution) * 100;
  }, [completedDuration, totalDuration, currentTimer]);

  const hoveredArc = hoveredIndex !== null ? stageArcs[hoveredIndex] : null;

  if (showConfirmDialog !== null) {
    const targetStage = rules.stages[showConfirmDialog];
    return (
      <div
        ref={containerRef}
        className="rounded-xl border border-navy-100 bg-white shadow-sm p-4 flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
        <h4 className="font-semibold text-sm text-navy-900 mb-1 text-center">跳转将丢失当前计时</h4>
        <p className="text-xs text-navy-500 mb-3 text-center leading-relaxed">
          跳转到「{targetStage.name}」将重置当前阶段的计时状态
        </p>
        <div className="flex gap-2 w-full">
          <button
            onClick={cancelJump}
            className="btn-secondary flex-1 !py-1.5 text-xs"
          >
            取消
          </button>
          <button
            onClick={confirmJump}
            className="btn-gold flex-1 !py-1.5 text-xs"
          >
            确认跳转
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative" style={{ width: size }}>
      <div className="rounded-xl border border-navy-100 bg-white shadow-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-serif text-sm font-semibold text-navy-900">比赛进度</h4>
          <span className="text-[10px] font-mono text-navy-500 font-semibold">
            {overallProgress.toFixed(0)}%
          </span>
        </div>

        <div className="relative" style={{ width: svgSize - 24, height: svgSize - 24, margin: '0 auto' }}>
          <svg width={svgSize - 24} height={svgSize - 24} className="block">
            <defs>
              {stageArcs.map((arc) => (
                <filter key={`shadow-${arc.stage.id}`} id={`shadow-${arc.stage.id}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor={arc.color} floodOpacity="0.3" />
                </filter>
              ))}
            </defs>

            {stageArcs.map((arc) => (
              <g key={arc.stage.id}>
                <path
                  d={arc.hitPath}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={RING_STROKE * 2.5}
                  className="cursor-pointer"
                  onClick={() => handleArcClick(arc.index)}
                  onMouseEnter={(e) => handleArcHover(arc.index, e)}
                  onMouseLeave={handleArcLeave}
                />
                <path
                  d={arc.path}
                  fill="none"
                  stroke={arc.status === 'done' ? arc.color + '50' : arc.color}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  style={{
                    opacity: hoveredIndex === arc.index ? 0.85 : 1,
                    transition: 'opacity 0.2s ease',
                    filter: arc.status === 'active' ? `drop-shadow(0 1px 3px ${arc.color}40)` : 'none',
                  }}
                  pointerEvents="none"
                />
              </g>
            ))}

            {stageArcs.filter(a => a.status === 'active').map((arc) => {
              const pos = polarToCartesian(center, center, radius, arc.midAngle);
              return (
                <circle
                  key={`dot-${arc.stage.id}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={5}
                  fill="white"
                  stroke={arc.color}
                  strokeWidth={2}
                  className="animate-pulse"
                  style={{ transformOrigin: 'center' }}
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-[9px] text-navy-400 uppercase tracking-wider">
              阶段 {currentStageIndex + 1}/{rules.stages.length}
            </div>
            <div className="font-mono text-xl font-bold text-navy-900 leading-tight mt-0.5">
              {getTimeDisplay(completedDuration + (currentTimer ? (currentTimer.current.totalSeconds - currentTimer.current.remainingSeconds) : 0))}
            </div>
            <div className="text-[9px] text-navy-400 mt-0.5">
              / {getTimeDisplay(totalDuration)}
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 justify-center">
          <div className="flex items-center gap-1 text-[9px] text-navy-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500/40"></span>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-navy-500">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
            <span>进行中</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-navy-500">
            <span className="w-2 h-2 rounded-full bg-[#E5D7B8]"></span>
            <span>待开始</span>
          </div>
        </div>
      </div>

      {hoveredArc && tooltipPos && (
        <div
          className="absolute z-[100] bg-white rounded-lg shadow-lg border border-navy-100 p-3 min-w-[180px] pointer-events-none"
          style={{
            left: '50%',
            top: -4,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <div className="flex items-start gap-2.5">
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                hoveredArc.status === 'active'
                  ? 'bg-gradient-gold text-white'
                  : hoveredArc.status === 'done'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-navy-100 text-navy-600'
              }`}
            >
              {hoveredArc.status === 'done' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : hoveredArc.status === 'active' ? (
                <Play className="w-3.5 h-3.5" />
              ) : (
                <span className="text-[10px] font-bold">{hoveredArc.index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-semibold text-xs text-navy-900 truncate">
                  {hoveredArc.stage.name}
                </span>
                {hoveredArc.status === 'active' && (
                  <span className="flex-shrink-0 inline-flex items-center px-1 py-0.5 rounded text-[8px] font-bold bg-gradient-gold text-white">
                    当前
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-navy-500">
                <Clock className="w-2.5 h-2.5" />
                <span className="font-mono">{getTimeDisplay(hoveredArc.stage.duration)}</span>
                {hoveredArc.stage.side && (
                  <>
                    <span className="text-navy-300">·</span>
                    <span className={getStageSideColor(hoveredArc.stage.side)}>
                      {getSideLabel(hoveredArc.stage.side)}
                    </span>
                  </>
                )}
              </div>
              {typeof hoveredArc.stage.speakerIndex === 'number' && (
                <div className="text-[10px] text-navy-400 mt-0.5">
                  第{hoveredArc.stage.speakerIndex + 1}辩手
                </div>
              )}
              <div className="mt-1.5 pt-1.5 border-t border-navy-100">
                <div className="text-[9px] text-navy-400">
                  {hoveredArc.status === 'done' && '✓ 该阶段已完成'}
                  {hoveredArc.status === 'active' && '▶ 正在进行中'}
                  {hoveredArc.status === 'upcoming' && '点击跳转到该阶段'}
                </div>
              </div>
            </div>
          </div>
          <div
            className="absolute left-1/2 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-navy-100"
            style={{ transform: 'translateX(-50%) rotate(45deg)' }}
          />
        </div>
      )}
    </div>
  );
};

export default MatchProgressRing;
