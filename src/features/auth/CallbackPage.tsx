import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { completeLogin, fetchSessionClaims } from '../../lib/blocks/auth';
export function CallbackPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { refresh } = useAuth(); const [error, setError] = useState(''); const ran = useRef(false);
  useEffect(() => { if (ran.current) return; ran.current = true; void (async () => { try { const result = await completeLogin(window.location.href); if (!result.ok) throw new Error(result.message); if (!await fetchSessionClaims()) throw new Error('Your session could not be verified. Please sign in again.'); await refresh(); onNavigate(result.returnTo); } catch(e) { setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.'); } })(); }, [onNavigate, refresh]);
  return <div className="auth-screen"><div className="auth-card">{error ? <><h2>Could not sign in</h2><div className="error-banner" role="alert">{error}</div><button className="primary-button" onClick={() => onNavigate('/login')}>Try again</button></> : <div className="loading-state"><Loader2 className="spin" size={20} /> Finishing sign-in…</div>}</div></div>;
}
