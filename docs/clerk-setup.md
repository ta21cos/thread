# Clerk Authentication Setup Guide

This guide explains how to set up Clerk authentication for the Thread Type Note App.

## Prerequisites

- Clerk account (sign up at https://clerk.com)
- Access to backend and frontend environment files

## Step 1: Create Clerk Application

1. Go to https://dashboard.clerk.com
2. Click "Create application" or "Add application"
3. Configure the application:
   - **Name**: Thread Type Note App
   - **Application type**: Regular web application
   - **Framework**: React
4. Click "Create application"

## Step 2: Configure Authentication Methods

In your Clerk application dashboard:

1. Navigate to **User & Authentication** → **Email, Phone, Username**
2. Enable authentication methods:
   - ✅ Email address (recommended)
   - ✅ Password
   - Optional: Google OAuth, GitHub OAuth, etc.
3. Click "Save"

## Step 3: Configure Allowed Origins

1. Navigate to **Domains** → **Development**
2. Add allowed origins:
   - `http://localhost:5173` (Vite dev server)
   - `http://localhost:3000` (Backend API)
3. For production, add your production URLs

## Step 4: Get API Keys

1. Navigate to **API Keys** in the sidebar
2. Copy the following keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

⚠️ **Important**: Never commit secret keys to version control!

## Step 5: Configure Backend Environment

1. Open `backend/.env`
2. Add your Clerk keys:

```bash
# Clerk Authentication
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
ALLOWED_ORIGINS=http://localhost:5173
APP_DOMAIN=localhost:3000
```

## Step 6: Configure Frontend Environment

1. Open `frontend/.env`
2. Add your Clerk publishable key:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

## Step 7: Verify Configuration

### Test Backend

```bash
# Terminal 1: Start backend
cd backend
bun run dev
```

The backend should start without errors. If you see "CLERK_SECRET_KEY is required", check your `.env` file.

### Test Frontend (after Step 5 integration)

```bash
# Terminal 2: Start frontend
cd frontend
bun run dev:web
```

Visit http://localhost:5173 - you should be redirected to Clerk's sign-in page.

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable                | Description                                         | Example                 |
| ----------------------- | --------------------------------------------------- | ----------------------- |
| `CLERK_SECRET_KEY`      | Clerk secret key (server-side only)                 | `sk_test_...`           |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key                               | `pk_test_...`           |
| `ALLOWED_ORIGINS`       | Comma-separated allowed origins for CSRF protection | `http://localhost:5173` |
| `APP_DOMAIN`            | Your backend domain for audience validation         | `localhost:3000`        |

### Frontend (`frontend/.env`)

| Variable                     | Description                              | Example       |
| ---------------------------- | ---------------------------------------- | ------------- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (safe for browser) | `pk_test_...` |

## Production Setup

For production deployments:

1. Create a **production** Clerk application (or use production keys)
2. Update `backend/.env.production`:
   ```bash
   CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
   CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   APP_DOMAIN=your-backend-domain.com
   ```
3. Update `frontend/.env.production`:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
   ```

## Troubleshooting

### Backend won't start

**Error**: `CLERK_SECRET_KEY is required`

- **Solution**: Check `backend/.env` file exists and contains `CLERK_SECRET_KEY`

### Authentication fails with 401

**Error**: `Unauthorized` with reason `token-invalid`

- **Solution**: Verify `ALLOWED_ORIGINS` includes your frontend URL
- **Solution**: Check `APP_DOMAIN` matches your backend domain

### Frontend redirect loop

**Error**: Constant redirects to sign-in

- **Solution**: Verify `VITE_CLERK_PUBLISHABLE_KEY` is set in `frontend/.env`
- **Solution**: Check Clerk dashboard has correct redirect URLs

## Security Best Practices

1. ✅ **Never commit `.env` files** - Already in `.gitignore`
2. ✅ **Use test keys for development** - Production keys only in production
3. ✅ **Rotate keys regularly** - Especially if compromised
4. ✅ **Use ALLOWED_ORIGINS** - Prevents CSRF attacks
5. ✅ **Validate audience** - Ensures tokens are for your app

## Next Steps

After completing this setup:

- Proceed to **Step 5**: Web frontend integration (ClerkProvider, useUserSync, etc.)
- Test authentication flow end-to-end
- Implement user sync endpoint (Step 2)

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Clerk Backend SDK](https://clerk.com/docs/references/backend/overview)
