import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for trapping focus within a container element
 *
 * This is essential for modal dialogs to ensure keyboard users
 * can't tab out of the modal to interact with background content.
 *
 * Reference: requirements.md Section 11.2 Accessibility
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isActive: boolean = true
) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
    ].join(', ');

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(selector)
    ).filter(
      (el) =>
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        getComputedStyle(el).visibility !== 'hidden'
    );
  }, []);

  // Handle tab key navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive || event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Ensure elements exist before focusing
      if (!firstElement || !lastElement) return;

      // Shift+Tab from first element -> go to last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // Tab from last element -> go to first
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [isActive, getFocusableElements]
  );

  // Store previous active element and focus first focusable element
  useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement;

    // Focus the first focusable element in the container
    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    if (firstElement) {
      // Small delay to ensure the container is rendered
      requestAnimationFrame(() => {
        firstElement.focus();
      });
    }

    // Add event listener for tab key
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously focused element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, getFocusableElements, handleKeyDown]);

  return containerRef;
}

/**
 * Hook for handling Escape key to close modals
 */
export function useEscapeKey(
  callback: () => void,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback, isActive]);
}

/**
 * Combined hook for modal accessibility
 * - Focus trapping
 * - Escape key to close
 * - Focus restoration on close
 */
export function useModalAccessibility<T extends HTMLElement = HTMLElement>(
  isOpen: boolean,
  onClose: () => void
) {
  const containerRef = useFocusTrap<T>(isOpen);
  useEscapeKey(onClose, isOpen);

  return containerRef;
}
