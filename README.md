# Adazol personal portfolio

Daniel Lozada’s portfolio at [adazol.com](https://adazol.com). The Next.js site includes case studies, a career timeline with two resume PDFs, field notes, a GitHub activity calendar, a Three.js portrait, and Dan AI.

## Run locally

Use Node.js 22.14 or newer and Yarn 1.22.

```sh
yarn install --frozen-lockfile
cp .env.example .env.local
yarn dev
```

Open [localhost:3000](http://localhost:3000). The portfolio, static portrait, resume PDFs, and public-source answers work with empty environment variables. With an email app configured on the device, the contact page can also open a filled email draft.

## Configure the server

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Enables the Gemini question service. Missing credentials, a timeout, or a provider error leaves a labeled public portfolio index available. |
| `GEMINI_MODEL` | Optional model override. Defaults to `gemini-3.5-flash-lite`. |
| `GITHUB_TOKEN` | Optional fallback token for the admin GitHub connection check. |
| `RESEND_API_KEY` | Optional fallback Resend API key for contact form delivery. |
| `CONTACT_FROM_EMAIL` | Optional fallback Resend-verified sender address. Set it together with `CONTACT_TO_EMAIL`. |
| `CONTACT_TO_EMAIL` | Optional fallback recipient inbox. Set it together with `CONTACT_FROM_EMAIL`. |
| `RESUME_URL` | Default PDF target for `/resume` until a destination is published in the admin panel. |
| `RESUME_DETAILED_URL` | Default PDF target for `/resume_detailed` until a destination is published in the admin panel. |
| `DOMAIN_OLD_URL` | Optional origin for `/old` links. Defaults to `https://daniel-lozada.web.app`. |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint for persistent hosted visitor counts and site content. |
| `UPSTASH_REDIS_REST_TOKEN` | Server-side token for the visitor and site content database. |
| `PORTFOLIO_VISITOR_DB_PATH` | Optional SQLite path for a separate localhost visitor database. |

Keep provider keys in server-side secrets. Dan AI selects from public portfolio facts and returns links from the curated source list. The contact endpoint uses provider idempotency and confirms acceptance only when Resend returns a message ID. The email draft opens in the visitor’s mail app for them to send.

Before deploying to `adazol.com`, verify Gemini with the preview deployment key and test delivery to the intended inbox. The app applies per-instance limits, with per-client addresses from Vercel’s managed header on that host. Configure host-level rate limits or quotas if needed for the expected production traffic.

## Private site administration

1. Set `PORTFOLIO_ADMIN_PATH` to an unpredictable lowercase path segment. Generate one with `openssl rand -hex 18`.
2. Set `PORTFOLIO_ADMIN_ACCOUNTS` to a JSON object mapping usernames to unique, randomly generated passwords. Each password must be 24–256 characters. Generate each with `openssl rand -hex 24`. For example, in a local .env file use `PORTFOLIO_ADMIN_ACCOUNTS='{"editor":"<generated password>"}'`. In a hosting dashboard, enter the JSON without the outer shell quotes.
3. On Vercel, configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` with write access. Use separate Redis databases for production and preview when they need independent content. Local development uses `.local/portfolio-content.sqlite` by default when Redis is absent. For a self-hosted production server using SQLite, set `PORTFOLIO_CONTENT_DB_PATH` to a path on a persistent volume shared by the server processes. Serve the production admin route over HTTPS.
4. After the initial deployment, open `/admin/<PORTFOLIO_ADMIN_PATH>` directly and sign in. Keep the URL and credentials private. Remove or rotate an account password to revoke that account’s sessions.

Choose a section, then select **Publish changes** to update the site without rebuilding it. Sections include appearance and visibility controls, landing and about copy, Work page copy and reorderable case studies with cover and project links, field notes with reorderable entries and paragraphs, resume jobs and skills, both PDF destinations, site availability, footer copy, and profile links. Draft edits stay in the open tab until published. Blank PDF destinations use the corresponding environment variable or bundled PDF.

### Background themes

Open **Appearance** to choose Server Aisle, Exposed CPU, or Fiber Patch Bay, then publish. Each scene responds to scroll position. Turn off **Animate background on scroll** to keep the scene still or turn off **Ambient Background** to show only the theme palette. The site also respects the visitor’s reduced-motion preference. Server Aisle uses a photo fallback when WebGL is unavailable.

### Service credentials

Set `PORTFOLIO_CREDENTIALS_KEY` in the server environment to a random 64-character hex string generated with `openssl rand -hex 32`. Keep it alongside your other server secrets and use a separate key per environment. Configure this before saving tokens, since existing overrides require the same key to decrypt. If you replace the encryption key, re-enter the provider tokens.

In **Service credentials**, enter Gemini and Resend API keys to override their server environment values. The same section lets you save and check a fine-grained GitHub token with no extra permissions using the [authenticated-user endpoint](https://docs.github.com/en/rest/users/users#get-the-authenticated-user). The visitor-facing calendar continues to use public data. Use the smallest permissions needed and a sending-only Resend key. Changing or removing a saved override updates future requests. Revoke old credentials through the provider when rotating them there.

Under **Contact email**, save the Resend-verified sender and the recipient inbox together. A sender can be an address or a display name followed by an address in angle brackets. The saved pair takes effect without redeploying and takes precedence over `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL`. Removing it restores the environment pair when both variables are set. The contact page uses its existing email draft fallback when delivery is unavailable.

The panel displays only credential status. Credentials are encrypted with AES-256-GCM before storage and are never included in public content. The database connection, encryption key and admin accounts belong in the server environment.

## Activity and visitor counts

The Activity page shows the calendar published on Daniel’s public GitHub profile. The server caches the calendar and displays a dated public snapshot if GitHub is unavailable.

The footer counts unique browsers on each page using a first-party cookie. Refreshing a URL with the same cookie keeps its count unchanged. Counts begin when the counter is enabled in an environment and can vary when visitors use additional browsers or clear their cookies. The store uses a hashed browser identifier scoped to each page to calculate its count.

On localhost, counts are persisted in `.local/portfolio-visitors.sqlite`. Configure the two Upstash variables for persistent counts on a hosted deployment. Use a dedicated database for production to keep its counts independent of testing and preview traffic.

## Checks

```sh
yarn test
yarn typecheck
yarn lint
yarn build
```

Use `yarn start` to serve the production build. The bundled portfolio defaults and project case studies live in `src/lib/portfolio-content.ts` and `src/lib/site-content.ts`. Dan AI uses published case studies and a separately curated fact inventory in `src/lib/portfolio-assistant-sources.ts`. The bundled PDFs are copies of the prior live downloads. The HTML career timeline holds the latest confirmed role.
