'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../../store/userStore';
import { useSessionStore } from '../../../store/sessionStore';
import { initSuperTokens } from '../../../lib/supertokens';
import { signInAndUp } from 'supertokens-web-js/recipe/thirdparty';

export default function AuthCallbackPage() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const clearSession = useSessionStore((s) => s.clearSession);
  const [message] = useState('Completing authentication...');

  useEffect(() => {
    initSuperTokens();

    (async () => {
      try {
        const response = await signInAndUp();
        if (response.status === 'OK') {
          const { user } = response;
          const finish = await fetch(
            '/api/auth/google-finish',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: user.id, email: user.emails[0] }),
              credentials: 'include',
            }
          );
          if (finish.ok) {
            const data = await finish.json();
            if (data.user) {
              const u = data.user;
              setUser(
                u.id, u.email, u.first_name || null, u.last_name || null,
                u.subscription_tier, u.proposal_count_this_month || 0, u.proposal_limit_this_month || 0
              );
            }
            clearSession();
            router.push('/dashboard');
            return;
          }
        }
      } catch {
        // fall through to redirect
      }
      router.push('/dashboard');
    })();
  }, [router, setUser, clearSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-teal-50">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
          <svg aria-hidden="true" className="animate-spin h-6 w-6 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
        <div className="text-muted-foreground">{message}</div>
      </div>
    </div>
  );
}
