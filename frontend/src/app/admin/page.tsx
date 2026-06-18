'use client';
import { useEffect, useState } from 'react';
import { fetchAnalytics, type AnalyticsOverview, type TrendPoint } from '../../lib/admin';

function formatNaira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

function formatNum(n: number) {
  return n.toLocaleString('en-NG');
}

function StatCard({ label, value, change, changeLabel, icon, accent }: {
  label: string; value: string; change: string; changeLabel: string; icon: string; accent: string;
}) {
  const isPositive = !change.startsWith('0') && !change.startsWith('-');
  return (
    <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
          isPositive ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'text-muted-foreground'
        }`}>
          {isPositive ? <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg> : null}
          <span>{change}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground group-hover:scale-105 transition-transform origin-left">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{changeLabel}</p>
    </div>
  );
}

function TrendChart({ data, valueKey, color, format, label }: {
  data: TrendPoint[]; valueKey: 'count' | 'amount'; color: string; format: 'number' | 'naira'; label: string;
}) {
  const max = Math.max(1, ...data.map(d => d[valueKey] || 0));
  const total = data.reduce((sum, d) => sum + (d[valueKey] || 0), 0);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground">
          Total: {format === 'number' ? formatNum(total) : formatNaira(total)}
        </span>
      </div>
      <div className="flex items-end gap-2 h-36">
        {Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dateStr = d.toISOString().split('T')[0];
          const point = data.find(p => p.date.startsWith(dateStr));
          const val = point?.[valueKey] || 0;
          const height = max > 0 ? (val / max) * 100 : 4;
          const displayVal = format === 'number' ? formatNum(val) : (val > 0 ? formatNaira(val).replace('₦', '') : '0');
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs rounded-md px-2 py-1 mb-1 whitespace-nowrap">
                {displayVal}
              </div>
              <div
                className="w-full rounded-t transition-all duration-500 ease-out hover:opacity-80"
                style={{
                  height: `${Math.max(4, height)}%`,
                  backgroundColor: color,
                  minHeight: val > 0 ? 4 : 2,
                }}
                title={`${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}: ${format === 'number' ? val : formatNaira(val)}`}
              />
              <span className="text-[10px] text-muted-foreground">{days[d.getDay()]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [signupTrend, setSignupTrend] = useState<TrendPoint[]>([]);
  const [proposalTrend, setProposalTrend] = useState<TrendPoint[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAnalytics();
        setOverview(data.overview);
        setSignupTrend(data.signup_trend);
        setProposalTrend(data.proposal_trend);
        setRevenueTrend(data.revenue_trend);
      } catch {
        setError('Failed to load analytics. You may not have admin access.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg aria-hidden="true" className="animate-spin h-8 w-8 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-muted-foreground text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mx-auto mb-3">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p className="text-red-700 dark:text-red-400 text-sm mb-1">{error}</p>
        <p className="text-xs text-red-500 dark:text-red-400/70">Make sure your email is listed in ADMIN_EMAILS</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Analytics Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time metrics across your platform
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={formatNum(overview?.total_users || 0)}
          change={`+${overview?.signups_24h || 0}`}
          changeLabel={`${overview?.signups_24h || 0} new in 24h`}
          icon="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"
          accent="bg-brand-50 dark:bg-brand-900/30 text-brand-600"
        />
        <StatCard
          label="Total Proposals"
          value={formatNum(overview?.total_proposals || 0)}
          change={`+${overview?.proposals_24h || 0}`}
          changeLabel={`${overview?.proposals_24h || 0} generated in 24h`}
          icon="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2 14 8 20 8 M16 13 8 13 M16 17 8 17"
          accent="bg-teal-50 dark:bg-teal-900/30 text-teal-600"
        />
        <StatCard
          label="Total Revenue"
          value={formatNaira(overview?.total_revenue || 0)}
          change={overview?.revenue_24h ? `+${formatNaira(overview.revenue_24h)}` : '₦0'}
          changeLabel="Revenue in 24h"
          icon="M12 2a10 10 0 1 0 10 10 M22 10A10 10 0 0 0 12 2 M12 6v6l4 2"
          accent="bg-amber-50 dark:bg-amber-900/30 text-amber-600"
        />
        <StatCard
          label="Payments (24h)"
          value={formatNum(overview?.payments_24h || 0)}
          change={`${overview?.payments_24h || 0}`}
          changeLabel="Completed transactions"
          icon="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9"
          accent="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <TrendChart data={signupTrend} valueKey="count" color="#059669" format="number" label="New Signups (7 days)" />
        <TrendChart data={proposalTrend} valueKey="count" color="#0d9488" format="number" label="Proposals Generated (7 days)" />
        <TrendChart data={revenueTrend} valueKey="amount" color="#6366f1" format="naira" label="Revenue (7 days)" />
      </div>

      {/* Quick Insights */}
      <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-medium text-foreground mb-3">Quick Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
            <div>
              <p className="text-sm text-foreground font-medium">Avg proposals per user</p>
              <p className="text-xs text-muted-foreground">
                {overview && overview.total_users > 0
                  ? (overview.total_proposals / overview.total_users).toFixed(1)
                  : '0'} proposals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-teal-500" />
            <div>
              <p className="text-sm text-foreground font-medium">Revenue per user</p>
              <p className="text-xs text-muted-foreground">
                {overview && overview.total_users > 0
                  ? formatNaira(Math.round(overview.total_revenue / overview.total_users))
                  : '₦0'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <div>
              <p className="text-sm text-foreground font-medium">Conversion rate</p>
              <p className="text-xs text-muted-foreground">
                {overview && overview.total_users > 0
                  ? `${((overview.payments_24h / overview.total_users) * 100).toFixed(1)}%`
                  : '0%'} (24h)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
