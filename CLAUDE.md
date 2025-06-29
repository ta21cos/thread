# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build application (includes Prisma generation)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run test:supabase` - Test Supabase connection
- `npm run setup:supabase` - Set up Supabase database schema

## Architecture Overview

Thread is a memo application with threaded discussions, similar to Slack. The architecture follows a modern full-stack pattern:

### Tech Stack

- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, daisyUI
- **Backend**: Next.js Server Actions
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Authentication & Storage**: Supabase Auth and Storage

### Key Data Models

- **User**: Authentication handled by Supabase, metadata in PostgreSQL
- **Memo**: Core entity with content, hierarchical threading via parent_id
- **Threading**: Self-referential relationship where memos can have replies

### Server Actions Pattern

The app uses Next.js Server Actions located in `src/app/actions/memo/`:

- Actions use Zod schemas for validation (`schema.ts`)
- Repository pattern with Prisma in `src/lib/db/repositories/`
- Type-safe operations defined in `types.ts`

### Authentication Flow

- Supabase Auth for user management
- AuthContext provider for client-side state
- Server-side auth checks in Server Actions
- Row Level Security (RLS) policies in database

### File Structure Conventions

- `src/app/` - Next.js App Router pages and Server Actions
- `src/components/` - React components (MessageCard, MessageInput, etc.)
- `src/lib/` - Utilities, database, auth, and Supabase clients
- `memory-bank/` - Project documentation and context

### Environment Variables Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_SERVICE_ROLE_KEY` - For setup scripts (optional)

### Database Setup

Use `npm run setup:supabase` to automatically create tables, RLS policies, and storage buckets. Manual setup available via `supabase-setup.sql`.

### Other instructions

Always follow rules in ./instructions/\*\*.md.
