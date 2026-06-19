'use client';
import { useEffect, useState, useCallback } from 'react';
import { fetchTransactions, type Transaction } from '../../../lib/admin';

function formatNaira(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  pending: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  failed: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  cancelled: 'bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300',
  abandoned: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
};

function getTxStatus(tx: Transaction): { label: string; color: string } {
  if (tx.status === 'completed') return { label: 'Completed', color: STATUS_COLORS.completed };
  if (tx.status === 'failed') return { label: 'Failed', color: STATUS_COLORS.failed };
  if (tx.status === 'cancelled') return { label: 'Cancelled', color: STATUS_COLORS.cancelled };
  if (tx.status === 'pending') {
    // Client-side heuristic: pending > 1 hour is shown as abandoned (approximate)
    const age = Date.now() - new Date(tx.created_at).getTime();
    if (age > 60 * 60 * 1000) return { label: 'Abandoned', color: STATUS_COLORS.abandoned };
    return { label: 'Pending', color: STATUS_COLORS.pending };
  }
  return { label: tx.status, color: STATUS_COLORS.pending };
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTransactions(p, 20);
      setTransactions(data.transactions);
      setTotal(data.total);
      setPage(data.page);
    } catch {
      setError('Failed to load transactions. You may not have admin access.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} total payments</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading transactions...</div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-8 text-center">
          <p className="text-muted-foreground text-sm">No transactions yet</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-50 dark:border-brand-800 text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Reference</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const statusInfo = getTxStatus(tx);
                    return (
                    <tr key={tx.id} className="border-b border-brand-50 dark:border-brand-800 last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{tx.flutterwave_reference?.slice(0, 24)}...</code>
                      </td>
                      <td className="px-4 py-3">
                        {tx.user_email ? (
                          <div>
                            <span className="text-foreground font-medium">
                              {tx.first_name ? `${tx.first_name} ${tx.last_name || ''}`.trim() : tx.user_email}
                            </span>
                            <br />
                            <span className="text-xs text-muted-foreground">{tx.user_email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Guest</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 capitalize">
                          {tx.payment_type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {formatNaira(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {tx.completed_at && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(tx.completed_at).toLocaleDateString('en-NG')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(tx.created_at).toLocaleString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => load(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => load(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
