import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import IssueExplorer from './pages/IssueExplorer';
import IssueDetail from './pages/IssueDetail';
import Workspace from './pages/Workspace';
import Settings from './pages/Settings';

export default function App() {
  return (
    <SettingsProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-ink font-body text-text">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<IssueExplorer />} />
                <Route path="/issue/:owner/:repo/:number" element={<IssueDetail />} />
                <Route path="/workspace" element={<Workspace />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </WorkspaceProvider>
    </SettingsProvider>
  );
}
