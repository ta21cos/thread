/**
 * Task Service Implementation
 */

import { okAsync, errAsync } from 'neverthrow';
import { type Task, type Database } from '../../db';
import { taskNotFoundError } from '../../errors/domain-errors';
import { createTaskRepository } from '../../repositories/task.repository';
import { ensureExists } from '../../repositories/helpers';
import { generateId } from '../../utils/id-generator';
import { parseTasks } from '../../utils/task-parser';
import type { TaskServiceHandle } from './types';

// ==========================================
// Handle Implementation (Factory)
// ==========================================

export const createTaskService = ({ db }: { db: Database }): TaskServiceHandle => {
  const taskRepo = createTaskRepository({ db });
  const ensureTaskExists = ensureExists<Task>(taskNotFoundError);

  return {
    syncTasksFromNote: (noteId, authorId, content) => {
      const parsedTasks = parseTasks(content);

      return taskRepo.deleteByNoteId(noteId).andThen(() =>
        parsedTasks.length === 0
          ? okAsync([])
          : taskRepo.bulkCreate(
              parsedTasks.map((t) => ({
                id: generateId(),
                noteId,
                authorId,
                content: t.content,
                position: t.position,
                isCompleted: t.isCompleted,
                completedAt: t.isCompleted ? new Date() : null,
                createdAt: new Date(),
                updatedAt: new Date(),
              }))
            )
      );
    },

    toggleTask: (taskId) =>
      taskRepo
        .findById(taskId)
        .andThen(ensureTaskExists(taskId))
        .andThen((task) => {
          const newIsCompleted = !task.isCompleted;
          return taskRepo.update(taskId, {
            isCompleted: newIsCompleted,
            completedAt: newIsCompleted ? new Date() : null,
          });
        }),

    getTasks: (authorId, includeCompleted = true, limit = 100) =>
      taskRepo.findByAuthorId(authorId, includeCompleted, limit),

    getTasksByNote: (noteId) => taskRepo.findByNoteId(noteId),
  };
};

// ==========================================
// Mock Handle Factory (for testing)
// ==========================================

export const createMockTaskService = (
  overrides: Partial<TaskServiceHandle> = {}
): TaskServiceHandle => ({
  syncTasksFromNote: () => okAsync([]),
  toggleTask: () => errAsync(taskNotFoundError('mock')),
  getTasks: () => okAsync([]),
  getTasksByNote: () => okAsync([]),
  ...overrides,
});
