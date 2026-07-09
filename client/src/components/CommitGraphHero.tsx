// The site's one signature visual: the actual git graph of contributing to
// open source (fork -> branch -> commits -> merge), rendered literally
// instead of a generic numbered-step list. See docs in the frontend-design
// notes: use a sequence motif only when the content genuinely is one.
const STEPS = [
  { x: 90, title: 'Find an issue', desc: 'Search good-first-issue, bug, and security labels across GitHub' },
  { x: 290, title: 'Fork, clone, branch', desc: 'One-click fork link plus the exact commands to run' },
  { x: 560, title: 'Code with your mentor', desc: 'AI sees your code and asks questions — never hands you the fix' },
  { x: 800, title: 'Open your PR', desc: 'Merge back with a clean, focused pull request' },
];

export function CommitGraphHero() {
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 900 230"
        className="draw-in mx-auto block w-full min-w-[720px] max-w-4xl"
        style={{ ['--draw-length' as string]: 1400 }}
        fill="none"
      >
        {/* main branch line */}
        <line x1="20" y1="40" x2="880" y2="40" stroke="var(--color-line)" strokeWidth="2.5" />
        <text x="20" y="24" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-text-faint)">
          main
        </text>

        {/* feature branch path: dips down after step 1, rejoins before step 4 */}
        <path
          d="M 90 40 C 90 90, 90 90, 150 90 L 730 90 C 790 90, 800 90, 800 40"
          stroke="var(--color-violet)"
          strokeWidth="2.5"
        />

        {/* fork point */}
        <circle cx="90" cy="40" r="6" fill="var(--color-ink)" stroke="var(--color-violet)" strokeWidth="2.5" />

        {/* commit dots on the feature branch */}
        <circle cx="290" cy="90" r="6" fill="var(--color-diff-add)" />
        <circle cx="440" cy="90" r="6" fill="var(--color-diff-add)" />
        <circle cx="590" cy="90" r="6" fill="var(--color-diff-add)" />

        {/* merge point */}
        <circle cx="800" cy="40" r="6" fill="var(--color-ink)" stroke="var(--color-violet)" strokeWidth="2.5" />

        {/* step labels */}
        {STEPS.map((step, i) => (
          <g key={step.title}>
            <text
              x={step.x}
              y="130"
              textAnchor="middle"
              fontFamily="Space Grotesk, sans-serif"
              fontSize="14"
              fontWeight="600"
              fill="var(--color-text)"
            >
              {i + 1}. {step.title}
            </text>
            <foreignObject x={step.x - 100} y="140" width="200" height="70">
              <p
                style={{
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontSize: '12px',
                  lineHeight: 1.4,
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  margin: 0,
                }}
              >
                {step.desc}
              </p>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  );
}
