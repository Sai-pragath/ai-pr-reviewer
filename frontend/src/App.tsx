import { useState } from 'react';
import { LayoutDashboard, Settings, GitFork, History, Bell, Cpu } from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { RulesView } from './components/RulesView';
import { RepositoriesView } from './components/RepositoriesView';
import { HistoryView } from './components/HistoryView';

type ViewState = 'dashboard' | 'rules' | 'repositories' | 'history';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">AI</div>
          <div>
            <h1 className="logo-text">PR Reviewer</h1>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              EC2 Agent Portal
            </span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className="menu-item">
            <button
              className={`menu-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
          </li>
          <li className="menu-item">
            <button
              className={`menu-link ${currentView === 'rules' ? 'active' : ''}`}
              onClick={() => setCurrentView('rules')}
            >
              <Settings size={18} />
              <span>Review Rules</span>
            </button>
          </li>
          <li className="menu-item">
            <button
              className={`menu-link ${currentView === 'repositories' ? 'active' : ''}`}
              onClick={() => setCurrentView('repositories')}
            >
              <GitFork size={18} />
              <span>Repositories</span>
            </button>
          </li>
          <li className="menu-item">
            <button
              className={`menu-link ${currentView === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentView('history')}
            >
              <History size={18} />
              <span>Review History</span>
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-avatar">AD</div>
          <div className="user-info">
            <span className="user-name">Admin Portal</span>
            <span className="user-role">AWS EC2 Deployment</span>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 className="header-title">
              {currentView === 'dashboard' && 'System Analytics'}
              {currentView === 'rules' && 'Review Rules Configuration'}
              {currentView === 'repositories' && 'GitHub Integrations'}
              {currentView === 'history' && 'Audit Review History'}
            </h2>
          </div>

          <div className="header-actions">
            {/* Server Status indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--accent-emerald)'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-emerald)',
                boxShadow: '0 0 8px var(--accent-emerald)'
              }} />
              <span>Agent Status: Online</span>
            </div>

            <button className="btn-icon" title="Notifications">
              <Bell size={18} />
            </button>

            <button className="btn-icon" title="System Settings">
              <Cpu size={18} />
            </button>
          </div>
        </header>

        {/* Dynamic page container */}
        <div className="content-body">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'rules' && <RulesView />}
          {currentView === 'repositories' && <RepositoriesView />}
          {currentView === 'history' && <HistoryView />}
        </div>
      </main>
    </div>
  );
}

export default App;
