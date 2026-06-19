'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToastStore } from '../../../store/toastStore';
import { useCopy } from '../../../hooks/useCopy';

interface Proposal {
  id: string;
  job_description: string;
  platform: string;
  generated_proposal: string;
  created_at: string;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore((s) => s.addToast);
  const { copy, copied } = useCopy();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/proposals', { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(data => {
        if (!cancelled) setProposals(data.proposals || []);
      })
      .catch(() => {
        if (!cancelled) addToast('Failed to load proposals', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [addToast]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Proposals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/session"
          className="inline-flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Proposal
        </Link>
      </div>

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading proposals...</div>
        </div>
      ) : proposals.length === 0 ? (
        <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-xl bg-brand-50 dark:bg-brand-900/50 flex items-center justify-center mx-auto mb-4">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p className="text-muted-foreground mb-2">No saved proposals yet.</p>
          <Link href="/session" className="text-brand-600 font-medium hover:text-brand-700 transition-colors text-sm">
            Generate your first proposal &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <div key={p.id} className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-medium capitalize">
                  {p.platform}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-foreground line-clamp-2 leading-relaxed">{p.job_description}</p>
              <details className="mt-3 group">
                <summary className="text-sm font-medium text-brand-600 hover:text-brand-700 cursor-pointer transition-colors list-none flex items-center gap-1">
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-90">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  View Proposal
                </summary>
                <pre className="mt-3 p-4 bg-muted/30 border border-border rounded-lg text-sm whitespace-pre-wrap font-sans text-foreground/80 leading-relaxed">
                  {p.generated_proposal}
                </pre>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => copy(p.generated_proposal, 'Proposal copied')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-muted border border-input hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:border-brand-300 transition-colors"
                  >
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
