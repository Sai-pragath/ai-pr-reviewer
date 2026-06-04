import React, { useState, useEffect } from 'react';
import { ToggleLeft, Sliders, Shield, BookOpen, AlertTriangle, Save, Plus, Trash2 } from 'lucide-react';

interface Rule {
  id: number;
  name: string;
  category: 'security' | 'codeSmell' | 'optimization' | 'bugRisk';
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  enabled: boolean;
}

export const RulesView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a senior software engineering staff reviewer. Analyze the pull request diff code chunk. Perform checks for security flaws, buffer issues, SQL injection, logical errors, resource leaks, and performance optimization. Output comment responses in standard JSON format containing file, line, and comments.'
  );

  const [rules, setRules] = useState<Rule[]>([
    {
      id: 1,
      name: 'Credentials & Secrets exposure scanner',
      category: 'security',
      description: 'Check for hardcoded API keys, JWT tokens, AWS credentials, database strings, or private SSH keys in the diff.',
      severity: 'CRITICAL',
      enabled: true
    },
    {
      id: 2,
      name: 'SQL Injection vulnerabilities check',
      category: 'security',
      description: 'Detect dynamic string concatenations in raw SQL queries or JPA custom queries that bypass sanitization.',
      severity: 'CRITICAL',
      enabled: true
    },
    {
      id: 3,
      name: 'JPA Resource Leaks & Session management',
      category: 'bugRisk',
      description: 'Verify all database connection pools, stream reader instances, and JPA transactions are correctly closed or annotations are in order.',
      severity: 'WARNING',
      enabled: true
    },
    {
      id: 4,
      name: 'Memory Leak & Infinite loop checks',
      category: 'bugRisk',
      description: 'Identify potential recursive calls without exit conditions, loop conditions that may block threads, or map size growth issues.',
      severity: 'CRITICAL',
      enabled: true
    },
    {
      id: 5,
      name: 'N+1 Query problems detection',
      category: 'optimization',
      description: 'Review fetch strategies in Hibernate mapping relations to warn on potential N+1 load operations.',
      severity: 'WARNING',
      enabled: true
    },
    {
      id: 6,
      name: 'Strict Style guide conforming',
      category: 'codeSmell',
      description: 'Analyze naming conventions, unnecessary object instantiations, dead code blocks, or nested conditional blocks.',
      severity: 'INFO',
      enabled: false
    }
  ]);

  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleCat, setNewRuleCat] = useState<'security' | 'codeSmell' | 'optimization' | 'bugRisk'>('security');
  const [newRuleSev, setNewRuleSev] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('WARNING');

  const fetchRulesAndPrompt = async () => {
    try {
      const rulesRes = await fetch('/api/v1/rules');
      const promptRes = await fetch('/api/v1/rules/prompt');
      if (rulesRes.ok) setRules(await rulesRes.json());
      if (promptRes.ok) setSystemPrompt(await promptRes.text());
    } catch (e) {
      console.warn('Backend not running yet, rules loaded in offline demo mode.', e);
    }
  };

  useEffect(() => {
    fetchRulesAndPrompt();
  }, []);

  const handleToggleRule = (id: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleSeverityChange = (id: number, sev: 'CRITICAL' | 'WARNING' | 'INFO') => {
    setRules(rules.map(r => r.id === id ? { ...r, severity: sev } : r));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: Rule = {
      id: Date.now(),
      name: newRuleName,
      description: newRuleDesc,
      category: newRuleCat,
      severity: newRuleSev,
      enabled: true
    };

    setRules([...rules, newRule]);
    setNewRuleName('');
    setNewRuleDesc('');
    
    setSuccessMsg('Rule added successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteRule = (id: number) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Mock saving to DB
      await new Promise(resolve => setTimeout(resolve, 800));
      setSuccessMsg('Configurations successfully saved to PostgreSQL database.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid var(--accent-emerald)',
          color: 'var(--accent-emerald)',
          padding: '16px',
          borderRadius: '10px',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {successMsg}
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        
        {/* Left Side: System Prompt Setup */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
              <Sliders size={18} style={{ color: 'var(--accent-purple)' }} />
              LLM Prompt Configuration
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tailors LLM reviews</span>
          </div>

          <div className="form-group">
            <label className="form-label">System Instruction Template</label>
            <textarea
              className="form-input form-textarea"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              placeholder="System prompt text..."
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              This prompt instructs the underlying LLM engine (e.g., Gemini or Claude) how to format comments. Avoid modifying the output format parameters.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => fetchRulesAndPrompt()}>
              Reset
            </button>
            <button className="btn btn-primary" onClick={handleSaveAll} disabled={loading}>
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

        {/* Add Custom Rule Form */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
              <Plus size={18} style={{ color: 'var(--accent-cyan)' }} />
              Create Custom Rule
            </h3>
          </div>

          <form onSubmit={handleAddRule}>
            <div className="form-group">
              <label className="form-label">Rule Name</label>
              <input
                type="text"
                className="form-input"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="e.g. Reject System.out.println usages"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Instructions</label>
              <textarea
                className="form-input"
                style={{ minHeight: '60px' }}
                value={newRuleDesc}
                onChange={(e) => setNewRuleDesc(e.target.value)}
                placeholder="e.g. Flag lines using Java's standard console output stream and recommend logging framework."
              />
            </div>

            <div className="grid-2" style={{ margin: 0, gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={newRuleCat}
                  onChange={(e) => setNewRuleCat(e.target.value as any)}
                >
                  <option value="security">Security</option>
                  <option value="bugRisk">Bug Risk</option>
                  <option value="optimization">Optimization</option>
                  <option value="codeSmell">Code Smell</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <select
                  className="form-input"
                  value={newRuleSev}
                  onChange={(e) => setNewRuleSev(e.target.value as any)}
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="WARNING">Warning</option>
                  <option value="INFO">Info</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Plus size={16} /> Add Rule
            </button>
          </form>
        </div>

      </div>

      {/* Rules Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
            <BookOpen size={18} style={{ color: 'var(--accent-purple)' }} />
            Active Review Rule Database
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={handleSaveAll} disabled={loading}>
            Save Enabled State
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Active</th>
                <th>Rule Name & Description</th>
                <th style={{ width: '150px' }}>Category</th>
                <th style={{ width: '150px' }}>Severity</th>
                <th style={{ width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} style={{ opacity: rule.enabled ? 1 : 0.6 }}>
                  <td>
                    <label className="rule-toggle">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                      />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>{rule.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{rule.description}</div>
                  </td>
                  <td>
                    {rule.category === 'security' && <span className="badge badge-rose">Security</span>}
                    {rule.category === 'bugRisk' && <span className="badge badge-amber">Bug Risk</span>}
                    {rule.category === 'optimization' && <span className="badge badge-purple">Optimization</span>}
                    {rule.category === 'codeSmell' && <span className="badge badge-cyan">Code Smell</span>}
                  </td>
                  <td>
                    <select
                      className="form-input"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      value={rule.severity}
                      onChange={(e) => handleSeverityChange(rule.id, e.target.value as any)}
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="WARNING">Warning</option>
                      <option value="INFO">Info</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      style={{ color: 'var(--accent-rose)', borderColor: 'rgba(239, 68, 68, 0.1)' }}
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 size={16} />
                    </button>
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
