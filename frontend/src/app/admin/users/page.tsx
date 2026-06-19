'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchUsers, updateUser, type AdminUser } from '../../../lib/admin';

const TIERS = ['free', 'starter', 'pro'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTier, setEditTier] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<NodeJS.Timeout>();

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUsers(s, p, 20);
      setUsers(data.users);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      setError('Failed to load users. You may not have admin access.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1, search); }, [load, search]);

  useEffect(() => {
    if (!editingId) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setEditingId(null);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editingId]);

  function handleSearch(val: string) {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setSearch(val), 300);
  }

  function openEdit(user: AdminUser) {
    setEditingId(user.id);
    setEditTier(user.subscription_tier);
    setEditLimit(String(user.proposal_limit_this_month || ''));
  }

  async function handleSave(userId: string) {
    setSaving(true);
    try {
      await updateUser(userId, {
        subscription_tier: editTier,
        proposal_limit_this_month: editLimit ? parseInt(editLimit) : undefined,
      });
      setEditingId(null);
      load(page, search);
    } catch {
      setError('Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBan(user: AdminUser) {
    const isBanned = !!user.deleted_at;
    const action = isBanned ? 'unban' : 'ban';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.email}?`)) return;

    setSaving(true);
    try {
      await updateUser(user.id, {
        deleted_at: isBanned ? null : new Date().toISOString(),
      });
      load(page, search);
    } catch {
      setError(`Failed to ${action} user`);
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.ceil(total / 20);
  const tierColors: Record<string, string> = {
    free: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    starter: 'bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300',
    pro: 'bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
  };

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total users</p>
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading users...</div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-8 text-center">
          <p className="text-muted-foreground text-sm">No users found</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-50 dark:border-brand-800 text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Usage</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Joined</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className={`border-b border-brand-50 dark:border-brand-800 last:border-0 ${user.deleted_at ? 'opacity-50 bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-xs font-medium text-brand-700 dark:text-brand-300">
                             {((user.first_name?.[0] || user.email?.[0]) || '?').toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">
                            {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${tierColors[user.subscription_tier] || tierColors.free}`}>
                          {user.subscription_tier}
                        </span>
                        {user.billing_period && (
                          <span className="text-xs text-muted-foreground ml-1 capitalize">({user.billing_period})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.proposal_limit_this_month > 0
                          ? `${user.proposal_count_this_month} / ${user.proposal_limit_this_month}`
                          : user.proposal_count_this_month}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(user)}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleBan(user)}
                            className={`text-xs font-medium ${user.deleted_at ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`}
                          >
                            {user.deleted_at ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => load(page - 1, search)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => load(page + 1, search)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30" onClick={() => setEditingId(null)}>
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl border border-border" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground mb-4">Edit User</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Plan</label>
                <select
                  value={editTier}
                  onChange={e => setEditTier(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                >
                  {TIERS.map(t => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Monthly proposal limit</label>
                <input
                  type="number"
                  value={editLimit}
                  onChange={e => setEditLimit(e.target.value)}
                  placeholder="0 = unlimited"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(editingId)}
                disabled={saving}
                className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
