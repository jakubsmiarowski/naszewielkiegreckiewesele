# Cloudflare + GitHub deployment setup

This project is configured to deploy to Cloudflare Workers from GitHub Actions.

## 1) Create and connect the GitHub repository

If the repo does not exist yet:

```bash
git add .
git commit -m "chore: bootstrap project and cloudflare github workflows"
git branch -M main
git remote add origin git@github.com:<your-user-or-org>/<your-repo>.git
git push -u origin main
```

## 2) Prepare Cloudflare credentials for CI

1. In Cloudflare dashboard, create an API token using template: `Edit Cloudflare Workers`.
2. Copy your Cloudflare Account ID from the dashboard.
3. In GitHub repository settings, add these Actions secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

## 3) Deploy from GitHub

Deployment workflow file: `.github/workflows/deploy-cloudflare.yml`

- Automatic deploy: every push to `main`
- Manual deploy: GitHub Actions -> `Deploy to Cloudflare` -> `Run workflow`

## 4) Optional local deploy/auth check

```bash
npx wrangler whoami
npm run deploy
```

If `wrangler whoami` fails, run:

```bash
npx wrangler login
```
