# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thread-based note-taking application for personal knowledge management. Users can create interconnected notes with replies and mentions (@ID), similar to social media threads.

## Active Technologies

- TypeScript 5.x with Bun runtime + React 18 (frontend), Hono (backend), Drizzle ORM, DOMPurify (sanitization) (001-thread-based-note)
- SQLite (embedded, offline-first) with full-text search (001-thread-based-note)

- **TypeScript 5.x** / Bun runtime
- **React 18** - Frontend UI framework
- **Hono** - Ultra-fast backend web framework
- **SQLite** - Embedded database (offline-first)
- **Drizzle ORM** - Type-safe database access
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **Bun** - Package manager and runtime

## Project Structure

```
backend/
├── src/
│   ├── models/       # Data models and database schemas
│   ├── services/     # Business logic
│   └── api/          # Hono routes and middleware
└── tests/

frontend/
├── src/
│   ├── components/   # React components
│   ├── pages/        # Page components
│   └── services/     # API clients
└── tests/

desktop/
├── src/
│   ├── main/        # Electron main process
│   ├── preload/     # Preload scripts
│   └── renderer/    # Fallback renderer HTML
└── electron.vite.config.ts

shared/
├── types/           # TypeScript interfaces
└── constants/       # Shared constants

specs/               # Feature specifications
scripts/             # Development scripts
```

## Environment Setup

The application uses environment-specific configuration files:

- `.env` - Development environment (default)
- `.env.test` - Test environment (used when NODE_ENV=test)
- `.env.example` - Template for reference

**Environment Variables:**

- `DATABASE_URL` - Path to SQLite database file (e.g., `data/notes.db` for dev, `data/test.db` for test)
- `PORT` - Server port (default: 3000 for dev, 3001 for test)
- `NODE_ENV` - Environment mode (`development`, `test`, `production`)

**Setup:**

1. Copy `.env.example` to `.env` for development
2. Test environment automatically uses `.env.test` when running tests
3. Config module (`backend/src/config/index.ts`) loads appropriate environment file

## Commands

```bash
# Development
bun install          # Install dependencies
bun run dev          # Start development server
bun run build        # Build for production

# Desktop App
bun run desktop:dev      # Start Electron desktop app (loads http://localhost:5173)
bun run desktop:build    # Build desktop app
bun run desktop:package  # Package desktop app for macOS

# Testing
bun test            # Run unit tests with Vitest (uses test database)
bun run test:e2e    # Run E2E tests with Playwright
bun run test:load   # Run load tests

# Database
bun run db:setup         # Initialize SQLite database (development)
bun run db:setup:test    # Initialize test database
bun run db:migrate       # Run Drizzle migrations
bun run db:seed          # Seed test data

# Code Quality
bun run lint        # Run ESLint
bun run typecheck   # Run TypeScript checks
bun run format      # Format with Prettier
```

## Key Features

### Core Functionality

- Create markdown notes with unique IDs
- Reply to notes creating threaded conversations
- Mention other notes using @ID syntax
- Search notes by content or mentions
- Edit and delete notes with cascade deletion

### UI Layout

- Split view: note list (left) + thread view (right)
- Infinite scroll for note lists
- Chronological ordering (oldest to newest)
- Real-time updates via WebSocket

### Data Model

- **Note**: id, content, parentId, timestamps, depth
- **Mention**: fromNoteId, toNoteId, position
- **SearchIndex**: Full-text search support

## API Endpoints

```
GET    /api/notes              # List root notes
POST   /api/notes              # Create note
GET    /api/notes/:id          # Get note with thread
PUT    /api/notes/:id          # Update note
DELETE /api/notes/:id          # Delete note (cascade)
GET    /api/notes/search       # Search notes
GET    /api/notes/:id/mentions # Get mentions
```

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Functional components with hooks
- Async/await over promises
- Descriptive variable names
- Comment complex logic only

### Testing Requirements

- TDD: Write tests first
- Test files next to source files
- Mock external dependencies
- E2E tests for user flows
- Maintain >80% coverage

### Git Workflow

- Feature branches: `NNN-feature-name`
- Conventional commits
- PR required for main
- Run tests before commit

## Recent Changes

- 001-thread-based-note: Added TypeScript 5.x with Bun runtime + React 18 (frontend), Hono (backend), Drizzle ORM, DOMPurify (sanitization)

- **001-thread-based-note**: Initial implementation with TypeScript, React, Hono, and SQLite

## Performance Targets

- Note operations: <100ms
- Search results: <150ms
- Page load: <1s
- Support 1000+ notes
- Smooth scrolling

## Security Considerations

- Content sanitization with DOMPurify
- CSP headers enabled
- Input validation on all endpoints
- SQL injection prevention
- XSS protection in markdown rendering

---

_Last updated: 2025-09-07_
