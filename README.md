# Phactory Food Cloud — v1.13.0

This optional Cloudflare Worker gives the public GitHub Pages app broad live restaurant and branded-food search without exposing provider credentials in the repository or browser.

## Supported providers

1. **Nutritionix** — primary restaurant/branded-menu provider when `NUTRITIONIX_APP_ID` and `NUTRITIONIX_API_KEY` are configured.
2. **FatSecret Platform API** — restaurant, branded, and common-food search when `FATSECRET_CLIENT_ID` and `FATSECRET_CLIENT_SECRET` are configured.
3. **USDA FoodData Central** — public-domain branded-food fallback when `USDA_API_KEY` is configured.

The Worker merges and deduplicates results. It does not persist searches, diary data, profile data, or provider responses.

## Why a server is required

API keys embedded in a public PWA can be copied by every visitor. The Worker keeps credentials in server environment variables, restricts browser access to the exact `APP_ORIGIN`, bounds query/result sizes, rejects unsupported methods, disables response caching, and normalizes provider responses before the app receives them.

## Deploy

1. Install Wrangler: `npm install -g wrangler`
2. Copy `wrangler.toml.example` to `wrangler.toml`.
3. Set `APP_ORIGIN` to the exact production origin, such as `https://username.github.io` or the custom domain origin.
4. Authenticate: `wrangler login`
5. Add one or more provider credentials as secrets:
   - `wrangler secret put NUTRITIONIX_APP_ID`
   - `wrangler secret put NUTRITIONIX_API_KEY`
   - `wrangler secret put FATSECRET_CLIENT_ID`
   - `wrangler secret put FATSECRET_CLIENT_SECRET`
   - `wrangler secret put USDA_API_KEY`
6. Deploy: `wrangler deploy`
7. Copy the HTTPS `workers.dev` URL into root `config.js` as `foodCloudUrl`.
8. Open PhactoryFit Settings and confirm **Live Food Cloud connected** and the enabled providers.

Never commit a credential or a populated environment-secret file.

## Endpoints

- `GET /health`
- `GET /v1/search?q=Wingstop%20lemon%20pepper&region=US&limit=50`

## Public-use safeguards

- Set `APP_ORIGIN` exactly; do not use `*`.
- Configure a Cloudflare Rate Limiting binding named `RATE_LIMITER`, or an equivalent edge rule, before a large public launch.
- Monitor quotas and billing for every provider.
- Review each provider's display, attribution, retention, and caching terms.
- Keep responses `no-store` unless your provider agreement explicitly permits caching.
- Consider a custom app domain so browser storage is isolated from unrelated GitHub Pages projects.

Nutritionix item details are fetched only for a bounded number of top autocomplete results. Provider failures are isolated so other configured sources can still return data.
