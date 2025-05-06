# Thread - Technical Context

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router for routing and server components
- **React 19**: UI library for component-based development
- **TypeScript**: Strongly typed programming language for improved developer experience
- **Tailwind CSS 4**: Utility-first CSS framework for styling
- **DaisyUI**: Component library built on top of Tailwind CSS

### Backend
- **Next.js Server Actions**: API functionality built into Next.js
- **Supabase**: Backend-as-a-Service platform providing:
  - PostgreSQL database
  - Authentication services
  - Storage solutions
  - Real-time capabilities
- **Kysely**: Type-safe SQL query builder for TypeScript

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Turbopack**: Fast bundler for development

## Development Environment

### Local Setup
- Node.js environment
- npm for package management
- Local Supabase instance for development
- Environment variables for configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key for client-side operations
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for server-side operations (used only in secure contexts)

## Database Schema

### Users Table
- Managed by Supabase Auth
- Extended with custom user profiles

### Memos Table
```
id: uuid (primary key)
content: text
user_id: uuid (foreign key to users)
parent_id: uuid (self-reference for threaded replies, nullable)
created_at: timestamp
updated_at: timestamp
```

### Files Table
```
id: uuid (primary key)
memo_id: uuid (foreign key to memos)
url: text
filename: text
content_type: text
size: integer
created_at: timestamp
```

## API Structure

### Server Actions
- `createMemo`: Create a new memo
- `getMemos`: Get all root-level memos
- `getReplies`: Get replies to a specific memo
- `uploadImage`: Upload an image to Supabase storage
- `deleteMemo`: Delete a memo and its replies

### Authentication API
- Managed through Supabase Auth
- Custom hooks and context for React integration

## Technical Constraints

### Performance Considerations
- Optimize for initial page load
- Efficient data fetching with server components
- Pagination for large datasets
- Image optimization for uploads

### Security Requirements
- Row Level Security in Supabase
- Proper authentication checks
- Input validation and sanitization
- CSRF protection

### Browser Compatibility
- Support for modern browsers
- Progressive enhancement where possible
- Responsive design for various devices

## Dependencies

### Core Dependencies
- next: 15.2.0
- react: ^19.0.0
- react-dom: ^19.0.0
- @supabase/supabase-js: ^2.49.1
- kysely: ^0.27.6
- pg: ^8.13.3
- tailwindcss: ^4.0.12
- daisyui: ^5.0.0
- postcss: ^8.5.3
- autoprefixer: ^10.4.20

### Development Dependencies
- typescript: ^5
- eslint: ^9
- eslint-config-next: 15.2.0
- @types/react: ^19
- @types/react-dom: ^19
- @types/node: ^20
- @types/pg: ^8.11.11
- dotenv: ^16.4.5
- @eslint/eslintrc: ^3

## Deployment Strategy
- Vercel for hosting
- Supabase cloud for database and authentication
- Environment-specific configurations
- CI/CD pipeline for automated deployments
