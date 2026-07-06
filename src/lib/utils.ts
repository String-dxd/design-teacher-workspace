import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export function stripSalutation(name: string): string {
  return name.replace(/^(Mrs?\.|Mrs?|Ms\.|Ms|Dr\.|Dr|Prof\.|Prof)\s+/i, '')
}
