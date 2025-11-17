import { ID_LENGTH } from '@thread-note/shared/constants';

// NOTE: Extract mention IDs from content using @ID syntax
export function extractMentions(content: string): string[] {
  const mentionRegex = new RegExp(`@([A-Za-z0-9]{${ID_LENGTH}})`, 'g');
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
}

// NOTE: Get positions of mentions in content
export function getMentionPositions(content: string, noteId: string): number[] {
  const mentionRegex = new RegExp(`@${noteId}`, 'g');
  const positions: number[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    positions.push(match.index);
  }

  return positions;
}
