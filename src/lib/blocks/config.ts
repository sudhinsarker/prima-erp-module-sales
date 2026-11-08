export const blocksConfig = {
  apiUrl: new URL('/blocks-api', window.location.origin).href,
  appDomain: window.location.origin,
  oidcUrl: import.meta.env.VITE_BLOCKS_OIDC_URL || 'https://iam.seliseblocks.com',
  oidcClientId: import.meta.env.VITE_BLOCKS_OIDC_CLIENT_ID || '722fe32a-44c0-4765-9c70-8c948bcd37ff',
  oidcScope: 'openid profile',
  xBlocksKey: import.meta.env.VITE_BLOCKS_X_BLOCKS_KEY || 'D589e5e2d1a43417591f07696cbf19477'
};
export function isBlocksConfigured() { return Boolean(blocksConfig.apiUrl && blocksConfig.xBlocksKey); }
export function isLoginConfigured() { return Boolean(blocksConfig.oidcClientId); }
