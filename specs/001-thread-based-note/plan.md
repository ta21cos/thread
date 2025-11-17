# Implementation Plan: Thread-Based Note-Taking Application

**Branch**: `001-thread-based-note` | **Date**: 2025-10-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-thread-based-note/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Thread-based note-taking application enabling knowledge workers to create interconnected markdown notes with replies and mentions (@ID syntax), organized in conversation-like threads for personal knowledge management. Single-user offline-first web application with split-view UI.

## Technical Context

**Language/Version**: TypeScript 5.x with Bun runtime
**Primary Dependencies**: React 18 (frontend), Hono (backend), Drizzle ORM, DOMPurify (sanitization)
**Storage**: SQLite (embedded, offline-first) with full-text search
**Testing**: Vitest (unit), Playwright (E2E), >80% coverage target
**Target Platform**: Web browsers (desktop/mobile), offline-capable
**Project Type**: Web (frontend + backend)
**Performance Goals**: <200ms response for all operations with up to 1000 notes
**Constraints**: 1000 character max note length, circular reference prevention, cascade deletion
**Scale/Scope**: Single-user, support 1000+ notes, split-view UI with infinite scroll

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Status**: PASS (No constitution file with specific constraints found; following project CLAUDE.md guidelines)

- ✅ **TDD Required**: Tests written first per CLAUDE.md requirement
- ✅ **TypeScript Strict Mode**: Enforced throughout
- ✅ **Simplicity**: Direct SQLite access via Drizzle ORM, no unnecessary abstractions
- ✅ **Testability**: Unit tests (Vitest) + E2E tests (Playwright), >80% coverage
- ✅ **Performance**: <200ms target aligns with <100ms note ops and <150ms search specs in CLAUDE.md

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
backend/
├── src/
│   ├── models/       # Drizzle schemas: notes, mentions, search-index
│   ├── services/     # Business logic: note operations, search, validation
│   └── api/          # Hono routes: /api/notes endpoints
└── tests/
    ├── contract/     # API contract tests (OpenAPI validation)
    ├── integration/  # Service integration tests
    └── unit/         # Model and service unit tests

frontend/
├── src/
│   ├── components/   # React components: NoteList, ThreadView, Editor
│   ├── pages/        # Main page with split view
│   └── services/     # API client, state management
└── tests/
    ├── e2e/          # Playwright tests for user scenarios
    └── unit/         # Component unit tests

shared/
├── types/            # TypeScript interfaces: Note, Mention, API contracts
└── constants/        # Shared constants: limits, error codes
```

**Structure Decision**: Web application (Option 2). Frontend serves split-view React UI, backend provides REST API via Hono. Shared types ensure type safety across boundary. SQLite database embedded in backend.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Task Breakdown by Layer**:

1. **Database Setup** (1-2 tasks):
   - Drizzle schema definitions for Note, Mention, SearchIndex
   - Database migration setup

2. **Contract Tests** (3-5 tasks) [P]:
   - API contract tests for each endpoint (7 endpoints per spec)
   - Schema validation tests

3. **Model Layer** (2-3 tasks) [P]:
   - Note model with validation (1000 char limit, circular ref check)
   - Mention extraction and validation
   - Search index synchronization

4. **Service Layer** (5-7 tasks):
   - Note CRUD service with cascade delete
   - Circular reference detection (DFS algorithm)
   - Search service with FTS5
   - Mention tracking service

5. **API Layer** (3-5 tasks):
   - Hono routes implementation
   - Validation middleware (Zod schemas)
   - Error handling middleware

6. **Frontend Components** (8-10 tasks) [P]:
   - NoteList component with infinite scroll
   - ThreadView component
   - NoteEditor with markdown preview
   - Split-view layout
   - Mention detection UI
   - API client service

7. **Integration Tests** (5-6 tasks):
   - Thread creation and hierarchy tests
   - Mention detection and navigation tests
   - Search functionality tests
   - Cascade deletion tests

8. **E2E Tests** (8-10 tasks):
   - All 16 acceptance scenarios from spec
   - Performance validation (<200ms)

**Estimated Output**: 35-45 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
