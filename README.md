# Prima Sales

Draft quotes created against the shared customer directory.

Uses the prima-erp development tenant, D589e5e2d1a43417591f07696cbf19477. All three applications use one public PKCE OIDC client and the same same-site Blocks API gateway. No client secret is used by the browser.

## Development

Run npm ci, npm run lint, and npm run build. For live login, serve over HTTPS on the registered application domain. The Blocks starter certificate scripts are included.

## Data

PrimaCustomer, PrimaInteraction, and PrimaQuote are shared DataGateway schemas. Every operation requires a signed-in application user. This minimal test version grants signed-in tenant users access to all three schemas; product-specific roles and record ownership restrictions are outside this version. Cloud model changes are managed through blocks/data and the Blocks CLI; schema definitions are mirrored in each repo, so coordinate changes.

## Login and verification

Sign in to Prima One through Blocks hosted login, open CRM, add a customer and an interaction note, then return to Prima One and open Sales. Select the same customer and save a draft quote. Reload both apps to verify persistence. Sign out and verify all app tabs return to sign-in when focused or reloaded. Passwords and CLI credentials must never be added to the frontend.

## Deployment

Blocks Release builds the dev branch using the included Dockerfile and serves the SPA through nginx on port 8080. The source contains only public tenant and client settings. Callback origins must remain registered on the OIDC client. Module links are in src/features/prima/links.ts.

## Blocks skills

24 routed skills were installed from SELISEdigitalplatforms/blocks-skills at main, commit c5b3ae93906dd9acd0eb9040254978ad4b3bdfeb. The full list is in .agents/skills/.blocks-skills-source. No missing or unrouted skills were found. AGENTS.md was created; Codex reads it and .agents/skills directly, so no extra pointer files were created. Anonymous reporting is disabled in .agents/skills/.blocks-reporting and can be changed on request.

## Published applications

- Prima One: https://dzvijs-esbol.slsblx.com
- Prima CRM: https://dzvijs-esbom.slsblx.com
- Prima Sales: https://dzvijs-esbse.slsblx.com

## Shared session routing

Browser SDK requests use the same-origin /blocks-api proxy. nginx and the local Vite proxy forward to blocksapi.slsblx.com with the canonical Prima One Origin and a fixed tenant key. Blocks names its token cookies after the Origin application, so all modules must use the same auth origin. Existing httpOnly cookies are forwarded without exposing them to frontend JavaScript. OIDC redirect URIs remain specific to each app. The production proxy rejects requests advertised as cross-site or same-site rather than same-origin.
