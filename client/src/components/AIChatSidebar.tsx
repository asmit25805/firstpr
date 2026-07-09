import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Eraser, Square } from 'lucide-react';
import type { ChatMessage as ChatMessageType, Issue, ProviderConfig, ScopeBrief } from '../types';
import type { CodeContextPayload } from '../lib/ai';
import { streamChat } from '../lib/ai';
import { ChatMessage } from './ChatMessage';

const QUICK_ACTIONS = [
  { label: 'Review my code', prompt: 'Can you look at what I have so far and tell me what looks right and what looks off? Please explain why rather than fixing it for me.' },
  { label: "I'm stuck", prompt: "I'm stuck and not sure what to try next on this issue. Can you help me think through it?" },
  { label: 'Explain this error', prompt: 'I got an error I don\u2019t understand. Can you help me read it and figure out what it means?' },
];

interface Props {
  issue: Issue;
  scopeBrief: ScopeBrief | null;
  codeContext: CodeContextPayload | null;
  provider: ProviderConfig;
  isConfigured: boolean;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function AIChatSidebar({ issue, scopeBrief, codeContext, provider, isConfigured }: Props) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessageType = { id: makeId(), role: 'user', content: trimmed };
    const assistantMsg: ChatMessageType = { id: makeId(), role: 'assistant', content: '' };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, assistantMsg]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(
        { issue, scopeBrief, codeContext, messages: nextMessages, provider },
        (token) => {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: last.content + token };
            return copy;
          });
        },
        controller.signal
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            content: (err as Error).message || 'Something went wrong talking to the AI provider.',
            isError: true,
          };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-text">
          <Sparkles size={14} className="text-violet" />
          Mentor
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setMessages([])}
            title="Clear conversation"
            className="rounded p-1 text-text-faint hover:bg-surface-2 hover:text-text"
          >
            <Eraser size={13} />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="rounded-lg border border-line-soft bg-surface-2 p-3 text-[12.5px] leading-relaxed text-text-muted">
            I can see the file you have open and I know the goal of{' '}
            <span className="text-text">#{issue.number}</span>. Ask me anything about it — I'll help you reason
            through it rather than hand you the fix.
          </div>
        )}
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} streaming={streaming && m.id === messages[messages.length - 1]?.id} />
        ))}
      </div>

      {messages.length === 0 && (
        <div className="shrink-0 border-t border-line-soft px-3 py-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => send(a.prompt)}
                disabled={!isConfigured}
                className="rounded-full border border-line px-2.5 py-1 text-[11.5px] text-text-muted hover:border-violet/40 hover:text-violet disabled:opacity-40"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="shrink-0 border-t border-line p-2.5"
      >
        {!isConfigured ? (
          <p className="px-1 text-[12px] text-diff-attn">
            Set up an AI provider in Settings to start chatting.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about the issue, or paste an error…"
              rows={2}
              className="min-h-[42px] flex-1 resize-none rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13px] text-text placeholder:text-text-faint focus:border-violet focus:outline-none"
            />
            {streaming ? (
              <button
                type="button"
                onClick={stop}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-text-muted hover:text-text"
                title="Stop"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet text-ink disabled:opacity-40"
                title="Send"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
