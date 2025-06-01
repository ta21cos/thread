'use client';

import { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface SlackLayoutProps {
  children: ReactNode;
  user?: {
    id: string;
    email?: string;
  };
  onSignOut?: () => void;
}

export function SlackLayout({ children, user, onSignOut }: SlackLayoutProps) {
  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id="drawer-toggle" type="checkbox" className="drawer-toggle" />

      {/* Page content */}
      <div className="drawer-content flex flex-col">
        {/* Navbar */}
        <div className="navbar bg-base-100 border-b border-base-300">
          <div className="flex-none lg:hidden">
            <label htmlFor="drawer-toggle" className="btn btn-square btn-ghost">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-bold">Thread</h1>
          </div>

          <div className="flex-none flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                  <div className="w-8 rounded-full">
                    <img src={`https://picsum.photos/32/32?random=${user.id}`} alt="User avatar" />
                  </div>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                >
                  <li className="menu-title">
                    <span>{user.email || 'ユーザー'}</span>
                  </li>
                  <li>
                    <a>プロフィール</a>
                  </li>
                  <li>
                    <a>設定</a>
                  </li>
                  <div className="divider my-1"></div>
                  {onSignOut && (
                    <li>
                      <a onClick={onSignOut}>サインアウト</a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 bg-base-200">{children}</main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side">
        <label
          htmlFor="drawer-toggle"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <aside className="min-h-full w-64 bg-base-100 border-r border-base-300">
          {/* Sidebar header */}
          <div className="p-4 border-b border-base-300">
            <h2 className="text-lg font-semibold">Thread</h2>
            <p className="text-sm text-base-content/60">チームコミュニケーション</p>
          </div>

          {/* Navigation menu */}
          <ul className="menu p-4 space-y-2">
            <li className="menu-title">
              <span>ナビゲーション</span>
            </li>
            <li>
              <a className="active">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                すべてのメッセージ
              </a>
            </li>
            <li>
              <a>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                スレッド
              </a>
            </li>
            <li>
              <a>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                ブックマーク
              </a>
            </li>
          </ul>

          {/* User status */}
          {user && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <div className="avatar online">
                  <div className="w-8 rounded-full">
                    <img src={`https://picsum.photos/32/32?random=${user.id}`} alt="User avatar" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">User {user.id.slice(0, 8)}</p>
                  <p className="text-xs text-base-content/60">オンライン</p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
