import { NavLink } from 'react-router-dom';
import { GitBranch, Compass, MonitorPlay, Settings2, CircleCheck, CircleAlert } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { PROVIDER_INFO } from '../context/SettingsContext';

const linkBase =
  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5';
const linkActive = 'bg-surface-3 text-text';
const linkInactive = 'text-text-muted hover:text-text hover:bg-surface-2';

export function Navbar() {
  const { settings, isConfigured } = useSettings();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-dim text-violet">
            <GitBranch size={16} strokeWidth={2.5} />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-text">
            First<span className="text-violet">PR</span>
          </span>
        </NavLink>

        <nav className="flex items-center gap-1">
          <NavLink to="/explore" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <Compass size={15} />
            <span className="hidden sm:inline">Find an issue</span>
          </NavLink>
          <NavLink to="/workspace" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <MonitorPlay size={15} />
            <span className="hidden sm:inline">Workspace</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
            title={isConfigured ? `AI mentor: ${PROVIDER_INFO[settings.provider.name].label}` : 'AI mentor not set up yet'}
          >
            <Settings2 size={15} />
            <span className="hidden sm:inline">Settings</span>
            {isConfigured ? (
              <CircleCheck size={13} className="text-diff-add" />
            ) : (
              <CircleAlert size={13} className="text-diff-attn" />
            )}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
