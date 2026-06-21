import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Brain, Settings, User, Bot } from 'lucide-react';
import DebateSettingsPanel from '@/components/ai/DebateSettingsPanel';
import DebateInput from '@/components/ai/DebateInput';
import TypewriterText from '@/components/ai/TypewriterText';
import { AIDebateSettings, ChatMessage } from '@/types';
import { generateAIResponse, generateOpeningMessage, createChatMessage } from '@/engines/aiDebateEngine';
import { cn } from '@/lib/utils';

export default function AIDebatePage() {
  const [settings, setSettings] = useState<AIDebateSettings | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiCurrentText, setAiCurrentText] = useState('');
  const [roundNumber, setRoundNumber] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiSide = settings?.userSide === 'pro' ? 'con' : 'pro';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiCurrentText]);

  const handleStart = (newSettings: AIDebateSettings) => {
    setSettings(newSettings);
    setIsStarted(true);
    setRoundNumber(0);
    const openingMsg = generateOpeningMessage(newSettings);
    setMessages([openingMsg]);
  };

  const handleUserSubmit = (text: string) => {
    if (!settings || isAIGenerating) return;

    const userMsg = createChatMessage('user', text, settings.userSide);
    setMessages((prev) => [...prev, userMsg]);
    setIsAIGenerating(true);
    setAiCurrentText('');
    setRoundNumber((prev) => prev + 1);

    setTimeout(() => {
      const aiResponse = generateAIResponse(settings, [...messages, userMsg], text);
      let charIndex = 0;
      const typeSpeed = 25;

      const typeInterval = setInterval(() => {
        charIndex += 1;
        setAiCurrentText(aiResponse.slice(0, charIndex));

        if (charIndex >= aiResponse.length) {
          clearInterval(typeInterval);
          const aiMsg = createChatMessage('ai', aiResponse, aiSide);
          setMessages((prev) => [...prev, aiMsg]);
          setIsAIGenerating(false);
          setAiCurrentText('');
        }
      }, typeSpeed);
    }, 800);
  };

  const handleReset = () => {
    setSettings(null);
    setMessages([]);
    setIsStarted(false);
    setIsAIGenerating(false);
    setAiCurrentText('');
    setRoundNumber(0);
    setShowSettings(false);
  };

  const handleNewRound = () => {
    if (!settings) return;
    const openingMsg = generateOpeningMessage(settings);
    setMessages([openingMsg]);
    setRoundNumber(0);
    setIsAIGenerating(false);
    setAiCurrentText('');
  };

  if (!isStarted || !settings) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-ivory-50">
        <DebateSettingsPanel onStart={handleStart} />
      </div>
    );
  }

  const difficultyLabels = {
    easy: '入门',
    medium: '中级',
    hard: '高级',
    expert: '专家',
  };

  const modeLabels = {
    practice: '练习模式',
    challenge: '挑战模式',
    casual: '休闲模式',
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-ivory-50 flex flex-col">
      <div className="bg-white border-b border-navy-100/80 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-navy-50 text-navy-500 hover:text-navy-800 transition-colors"
              title="返回设置"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-serif text-lg font-bold text-navy-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-gold-500" />
                AI 辩论对手
              </h2>
              <p className="text-sm text-navy-500 line-clamp-1">{settings.topic}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-navy-50 text-navy-600 font-medium">
                {modeLabels[settings.mode]}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-gold-50 text-gold-700 font-medium">
                {difficultyLabels[settings.difficulty]}
              </span>
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full font-medium',
                  settings.userSide === 'pro'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                )}
              >
                你：{settings.userSide === 'pro' ? '正方' : '反方'}
              </span>
            </div>
            <button
              onClick={handleNewRound}
              className="p-2 rounded-lg hover:bg-navy-50 text-navy-500 hover:text-navy-800 transition-colors"
              title="重新开始"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              userSide={settings.userSide}
            />
          ))}

          {isAIGenerating && (
            <div className="flex gap-3 justify-start">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-5 py-4',
                  'bg-white border border-navy-100 text-navy-800',
                  'rounded-tl-md shadow-sm'
                )}
              >
                <div className="text-xs text-navy-400 mb-2 font-medium flex items-center gap-2">
                  <span>AI 辩手</span>
                  <span className="text-navy-300">·</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-xs',
                      aiSide === 'pro' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    )}
                  >
                    {aiSide === 'pro' ? '正方' : '反方'}
                  </span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {aiCurrentText ? (
                    <TypewriterText text="" />
                  ) : (
                    <span className="flex items-center gap-1 text-navy-400">
                      <span className="animate-pulse">思考中</span>
                      <span className="inline-flex gap-0.5">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {isAIGenerating && aiCurrentText && (
            <div className="flex gap-3 justify-start">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-5 py-4',
                  'bg-white border border-navy-100 text-navy-800',
                  'rounded-tl-md shadow-sm'
                )}
              >
                <div className="text-xs text-navy-400 mb-2 font-medium flex items-center gap-2">
                  <span>AI 辩手</span>
                  <span className="text-navy-300">·</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded text-xs',
                      aiSide === 'pro' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    )}
                  >
                    {aiSide === 'pro' ? '正方' : '反方'}
                  </span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  <TypewriterText text={aiCurrentText} speed={20} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-navy-100/80 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <DebateInput
            onSubmit={handleUserSubmit}
            disabled={isAIGenerating}
            thinkTimeSeconds={settings.thinkTimeSeconds}
            placeholder={`作为${settings.userSide === 'pro' ? '正方' : '反方'}，输入你的论点... (按 ⌘/Ctrl + Enter 发送)`}
            side={settings.userSide}
          />
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  userSide: 'pro' | 'con';
}

function MessageBubble({ message, userSide }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-md px-5 py-3 rounded-xl bg-navy-50 border border-navy-100 text-navy-600 text-sm text-center">
          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        </div>
      </div>
    );
  }

  const side = isUser ? userSide : userSide === 'pro' ? 'con' : 'pro';
  const sideLabel = side === 'pro' ? '正方' : '反方';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center flex-shrink-0 shadow-md">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-5 py-4',
          isUser &&
            side === 'pro' &&
            'bg-emerald-500 text-white rounded-tr-md shadow-md',
          isUser &&
            side === 'con' &&
            'bg-red-500 text-white rounded-tr-md shadow-md',
          !isUser &&
            'bg-white border border-navy-100 text-navy-800 rounded-tl-md shadow-sm'
        )}
      >
        <div
          className={cn(
            'text-xs mb-2 font-medium flex items-center gap-2',
            isUser ? 'text-white/80' : 'text-navy-400'
          )}
        >
          <span>{isUser ? '你' : 'AI 辩手'}</span>
          <span className={isUser ? 'text-white/60' : 'text-navy-300'}>·</span>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-xs',
              isUser && side === 'pro' && 'bg-white/20 text-white',
              isUser && side === 'con' && 'bg-white/20 text-white',
              !isUser && side === 'pro' && 'bg-emerald-50 text-emerald-600',
              !isUser && side === 'con' && 'bg-red-50 text-red-600'
            )}
          >
            {sideLabel}
          </span>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}
