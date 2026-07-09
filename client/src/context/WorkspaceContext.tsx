import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Issue, ScopeBrief } from '../types';

const STORAGE_KEY = 'firstpr.workspace.v1';

interface StoredState {
  issue: Issue | null;
  scopeBrief: ScopeBrief | null;
}

function load(): StoredState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { issue: null, scopeBrief: null };
    return JSON.parse(raw);
  } catch {
    return { issue: null, scopeBrief: null };
  }
}

interface WorkspaceContextValue {
  issue: Issue | null;
  scopeBrief: ScopeBrief | null;
  setIssue: (issue: Issue | null) => void;
  setScopeBrief: (brief: ScopeBrief | null) => void;
  reset: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const initial = load();
  const [issue, setIssueState] = useState<Issue | null>(initial.issue);
  const [scopeBrief, setScopeBriefState] = useState<ScopeBrief | null>(initial.scopeBrief);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ issue, scopeBrief }));
  }, [issue, scopeBrief]);

  const setIssue = (next: Issue | null) => {
    setIssueState((prev) => {
      const isDifferentIssue = !next || !prev || prev.owner !== next.owner || prev.repo !== next.repo || prev.number !== next.number;
      if (isDifferentIssue) setScopeBriefState(null);
      return next;
    });
  };

  const setScopeBrief = (next: ScopeBrief | null) => setScopeBriefState(next);

  const reset = () => {
    setIssueState(null);
    setScopeBriefState(null);
  };

  return (
    <WorkspaceContext.Provider value={{ issue, scopeBrief, setIssue, setScopeBrief, reset }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return ctx;
}
