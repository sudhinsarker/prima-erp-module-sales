import { blocksClient } from '../../lib/blocks/client';

export type Customer = Record<string, unknown> & { ItemId: string; name: string; email: string; company: string };
export type Interaction = Record<string, unknown> & { ItemId: string; customerId: string; note: string; occurredAt: string };
export type Quote = Record<string, unknown> & { ItemId: string; customerId: string; customerName: string; description: string; amount: number; currency: string; status: string };

export const customers = blocksClient.data.collection<Customer>('PrimaCustomer', { fields: ['name', 'email', 'company'] });
export const interactions = blocksClient.data.collection<Interaction>('PrimaInteraction', { fields: ['customerId', 'note', 'occurredAt'] });
export const quotes = blocksClient.data.collection<Quote>('PrimaQuote', { fields: ['customerId', 'customerName', 'description', 'amount', 'currency', 'status'] });

export function ensureSuccess(value: unknown): void {
  if (!value || typeof value !== 'object') throw new Error('The server returned an empty response.');
  const result = value as Record<string, unknown>;
  if (Array.isArray(result.errors) && result.errors.length) throw new Error(result.errors.map(e => typeof e === 'object' && e && 'message' in e ? String(e.message) : String(e)).join('; '));
  if (result.isSuccess === false || result.acknowledged === false) throw new Error(String(result.message || 'The operation was rejected.'));
  if (result.data && typeof result.data === 'object') {
    for (const nested of Object.values(result.data)) if (nested && typeof nested === 'object') ensureSuccess(nested);
  }
}

export function unpack<T>(value: unknown): { items: T[]; totalCount: number } {
  ensureSuccess(value);
  const root = value as Record<string, unknown>;
  if (Array.isArray(root.items)) return { items: root.items as T[], totalCount: Number(root.totalCount ?? root.items.length) };
  for (const container of [root.data, ...Object.values(root)]) {
    if (container && typeof container === 'object' && !Array.isArray(container)) {
      const record = container as Record<string, unknown>;
      if (Array.isArray(record.items)) return { items: record.items as T[], totalCount: Number(record.totalCount ?? record.items.length) };
      for (const nested of Object.values(record)) {
        if (nested && typeof nested === 'object' && 'items' in nested && Array.isArray(nested.items)) {
          return { items: nested.items as T[], totalCount: Number('totalCount' in nested ? nested.totalCount : nested.items.length) };
        }
      }
    }
  }
  throw new Error('The server returned an unexpected list response.');
}

export async function allCustomers(): Promise<Customer[]> {
  const results: Customer[] = [];
  for (let pageNo = 1; ; pageNo++) {
    const page = unpack<Customer>(await customers.list({ pageNo, pageSize: 100 }));
    results.push(...page.items);
    if (!page.items.length || results.length >= page.totalCount) return results;
  }
}
