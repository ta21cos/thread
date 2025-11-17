# Research & Technical Decisions

**Feature**: Thread-Based Note-Taking Application  
**Date**: 2025-09-07  
**Status**: Complete

## Technology Stack Decisions

### Decision: TypeScript + Bun Backend with Hono Framework

**Rationale**:

- Type safety across frontend and backend
- Shared types/interfaces reduce duplication
- Hono: Ultra-fast, lightweight, runs on Bun natively
- First-class TypeScript support in Hono
- Excellent performance with Bun runtime

**Alternatives Considered**:

- Express.js: More mature but heavier and slower than Hono
- Fastify: Fast but Hono is more modern and Bun-optimized
- Python/FastAPI: Good for rapid development but requires type duplication
- Go: Better performance but steeper learning curve for UI developers

### Decision: Hono Web Framework

**Rationale**:

- Fastest Node.js web framework (3x faster than Express)
- Built for edge computing and Bun runtime
- Minimal bundle size (12KB)
- Built-in TypeScript support with excellent type inference
- Middleware system compatible with Web Standards
- Native support for streaming responses

**Alternatives Considered**:

- Express: Industry standard but slower and requires more setup for TypeScript
- Koa: Lightweight but less ecosystem support
- Fastify: Fast but Hono has better Bun integration

### Decision: React for Frontend

**Rationale**:

- Component-based architecture perfect for nested thread UI
- Virtual DOM efficient for frequent updates
- Rich ecosystem of UI libraries
- Strong TypeScript support

**Alternatives Considered**:

- Vue.js: Simpler but less suitable for complex nested structures
- Svelte: Faster but smaller ecosystem
- Vanilla JS: Too much manual DOM manipulation for thread UI

### Decision: SQLite for Storage

**Rationale**:

- Zero-configuration embedded database
- Perfect for single-user desktop/local application
- ACID compliant for data integrity
- Supports complex queries for thread relationships
- **Excellent for offline-first applications** - SQLite runs entirely local, no network required
- File-based storage works perfectly offline, syncs when online

**Alternatives Considered**:

- PostgreSQL: Overkill for single-user application
- MongoDB: Document store doesn't fit relational thread model well
- JSON files: Insufficient for complex queries and relationships

## Architecture Decisions

### Decision: Split-View UI Pattern

**Rationale**:

- Left panel for note list, right panel for thread view
- Common pattern users understand (email clients, chat apps)
- Efficient use of screen space
- Allows quick navigation while maintaining context

**Alternatives Considered**:

- Single panel with navigation: Loses context when viewing threads
- Modal-based: Disrupts flow when viewing threads
- Tab-based: Difficult to compare multiple threads

### Decision: Unique ID System - Short Custom IDs

**Updated Decision**: Use 6-character alphanumeric IDs (e.g., "a3k7m9")
**Rationale**:

- Shorter than NanoID (6 vs 10 chars) for better UX
- Still collision-resistant for single-user app
- Easy to type for mentions (@a3k7m9)
- Different ID strategies per table:
  - Notes: 6-char custom IDs (user-facing)
  - Internal tables: Auto-increment integers (not exposed)
  - Mentions: Composite keys (fromNoteId, toNoteId)

**Alternatives Considered**:

- UUIDs: Too long for user-facing IDs
- Sequential numbers: Privacy/security concerns
- Timestamps: Collision risk and timezone issues

### Decision: Markdown for Note Format

**Rationale**:

- Rich formatting without complexity
- Industry standard for technical notes
- Easy to implement with existing libraries
- Exportable and future-proof

**Alternatives Considered**:

- Plain text: Too limiting for knowledge management
- HTML/WYSIWYG: Security risks and complexity
- Custom format: Unnecessary complexity

## Implementation Patterns

### Decision: Repository Pattern for Data Access

**Rationale**:

- Clean separation of data logic
- Easier testing with mock repositories
- Flexibility to change storage later
- Single source of truth for queries

### Decision: Drizzle ORM

**Rationale**:

- Lightweight and TypeScript-first
- Works great with SQLite
- Type-safe queries
- Excellent Bun compatibility
- Simple migrations

### Decision: Event-Driven Updates

**Rationale**:

- WebSocket for real-time UI updates
- Ensures UI consistency
- Better UX with instant feedback
- Foundation for future collaboration features

### Decision: Component Library (Radix UI)

**Rationale**:

- Unstyled, accessible components
- Full control over styling
- TypeScript support
- Lightweight and performant

## Performance Optimizations

### Decision: Virtual Scrolling for Note Lists

**Rationale**:

- Handles thousands of notes efficiently
- Constant memory usage regardless of list size
- Smooth scrolling experience
- React Window library provides solid implementation

### Decision: Debounced Search

**Rationale**:

- Reduces database queries
- Better UX with fewer intermediate results
- 300ms delay optimal for typing speed
- Client-side caching for recent searches

### Decision: Lazy Loading for Thread Expansion

**Rationale**:

- Initial load only shows root notes
- Threads loaded on demand
- Significantly faster initial render
- Progressive enhancement pattern

## Package Manager & Testing Strategy

### Decision: Bun as Package Manager and Runtime

**Rationale**:

- Significantly faster than npm/yarn/pnpm
- Built-in TypeScript support
- Native test runner included
- SQLite driver built-in
- Excellent for local-first apps

### Decision: Vitest for Unit Tests

**Rationale**:

- Faster execution than Jest
- Better Vite integration
- Compatible with Bun
- Same API as Jest (easy migration)
- Better TypeScript performance
- Works well with React Testing Library

### Decision: Playwright for E2E Tests

**Rationale**:

- Cross-browser testing capability
- Reliable and fast execution
- Good debugging tools
- TypeScript support

### Decision: SQLite In-Memory for Tests

**Rationale**:

- Fast test execution
- Identical to production behavior
- No test database cleanup needed
- Isolated test environments

## Security Considerations

### Decision: Content Security Policy

**Rationale**:

- Prevents XSS attacks in markdown rendering
- Whitelist approach for external resources
- Strict CSP headers in production

### Decision: Input Sanitization with DOMPurify

**Rationale**:

- Battle-tested library
- Configurable for markdown needs
- Prevents script injection
- Maintains formatting fidelity

## Deployment Strategy

### Decision: Docker Container

**Rationale**:

- Consistent environment across platforms
- Easy deployment and scaling
- Includes all dependencies
- Simple backup/restore with volumes

### Decision: Nginx Reverse Proxy

**Rationale**:

- Static file serving optimization
- SSL termination
- Compression and caching
- Load balancing ready

## All NEEDS CLARIFICATION Resolved

✅ Single-user system (no multi-tenancy)
✅ Markdown format for notes
✅ Cascade delete for replies
✅ Infinite scroll UI pattern
✅ No export/import in v1 (future feature)
✅ 10KB note size limit
✅ Graceful degradation under load

---

_This document resolves all technical unknowns from the specification phase._
