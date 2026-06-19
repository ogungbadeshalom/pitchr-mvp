'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AffiliateStats {
  code: string;
  marketer_name: string;
  type: string;
  rate: number;
  signups: number;
  total_revenue: number;
  commission_owed: number;
}

export default function AffiliatePage() {
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setStats(null);
    try {
      const res = await fetch(`/api/affiliate/${code.trim().toLowerCase()}`);
      if (res.ok) {
        setStats(await res.json());
      } else {
        setError('Referral code not found. Check and try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 dark:from-background dark:via-background dark:to-background px-4">
      <div className="max-w-lg mx-auto py-16">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Image src="/images/P.png" alt="Pitchr logo" width={24} height={24} className="rounded" />
            <span className="text-2xl font-bold text-brand-600 tracking-tight">Pitchr</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Affiliate Earnings</h1>
          <p className="text-sm text-muted-foreground mt-2">Enter your referral code to see your earnings</p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your referral code"
            className="flex-1 px-4 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white dark:bg-card"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Check'}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 mb-6">
            {error}
          </div>
        )}

        {stats && (
          <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{stats.marketer_name}</h2>
                <p className="text-sm text-muted-foreground">Code: {stats.code}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${stats.type === 'marketer' ? 'bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300' : 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'}`}>
                {stats.type === 'marketer' ? 'Marketer' : 'Affiliate'} · {stats.rate}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stats.signups}</p>
                <p className="text-xs text-muted-foreground mt-1">Signups</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">&#8358;{stats.total_revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Revenue</p>
              </div>
              <div className="bg-brand-50 dark:bg-brand-900/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-brand-600">&#8358;{stats.commission_owed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Commission</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
