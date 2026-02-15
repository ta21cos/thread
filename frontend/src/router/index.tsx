import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NotesPage } from '../pages/NotesPage';

const BookmarksPage = React.lazy(() => import('../pages/BookmarksPage'));
const TasksPage = React.lazy(() => import('../pages/TasksPage'));
const DailyNotesPage = React.lazy(() => import('../pages/DailyNotesPage'));

const PageFallback = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<NotesPage />} />
          <Route path="/notes/:noteId" element={<NotesPage />} />
          <Route path="/channels/:channelId" element={<NotesPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/daily" element={<DailyNotesPage />} />
          <Route path="/daily/:date" element={<DailyNotesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
