'use client';
import { useEffect, useState } from 'react';
import { useToastStore } from '../../../store/toastStore';

export default function MaintenancePage() {
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    fetch('/api/maintenance')
      .then(r => r.json())
      .then(data => { setActive(data.active); setMessage(data.message || ''); })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (active && !message.trim()) {
      addToast('Message is required when maintenance is active', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active, message: message.trim() || undefined }),
        credentials: 'include',
      });
      if (res.ok) {
        addToast(active ? 'Maintenance mode activated' : 'Maintenance mode deactivated', 'success');
      } else {
        addToast('Failed to update maintenance mode', 'error');
      }
    } catch {
      addToast('Connection error', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Maintenance Mode</h1>
        <p className="text-sm text-muted-foreground mt-1">Show a banner to users when the platform is undergoing maintenance.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-6 max-w-lg">
        <label className="flex items-center justify-between mb-6 cursor-pointer">
          <div>
            <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">When active, all dashboard users will see a warning banner.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={() => setActive(!active)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${active ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </label>

        {active && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-foreground mb-1.5">Message to show users</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={300}
              className="w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand-500 bg-white dark:bg-card resize-none"
              placeholder="We're upgrading the payment system. Proposals will work but payments may be delayed."
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/300</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}
