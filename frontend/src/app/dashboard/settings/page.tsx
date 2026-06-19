'use client';
import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { useUserStore } from '../../../store/userStore';
import { useToastStore } from '../../../store/toastStore';

export default function SettingsPage() {
  const { firstName: storeFirstName, lastName: storeLastName, email, setUser } = useUserStore();
  const [firstName, setFirstName] = useState(storeFirstName || '');
  const [lastName, setLastName] = useState(storeLastName || '');
  const [profileText, setProfileText] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

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

      <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-6 mt-4">
        <h2 className="font-semibold text-foreground mb-1">Account</h2>
        <p className="text-sm text-muted-foreground mb-4">Manage your account settings and linked accounts</p>
        <button
          type="button"
          onClick={() => addToast('Google OAuth — configure your SuperTokens Google credentials to enable.', 'info')}
          className="flex items-center gap-2 px-4 py-2.5 border border-input rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Link Google Account
        </button>
      </div>
    </div>
  )
}
