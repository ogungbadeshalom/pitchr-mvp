'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { useUserStore } from '../../../store/userStore';
import { useSessionStore } from '../../../store/sessionStore';
import { useToastStore } from '../../../store/toastStore';

export default function SettingsPage() {
  const router = useRouter();
  const { firstName: storeFirstName, lastName: storeLastName, email, setUser } = useUserStore();
  const clearSession = useSessionStore((s) => s.clearSession);
  const [firstName, setFirstName] = useState(storeFirstName || '');
  const [lastName, setLastName] = useState(storeLastName || '');
  const [profileText, setProfileText] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    fetch('/api/user', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          const u = data.user;
          setUser(u.id, u.email, u.first_name || null, u.last_name || null, u.subscription_tier, u.proposal_count_this_month || 0, u.proposal_limit_this_month || 0, u.billing_period);
        }
      })
      .catch(() => {});
  }, [setUser]);

  useEffect(() => {
    if (storeFirstName && !firstName) setFirstName(storeFirstName);
    if (storeLastName && !lastName) setLastName(storeLastName);
  }, [storeFirstName, storeLastName, firstName, lastName]);

  useEffect(() => {
    fetch('/api/user/profile/freelancer', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.profile_text !== undefined) setProfileText(data.profile_text); })
      .catch(() => { addToast('Failed to load profile', 'error'); });
  }, [addToast]);

  async function handleSaveProfile() {
    setProfileSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile/freelancer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_text: profileText }),
        credentials: 'include',
      });
      if (res.ok) {
        addToast('Freelancer profile saved', 'success');
      } else {
        addToast('Failed to save freelancer profile', 'error');
      }
    } catch {
      addToast('Connection error', 'error');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const u = data.user;
          setUser(u.id, u.email, u.first_name || null, u.last_name || null, u.subscription_tier, u.proposal_count_this_month || 0, u.proposal_limit_this_month || 0);
        }
        addToast('Settings saved', 'success');
      } else {
        addToast('Failed to save settings', 'error');
      }
    } catch {
      addToast('Connection error', 'error');
    }
  }

  async function handleDeleteAccount() {
    if (!deleteConfirmed) return;
    if (!window.confirm('Are you sure? This will permanently deactivate your account. All your data will be retained but you will not be able to log in again.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        addToast('Account deleted', 'success');
        clearSession();
        router.push('/');
      } else {
        addToast('Failed to delete account', 'error');
      }
    } catch {
      addToast('Connection error', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-6">
        <h2 className="font-semibold text-foreground mb-4">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand-500 bg-white dark:bg-card"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand-500 bg-white dark:bg-card"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={email || ''}
              disabled
              className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>

          <div className="pt-2">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-6 mt-4">
        <h2 className="font-semibold text-foreground mb-4">Freelancer Profile</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Paste your freelancer profile so the AI can personalize proposals with your real experience and results.
        </p>
        <textarea
          value={profileText}
          onChange={(e) => { if (e.target.value.length <= 5000) setProfileText(e.target.value); }}
          maxLength={5000}
          className="w-full h-36 p-3 border border-input rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand-500 transition-shadow text-sm bg-white dark:bg-card"
          placeholder="4 years React/Node.js developer. Cut load times 85% for a fintech. Built dashboards used by 500+ daily users. Self-taught, 4 years freelancing on Upwork..."
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted-foreground">{profileText.length}/5000</span>
          <Button size="sm" onClick={handleSaveProfile} disabled={profileSaving}>
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-card border border-red-200 dark:border-red-900 rounded-xl p-6 mt-4">
        <h2 className="font-semibold text-red-600 dark:text-red-400 mb-2">Delete Account</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This will permanently deactivate your account. Your proposals and payment history will be retained but you will no longer be able to log in.
        </p>
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={deleteConfirmed}
            onChange={(e) => setDeleteConfirmed(e.target.checked)}
            className="w-4 h-4 rounded border-input text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-foreground">I understand this action is permanent</span>
        </label>
        <Button
          onClick={handleDeleteAccount}
          disabled={!deleteConfirmed || deleting}
          className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete My Account'}
        </Button>
      </div>
    </div>
  )
}
