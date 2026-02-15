/**
 * Task Parser Utility
 *
 * Parses markdown-style task checkboxes from note content.
 * Supports:
 * - [ ] Uncompleted task
 * - [x] Completed task
 * - [X] Completed task (uppercase)
 */

export interface ParsedTask {
  content: string;
  position: number; // Character position in the original content
  isCompleted: boolean;
}

/**
 * Parse tasks from note content
 *
 * @example
 * ```ts
 * const tasks = parseTasks('- [ ] Buy milk\n- [x] Write code');
 * // Returns:
 * // [
 * //   { content: 'Buy milk', position: 0, isCompleted: false },
 * //   { content: 'Write code', position: 16, isCompleted: true }
 * // ]
 * ```
 */
export const parseTasks = (content: string): ParsedTask[] => {
  const taskRegex = /^[\s]*-\s+\[([ xX])\]\s+(.+)$/gm;
  const tasks: ParsedTask[] = [];

  let match: RegExpExecArray | null;
  while ((match = taskRegex.exec(content)) !== null) {
    const [, checkmark, taskContent] = match;
    tasks.push({
      content: taskContent.trim(),
      position: match.index,
      isCompleted: checkmark.toLowerCase() === 'x',
    });
  }

  return tasks;
};

/**
 * Toggle a task's completion status in content
 *
 * @param content Original content
 * @param position Position of the task in content
 * @param completed New completion status
 * @returns Updated content with toggled task
 */
export const toggleTaskInContent = (
  content: string,
  position: number,
  completed: boolean
): string => {
  const taskRegex = /^([\s]*-\s+\[)([ xX])(\]\s+.+)$/gm;
  let result = content;
  let match: RegExpExecArray | null;

  taskRegex.lastIndex = 0;
  while ((match = taskRegex.exec(content)) !== null) {
    if (match.index === position) {
      const [fullMatch, prefix, , suffix] = match;
      const newCheckmark = completed ? 'x' : ' ';
      const newTaskLine = `${prefix}${newCheckmark}${suffix}`;
      result =
        content.substring(0, position) +
        newTaskLine +
        content.substring(position + fullMatch.length);
      break;
    }
  }

  return result;
};

/**
 * Check if content has any tasks
 */
export const hasTasks = (content: string): boolean => {
  const taskRegex = /-\s+\[[ xX]\]\s+.+/;
  return taskRegex.test(content);
};

/**
 * Count tasks in content
 */
export const countTasks = (content: string): { total: number; completed: number } => {
  const tasks = parseTasks(content);
  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.isCompleted).length,
  };
};
