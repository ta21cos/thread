import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { SessionRestore } from '@/components/SessionRestore';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Thread - A Memo App',
  description: 'A full-stack memo application built with Next.js and Supabase',
  keywords: 'memo, thread, discussion, collaboration',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" data-theme="light" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-gray-50`}>
        <AuthProvider>
          <SessionRestore />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
