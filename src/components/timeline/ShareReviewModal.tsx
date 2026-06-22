import { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Share2,
  Download,
  Link as LinkIcon,
  FileText,
  ExternalLink,
  Clock,
  Trophy,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type {
  ReviewShareData,
  TimelineEventType,
} from '@/types';

const TYPE_LABELS: Record<TimelineEventType, string> = {
  argument: '论点提出',
  rebuttal: '精彩反驳',
  mistake: '失误点',
  cross_examine: '质询高潮',
  highlight: '精彩时刻',
  turning_point: '转折点',
  summary: '总结陈词',
};

interface ShareReviewModalProps {
  open: boolean;
  onClose: () => void;
  shareData: ReviewShareData | null;
}

type ExportFormat = 'link' | 'text' | 'markdown';

export default function ShareReviewModal({ open, onClose, shareData }: ShareReviewModalProps) {
  const [format, setFormat] = useState<ExportFormat>('link');
  const [copied, setCopied] = useState(false);

  const exportContent = useMemo(() => {
    if (!shareData) return '';
    const { review, events, shareUrl } = shareData;

    if (format === 'link') {
      return shareUrl;
    }

    if (format === 'text') {
      const lines: string[] = [];
      lines.push(`【比赛复盘】${review.matchTitle}`);
      lines.push(`辩题：${review.topicTitle}`);
      lines.push(`${review.proTeamName}（正方） VS ${review.conTeamName}（反方）`);
      lines.push('');
      lines.push('=== 整体评价 ===');
      lines.push(review.overallComment);
      lines.push('');
      lines.push('=== 胜负分析 ===');
      lines.push(review.winnerAnalysis);
      lines.push('');
      lines.push('=== 关键收获 ===');
      review.keyTakeaways.forEach((k, i) => {
        lines.push(`${i + 1}. ${k}`);
      });
      lines.push('');
      lines.push('=== 时间轴关键事件 ===');
      events.forEach((e) => {
        const mins = Math.floor(e.timestamp / 60000);
        const secs = Math.floor((e.timestamp % 60000) / 1000);
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const sideStr = e.side === 'pro' ? '[正方]' : e.side === 'con' ? '[反方]' : e.side === 'judge' ? '[评委]' : '[双方]';
        lines.push(`[${timeStr}] ${sideStr} ${TYPE_LABELS[e.type]}：${e.title}`);
        if (e.description) {
          lines.push(`    ${e.description}`);
        }
        if (e.tags.length > 0) {
          lines.push(`    标签：${e.tags.map((t) => `#${t}`).join(' ')}`);
        }
        lines.push('');
      });
      lines.push(`复盘记录人：${review.createdBy}`);
      lines.push(`生成时间：${new Date(shareData.generatedAt).toLocaleString('zh-CN')}`);
      lines.push(`分享链接：${shareUrl}`);
      return lines.join('\n');
    }

    if (format === 'markdown') {
      const lines: string[] = [];
      lines.push(`# 比赛复盘：${review.matchTitle}`);
      lines.push('');
      lines.push(`> **辩题**：${review.topicTitle}`);
      lines.push(`>`);
      lines.push(`> **对阵**：${review.proTeamName}（正方） VS ${review.conTeamName}（反方）`);
      lines.push('');
      lines.push('## 整体评价');
      lines.push('');
      lines.push(review.overallComment);
      lines.push('');
      lines.push('## 胜负分析');
      lines.push('');
      lines.push(review.winnerAnalysis);
      lines.push('');
      lines.push('## 关键收获');
      lines.push('');
      review.keyTakeaways.forEach((k, i) => {
        lines.push(`${i + 1}. ${k}`);
      });
      lines.push('');
      lines.push('## 时间轴关键事件');
      lines.push('');
      lines.push('| 时间 | 持方 | 类型 | 事件 |');
      lines.push('|------|------|------|------|');
      events.forEach((e) => {
        const mins = Math.floor(e.timestamp / 60000);
        const secs = Math.floor((e.timestamp % 60000) / 1000);
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const sideStr = e.side === 'pro' ? '正方' : e.side === 'con' ? '反方' : e.side === 'judge' ? '评委' : '双方';
        const importanceStr = '★'.repeat(e.importance) + '☆'.repeat(5 - e.importance);
        lines.push(`| ${timeStr} | ${sideStr} | ${TYPE_LABELS[e.type]} ${importanceStr} | **${e.title}**<br/>${e.description.replace(/\n/g, '<br/>')} |`);
      });
      lines.push('');
      lines.push('---');
      lines.push('');
      lines.push(`- **复盘记录人**：${review.createdBy}`);
      lines.push(`- **生成时间**：${new Date(shareData.generatedAt).toLocaleString('zh-CN')}`);
      lines.push(`- **分享链接**：[点击查看](${shareUrl})`);
      return lines.join('\n');
    }

    return '';
  }, [shareData, format]);

  const handleCopy = async () => {
    if (!exportContent) return;
    try {
      await navigator.clipboard.writeText(exportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = exportContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!shareData || !exportContent) return;
    const ext = format === 'link' ? 'txt' : format === 'markdown' ? 'md' : 'txt';
    const mime = format === 'markdown' ? 'text/markdown' : 'text/plain';
    const blob = new Blob([exportContent], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `比赛复盘_${shareData.review.matchId}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!shareData) return null;
  const { review, events, shareUrl } = shareData;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="分享复盘记录"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary text-sm">
            关闭
          </button>
          <button onClick={handleDownload} className="btn-secondary text-sm">
            <Download className="w-4 h-4" />
            下载文件
          </button>
          <button onClick={handleCopy} className="btn-gold text-sm">
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {format === 'link' ? '复制链接' : '复制内容'}
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-gradient-navy p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-gold-300 flex-shrink-0" />
                <span className="text-xs text-gold-200 font-medium uppercase tracking-wider">比赛复盘</span>
              </div>
              <h4 className="font-serif text-lg font-bold mb-1 leading-snug">
                {review.topicTitle}
              </h4>
              <p className="text-sm text-white/70">
                {review.proTeamName} <span className="text-white/40">VS</span> {review.conTeamName}
              </p>
            </div>
            <Share2 className="w-8 h-8 text-white/40 flex-shrink-0" />
          </div>
        </div>

        <div>
          <label className="label-base">导出格式</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormat('link')}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-medium transition-all',
                format === 'link'
                  ? 'bg-gold-50 text-gold-700 border-gold-300 ring-2 ring-offset-1 ring-gold-300/30'
                  : 'bg-white text-navy-500 border-navy-200 hover:border-navy-300 hover:text-navy-700'
              )}
            >
              <LinkIcon className="w-5 h-5" />
              分享链接
            </button>
            <button
              type="button"
              onClick={() => setFormat('text')}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-medium transition-all',
                format === 'text'
                  ? 'bg-gold-50 text-gold-700 border-gold-300 ring-2 ring-offset-1 ring-gold-300/30'
                  : 'bg-white text-navy-500 border-navy-200 hover:border-navy-300 hover:text-navy-700'
              )}
            >
              <FileText className="w-5 h-5" />
              纯文本
            </button>
            <button
              type="button"
              onClick={() => setFormat('markdown')}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-medium transition-all',
                format === 'markdown'
                  ? 'bg-gold-50 text-gold-700 border-gold-300 ring-2 ring-offset-1 ring-gold-300/30'
                  : 'bg-white text-navy-500 border-navy-200 hover:border-navy-300 hover:text-navy-700'
              )}
            >
              <FileText className="w-5 h-5" />
              Markdown
            </button>
          </div>
        </div>

        {format === 'link' ? (
          <div>
            <label className="label-base">分享链接</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-2.5 rounded-lg border border-navy-200 bg-navy-50 text-sm text-navy-700 font-mono truncate">
                {shareUrl}
              </div>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm px-3"
                title="在新窗口打开"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="mt-2 text-xs text-navy-500">
              将此链接分享给他人，对方即可查看完整复盘记录
            </p>
          </div>
        ) : (
          <div>
            <label className="label-base">
              预览（{format === 'markdown' ? 'Markdown 格式' : '纯文本格式'}）
            </label>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-navy-200 bg-navy-50/50 p-4">
              <pre className="whitespace-pre-wrap text-xs text-navy-700 font-mono leading-relaxed">
                {exportContent}
              </pre>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-ivory-100 p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-navy-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy-700 mb-0.5">
                复盘包含 {events.length} 个关键事件
              </p>
              <p className="text-xs text-navy-500">
                记录人：{review.createdBy} · 最后更新于 {new Date(review.updatedAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
