import React, { useState } from 'react';
import { GitBranch, ShieldCheck, Key, HelpCircle, Link2, Copy, Check, Eye, EyeOff } from 'lucide-react';

interface Repository {
  id: number;
  owner: string;
  name: string;
  webhookUrl: string;
  webhookStatus: 'ACTIVE' | 'PENDING' | 'FAILED';
  lastPing: string;
  targetBranches: string[];
}

export const RepositoriesView: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [repos, setRepos] = useState<Repository[]>([
    {
      id: 1,
      owner: 'acme-org',
      name: 'spring-petclinic',
      webhookUrl: 'http://3.124.9.45:8080/api/v1/webhooks/github',
      webhookStatus: 'ACTIVE',
      lastPing: '2 mins ago',
      targetBranches: ['main', 'develop']
    },
    {
      id: 2,
      owner: 'acme-org',
      name: 'react-dashboard',
      webhookUrl: 'http://3.124.9.45:8080/api/v1/webhooks/github',
      webhookStatus: 'ACTIVE',
      lastPing: '1 hour ago',
      targetBranches: ['main']
    },
    {
      id: 3,
      owner: 'personal-project',
      name: 'payment-gateway',
      webhookUrl: 'http://3.124.9.45:8080/api/v1/webhooks/github',
      webhookStatus: 'PENDING',
      lastPing: 'Never',
      targetBranches: ['master']
    }
  ]);

  const [newOwner, setNewOwner] = useState('');
  const [newName, setNewName] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [githubPat, setGithubPat] = useState('');
  const [targetBranchesInput, setTargetBranchesInput] = useState('main, develop');

  const handleConnectRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwner || !newName) return;

    const newRepo: Repository = {
      id: Date.now(),
      owner: newOwner,
      name: newName,
      webhookUrl: 'http://3.124.9.45:8080/api/v1/webhooks/github',
      webhookStatus: 'PENDING',
      lastPing: 'Never',
      targetBranches: targetBranchesInput.split(',').map(b => b.trim()).filter(Boolean)
    };

    setRepos([...repos, newRepo]);
    setNewOwner('');
    setNewName('');
    
    setSuccessMsg(`Repository ${newOwner}/${newName} connected successfully. Set up the webhook in your GitHub repository settings.`);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid var(--accent-cyan)',
          color: 'var(--accent-cyan)',
          padding: '16px',
          borderRadius: '10px',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {successMsg}
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        
        {/* Repo Connect Form */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
              <Link2 size={18} style={{ color: 'var(--accent-cyan)' }} />
              Connect GitHub Repository
            </h3>
          </div>

          <form onSubmit={handleConnectRepo}>
            <div className="grid-2" style={{ margin: 0, gap: '16px', marginBottom: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">GitHub Owner / Org</label>
                <input
                  type="text"
                  className="form-input"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="e.g. acme-org"
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Repository Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. spring-petclinic"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Branches (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                value={targetBranchesInput}
                onChange={(e) => setTargetBranchesInput(e.target.value)}
                placeholder="main, develop, staging"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                GitHub Personal Access Token (PAT)
                <span style={{ cursor: 'pointer', color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowToken(!showToken)}>
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />} {showToken ? 'Hide' : 'Show'}
                </span>
              </label>
              <input
                type={showToken ? 'text' : 'password'}
                className="form-input"
                value={githubPat}
                onChange={(e) => setGithubPat(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Requires `repo` scope to read diffs and post inline pull request review comments.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Webhook Secret (for validation)</label>
              <input
                type="password"
                className="form-input"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Enter HMAC secret passphrase"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Connect Repository
            </button>
          </form>
        </div>

        {/* Webhook Guide Card */}
        <div className="card" style={{ height: '100%' }}>
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
              <HelpCircle size={18} style={{ color: 'var(--accent-purple)' }} />
              GitHub Webhook Setup Tutorial
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <p>To enable automated review on commits, register this webhook URL in GitHub:</p>
            
            <div style={{
              backgroundColor: '#0c0f1b',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'white'
            }}>
              <span>http://[your-ec2-ip]:8080/api/v1/webhooks/github</span>
              <button
                className="btn-icon"
                style={{ width: '28px', height: '28px', borderRadius: '4px' }}
                onClick={() => handleCopy('http://3.124.9.45:8080/api/v1/webhooks/github', 99)}
              >
                {copiedIndex === 99 ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
              </button>
            </div>

            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>Navigate to GitHub Repository &rarr; <strong>Settings</strong> &rarr; <strong>Webhooks</strong> &rarr; <strong>Add Webhook</strong>.</li>
              <li>Set Payload URL to the URL above.</li>
              <li>Choose Content type to <strong>application/json</strong>.</li>
              <li>Provide the same <strong>Secret</strong> passphrase configured on the left.</li>
              <li>Under trigger events, select <strong>Let me select individual events</strong> and mark <strong>Pull Requests</strong>.</li>
              <li>Save changes. The system will process review logs automatically on incoming payloads.</li>
            </ol>
          </div>
        </div>

      </div>

      {/* Connected Repos Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
            <GitBranch size={18} style={{ color: 'var(--accent-purple)' }} />
            Connected Repositories
          </h3>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Org / Repository</th>
                <th>Target Webhook URL</th>
                <th>Webhook Validation</th>
                <th>Last Active Ping</th>
                <th>Branches Tracked</th>
              </tr>
            </thead>
            <tbody>
              {repos.map((repo, idx) => (
                <tr key={repo.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>
                        {repo.owner} / {repo.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {repo.webhookUrl}
                      </span>
                      <button
                        className="btn-icon"
                        style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                        onClick={() => handleCopy(repo.webhookUrl, idx)}
                      >
                        {copiedIndex === idx ? <Check size={12} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                  <td>
                    {repo.webhookStatus === 'ACTIVE' ? (
                      <span className="badge badge-emerald">
                        <ShieldCheck size={12} style={{ marginRight: 4 }} /> Connected
                      </span>
                    ) : (
                      <span className="badge badge-amber">
                        <Key size={12} style={{ marginRight: 4 }} /> Pending Ping
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{repo.lastPing}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {repo.targetBranches.map((branch, bIdx) => (
                        <span key={bIdx} className="badge badge-purple" style={{ borderRadius: '4px', fontSize: '0.7rem' }}>
                          {branch}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
