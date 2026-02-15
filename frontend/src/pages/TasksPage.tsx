import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { useTasks, useToggleTask } from '../services/task.service';
import { getRelativeTime } from '@/lib/utils';
import type { Task } from '../../../shared/types';

const TaskItem: React.FC<{
  task: Task;
  onToggle: (id: string) => void;
  onNavigate: (noteId: string) => void;
}> = ({ task, onToggle, onNavigate }) => {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
      data-testid="task-item"
    >
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 flex-shrink-0"
        aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        data-testid="task-toggle"
      >
        {task.isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Square className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <button
        onClick={() => onNavigate(task.noteId)}
        className="flex flex-1 flex-col gap-1 text-left"
      >
        <p
          className={`text-sm ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}
        >
          {task.content}
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-primary">#{task.noteId}</span>
          <span className="text-xs text-muted-foreground">
            {task.isCompleted && task.completedAt
              ? `Completed ${getRelativeTime(task.completedAt)}`
              : getRelativeTime(task.createdAt)}
          </span>
        </div>
      </button>
    </div>
  );
};

export const TasksPage: React.FC = () => {
  const { data: tasks, isLoading } = useTasks(true);
  const toggleTask = useToggleTask();
  const navigate = useNavigate();

  const { pending, completed } = useMemo(() => {
    if (!tasks) return { pending: [], completed: [] };
    return {
      pending: tasks.filter((t) => !t.isCompleted),
      completed: tasks.filter((t) => t.isCompleted),
    };
  }, [tasks]);

  const handleNavigate = (noteId: string) => {
    navigate(`/notes/${noteId}`);
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b border-border px-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-foreground">Tasks</h1>
            {tasks && (
              <span className="text-xs text-muted-foreground">({pending.length} remaining)</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckSquare className="mb-3 h-12 w-12" />
              <p className="font-medium text-foreground">No tasks yet</p>
              <p className="text-sm">Tasks from your notes will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6" data-testid="tasks-list">
              {pending.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    To Do ({pending.length})
                  </h2>
                  {pending.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={(id) => toggleTask.mutate(id)}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              )}

              {completed.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Completed ({completed.length})
                  </h2>
                  {completed.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={(id) => toggleTask.mutate(id)}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default TasksPage;
