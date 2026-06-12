'use client';
import { useState } from 'react';
import { useToastStore } from '../store/toastStore';

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const copy = async (text: string, label = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast(`${label} to clipboard`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  return { copy, copied };
}
