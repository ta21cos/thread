import { useState, useCallback } from 'react';

/**
 * Custom hook for managing a map of boolean toggle states.
 *
 * Useful for tracking expanded/collapsed states, selections, etc.
 * where multiple items can each have an independent boolean state.
 *
 * @example
 * const [expandedImages, toggleImage] = useToggleMap();
 * // Check if an item is expanded
 * const isExpanded = expandedImages['note-1'] ?? false;
 * // Toggle an item
 * toggleImage('note-1');
 */
export const useToggleMap = (
  initialState: Record<string, boolean> = {}
): [Record<string, boolean>, (key: string) => void] => {
  const [map, setMap] = useState<Record<string, boolean>>(initialState);

  const toggle = useCallback((key: string) => {
    setMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  return [map, toggle];
};

export default useToggleMap;
