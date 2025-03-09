# Thread - A Memo Application

A full-stack memo application built with Next.js 15, Supabase, and Kysely. Users can post memos similar to Slack, create threaded discussions, and upload images.

## Technology Stack

- **Frontend**: Next.js 15 / TypeScript / Tailwind CSS / daisyUI
- **Backend**: Next.js Server Actions
- **Database, Storage, and Authentication**: Supabase
- **ORM**: Kysely
- **Code Style**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- A Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/thread.git
   cd thread
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Supabase project:
   - Go to [Supabase](https://supabase.com/) and create a new project
   - Note your project URL and anon key

4. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   DATABASE_URL=your-postgresql-connection-string
   ```

5. Set up the database schema in Supabase:

   **Option 1: Using the setup script (recommended)**
   ```bash
   # Add your service role key to .env.local first
   echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" >> .env.local
   
   # Run the setup script
   npm run setup:supabase
   ```
   - You can find your service role key in your Supabase dashboard under Project Settings > API
   - This script will automatically execute all the SQL commands to set up your database

   **Option 2: Manual setup**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of the `supabase-setup.sql` file in this repository
   - Paste it into the SQL Editor and run the queries

   Both options will:
   - Create the necessary tables (`memos` and `users`)
   - Set up Row Level Security (RLS) policies
   - Create a storage bucket for image uploads
   - Set up triggers for automatic timestamps and user creation

6. Test your Supabase connection:
   ```bash
   npm run test:supabase
   ```
   - This will test your connection to Supabase's authentication, database, and storage services
   - If there are any issues, the script will provide helpful error messages and guidance

7. Run the development server:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment to Vercel

1. Push your code to a GitHub repository.

2. Go to [Vercel](https://vercel.com/) and create a new project.

3. Import your GitHub repository.

4. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`

5. Deploy the application.

## Features

- **User Authentication**
  - Email/password authentication
  - Session management
  - Protected routes

- **Memo Management**
  - Create and view memos
  - Threaded discussions (replies to memos)
  - Delete memos

- **Image Uploads**
  - Upload images to Supabase storage
  - Attach images to memos

- **Security**
  - Row Level Security (RLS) in Supabase
  - User-specific data access
  - Secure API routes with server actions

## Project Structure

```
thread/
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── dashboard/         # Dashboard page
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── lib/                   # Utility functions and libraries
│   │   ├── actions.ts         # Server actions for database operations
│   │   ├── auth/              # Authentication utilities
│   │   │   └── AuthContext.tsx # Authentication context provider
│   │   ├── db/                # Database utilities
│   │   │   ├── index.ts       # Database connection setup
│   │   │   └── schema.ts      # Database schema definitions
│   │   └── supabase.ts        # Supabase client configuration
│   └── components/            # React components (to be added)
├── .env.local                 # Environment variables (not in repo)
├── .env.local.example         # Example environment variables
├── supabase-setup.sql         # SQL setup script for Supabase
├── setup-supabase.mjs         # Script to automate Supabase setup
├── test-supabase-connection.mjs # Script to test Supabase connection
├── tailwind.config.js         # Tailwind CSS configuration
└── postcss.config.js          # PostCSS configuration
```

## License

This project is licensed under the MIT License.
