import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Star,
  ShieldCheck,
  ShieldX,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import { cn } from '@/lib/utils';
import ArgumentTree from '@/components/arguments/ArgumentTree';
import Empty from '@/components/ui/Empty';
import { FORMAT_RULES } from '@/engines/formatRules';
import type { TopicCategory } from '@/types';

const CATEGORY_COLORS: Record<TopicCategory, string> = {
  政策: 'bg-navy-50 text-navy-700 ring-navy-600/20',
  价值: 'bg-gold-50 text-gold-700 ring-gold-600/30',
  事实: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  模拟法庭: 'bg-red-50 text-red-700 ring-red-600/20',
};

function Stars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < level ? 'fill-gold-400 text-gold-400' : 'text-navy-200'
          )}
        />
      ))}
    </div>
  );
}

export default function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { getTopicById, arguments: allArgs } = useDebateStore();

  const topic = topicId ? getTopicById(topicId) : undefined;

  const stats = useMemo(() => {
    if (!topic) return { pro: 0, con: 0, proVotes: 0, conVotes: 0 };
    const topicArgs = allArgs.filter((a) => a.topicId === topic.id);
    const pro = topicArgs.filter((a) => a.side === 'pro');
    const con = topicArgs.filter((a) => a.side === 'con');
    return {
      pro: pro.length,
      con: con.length,
      proVotes: pro.reduce((sum, a) => sum + a.votes, 0),
      conVotes: con.reduce((sum, a) => sum + a.votes, 0),
    };
  }, [topic, allArgs]);

  if (!topic) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/topics')}
          className="btn-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          返回辩题库
        </button>
        <div className="card">
          <Empty title="辩题不存在" description="该辩题可能已被删除" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/topics')}
        className="btn-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
        返回辩题库
      </button>

      <div className="card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-navy text-white shadow-card">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-2xl font-bold leading-snug text-navy-900">
                {topic.title}
              </h1>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                    <ShieldCheck className="h-4 w-4" />
                    正方：{topic.proSide}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200">
                    <ShieldX className="h-4 w-4" />
                    反方：{topic.conSide}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-6 rounded-xl bg-gradient-to-br from-ivory-50 to-ivory-100 p-4 ring-1 ring-navy-100/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-emerald-600">
                <MessageSquare className="h-4 w-4" />
                {stats.pro}
              </div>
              <div className="mt-0.5 text-xs text-navy-500">正方论点</div>
            </div>
            <div className="h-10 w-px bg-navy-200" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-rose-600">
                <MessageSquare className="h-4 w-4" />
                {stats.con}
              </div>
              <div className="mt-0.5 text-xs text-navy-500">反方论点</div>
            </div>
            <div className="h-10 w-px bg-navy-200" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-gold-600">
                <ThumbsUp className="h-4 w-4" />
                {stats.proVotes + stats.conVotes}
              </div>
              <div className="mt-0.5 text-xs text-navy-500">总投票</div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {topic.category.map((c) => (
              <span
                key={c}
                className={cn(
                  'badge ring-1',
                  CATEGORY_COLORS[c]
                )}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {topic.formats.map((f) => (
              <span
                key={f}
                className="badge bg-navy-50 text-navy-600 ring-1 ring-navy-200/50 text-[11px]"
              >
                {FORMAT_RULES[f].label}
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs font-medium text-navy-500">难度</span>
            <Stars level={topic.difficulty} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-bold text-navy-900">
          <MessageSquare className="h-5 w-5" />
          论点树
        </h2>
        <ArgumentTree topic={topic} />
      </div>
    </div>
  );
}
