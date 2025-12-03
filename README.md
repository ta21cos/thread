<div align="center">

# 🧵 Thread

**A modern thread-based note-taking application for personal knowledge management**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Runtime-black.svg)](https://bun.sh/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)

[Features](#-features) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [Development](#-development) • [Testing](#-testing)

</div>

---

## ✨ Features

**Thread** enables you to create interconnected notes with replies and mentions, similar to social media threads but for your personal knowledge base.

- 📝 **Markdown Notes** - Write notes with full markdown support
- 🔗 **Thread Conversations** - Reply to notes and create nested discussions
- 🏷️ **@Mentions** - Reference other notes using `@ID` syntax
- 🔍 **Full-Text Search** - Find notes instantly with SQLite FTS5
- 💾 **Offline-First** - Embedded SQLite database, no server required
- ⚡ **Blazing Fast** - Built with Bun runtime and optimized for performance
- 🖥️ **Desktop App** - Native Electron app for macOS, Windows, and Linux
- 🎨 **Clean UI** - Split-view interface with infinite scroll

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or higher

### Installation

```bash
# Install dependencies
bun install

# Setup database
bun run db:setup

# Start development server
bun run dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your app running.

### Desktop App

```bash
# Start desktop app in development mode
bun run desktop:dev

# Build and package for macOS
bun run desktop:package
```

## 🛠️ Tech Stack

<table>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>
      <a href="https://react.dev/">React 18</a> •
      <a href="https://www.typescriptlang.org/">TypeScript 5.x</a> •
      <a href="https://vitejs.dev/">Vite</a>
    </td>
  </tr>
  <tr>
    <td><strong>Backend</strong></td>
    <td>
      <a href="https://hono.dev/">Hono</a> •
      <a href="https://bun.sh/">Bun Runtime</a> •
      <a href="https://orm.drizzle.team/">Drizzle ORM</a>
    </td>
  </tr>
  <tr>
    <td><strong>Database</strong></td>
    <td>
      <a href="https://www.sqlite.org/">SQLite</a> with FTS5 full-text search
    </td>
  </tr>
  <tr>
    <td><strong>Desktop</strong></td>
    <td>
      <a href="https://www.electronjs.org/">Electron</a> •
      <a href="https://electron-vite.org/">Electron Vite</a>
    </td>
  </tr>
  <tr>
    <td><strong>Testing</strong></td>
    <td>
      <a href="https://vitest.dev/">Vitest</a> •
      <a href="https://playwright.dev/">Playwright</a>
    </td>
  </tr>
</table>

## 📂 Project Structure

```
thread/
├── backend/          # Hono API server
│   ├── src/
│   │   ├── api/      # REST endpoints
│   │   ├── models/   # Database schemas
│   │   └── services/ # Business logic
│   └── tests/
├── frontend/         # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── tests/
├── desktop/          # Electron desktop app
│   ├── src/
│   │   ├── main/
│   │   ├── preload/
│   │   └── renderer/
│   └── electron.vite.config.ts
├── shared/           # Shared TypeScript types
└── specs/            # Feature specifications
```

## 💻 Development

### Available Commands

```bash
# Development
bun run dev              # Start dev server (backend + frontend)
bun run build            # Build for production

# Desktop App
bun run desktop:dev      # Start Electron app
bun run desktop:build    # Build desktop app
bun run desktop:package  # Package for distribution

# Database
bun run db:setup         # Initialize database
bun run db:setup:test    # Initialize test database
bun run db:migrate       # Run migrations
bun run db:seed          # Seed test data

# Code Quality
bun run lint             # Run ESLint
bun run typecheck        # TypeScript type checking
bun run format           # Format with Prettier
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=data/notes.db
PORT=3000
NODE_ENV=development
```

## 🧪 Testing

```bash
# Unit tests (Vitest)
bun test

# E2E tests (Playwright)
bun run test:e2e

# Load testing
bun run test:load
```

**Testing Philosophy:**

- ✅ Test-Driven Development (TDD)
- ✅ >80% code coverage target
- ✅ Mock external dependencies
- ✅ E2E tests for critical user flows

## 📡 API Endpoints

| Method   | Endpoint                  | Description           |
| -------- | ------------------------- | --------------------- |
| `GET`    | `/api/notes`              | List root notes       |
| `POST`   | `/api/notes`              | Create new note       |
| `GET`    | `/api/notes/:id`          | Get note with thread  |
| `PUT`    | `/api/notes/:id`          | Update note           |
| `DELETE` | `/api/notes/:id`          | Delete note (cascade) |
| `GET`    | `/api/notes/search`       | Search notes          |
| `GET`    | `/api/notes/:id/mentions` | Get note mentions     |

## 🎯 Performance Targets

- ⚡ Note operations: **<100ms**
- 🔍 Search results: **<150ms**
- 📄 Page load: **<1s**
- 📚 Support: **1000+ notes**

## 🙏 Acknowledgments

Built with modern web technologies and inspired by the need for simple, fast, and interconnected note-taking.

---

<div align="center">

**[⬆ back to top](#-thread)**

Made with ❤️ using [Bun](https://bun.sh/) and [React](https://react.dev/)

</div>
