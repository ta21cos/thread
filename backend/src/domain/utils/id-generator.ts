import { ID_LENGTH, ID_CHARSET } from '@thread-note/shared/constants';

// NOTE: Generate 6-character alphanumeric IDs (as per research.md decision)
export function generateId(): string {
  let id = '';
  const charsetLength = ID_CHARSET.length;

  for (let i = 0; i < ID_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * charsetLength);
    id += ID_CHARSET[randomIndex];
  }

  return id;
}

// NOTE: Validate ID format
export function isValidId(id: string): boolean {
  if (id.length !== ID_LENGTH) return false;

  for (const char of id) {
    if (!ID_CHARSET.includes(char)) return false;
  }

  return true;
}
