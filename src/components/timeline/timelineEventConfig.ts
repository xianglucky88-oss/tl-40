import {
  MessageSquare,
  Zap,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  TrendingUp,
  FileText,
} from 'lucide-react';
import type {
  TimelineEventType,
  TimelineEventIconConfig,
} from '@/types';

export const EVENT_TYPE_CONFIG: Record<TimelineEventType, TimelineEventIconConfig & { icon: React.ComponentType<{ className?: string }> }> = {
  argument: {
    label: '论点提出',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    dotColor: 'bg-emerald-500',
    icon: MessageSquare,
  },
  rebuttal: {
    label: '精彩反驳',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    dotColor: 'bg-blue-500',
    icon: Zap,
  },
  mistake: {
    label: '失误点',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    dotColor: 'bg-red-500',
    icon: AlertTriangle,
  },
  cross_examine: {
    label: '质询高潮',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    dotColor: 'bg-purple-500',
    icon: HelpCircle,
  },
  highlight: {
    label: '精彩时刻',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    dotColor: 'bg-amber-500',
    icon: Sparkles,
  },
  turning_point: {
    label: '转折点',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-300',
    dotColor: 'bg-teal-500',
    icon: TrendingUp,
  },
  summary: {
    label: '总结陈词',
    color: 'text-navy-700',
    bgColor: 'bg-navy-50',
    borderColor: 'border-navy-300',
    dotColor: 'bg-navy-500',
    icon: FileText,
  },
};
