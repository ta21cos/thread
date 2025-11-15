import { useEffect, RefObject } from 'react';
import { useFocusContext } from '@/contexts/FocusContext';

interface UseFocusManagerOptions {
  id: string;
  ref: RefObject<HTMLElement>;
  autoFocus?: boolean;
  priority?: number;
  restoreOnUnmount?: boolean;
}

/**
 * Hook to manage focus for an input element
 * Automatically registers/unregisters with FocusContext
 */
export const useFocusManager = ({
  id,
  ref,
  autoFocus = false,
  priority = 0,
  restoreOnUnmount = false,
}: UseFocusManagerOptions) => {
  const { registerInput, unregisterInput, focusInput, setFocusedId, restoreLastFocus } = useFocusContext();

  // Register input on mount
  useEffect(() => {
    registerInput(id, ref, priority);

    if (autoFocus) {
      focusInput(id);
    }

    return () => {
      unregisterInput(id);
      if (restoreOnUnmount) {
        restoreLastFocus();
      }
    };
  }, [id, ref, priority, autoFocus, registerInput, unregisterInput, focusInput, restoreOnUnmount, restoreLastFocus]);

  // Track focus/blur events
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleFocus = () => {
      setFocusedId(id);
    };

    const handleBlur = () => {
      setFocusedId(null);
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, [ref, id, setFocusedId]);

  return {
    focus: () => focusInput(id),
  };
};
