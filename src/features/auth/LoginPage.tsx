import { ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../app/providers/AuthProvider';
import { product } from '../prima/product';
import { productName } from '../prima/PrimaPage';
export function LoginPage({ returnTo }: { returnTo?: string }) {
  const { login } = useAuth(); const [pending, setPending] = useState(false); const [error, setError] = useState(''); const started = useRef(false);
  async function handleLogin() { setPending(true); setError(''); try { await login(returnTo); } catch(e) { setError(e instanceof Error ? e.message : 'Unable to start sign-in.'); setPending(false); } }
  useEffect(() => { if (product !== 'one' && !started.current) { started.current = true; void handleLogin(); } }, []);
  return <div className="auth-screen"><div className="auth-card"><div className="auth-brand"><span className="brand-symbol">p<span>·</span></span>{productName}</div><div className="eyebrow">WELCOME TO PRIMA</div><h1>Your work, connected.</h1><p className="subtitle">Sign in once to access your workspace.</p>{error && <div className="error-banner" role="alert">{error}</div>}<button className="primary-button" disabled={pending} onClick={handleLogin}>{pending ? <><Loader2 size={17} className="spin" /> Connecting…</> : <>Continue to sign in <ArrowRight size={17} /></>}</button><p className="auth-footnote">Secure sign-in with SELISE Blocks</p></div></div>;
}
