import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebateInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  thinkTimeSeconds: number;
  placeholder?: string;
  side?: 'pro' | 'con';
}

export default function DebateInput({
  onSubmit,
  disabled = false,
  thinkTimeSeconds,
  placeholder = '输入你的论点...',
  side = 'pro',
}: DebateInputProps) {
  const [text, setText] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(thinkTimeSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    setRemainingSeconds(thinkTimeSeconds);
    setIsRunning(false);
    hasStartedRef.current = false;
  }, [thinkTimeSeconds, disabled]);

  useEffect(() => {
    if (!isRunning || disabled) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
      if (prev <= 1) {
        clearInterval(interval);
        setIsRunning(false);
        if (text.trim()) {
          onSubmit(text);
          setText('');
        }
        return 0;
      }
      return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, disabled, text, onSubmit]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setText(newText);

      if (!hasStartedRef.current && newText.trim().length > 0 && !disabled) {
        hasStartedRef.current = true;
        setIsRunning(true);
      }
    },
    [disabled]
  );

  const handleSubmit = useCallback(() => {
    if (!text.trim() || disabled) return;
    onSubmit(text);
    setText('');
    setRemainingSeconds(thinkTimeSeconds);
    setIsRunning(false);
    hasStartedRef.current = false;
  }, [text, disabled, onSubmit, thinkTimeSeconds]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const progress = remainingSeconds / thinkTimeSeconds;
  const isUrgent = remainingSeconds <= 10;
  const isWarning = remainingSeconds <= 30 && remainingSeconds > 10;

  const sideColor = side === 'pro' ? 'emerald' : 'red';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={cn('w-4 h-4', isUrgent ? 'text-red-500' : 'text-navy-400')} />
          <span
            className={cn(
              'text-sm font-medium',
              isUrgent && 'text-red-500 font-bold animate-pulse',
              isWarning && 'text-amber-500',
              !isUrgent && !isWarning && 'text-navy-500'
            )}
          >
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-xs text-navy-400">思考时间</span>
        </div>
        <div className="text-xs text-navy-400">
          <span className="font-mono">{text.length}</span> 字
          <span className="mx-1.5">·</span>
          <kbd className="font-mono bg-navy-100 px-1.5 py-0.5 rounded text-navy-500">⌘/Ctrl + Enter</kbd> 发送
        </div>
      </div>

      <div
        className={cn(
          'relative rounded-xl border-2 overflow-hidden transition-all duration-300',
          side === 'pro' && isRunning && 'border-emerald-400',
          side === 'con' && isRunning && 'border-red-400',
          !isRunning && 'border-navy-200',
          disabled && 'opacity-60'
        )}
      >
        <div
          className={cn(
            'absolute top-0 left-0 h-1 transition-all duration-1000 ease-linear',
            isUrgent && 'bg-red-500',
            isWarning && !isUrgent && 'bg-amber-400',
            !isWarning && !isUrgent && isRunning && side === 'pro' && 'bg-emerald-500',
            !isWarning && !isUrgent && isRunning && side === 'con' && 'bg-red-500',
            !isRunning && 'bg-transparent'
          )}
          style={{ width: `${progress * 100}%` }}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          className={cn(
            'w-full px-4 py-3 resize-none focus:outline-none text-navy-900 text-sm leading-relaxed',
            'bg-white placeholder:text-navy-300'
          )}
        />

        <div className="flex items-center justify-between px-4 py-2 bg-navy-50/50 border-t border-navy-100">
          {isUrgent && (
            <div className="flex items-center gap-1.5 text-red-500 text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              时间即将耗尽
            </div>
          )}
          {!isUrgent && <div className="text-xs text-navy-400">
            {side === 'pro' ? '正方发言中' : '反方发言中'}
          </div>}

          <button
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              side === 'pro' &&
                text.trim() &&
                !disabled &&
                'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm',
              side === 'con' &&
                text.trim() &&
                !disabled &&
                'bg-red-500 text-white hover:bg-red-600 shadow-sm',
              (!text.trim() || disabled) &&
                'bg-navy-200 text-navy-400 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
