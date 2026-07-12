# Phactory Food Cloud

This optional edge/server gateway gives the public GitHub Pages app a secure server-side search layer without exposing provider credentials.

## Why it exists

A static PWA cannot safely embed FatSecret, USDA, Nutritionix, or other private API credentials. Every visitor could extract keys from JavaScript. The Worker stores credentials as server secrets, applies output limits, disables response caching, validates requests, and returns a normalized nutrition schema.

## Supported providers

- FatSecret Platform API, when `FATSECRET_CLIENT_ID` and `FATSECRET_CLIENT_SECRET` are configured.
- USDA FoodData Central, when `USDA_API_KEY` is configured.

The providers are optional. Review their current terms, attribution, rate limits, and data-storage rules before public deployment. The Worker does not persist provider results.

## Deploy

1. Install Wrangler: `npm install -g wrangler`
2. Copy `wrangler.toml.example` to `wrangler.toml` and set `APP_ORIGIN` to the exact deployed app origin.
3. Authenticate: `wrangler login`
4. Add secrets:
   - `wrangler secret put FATSECRET_CLIENT_ID`
   - `wrangler secret put FATSECRET_CLIENT_SECRET`
   - `wrangler secret put USDA_API_KEY`
5. Deploy from this folder: `wrangler deploy`
6. Put the resulting HTTPS `workers.dev` URL in root `config.js` as `foodCloudUrl`.
7. Never commit `wrangler.toml` if it contains environment-specific information. Never commit credentials.

## Endpoints

- `GET /health`
- `GET /v1/search?q=burger%20king%20whopper&region=US&limit=50`

## Production notes

Use a dedicated Worker, restrict `APP_ORIGIN`, enable Cloudflare rate limiting, and monitor provider quotas. A commercial public launch should use a provider contract that permits the intended display, caching, and retention behavior.

FatSecret may require registered proxy IPs. If your account cannot authorize Cloudflare Worker egress, deploy the same gateway on a server with a fixed outbound IP.
