'use client';
import { useState, useRef, useEffect } from 'react';
import { useToastStore } from '../store/toastStore';

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = async (text: string, label = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast(`${label} to clipboard`, 'success');
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  return { copy, copied };
}
