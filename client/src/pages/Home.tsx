import { Link } from 'react-router-dom';
import { ArrowRight, Ban, MessagesSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { CommitGraphHero } from '../components/CommitGraphHero';

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-14 text-center">
        <div className="rise-in mx-auto mb-5 flex w-fit items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12px] text-text-muted">
          <Sparkles size={12} className="text-violet" />
          Bring your own AI key — free or paid, your choice
        </div>
        <h1 className="rise-in font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl" style={{ animationDelay: '60ms' }}>
          Your first open-source PR,<br className="hidden sm:block" /> with a mentor who won't just{' '}
          <span className="text-violet">do it for you</span>.
        </h1>
        <p className="rise-in mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-text-muted" style={{ animationDelay: '120ms' }}>
          Find a real, beginner-friendly issue on GitHub, then get an AI mentor that can see your code,
          explains what's wrong and why, and is locked to the exact scope of that one issue — no
          copy-pasted fixes, no scope creep, no hallucinated files.
        </p>
        <div className="rise-in mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: '180ms' }}>
          <Link
            to="/explore"
            className="flex items-center gap-2 rounded-lg bg-violet px-5 py-2.5 text-[14px] font-semibold text-ink transition-opacity hover:opacity-90"
          >
            Find your first issue <ArrowRight size={15} />
          </Link>
          <Link
            to="/settings"
            className="rounded-lg border border-line px-5 py-2.5 text-[14px] font-medium text-text-muted transition-colors hover:border-line-soft hover:text-text"
          >
            Set up your AI key
          </Link>
        </div>
      </section>

      {/* How it works — the signature commit graph */}
      <section className="border-y border-line bg-surface/40 py-14">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center font-display text-xl font-semibold text-text">How it actually works</h2>
          <p className="mx-auto mt-2 max-w-md text-center text-[13.5px] text-text-muted">
            It's the same shape as any real contribution — we just built the tooling around it.
          </p>
          <div className="mt-10">
            <CommitGraphHero />
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold text-text">Teach, don't tell.</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-text-muted">
              Every session starts by turning the raw GitHub issue into a scope brief: the goal, what
              "done" looks like, and — just as importantly — what's explicitly{' '}
              <em className="text-text">out of scope</em> for this PR. The AI mentor is instructed to hold
              to that brief for the whole conversation.
            </p>
            <ul className="mt-5 space-y-3">
              <li className="flex gap-2.5 text-[13.5px] text-text-muted">
                <Ban size={16} className="mt-0.5 shrink-0 text-diff-danger" />
                It won't write the fix for you, even if you ask twice.
              </li>
              <li className="flex gap-2.5 text-[13.5px] text-text-muted">
                <MessagesSquare size={16} className="mt-0.5 shrink-0 text-violet" />
                It asks what you've tried before it explains anything.
              </li>
              <li className="flex gap-2.5 text-[13.5px] text-text-muted">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-diff-add" />
                It only reasons about code you've actually shown it — never invents files or APIs.
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="font-mono text-[11px] uppercase tracking-wide text-text-faint">Example exchange</p>
            <div className="mt-3 space-y-3 text-[13px] leading-relaxed">
              <div className="rounded-lg bg-surface-2 px-3 py-2 text-text-muted">
                "Just give me the fixed function, I'm stuck."
              </div>
              <div className="rounded-lg border border-violet/25 bg-violet-dim/40 px-3 py-2 text-text">
                "I won't write it for you, but let's narrow it down — when you log the value right before
                the return statement, what do you actually see? That'll tell us if the bug is in the input
                or in how it's transformed."
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-10 text-center">
        <p className="text-[13px] text-text-muted">
          Free and open source. Fork it, star it, or make it your first PR of all —{' '}
          {/* TODO: point this at your own repo once you've pushed it, e.g. https://github.com/you/firstpr */}
          <a
            href="https://github.com/YOUR-USERNAME/firstpr"
            target="_blank"
            rel="noreferrer"
            className="text-violet hover:underline"
          >
            see the repo
          </a>
          .
        </p>
      </section>
    </div>
  );
}
