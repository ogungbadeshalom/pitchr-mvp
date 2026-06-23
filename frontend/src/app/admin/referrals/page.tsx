'use client';
import { useEffect, useState } from 'react';
import { useToastStore } from '../../../store/toastStore';

interface ReferralLink {
  code: string;
  marketer_name: string;
  type: string;
  signups: number;
  total_revenue: number;
  commission_rate: number;
  commission_owed: number;
}

export default function ReferralsPage() {
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [linkType, setLinkType] = useState('affiliate');
  const [commissionRate, setCommissionRate] = useState('5');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  function load() {
    fetch('/api/admin/referral-links', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setLinks(data.links || []))
      .catch(() => addToast('Failed to load referral links', 'error'));
  }

  useEffect(() => { load(); }, []);

  function startEdit(link: ReferralLink) {
    setCode(link.code);
    setName(link.marketer_name);
    setLinkType(link.type);
    setCommissionRate(String(link.commission_rate));
    setEditing(link.code);
  }

  function cancelEdit() {
    setCode('');
    setName('');
    setLinkType('affiliate');
    setCommissionRate('5');
    setEditing(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setCreating(true);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/referral-links/${editing}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ marketer_name: name.trim(), type: linkType, commission_rate: parseFloat(commissionRate) || 5 }),
          credentials: 'include',
        });
        if (res.ok) {
          cancelEdit();
          load();
          addToast('Referral link updated', 'success');
        } else {
          addToast('Failed to update', 'error');
        }
      } else {
        const res = await fetch('/api/admin/referral-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code.trim(), marketer_name: name.trim(), type: linkType, commission_rate: parseFloat(commissionRate) || 5 }),
          credentials: 'include',
        });
        if (res.ok) {
          setCode('');
          setName('');
          load();
          addToast('Referral link created', 'success');
        } else {
          addToast('Failed to create', 'error');
        }
      }
    } catch {
      addToast('Connection error', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(linkCode: string) {
    try {
      const res = await fetch(`/api/admin/referral-links/${linkCode}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        load();
        addToast('Referral link removed', 'success');
      } else {
        addToast('Failed to remove', 'error');
      }
    } catch {
      addToast('Connection error', 'error');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
          <p className="text-sm text-muted-foreground mt-1">Track marketer commissions and referral performance</p>
          <p className="text-xs text-muted-foreground mt-1">Format: <code className="bg-muted px-1.5 py-0.5 rounded text-brand-600">https://pitchr.com.ng?ref=</code></p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Referral Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. james"
            disabled={!!editing}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white dark:bg-card disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white dark:bg-card"
          >
            <option value="affiliate">Affiliate</option>
            <option value="marketer">Marketer</option>
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Commission (%)</label>
          <input
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            min="0.01"
            max="100"
            step="0.01"
            placeholder="5"
            className="w-20 px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white dark:bg-card"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Marketer Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. James Okonkwo"
            className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white dark:bg-card"
          />
        </div>
        <div className="flex items-end gap-2">
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="w-full sm:w-auto border border-input px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={creating}
            className="w-full sm:w-auto bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {creating ? 'Saving...' : editing ? 'Save Changes' : 'Create Link'}
          </button>
        </div>
      </form>

      <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-100 dark:border-brand-800 bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Marketer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Signups</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Revenue</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Rate</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Commission</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-muted-foreground">
                  No referral links yet. Create one above.
                </td>
              </tr>
            ) : (
              links.map((l) => (
                <tr key={l.code} className="border-b border-brand-50 dark:border-brand-800/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{l.marketer_name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-muted px-2 py-1 rounded select-all" title="pitchr.com.ng?ref={l.code}">{l.code}</code>
                    <span className="text-xs text-muted-foreground ml-1.5">pitchr.com.ng?ref={l.code}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{l.signups}</td>
                  <td className="px-4 py-3 text-right">₦{l.total_revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.type === 'marketer' ? 'bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300' : 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'}`}>
                      {l.type === 'marketer' ? 'Marketer' : 'Affiliate'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{l.commission_rate}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-600">₦{l.commission_owed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(l)}
                      className="text-xs text-brand-600 hover:text-brand-700 transition-colors mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(l.code)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
