// Maximum number of items allowed on the wheel
export const MAX_ITEMS = 50;
export const MIN_ITEMS_TO_SPIN = 2;

export interface ValidationResult {
  items: string[];
  wasTruncated: boolean;
  originalCount: number;
}

/**
 * Parse multiline text or comma-separated values into an array of items
 */
export function parseItems(input: string): string[] {
  // Split by newlines first, then by commas if it's a single line
  let lines = input.split(/\r?\n/);
  
  // If only one line, try splitting by comma
  if (lines.length === 1 && input.includes(',')) {
    lines = input.split(',');
  }
  
  return lines;
}

/**
 * Normalize items: trim whitespace and filter empty items
 */
export function normalizeItems(items: string[]): string[] {
  return items
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Validate and limit items to MAX_ITEMS
 */
export function validateItems(items: string[], existingCount: number = 0): ValidationResult {
  const normalized = normalizeItems(items);
  const availableSlots = MAX_ITEMS - existingCount;
  
  if (normalized.length <= availableSlots) {
    return {
      items: normalized,
      wasTruncated: false,
      originalCount: normalized.length
    };
  }
  
  return {
    items: normalized.slice(0, availableSlots),
    wasTruncated: true,
    originalCount: normalized.length
  };
}

/**
 * Parse file content (CSV or TXT)
 */
export function parseFileContent(content: string, filename: string): string[] {
  const extension = filename.toLowerCase().split('.').pop();
  
  if (extension === 'csv') {
    // For CSV, split by newlines and handle potential quoted values
    return content.split(/\r?\n/).flatMap(line => {
      // Simple CSV parsing - handle comma-separated values
      // This handles basic CSV without complex quoted fields
      if (line.includes(',')) {
        return line.split(',');
      }
      return [line];
    });
  }
  
  // For TXT and other files, split by newlines
  return content.split(/\r?\n/);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sort array alphabetically
 */
export function sortArrayAZ<T extends string>(array: T[]): T[] {
  return [...array].sort((a, b) => a.localeCompare(b));
}

/**
 * Sort array reverse alphabetically
 */
export function sortArrayZA<T extends string>(array: T[]): T[] {
  return [...array].sort((a, b) => b.localeCompare(a));
}
