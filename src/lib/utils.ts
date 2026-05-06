import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export function stripSalutation(name: string): string {
  return name.replace(/^(Mrs?\.|Mrs?|Ms\.|Ms|Dr\.|Dr|Prof\.|Prof)\s+/i, '')
}

export interface StatusThreshold {
  min?: number
  max?: number
  className: string
}

/**
 * Returns a CSS class name based on a numeric value and threshold configuration.
 * Thresholds are evaluated in order - first match wins.
 */
export function getStatusColor(
  value: number,
  thresholds: Array<StatusThreshold>,
): string | undefined {
  for (const threshold of thresholds) {
    const meetsMin = threshold.min === undefined || value >= threshold.min
    const meetsMax = threshold.max === undefined || value < threshold.max
    if (meetsMin && meetsMax) {
      return threshold.className
    }
  }
  return undefined
}
