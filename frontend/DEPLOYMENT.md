# Frontend Deployment to Cloudflare Pages

This document describes how to deploy the Thread Note frontend to Cloudflare Pages.

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com/sign-up
2. **Wrangler CLI**: Install globally with `npm install -g wrangler` or use `bunx wrangler`
3. **Authenticate**: Run `wrangler login` to authenticate with your Cloudflare account

## Environment Setup

### 1. Update Backend URLs

Edit the environment files to point to your deployed backend:

**`.env.production`:**

```env
VITE_BACKEND_API_ENDPOINT=https://thread-note-backend-production.YOUR_SUBDOMAIN.workers.dev
VITE_BACKEND_WS_ENDPOINT=wss://thread-note-backend-production.YOUR_SUBDOMAIN.workers.dev
```

**`.env.staging`:**

```env
VITE_BACKEND_API_ENDPOINT=https://thread-note-backend-staging.YOUR_SUBDOMAIN.workers.dev
VITE_BACKEND_WS_ENDPOINT=wss://thread-note-backend-staging.YOUR_SUBDOMAIN.workers.dev
```

Replace `YOUR_SUBDOMAIN` with your actual Cloudflare Workers subdomain.

### 2. Verify Backend Deployment

Ensure your backend is deployed to Cloudflare Workers first:

```bash
cd backend
bun run deploy:staging   # For staging
bun run deploy:production # For production
```

## Deployment Commands

### Staging Deployment

```bash
cd frontend
bun run deploy:staging
```

This will:

1. Run TypeScript compiler
2. Build the frontend with staging environment variables
3. Deploy to Cloudflare Pages project `thread-note-frontend-staging`

### Production Deployment

```bash
cd frontend
bun run deploy:production
```

This will:

1. Run TypeScript compiler
2. Build the frontend with production environment variables
3. Deploy to Cloudflare Pages project `thread-note-frontend-production`

## Build Commands

You can also build without deploying:

```bash
bun run build:staging      # Build for staging
bun run build:production   # Build for production
```

## First-Time Deployment

On your first deployment, Cloudflare Pages will create the project automatically. After the first deployment:

1. Go to https://dash.cloudflare.com/
2. Navigate to **Pages** in the sidebar
3. Find your project (e.g., `thread-note-frontend-production`)
4. Configure any additional settings like:
   - Custom domains
   - Environment variables (if needed)
   - Build settings

## Environment Variables in Cloudflare Pages

**Important**: Vite embeds environment variables at build time, so all `VITE_*` variables from your `.env` files are compiled into the JavaScript bundle.

The frontend uses `VITE_BACKEND_API_ENDPOINT` to determine the backend API URL:

- **Development**: Uses `/api` (proxied by Vite dev server to `localhost:3000`)
- **Production/Staging**: Uses the full URL from `.env.production` or `.env.staging`

Make sure to update `.env.production` and `.env.staging` with your actual backend URLs before building/deploying.

You don't need to set environment variables in the Cloudflare Pages dashboard since they're embedded at build time.

## Custom Domains

To add a custom domain:

1. Go to your Cloudflare Pages project
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Follow the instructions to configure DNS

## Deployment URL

After deployment, your site will be available at:

- **Production**: `https://thread-note-frontend-production.pages.dev`
- **Staging**: `https://thread-note-frontend-staging.pages.dev`

## Rollback

To rollback to a previous deployment:

1. Go to your Pages project in the Cloudflare dashboard
2. Navigate to **Deployments**
3. Find the deployment you want to rollback to
4. Click **Rollback to this deployment**

## CI/CD Integration

For automated deployments with GitHub Actions or other CI/CD platforms:

```yaml
# Example GitHub Actions workflow
- name: Deploy to Cloudflare Pages
  run: |
    cd frontend
    bun install
    bun run deploy:production
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

You'll need to create a Cloudflare API token with Pages permissions.

## Troubleshooting

### Build Fails

- Check TypeScript errors: `bun run typecheck`
- Check linting errors: `bun run lint`
- Ensure all dependencies are installed: `bun install`

### API Calls Fail

- Verify backend URLs in `.env.production` or `.env.staging`
- Check CORS settings in your backend
- Ensure backend is deployed and accessible

### 404 Errors on Client-Side Routes

Cloudflare Pages should handle SPAs automatically, but if you encounter issues:

1. Create a `_redirects` file in the `public` folder:
   ```
   /* /index.html 200
   ```

## Monitoring

Monitor your deployment:

- **Analytics**: Cloudflare Pages dashboard > Analytics
- **Logs**: Use `wrangler pages deployment tail` to view real-time logs
- **Performance**: Use Cloudflare Web Analytics

---

_Last updated: 2025-11-01_
