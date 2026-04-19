import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * className'leri akıllıca birleştirir — Tailwind çakışmalarını çözer.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
