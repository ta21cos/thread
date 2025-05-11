# Thread - System Patterns

## System Architecture

Thread follows a modern full-stack architecture with clear separation of concerns:

```mermaid
flowchart TD
    Client[Client Browser] <--> NextJS[Next.js App]
    NextJS <--> ServerActions[Server Actions]
    ServerActions <--> Supabase[Supabase]
    Supabase --> Auth[Authentication]
    Supabase --> DB[PostgreSQL Database]
    Supabase --> Storage[File Storage]
```

### Key Components

1. **Frontend Layer**
   - Next.js 15 with App Router
   - React components for UI
   - Client-side state management
   - Tailwind CSS for styling

2. **Server Layer**
   - Next.js Server Actions for API functionality
   - Server-side rendering and data fetching
   - Authentication handling

3. **Data Layer**
   - Supabase PostgreSQL database
   - Kysely as the query builder and ORM
   - Row Level Security for data protection
   - Supabase Storage for file uploads

## Design Patterns

### Component Architecture

Thread follows the Atomic Design methodology for component organization:

```mermaid
flowchart TD
    Atoms[Atoms: Basic UI elements] --> Molecules[Molecules: Simple component groups]
    Molecules --> Organisms[Organisms: Complex UI sections]
    Organisms --> Templates[Templates: Page layouts]
    Templates --> Pages[Pages: Full views]
```

### State Management

- **Server State**: Managed through Server Actions and database queries
- **Client State**: React's useState and useContext for UI state
- **Authentication State**: Centralized AuthContext provider

### Data Flow

```mermaid
flowchart LR
    User[User Action] --> Component[React Component]
    Component --> ServerAction[Server Action]
    ServerAction --> Database[Database Operation]
    Database --> Response[Response Data]
    Response --> Component
    Component --> Render[UI Render]
```

## Key Technical Decisions

### Next.js App Router

- Provides file-based routing
- Enables server components and server actions
- Supports efficient data fetching patterns

### Supabase Integration

- Simplifies authentication implementation
- Provides PostgreSQL database with Row Level Security
- Offers built-in storage solution for file uploads
- Enables real-time functionality

### Kysely ORM

- Type-safe SQL query builder
- Provides structured database access
- Enables complex queries with TypeScript support

### Tailwind CSS

- Utility-first CSS framework
- Enables rapid UI development
- Ensures consistent styling across components

## Component Relationships

### Authentication Flow

```mermaid
flowchart TD
    AuthContext[AuthContext Provider] --> LoginPage[Login Page]
    AuthContext --> SignupPage[Signup Page]
    AuthContext --> Dashboard[Dashboard]
    AuthContext --> ProtectedRoutes[Protected Routes]
```

### Memo System

```mermaid
flowchart TD
    Dashboard[Dashboard Page] --> MemoForm[Memo Creation Form]
    Dashboard --> MemoList[Memo List]
    MemoList --> MemoItem[Individual Memo]
    MemoItem --> ReplyForm[Reply Form]
    MemoItem --> ReplyList[Reply List]
```

## Error Handling Strategy

- Client-side form validation
- Server-side validation in Server Actions
- Centralized error handling in API calls
- User-friendly error messages
- Fallback UI components for error states

## Security Patterns

- Authentication through Supabase Auth
- Row Level Security policies in database
- CSRF protection in form submissions
- Input sanitization
- Secure file upload handling
