import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // NOTE: Absolute time (e.g., "8:34 AM")
  const absolute = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // NOTE: Relative time
  let relative = '';
  if (diffMins < 1) relative = 'just now';
  else if (diffMins < 60) relative = `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  else if (diffHours < 24) relative = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  else if (diffDays < 7) relative = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  else relative = date.toLocaleDateString();

  // NOTE: Combine absolute + relative (e.g., "8:34 AM (12 hours ago)")
  return `${absolute} (${relative})`;
}
