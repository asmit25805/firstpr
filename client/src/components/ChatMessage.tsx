import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, User, TriangleAlert } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../types';

export function ChatMessage({ message, streaming }: { message: ChatMessageType; streaming?: boolean }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-surface-3 text-text-muted' : message.isError ? 'bg-diff-danger-dim text-diff-danger' : 'bg-violet-dim text-violet'
        }`}
      >
        {isUser ? <User size={13} /> : message.isError ? <TriangleAlert size={13} /> : <Sparkles size={13} />}
      </div>
      <div
        className={`min-w-0 max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
          isUser
            ? 'bg-violet text-ink'
            : message.isError
              ? 'border border-diff-danger/30 bg-diff-danger-dim text-diff-danger'
              : 'border border-line bg-surface text-text'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-pre:my-2 prose-pre:bg-surface-3 prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-surface-3 prose-code:px-1 prose-code:py-0.5 prose-code:text-[12.5px] prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:text-text prose-strong:text-text prose-a:text-violet">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || (streaming ? '…' : '')}</ReactMarkdown>
          </div>
        )}
        {streaming && message.content && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-violet align-middle" />}
      </div>
    </div>
  );
}
