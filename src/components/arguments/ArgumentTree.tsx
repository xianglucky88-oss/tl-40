import { useState, type ComponentType } from 'react';
import { Plus, Send, ShieldCheck, ShieldX, User } from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import { cn } from '@/lib/utils';
import ArgumentTreeNode from './ArgumentTreeNode';
import type { ArgumentSide, Topic, ArgumentNode } from '@/types';

interface ArgumentTreeProps {
  topic: Topic;
}

export default function ArgumentTree({ topic }: ArgumentTreeProps) {
  const { addArgument, getArgumentTreeByTopicId } = useDebateStore();
  const tree = getArgumentTreeByTopicId(topic.id);

  const [authorName, setAuthorName] = useState(
    () => localStorage.getItem('debate_author_name') || ''
  );
  const [proContent, setProContent] = useState('');
  const [conContent, setConContent] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [replySide, setReplySide] = useState<ArgumentSide | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const saveAuthor = (name: string) => {
    setAuthorName(name);
    try {
      localStorage.setItem('debate_author_name', name);
    } catch {
      // ignore
    }
  };

  const handleAddRoot = (side: ArgumentSide) => {
    const content = side === 'pro' ? proContent : conContent;
    if (!content.trim()) return;
    addArgument(topic.id, side, content, authorName);
    if (side === 'pro') setProContent('');
    else setConContent('');
  };

  const handleReply = (parentId: string) => {
    const side = tree.proRoots.some((r) => findNode(r, parentId)) ? 'pro' : 'con';
    setReplyParentId(parentId);
    setReplySide(side);
    setReplyContent('');
  };

  const findNode = (node: ArgumentNode, id: string): boolean => {
    if (node.id === id) return true;
    return node.children.some((c) => findNode(c, id));
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !replyParentId || !replySide) return;
    addArgument(topic.id, replySide, replyContent, authorName, replyParentId);
    setReplyParentId(null);
    setReplySide(null);
    setReplyContent('');
  };

  const voter = authorName || '匿名用户';

  const SideColumn = ({
    side,
    title,
    subtitle,
    roots,
    icon: Icon,
    colorClass,
    content,
    setContent,
  }: {
    side: ArgumentSide;
    title: string;
    subtitle: string;
    roots: ArgumentNode[];
    icon: ComponentType<{ className?: string }>;
    colorClass: string;
    content: string;
    setContent: (v: string) => void;
  }) => (
    <div className="flex flex-col">
      <div
        className={cn(
          'rounded-t-xl px-5 py-4 text-white',
          side === 'pro' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-rose-500 to-rose-600'
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          <h3 className="font-serif text-lg font-bold">{title}</h3>
        </div>
        <p className="mt-1 text-sm text-white/90">{subtitle}</p>
      </div>

      <div className={cn('flex-1 space-y-3 rounded-b-xl border border-t-0 p-4 bg-white', colorClass)}>
        <div className="space-y-2 rounded-lg border border-dashed border-navy-200 bg-ivory-50 p-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder={`阐述你的${side === 'pro' ? '正方' : '反方'}论点...`}
            className="input-base text-sm"
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
              <input
                value={authorName}
                onChange={(e) => saveAuthor(e.target.value)}
                placeholder="你的昵称（可选）"
                className="input-base !py-2 pl-9 text-xs"
              />
            </div>
            <button
              onClick={() => handleAddRoot(side)}
              disabled={!content.trim()}
              className={cn(
                'btn-primary !px-4 !py-2 text-xs',
                side === 'pro' ? '!bg-gradient-to-r !from-emerald-500 !to-emerald-600' : '!bg-gradient-to-r !from-rose-500 !to-rose-600'
              )}
            >
              <Send className="h-3.5 w-3.5" />
              发布论点
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {roots.length === 0 ? (
            <div className="rounded-lg border border-dashed border-navy-200 py-8 text-center text-sm text-navy-400">
              暂无{side === 'pro' ? '正方' : '反方'}论点，来发布第一个吧！
            </div>
          ) : (
            roots.map((node) => (
              <ArgumentTreeNode
                key={node.id}
                node={node}
                side={side}
                currentVoter={voter}
                onReply={handleReply}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {replyParentId && replySide && (
        <div className="animate-fade-in-scale card border-gold-300 bg-gold-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-navy-700">
              <Plus className="h-4 w-4" />
              回复{replySide === 'pro' ? '正方' : '反方'}论点
            </div>
            <button
              onClick={() => {
                setReplyParentId(null);
                setReplySide(null);
                setReplyContent('');
              }}
              className="text-xs text-navy-500 hover:text-navy-700"
            >
              取消
            </button>
          </div>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
            placeholder="输入你的回复内容..."
            className="input-base text-sm"
            autoFocus
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-400" />
              <input
                value={authorName}
                onChange={(e) => saveAuthor(e.target.value)}
                placeholder="你的昵称"
                className="input-base !py-1.5 pl-8 text-xs w-40"
              />
            </div>
            <button
              onClick={handleSubmitReply}
              disabled={!replyContent.trim()}
              className="btn-primary !px-4 !py-1.5 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              发布回复
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SideColumn
          side="pro"
          title="正方论点"
          subtitle={topic.proSide}
          roots={tree.proRoots}
          icon={ShieldCheck}
          colorClass="border-emerald-200"
          content={proContent}
          setContent={setProContent}
        />
        <SideColumn
          side="con"
          title="反方论点"
          subtitle={topic.conSide}
          roots={tree.conRoots}
          icon={ShieldX}
          colorClass="border-rose-200"
          content={conContent}
          setContent={setConContent}
        />
      </div>
    </div>
  );
}
