'use client';
import { useEffect, useState } from 'react';
import { fetchAnalytics, type AnalyticsOverview, type TrendPoint } from '../../lib/admin';

function formatNaira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/50 flex items-center justify-center">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600">
            <path d={icon} />
          </svg>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function TrendChart({ data, valueKey, color }: { data: TrendPoint[]; valueKey: 'count' | 'amount'; color: string }) {
  const max = Math.max(1, ...data.map(d => d[valueKey] || 0));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-end gap-2 h-32">
        {Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dateStr = d.toISOString().split('T')[0];
          const point = data.find(p => p.date.startsWith(dateStr));
          const val = point?.[valueKey] || 0;
          const height = max > 0 ? (val / max) * 100 : 0;
          const displayVal = valueKey === 'amount' ? formatNaira(val).replace('₦', '') : String(val);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{displayVal}</span>
              <div
                className="w-full rounded-t"
                style={{
                  height: `${Math.max(4, height)}%`,
                  backgroundColor: color,
                  opacity: 0.8,
                }}
              />
              <span className="text-xs text-muted-foreground">{days[(d.getDay())]}</span>
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
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Analytics Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Last 24 hours and 7-day trends</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={String(overview?.total_users || 0)}
          sub={`+${overview?.signups_24h || 0} in 24h`}
          icon="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"
        />
        <StatCard
          label="Total Proposals"
          value={String(overview?.total_proposals || 0)}
          sub={`+${overview?.proposals_24h || 0} in 24h`}
          icon="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2 14 8 20 8 M16 13 8 13 M16 17 8 17"
        />
        <StatCard
          label="Total Revenue"
          value={formatNaira(overview?.total_revenue || 0)}
          sub={`${formatNaira(overview?.revenue_24h || 0)} in 24h`}
          icon="M12 2a10 10 0 1 0 10 10 M22 10A10 10 0 0 0 12 2"
        />
        <StatCard
          label="Payments (24h)"
          value={String(overview?.payments_24h || 0)}
          sub="Completed transactions"
          icon="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Signups (7 days)</h3>
          <TrendChart data={signupTrend} valueKey="count" color="#059669" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Proposals (7 days)</h3>
          <TrendChart data={proposalTrend} valueKey="count" color="#0d9488" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Revenue (7 days)</h3>
          <TrendChart data={revenueTrend} valueKey="amount" color="#6366f1" />
        </div>
      </div>
    </div>
  );
}
