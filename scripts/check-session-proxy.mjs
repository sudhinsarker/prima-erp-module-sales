import assert from 'node:assert/strict';
import { createBlocksClient } from '@seliseblocks/client';

const appOrigin = new URL(process.argv[2] || 'https://dzvijs-esbse.slsblx.com').origin;
const callbackOrigin = new URL(process.argv[3] || appOrigin).origin;
const apiUrl = appOrigin + '/blocks-api';
const oidc = {
  clientId: '722fe32a-44c0-4765-9c70-8c948bcd37ff',
  url: 'https://iam.seliseblocks.com',
  redirectUri: callbackOrigin + '/login/callback'
};
const client = createBlocksClient({ apiUrl, xBlocksKey: 'D589e5e2d1a43417591f07696cbf19477', oidc });

assert.equal(await client.auth.isAuthenticated(), false, 'Anonymous callers must not have a session');
const login = await client.auth.idp.initiate();
assert.ok(login.redirect_uri, 'Hosted login must return a redirect');
const redirect = new URL(login.redirect_uri);
assert.equal(redirect.host, 'iam.seliseblocks.com');
assert.equal(redirect.searchParams.get('redirect_uri'), oidc.redirectUri);
assert.equal(redirect.searchParams.get('code_challenge_method'), 'S256');

for (const site of ['same-site', 'cross-site']) {
  const blocked = createBlocksClient({
    apiUrl,
    xBlocksKey: 'D589e5e2d1a43417591f07696cbf19477',
    fetch: (url, options) => {
      const headers = new Headers(options?.headers);
      headers.set('Sec-Fetch-Site', site);
      return fetch(url, { ...options, headers });
    }
  });
  await assert.rejects(blocked.data.collection('PrimaCustomer').list({ pageNo: 1, pageSize: 1 }), /403/);
}

const forgedTenant = createBlocksClient({ apiUrl, xBlocksKey: 'wrong-tenant', oidc });
assert.ok((await forgedTenant.auth.idp.initiate()).redirect_uri, 'The proxy must pin the core tenant');
await assert.rejects(client.data.collection('PrimaCustomer').list({ pageNo: 1, pageSize: 1 }), /401/);
console.log('PASS: hosted OIDC, module callback, S256 PKCE, fixed tenant, anonymous denial, and cross-site request rejection.');
