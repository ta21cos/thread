# Thread - Project Brief

## Project Overview
Thread is a full-stack memo application built with Next.js 15, Supabase, and Kysely. It allows users to post memos similar to Slack, create threaded discussions, and upload images.

## Core Requirements

### Authentication
- User registration and login using Supabase Auth
- Support for email/password authentication
- OAuth integration (future enhancement)
- Secure session management

### Memo Functionality
- Create and post memos
- View memos in chronological order
- Support for threaded discussions
- Image upload capabilities

### User Experience
- Clean, intuitive interface
- Responsive design for all devices
- Real-time updates for new memos
- Efficient loading and performance

## Technical Goals
- Implement Next.js 15 with App Router
- Utilize Supabase for backend services (auth, database, storage)
- Implement proper error handling and loading states
- Follow best practices for code organization and maintainability
- Ensure security with Row Level Security in Supabase

## Project Scope
- Initial focus on core memo posting and viewing functionality
- Authentication system with basic user profiles
- Threaded discussions for memos
- Image upload support for memos
- Real-time updates for new content

## Success Criteria
- Users can register, log in, and manage their accounts
- Users can create, view, and reply to memos
- Memos persist across sessions and are properly associated with users
- The application is responsive and performs well on various devices
- The codebase is maintainable and follows best practices
