import { ArrowLeft, ArrowRight, Building2, Check, FileText, Grid2X2, Loader2, Plus, RefreshCw, Users, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../app/providers/AuthProvider';
import { allCustomers, customers, interactions, quotes, unpack, ensureSuccess, type Customer, type Interaction, type Quote } from './data';
import { links } from './links';
import { product } from './product';

export const productName = product === 'one' ? 'Prima One' : product === 'crm' ? 'Prima CRM' : 'Prima Sales';
const message = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';

export function PrimaPage() {
  const { claims, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signoutError, setSignoutError] = useState('');
  const displayName = String(claims?.name || claims?.email || 'Your workspace');
  return <div className="workspace">
    <header className="topbar"><a className="brand" href={links.one}><span className="brand-symbol">p<span>·</span></span><span>prima<span className="brand-suffix">{product === 'one' ? 'one' : product}</span></span></a>
      <div className="account"><span className="avatar">{displayName.slice(0, 1).toUpperCase()}</span><span className="account-name">{displayName}</span><button className="text-button" disabled={signingOut} onClick={async () => { setSigningOut(true); try { await logout(); } catch (e) { setSignoutError(message(e)); } finally { setSigningOut(false); } }}>{signingOut ? 'Signing out…' : 'Sign out'}</button></div>
    </header>
    <main className="main">
      {signoutError && <div role="alert" className="error-banner">{signoutError}</div>}
      {product !== 'one' && <a className="back-link" href={links.one}><ArrowLeft size={15} /> All modules</a>}
      {product === 'one' ? <Navigator /> : product === 'crm' ? <CRM /> : <Sales />}
    </main><footer>Prima ERP <span>One workspace. Connected work.</span></footer>
  </div>;
}

function Navigator() {
  return <><div className="eyebrow">YOUR WORKSPACE</div><h1>Where would you like to work?</h1><p className="subtitle">Everything you need, one place to start.</p>
    <div className="module-grid">
      <a className="module-card crm-card" href={links.crm}><span className="module-icon"><Users size={26} strokeWidth={1.6} /></span><div><h2>Prima CRM</h2><p>Keep customers and conversations connected.</p></div><span className="module-open">Open CRM <ArrowRight size={18} /></span></a>
      <a className="module-card sales-card" href={links.sales || undefined} aria-disabled={!links.sales}><span className="module-icon"><FileText size={26} strokeWidth={1.6} /></span><div><h2>Prima Sales</h2><p>Turn customer relationships into opportunities.</p></div><span className="module-open">{links.sales ? 'Open Sales' : 'Getting ready'} <ArrowRight size={18} /></span></a>
    </div>
  </>;
}

function CRM() {
  const cache = useQueryClient();
  const customerQuery = useQuery({ queryKey: ['customers'], queryFn: allCustomers });
  const [selected, setSelected] = useState<Customer>();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const noteQuery = useQuery({ queryKey: ['interactions', selected?.ItemId], enabled: !!selected, queryFn: async () => unpack<Interaction>(await interactions.list({ pageNo: 1, pageSize: 100, filter: { customerId: selected!.ItemId }, sort: { occurredAt: -1 } })) });
  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); setError(''); setPending(true);
    try { const name = String(values.get('name')).trim(); if (!name) throw new Error('Enter a customer name.'); ensureSuccess(await customers.create({ name, email: String(values.get('email')).trim(), company: String(values.get('company')).trim() })); await cache.invalidateQueries({ queryKey: ['customers'] }); setShowForm(false); setSuccess('Customer added. It is now available in Sales.'); }
    catch (e) { setError(message(e)); } finally { setPending(false); }
  }
  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const note = String(new FormData(form).get('note')).trim(); if (!note || !selected) return; setPending(true); setError('');
    try { ensureSuccess(await interactions.create({ customerId: selected.ItemId, note, occurredAt: new Date().toISOString() })); form.reset(); await cache.invalidateQueries({ queryKey: ['interactions', selected.ItemId] }); }
    catch (e) { setError(message(e)); } finally { setPending(false); }
  }
  const visible = (customerQuery.data || []).filter(c => `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(search.toLowerCase()));
  return <><div className="page-heading"><div><div className="eyebrow">RELATIONSHIPS</div><h1>Customers</h1><p className="subtitle">Good work starts with a conversation.</p></div><button className="primary-button" onClick={() => { setShowForm(true); setSelected(undefined); setError(''); }}><Plus size={17} /> Add customer</button></div>
    <Feedback error={error} success={success} />
    {showForm && <section className="panel form-panel"><div className="panel-heading"><h2>New customer</h2><button className="icon-button" aria-label="Close customer form" disabled={pending} onClick={() => setShowForm(false)}><X size={18} /></button></div><form onSubmit={saveCustomer}><div className="form-grid"><label>Customer name<input name="name" required maxLength={120} autoFocus placeholder="e.g. Alex Morgan" /></label><label>Company<input name="company" maxLength={160} placeholder="Company name" /></label><label>Email<input name="email" type="email" maxLength={254} placeholder="alex@company.com" /></label></div><button className="primary-button" disabled={pending}>{pending ? 'Saving…' : 'Save customer'}</button></form></section>}
    <section className="panel"><div className="toolbar"><div className="panel-title"><h2>Customer directory</h2><span className="count">{customerQuery.data?.length ?? 0}</span></div><div className="tools"><input className="search" aria-label="Search customers" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…" /><button className="icon-button" aria-label="Refresh customers" onClick={() => void customerQuery.refetch()}><RefreshCw size={16} /></button></div></div>
      <QueryState loading={customerQuery.isPending} error={customerQuery.error} retry={() => void customerQuery.refetch()} />
      {!customerQuery.isPending && !customerQuery.error && (visible.length ? <div className="table-scroll"><table><thead><tr><th>Customer</th><th>Company</th><th>Email</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(c => <tr key={c.ItemId}><td><span className="customer-name"><span className="mini-avatar">{c.name.slice(0, 1).toUpperCase()}</span>{c.name}</span></td><td>{c.company || '—'}</td><td>{c.email || '—'}</td><td><button className="text-button" onClick={() => { setSelected(c); setShowForm(false); setError(''); }}>View notes <ArrowRight size={14} /></button></td></tr>)}</tbody></table></div> : <Empty icon="customers" title={search ? 'No matching customers' : 'Meet your first customer'} detail={search ? 'Try a different name, company, or email.' : 'Add a customer here and find them in Prima Sales too.'} />)}
    </section>
    {selected && <section className="panel form-panel"><div className="panel-heading"><div><h2>{selected.name}</h2><p className="muted">Interaction notes</p></div><button className="icon-button" aria-label="Close notes" onClick={() => setSelected(undefined)}><X size={18} /></button></div><form onSubmit={saveNote}><label>Add a note<textarea name="note" required maxLength={4000} placeholder="What did you discuss?" /></label><button className="primary-button" disabled={pending}>{pending ? 'Saving…' : 'Add note'}</button></form><QueryState loading={noteQuery.isPending} error={noteQuery.error} retry={() => void noteQuery.refetch()} /><div className="notes">{noteQuery.data?.items.map(n => <article key={n.ItemId}><p>{n.note}</p><time>{new Date(n.occurredAt).toLocaleString()}</time></article>)}{noteQuery.data?.items.length === 0 && <p className="muted">No notes yet. Start the conversation.</p>}</div></section>}
  </>;
}

function Sales() {
  const cache = useQueryClient(); const [page, setPage] = useState(1);
  const customerQuery = useQuery({ queryKey: ['customers'], queryFn: allCustomers });
  const quoteQuery = useQuery({ queryKey: ['quotes', page], queryFn: async () => unpack<Quote>(await quotes.list({ pageNo: page, pageSize: 20 })) });
  const [showForm, setShowForm] = useState(false); const [pending, setPending] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  async function saveQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget); setPending(true); setError('');
    try { const customer = customerQuery.data?.find(c => c.ItemId === values.get('customer')); if (!customer) throw new Error('Choose a customer.'); const amount = Number(values.get('amount')); if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter an amount greater than zero.'); const description = String(values.get('description')).trim(); if (!description) throw new Error('Enter a description.'); ensureSuccess(await quotes.create({ customerId: customer.ItemId, customerName: customer.name, description, amount, currency: String(values.get('currency')), status: 'Draft' })); await cache.invalidateQueries({ queryKey: ['quotes'] }); setPage(1); setShowForm(false); setSuccess('Draft quote created.'); }
    catch (e) { setError(message(e)); } finally { setPending(false); }
  }
  return <><div className="page-heading"><div><div className="eyebrow">OPPORTUNITIES</div><h1>Quotes</h1><p className="subtitle">A simple next step for every opportunity.</p></div><button className="primary-button" onClick={() => { setShowForm(true); setError(''); void customerQuery.refetch(); }}><Plus size={17} /> Create quote</button></div>
    <Feedback error={error} success={success} />
    {showForm && <section className="panel form-panel"><div className="panel-heading"><h2>New draft quote</h2><button className="icon-button" aria-label="Close quote form" disabled={pending} onClick={() => setShowForm(false)}><X size={18} /></button></div><QueryState loading={customerQuery.isPending} error={customerQuery.error} retry={() => void customerQuery.refetch()} />{customerQuery.data?.length === 0 ? <p className="muted">Add your first customer in <a href={links.crm}>Prima CRM</a>, then return here.</p> : <form onSubmit={saveQuote}><div className="form-grid"><label className="wide-field">Customer<select name="customer" required defaultValue="" disabled={customerQuery.isPending}><option value="" disabled>Select a shared customer</option>{customerQuery.data?.map(c => <option key={c.ItemId} value={c.ItemId}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>)}</select></label><label className="wide-field">Description<textarea name="description" required maxLength={2000} placeholder="What are you offering?" /></label><label>Amount<input name="amount" type="number" required min="0.01" max="999999999" step="0.01" placeholder="0.00" /></label><label>Currency<select name="currency" defaultValue="CHF"><option>CHF</option><option>EUR</option><option>USD</option><option>BDT</option></select></label></div><button className="primary-button" disabled={pending || !customerQuery.data?.length}>{pending ? 'Saving…' : 'Save draft quote'}</button></form>}</section>}
    <section className="panel"><div className="toolbar"><div className="panel-title"><h2>All quotes</h2><span className="count">{quoteQuery.data?.totalCount ?? 0}</span></div><button className="icon-button" aria-label="Refresh quotes" onClick={() => void quoteQuery.refetch()}><RefreshCw size={16} /></button></div><QueryState loading={quoteQuery.isPending} error={quoteQuery.error} retry={() => void quoteQuery.refetch()} />
      {!quoteQuery.isPending && !quoteQuery.error && (quoteQuery.data?.items.length ? <div className="table-scroll"><table><thead><tr><th>Customer</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead><tbody>{quoteQuery.data.items.map(q => <tr key={q.ItemId}><td className="strong">{q.customerName}</td><td className="description-cell">{q.description}</td><td className="amount">{new Intl.NumberFormat(undefined, { style: 'currency', currency: q.currency }).format(q.amount)}</td><td><span className="draft-badge">Draft</span></td></tr>)}</tbody></table></div> : <Empty icon="quotes" title="Your next opportunity starts here" detail="Create a draft quote using a customer from Prima CRM." />)}
      {(quoteQuery.data?.totalCount ?? 0) > 20 && <div className="pagination"><button className="secondary-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page}</span><button className="secondary-button" disabled={page * 20 >= (quoteQuery.data?.totalCount ?? 0)} onClick={() => setPage(p => p + 1)}>Next</button></div>}
    </section>
  </>;
}

function Feedback({ error, success }: { error: string; success: string }) { return <>{error && <div role="alert" className="error-banner">{error}</div>}{success && <div role="status" className="success-banner"><Check size={16} />{success}</div>}</>; }
function QueryState({ loading, error, retry }: { loading: boolean; error: unknown; retry: () => void }) { return loading ? <div className="loading-state"><Loader2 className="spin" size={20} /> Loading…</div> : error ? <div role="alert" className="inline-error"><p>{message(error)}</p><button className="secondary-button" onClick={retry}>Try again</button></div> : null; }
function Empty({ icon, title, detail }: { icon: 'customers' | 'quotes'; title: string; detail: string }) { return <div className="empty-state"><span className="empty-icon">{icon === 'customers' ? <Building2 size={26} /> : <FileText size={26} />}</span><h3>{title}</h3><p>{detail}</p></div>; }
