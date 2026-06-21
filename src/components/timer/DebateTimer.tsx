import { useEffect, useMemo, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import {
  tick,
  start,
  pause,
  nextStage,
  prevStage,
  resetStage,
  getTimeDisplay,
  getProgressPercent,
  isUrgent,
  getStageSideColor,
  getStageSideBg,
} from '@/engines/timerEngine';
import { getFormatRules } from '@/engines/formatRules';
import MatchProgressRing from './MatchProgressRing';

interface DebateTimerProps {
  matchId?: string;
}

const RING_SIZE = 360;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const getRingColor = (side?: string): string => {
  switch (side) {
    case 'pro': return '#059669';
    case 'con': return '#EF4444';
    case 'judge': return '#1b3f6c';
    case 'both': return '#c2874f';
    default: return '#1b3f6c';
  }
};

export const DebateTimer = ({ matchId }: DebateTimerProps) => {
  const currentTimer = useDebateStore((s) => s.currentTimer);
  const setTimer = useDebateStore((s) => s.setTimer);
  const initTimer = useDebateStore((s) => s.initTimer);
  const matches = useDebateStore((s) => s.matches);
  const tournament = useDebateStore((s) => s.tournament);

  useEffect(() => {
    if (matchId) {
      const match = matches.find((m) => m.id === matchId);
      if (match && !currentTimer) {
        initTimer(tournament.format, match.currentStageIndex ?? 0);
      }
    } else if (!currentTimer) {
      initTimer('mandarin');
    }
  }, [matchId, matches, tournament.format, currentTimer, initTimer]);

  useEffect(() => {
    if (!currentTimer?.isRunning) return;
    const interval = setInterval(() => {
      setTimer(tick(currentTimer));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentTimer?.isRunning, currentTimer, setTimer]);

  const handleToggle = useCallback(() => {
    if (!currentTimer) return;
    setTimer(currentTimer.isRunning ? pause(currentTimer) : start(currentTimer));
  }, [currentTimer, setTimer]);

  const handleNext = useCallback(() => {
    if (!currentTimer) return;
    setTimer(nextStage(currentTimer));
  }, [currentTimer, setTimer]);

  const handlePrev = useCallback(() => {
    if (!currentTimer) return;
    setTimer(prevStage(currentTimer));
  }, [currentTimer, setTimer]);

  const handleReset = useCallback(() => {
    if (!currentTimer) return;
    setTimer(resetStage(currentTimer));
  }, [currentTimer, setTimer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleToggle();
      } else if (e.key.toLowerCase() === 'n') {
        handleNext();
      } else if (e.key.toLowerCase() === 'p') {
        handlePrev();
      } else if (e.key.toLowerCase() === 'r') {
        handleReset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleToggle, handleNext, handlePrev, handleReset]);

  const timeDisplay = useMemo(() => {
    if (!currentTimer) return '00:00';
    return getTimeDisplay(currentTimer.current.remainingSeconds);
  }, [currentTimer]);

  const progress = useMemo(() => {
    if (!currentTimer) return 1;
    return getProgressPercent(currentTimer.current);
  }, [currentTimer]);

  const urgent = useMemo(() => {
    if (!currentTimer) return false;
    return isUrgent(currentTimer.current);
  }, [currentTimer]);

  const sideColorClass = useMemo(() => {
    if (!currentTimer) return 'text-navy-700';
    return getStageSideColor(currentTimer.current.stageConfig.side);
  }, [currentTimer]);

  const sideBgClass = useMemo(() => {
    if (!currentTimer) return 'bg-navy-50 border-navy-200';
    return getStageSideBg(currentTimer.current.stageConfig.side);
  }, [currentTimer]);

  const ringColor = useMemo(() => {
    if (!currentTimer) return '#1b3f6c';
    return urgent ? '#EF4444' : getRingColor(currentTimer.current.stageConfig.side);
  }, [currentTimer, urgent]);

  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  if (!currentTimer) {
    return (
      <div className="flex items-center justify-center h-80 text-navy-500 font-medium">
        正在初始化计时器...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full">
        <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            className={`absolute inset-0 -rotate-90 ${urgent ? 'timer-urgent' : currentTimer.isRunning ? 'timer-pulse' : ''}`}
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="#E8DFC7"
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.5s ease' }}
            />
          </svg>

          <div className="relative flex flex-col items-center gap-3 z-10 px-6 text-center">
            <div
              className={`px-3.5 py-1 rounded-full text-[11px] font-semibold border ${sideBgClass} ${sideColorClass}`}
            >
              阶段 {currentTimer.current.stageIndex + 1} / {getFormatRules(currentTimer.format).stages.length}
            </div>

            <div
              className={`font-mono font-bold tracking-tight leading-none ${
                urgent ? 'text-red-500' : 'text-navy-900'
              }`}
              style={{ fontSize: '4rem' }}
            >
              {timeDisplay}
            </div>

            <div className={`font-serif text-base font-semibold ${sideColorClass}`}>
              {currentTimer.current.stageConfig.name}
            </div>

            {currentTimer.isFinished && (
              <div className="badge-gold mt-1 text-xs">
                辩论计时结束
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <MatchProgressRing format={currentTimer.format} size={190} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={handlePrev}
          className="btn-secondary !py-2 !px-3"
          disabled={currentTimer.current.stageIndex === 0}
          title="上一阶段 (P)"
        >
          <SkipBack className="w-3.5 h-3.5" />
          <span className="text-sm">上一阶段</span>
        </button>

        <button
          type="button"
          onClick={handleToggle}
          className="btn-primary !py-2 px-7"
          disabled={currentTimer.isFinished}
          title={currentTimer.isRunning ? '暂停 (Space)' : '开始 (Space)'}
        >
          {currentTimer.isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              <span className="text-sm">暂停</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span className="text-sm">开始</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="btn-secondary !py-2 !px-3"
          disabled={currentTimer.isFinished}
          title="下一阶段 (N)"
        >
          <span className="text-sm">下一阶段</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="btn-secondary !py-2 !px-3"
          title="重置当前阶段 (R)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-sm">重置</span>
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2 text-xs text-navy-500">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-navy-50">
          <kbd className="font-mono bg-white border border-navy-200 px-1.5 py-0.5 rounded text-[11px]">Space</kbd>
          <span className="text-[11px]">开始/暂停</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-navy-50">
          <kbd className="font-mono bg-white border border-navy-200 px-1.5 py-0.5 rounded text-[11px]">N</kbd>
          <span className="text-[11px]">下一阶段</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-navy-50">
          <kbd className="font-mono bg-white border border-navy-200 px-1.5 py-0.5 rounded text-[11px]">P</kbd>
          <span className="text-[11px]">上一阶段</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-navy-50">
          <kbd className="font-mono bg-white border border-navy-200 px-1.5 py-0.5 rounded text-[11px]">R</kbd>
          <span className="text-[11px]">重置阶段</span>
        </span>
      </div>
    </div>
  );
};

export default DebateTimer;
