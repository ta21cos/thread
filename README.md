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
   - Create a `memos` table with the following columns:
     - `id` (uuid, primary key)
     - `content` (text)
     - `user_id` (uuid, references auth.users.id)
     - `parent_id` (uuid, nullable, references memos.id)
     - `created_at` (timestamp with time zone)
     - `updated_at` (timestamp with time zone)
   - Set up Row Level Security (RLS) policies for the `memos` table

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

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

- User authentication (sign up, sign in, sign out)
- Create and view memos
- Threaded discussions
- Image uploads (coming soon)
- Real-time updates (coming soon)

## Project Structure

```
thread/
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── dashboard/  # Dashboard page
│   │   ├── login/      # Login page
│   │   ├── signup/     # Signup page
│   │   ├── layout.tsx  # Root layout
│   │   └── page.tsx    # Home page
│   ├── lib/            # Utility functions and libraries
│   │   ├── auth/       # Authentication utilities
│   │   ├── db/         # Database utilities
│   │   └── supabase.ts # Supabase client
│   └── components/     # React components (to be added)
├── .env.local.example  # Example environment variables
├── tailwind.config.js  # Tailwind CSS configuration
└── postcss.config.js   # PostCSS configuration
```

## License

This project is licensed under the MIT License.
