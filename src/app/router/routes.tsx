import { useCallback, useEffect, useState } from 'react';
import { RedirectIfAuthenticated, RequireAuth } from './guards';
import { CallbackPage } from '../../features/auth/CallbackPage';
import { LoginPage } from '../../features/auth/LoginPage';
import { PrimaPage, productName } from '../../features/prima/PrimaPage';
import '../../features/prima/prima.css';
export function AppRouter() {
  const [location, setLocation] = useState(() => ({ path: window.location.pathname, search: window.location.search }));
  useEffect(() => { document.title = productName; const update = () => setLocation({ path: window.location.pathname, search: window.location.search }); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update); }, []);
  const navigate = useCallback((path: string) => { const target = path.startsWith('/') && !path.startsWith('//') ? path : '/'; window.history.replaceState({}, '', target); setLocation({ path: window.location.pathname, search: window.location.search }); }, []);
  if (location.path === '/login/callback') return <CallbackPage onNavigate={navigate} />;
  if (location.path === '/login') return <RedirectIfAuthenticated onNavigate={navigate}><LoginPage returnTo={new URLSearchParams(location.search).get('returnTo') || '/'} /></RedirectIfAuthenticated>;
  if (location.path !== '/') return <div className="auth-screen"><div className="auth-card"><h1>Page not found</h1><p className="subtitle">This page is not available.</p><a href="/">Back to {productName}</a></div></div>;
  return <RequireAuth currentPath={location.path} onNavigate={navigate}><PrimaPage /></RequireAuth>;
}
