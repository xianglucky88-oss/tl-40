import { useState, useMemo, useCallback } from 'react';
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

const RING_STROKE = 14;
const GAP_ANGLE = 1.5;

const getSideFillColor = (side?: string): string => {
  switch (side) {
    case 'pro': return '#059669';
    case 'con': return '#EF4444';
    case 'judge': return '#1b3f6c';
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

const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
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
  status: 'done' | 'active' | 'upcoming';
  fillColor: string;
  path: string;
}

export const MatchProgressRing = ({ format, size = 220 }: MatchProgressRingProps) => {
  const currentTimer = useDebateStore((s) => s.currentTimer);
  const setTimer = useDebateStore((s) => s.setTimer);
  const tournament = useDebateStore((s) => s.tournament);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<number | null>(null);

  const activeFormat = format ?? currentTimer?.format ?? tournament.format;
  const rules = useMemo(() => getFormatRules(activeFormat), [activeFormat]);

  const totalDuration = useMemo(() => {
    return rules.stages.reduce((acc, s) => acc + s.duration, 0);
  }, [rules]);

  const currentStageIndex = currentTimer?.current.stageIndex ?? 0;
  const isRunning = currentTimer?.isRunning ?? false;
  const hasStarted = currentTimer?.hasStarted ?? false;

  const stageArcs = useMemo((): StageArcData[] => {
    const arcs: StageArcData[] = [];
    let currentAngle = 0;
    const totalGap = GAP_ANGLE * rules.stages.length;
    const availableAngle = 360 - totalGap;

    rules.stages.forEach((stage, index) => {
      const stageAngle = (stage.duration / totalDuration) * availableAngle;
      const startAngle = currentAngle;
      const endAngle = currentAngle + stageAngle;

      let status: 'done' | 'active' | 'upcoming';
      if (index < currentStageIndex) {
        status = 'done';
      } else if (index === currentStageIndex) {
        status = 'active';
      } else {
        status = 'upcoming';
      }

      const radius = (size - RING_STROKE) / 2;
      const center = size / 2;
      const path = describeArc(center, center, radius, startAngle, endAngle);

      let fillColor: string;
      if (status === 'done') {
        fillColor = getSideFillColor(stage.side) + '40';
      } else if (status === 'active') {
        fillColor = getSideFillColor(stage.side);
      } else {
        fillColor = '#E8DFC7';
      }

      arcs.push({
        stage,
        index,
        startAngle,
        endAngle,
        status,
        fillColor,
        path,
      });

      currentAngle = endAngle + GAP_ANGLE;
    });

    return arcs;
  }, [rules, totalDuration, currentStageIndex, size]);

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
      <div className="card p-5" style={{ width: size, height: size }}>
        <div className="h-full flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
          <h4 className="font-semibold text-navy-900 mb-2">跳转将丢失当前计时</h4>
          <p className="text-xs text-navy-500 mb-4">
            {isRunning ? '计时器正在运行，' : ''}
            跳转到「{targetStage.name}」将重置当前阶段的计时状态，是否继续？
          </p>
          <div className="flex gap-2 w-full">
            <button
              onClick={cancelJump}
              className="btn-secondary flex-1 !py-2 text-sm"
            >
              取消
            </button>
            <button
              onClick={confirmJump}
              className="btn-gold flex-1 !py-2 text-sm"
            >
              确认跳转
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="card p-4" style={{ width: size }}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-serif text-sm font-semibold text-navy-900">比赛进度</h4>
          <span className="text-[11px] font-mono text-navy-500">
            {overallProgress.toFixed(1)}%
          </span>
        </div>

        <div className="relative" style={{ width: size - 32, height: size - 32, margin: '0 auto' }}>
          <svg width={size - 32} height={size - 32} className="block">
            {stageArcs.map((arc, i) => (
              <path
                key={arc.stage.id}
                d={arc.path}
                fill="none"
                stroke={arc.fillColor}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                className={`cursor-pointer transition-all duration-300 ${
                  hoveredIndex === i ? 'opacity-80' : ''
                } ${arc.status === 'active' ? 'drop-shadow-sm' : ''}`}
                style={{
                  transform: arc.status === 'active' && hoveredIndex === i ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: 'center',
                  filter: arc.status === 'active' ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none',
                }}
                onClick={() => handleArcClick(i)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}

            {stageArcs.map((arc) => {
              if (arc.status !== 'active') return null;
              const midAngle = (arc.startAngle + arc.endAngle) / 2;
              const radius = (size - 32 - RING_STROKE) / 2;
              const center = (size - 32) / 2;
              const pos = polarToCartesian(center, center, radius, midAngle);
              return (
                <circle
                  key={`indicator-${arc.stage.id}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={5}
                  fill="white"
                  stroke={getSideFillColor(arc.stage.side)}
                  strokeWidth={2}
                  className="animate-pulse"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[10px] text-navy-400 uppercase tracking-wider mb-0.5">
              阶段 {currentStageIndex + 1}/{rules.stages.length}
            </div>
            <div className="font-mono text-2xl font-bold text-navy-900">
              {getTimeDisplay(completedDuration + (currentTimer ? (currentTimer.current.totalSeconds - currentTimer.current.remainingSeconds) : 0))}
            </div>
            <div className="text-[10px] text-navy-400">
              / {getTimeDisplay(totalDuration)}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
          <div className="flex items-center gap-1 text-[10px] text-navy-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500/40"></span>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-navy-500">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
            <span>进行中</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-navy-500">
            <span className="w-2 h-2 rounded-full bg-[#E8DFC7]"></span>
            <span>待开始</span>
          </div>
        </div>
      </div>

      {hoveredArc && (
        <div
          className="absolute z-50 bg-white rounded-xl shadow-xl border border-navy-100 p-4 min-w-[220px] animate-fade-in"
          style={{
            left: '50%',
            top: -8,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                hoveredArc.status === 'active'
                  ? 'bg-gradient-gold text-white'
                  : hoveredArc.status === 'done'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-navy-100 text-navy-600'
              }`}
            >
              {hoveredArc.status === 'done' ? (
                <CheckCircle2 className="w-4.5 h-4.5" />
              ) : hoveredArc.status === 'active' ? (
                <Play className="w-4.5 h-4.5" />
              ) : (
                <span className="text-xs font-bold">{hoveredArc.index + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-navy-900 truncate">
                  {hoveredArc.stage.name}
                </span>
                {hoveredArc.status === 'active' && (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-gold text-white">
                    当前
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-navy-500">
                <Clock className="w-3 h-3" />
                <span className="font-mono">{getTimeDisplay(hoveredArc.stage.duration)}</span>
                {hoveredArc.stage.side && (
                  <>
                    <span className="text-navy-300">·</span>
                    <span className={getStageSideColor(hoveredArc.stage.side).replace('text-', 'text-')}>
                      {getSideLabel(hoveredArc.stage.side)}
                    </span>
                  </>
                )}
                {typeof hoveredArc.stage.speakerIndex === 'number' && (
                  <>
                    <span className="text-navy-300">·</span>
                    <span>第{hoveredArc.stage.speakerIndex + 1}辩手</span>
                  </>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-navy-100">
                <div className="text-[10px] text-navy-400">
                  {hoveredArc.status === 'done' && '✓ 该阶段已完成'}
                  {hoveredArc.status === 'active' && '▶ 正在进行中'}
                  {hoveredArc.status === 'upcoming' && '○ 点击跳转到该阶段'}
                </div>
              </div>
            </div>
          </div>
          <div
            className="absolute left-1/2 -bottom-2 w-4 h-4 bg-white border-r border-b border-navy-100"
            style={{ transform: 'translateX(-50%) rotate(45deg)' }}
          />
        </div>
      )}
    </div>
  );
};

export default MatchProgressRing;
