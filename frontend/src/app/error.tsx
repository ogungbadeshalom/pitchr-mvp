'use client';
import { Button } from '../components/ui/button';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 via-white to-teal-50">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
