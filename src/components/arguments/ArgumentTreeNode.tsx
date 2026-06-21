import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  Pencil,
  Trash2,
  Reply,
  Check,
  X,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import { cn } from '@/lib/utils';
import type { ArgumentNode, ArgumentSide } from '@/types';

interface ArgumentTreeNodeProps {
  node: ArgumentNode;
  side: ArgumentSide;
  depth?: number;
  currentVoter: string;
  onReply: (parentId: string) => void;
}

export default function ArgumentTreeNode({
  node,
  side,
  depth = 0,
  currentVoter,
  onReply,
}: ArgumentTreeNodeProps) {
  const { voteArgument, updateArgument, removeArgument } = useDebateStore();
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(node.content);
  const [hovered, setHovered] = useState(false);

  const hasChildren = node.children && node.children.length > 0;
  const hasVoted = node.voters.includes(currentVoter || '匿名用户');

  const handleVote = () => {
    voteArgument(node.id, currentVoter);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    updateArgument(node.id, editContent);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(node.content);
    setEditing(false);
  };

  const sideColors = {
    pro: {
      border: 'border-l-emerald-500',
      bg: 'bg-emerald-50/60',
      hoverBg: 'hover:bg-emerald-50',
      ring: 'ring-emerald-200/60',
      badge: 'bg-emerald-100 text-emerald-700',
      accent: 'text-emerald-600',
    },
    con: {
      border: 'border-l-rose-500',
      bg: 'bg-rose-50/60',
      hoverBg: 'hover:bg-rose-50',
      ring: 'ring-rose-200/60',
      badge: 'bg-rose-100 text-rose-700',
      accent: 'text-rose-600',
    },
  }[side];

  return (
    <div className="animate-fade-in-scale">
      <div
        className={cn(
          'relative rounded-lg border-l-4 transition-all duration-200',
          sideColors.border,
          sideColors.bg,
          sideColors.hoverBg,
          'ring-1',
          sideColors.ring
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ marginLeft: depth > 0 ? 20 : 0 }}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {hasChildren && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-navy-500 transition-colors hover:bg-white hover:text-navy-700"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5 shrink-0" />}

            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="input-base text-sm"
                    placeholder="输入论点内容..."
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim()}
                      className="btn-primary !px-3 !py-1.5 text-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      保存
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn-secondary !px-3 !py-1.5 text-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-navy-800">
                    {node.content}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
                        sideColors.badge
                      )}
                    >
                      {node.author}
                    </span>

                    <button
                      onClick={handleVote}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-all',
                        hasVoted
                          ? cn('bg-gradient-navy text-white shadow-sm')
                          : 'bg-white text-navy-600 ring-1 ring-navy-200 hover:bg-navy-50'
                      )}
                    >
                      <ThumbsUp
                        className={cn('h-3.5 w-3.5', hasVoted && 'fill-current')}
                      />
                      {node.votes}
                    </button>

                    {hovered && (
                      <>
                        <button
                          onClick={() => onReply(node.id)}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-navy-600 transition-colors hover:bg-white"
                        >
                          <Reply className="h-3.5 w-3.5" />
                          回复
                        </button>
                        <button
                          onClick={() => setEditing(true)}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-navy-600 transition-colors hover:bg-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          编辑
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('确定删除该论点及其所有子论点吗？')) {
                              removeArgument(node.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-red-500 transition-colors hover:bg-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </button>
                      </>
                    )}

                    <span className="ml-auto text-navy-400">
                      {new Date(node.createdAt).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasChildren && !collapsed && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <ArgumentTreeNode
              key={child.id}
              node={child}
              side={side}
              depth={depth + 1}
              currentVoter={currentVoter}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
