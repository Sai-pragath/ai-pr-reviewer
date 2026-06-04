import React, { useState, useEffect } from 'react';
import { GitPullRequest, ShieldAlert, Zap, Layers, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface AnalyticsSummary {
  totalPrsReviewed: number;
  averageTimeSeconds: number;
  totalCommentsCount: number;
  activeReposCount: number;
  categoryDistribution: {
    security: number;
    codeSmell: number;
    optimization: number;
    bugRisk: number;
  };
  dailyTrend: { date: string; count: number }[];
}

export const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsSummary>({
    totalPrsReviewed: 142,
    averageTimeSeconds: 14.8,
    totalCommentsCount: 389,
    activeReposCount: 8,
    categoryDistribution: {
      security: 42,
      codeSmell: 184,
      optimization: 112,
      bugRisk: 51
    },
    dailyTrend: [
      { date: 'Mon', count: 12 },
      { date: 'Tue', count: 18 },
      { date: 'Wed', count: 15 },
      { date: 'Thu', count: 24 },
      { date: 'Fri', count: 32 },
      { date: 'Sat', count: 8 },
      { date: 'Sun', count: 33 }
    ]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/analytics/summary');
      if (response.ok) {
        const json = await response.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Backend not running yet, using high-fidelity mock data fallback.', e);
    } finally {
      setTimeout(() => setLoading(false), 500); // smooth transition
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute values for SVG charts
  const categories = [
    { label: 'Code Smells', value: data.categoryDistribution.codeSmell, color: 'var(--accent-cyan)' },
    { label: 'Optimization', value: data.categoryDistribution.optimization, color: 'var(--accent-purple)' },
    { label: 'Security', value: data.categoryDistribution.security, color: 'var(--accent-rose)' },
    { label: 'Bug Risks', value: data.categoryDistribution.bugRisk, color: 'var(--accent-amber)' },
  ];
  
  const totalIssues = categories.reduce((sum, c) => sum + c.value, 0);
  
  // Donut chart calculations
  let accumulatedPercent = 0;
  const donutSlices = categories.map(c => {
    const percent = totalIssues > 0 ? (c.value / totalIssues) * 100 : 0;
    const offset = 100 - accumulatedPercent;
    accumulatedPercent += percent;
    return { ...c, percent, offset };
  });

  // Line chart trend calculations
  const maxTrend = Math.max(...data.dailyTrend.map(t => t.count), 1);
  const chartHeight = 120;
  const chartWidth = 500;
  const points = data.dailyTrend.map((t, idx) => {
    const x = (idx / (data.dailyTrend.length - 1)) * chartWidth;
    const y = chartHeight - (t.count / maxTrend) * (chartHeight - 20) - 10;
    return { x, y, ...t };
  });
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div>
      {/* Stat Cards Grid */}
      <div className="grid-4">
        <div className="card card-glowing cyan-glow">
          <div className="stat-card">
            <div>
              <div className="card-title">PRs Reviewed</div>
              <div className="stat-value">{data.totalPrsReviewed}</div>
              <div className="stat-trend trend-up">
                <span>+12.4%</span> this week
              </div>
            </div>
            <div className="stat-icon">
              <GitPullRequest size={22} />
            </div>
          </div>
        </div>

        <div className="card card-glowing rose-glow">
          <div className="stat-card">
            <div>
              <div className="card-title">Security Flaws Found</div>
              <div className="stat-value">{data.categoryDistribution.security}</div>
              <div className="stat-trend trend-down">
                <span>-4.2%</span> from last month
              </div>
            </div>
            <div className="stat-icon">
              <ShieldAlert size={22} />
            </div>
          </div>
        </div>

        <div className="card card-glowing purple-glow">
          <div className="stat-card">
            <div>
              <div className="card-title">Avg Review Time</div>
              <div className="stat-value">{data.averageTimeSeconds}s</div>
              <div className="stat-trend trend-up">
                <span>-1.2s</span> optimization
              </div>
            </div>
            <div className="stat-icon">
              <Clock size={22} />
            </div>
          </div>
        </div>

        <div className="card card-glowing emerald-glow">
          <div className="stat-card">
            <div>
              <div className="card-title">Active Repositories</div>
              <div className="stat-value">{data.activeReposCount}</div>
              <div className="stat-trend trend-up">
                <span>+1 new</span> repository
              </div>
            </div>
            <div className="stat-icon">
              <Layers size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid-2">
        {/* Trend Line Chart */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Review Activity Trend</h3>
            <button className="btn-icon" onClick={fetchData} disabled={loading} title="Refresh analytics">
              <RefreshCw size={16} className={loading ? 'spin' : ''} style={{ animation: loading ? 'progressFlow 1s linear infinite' : 'none' }} />
            </button>
          </div>
          
          <div style={{ position: 'relative', height: '180px', marginTop: '20px' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Horizontal Grid lines */}
              <line x1="0" y1={chartHeight / 3} x2={chartWidth} y2={chartHeight / 3} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <line x1="0" y1={(2 * chartHeight) / 3} x2={chartWidth} y2={(2 * chartHeight) / 3} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              
              {/* Area */}
              <path d={areaPath} fill="url(#chartGlow)" />
              
              {/* Line */}
              <path d={linePath} fill="none" stroke="var(--accent-cyan)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Points & Labels */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-primary)" stroke="var(--accent-cyan)" strokeWidth="2" />
                  <text x={p.x} y={p.y - 8} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">{p.count}</text>
                </g>
              ))}
            </svg>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', marginTop: '8px' }}>
              {data.dailyTrend.map((t, idx) => (
                <span key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Category Donut Chart */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Detected Issues Breakdown</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total: {totalIssues} issues</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginTop: '16px' }}>
            <div style={{ width: '130px', height: '130px', position: 'relative', flexShrink: 0 }}>
              <svg viewBox="0 0 42 42" width="100%" height="100%">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg-tertiary)" strokeWidth="5.5" />
                {donutSlices.map((slice, idx) => (
                  <circle
                    key={idx}
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="5.5"
                    strokeDasharray={`${slice.percent} ${100 - slice.percent}`}
                    strokeDashoffset={slice.offset}
                    transform="rotate(-90 21 21)"
                  />
                ))}
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{data.totalCommentsCount}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Comments</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {donutSlices.map((c, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {c.value} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>({Math.round(c.percent)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reviews Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent PR Review Logs</h3>
          <span className="badge badge-cyan">Real-time Hook</span>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Repository</th>
                <th>Pull Request</th>
                <th>Author</th>
                <th>Bugs</th>
                <th>Security</th>
                <th>Time Taken</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>spring-petclinic</td>
                <td><span style={{ fontWeight: 600, color: 'white' }}>#104</span> Upgrade to Spring Security 6.2</td>
                <td>alex_dev</td>
                <td><span style={{ color: 'var(--accent-amber)' }}>2</span></td>
                <td><span className="badge badge-rose">1 critical</span></td>
                <td>12.5s</td>
                <td><span className="badge badge-emerald"><CheckCircle size={12} style={{ marginRight: 4 }} /> Action Posted</span></td>
              </tr>
              <tr>
                <td>react-dashboard</td>
                <td><span style={{ fontWeight: 600, color: 'white' }}>#42</span> Implement custom hook for websockets</td>
                <td>lisa_frontend</td>
                <td><span style={{ color: 'var(--accent-cyan)' }}>1</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>0</span></td>
                <td>14.1s</td>
                <td><span className="badge badge-emerald"><CheckCircle size={12} style={{ marginRight: 4 }} /> Action Posted</span></td>
              </tr>
              <tr>
                <td>payment-gateway</td>
                <td><span style={{ fontWeight: 600, color: 'white' }}>#89</span> Hotfix for checkout race condition</td>
                <td>mike_backend</td>
                <td><span style={{ color: 'var(--accent-rose)' }}>3</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>0</span></td>
                <td>9.8s</td>
                <td><span className="badge badge-emerald"><CheckCircle size={12} style={{ marginRight: 4 }} /> Action Posted</span></td>
              </tr>
              <tr>
                <td>auth-service</td>
                <td><span style={{ fontWeight: 600, color: 'white' }}>#55</span> Implement OAuth2 authentication bypass</td>
                <td>hacker_bob</td>
                <td><span style={{ color: 'var(--accent-amber)' }}>1</span></td>
                <td><span className="badge badge-rose">2 critical</span></td>
                <td>18.4s</td>
                <td><span className="badge badge-purple"><AlertTriangle size={12} style={{ marginRight: 4 }} /> Block Recommended</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
