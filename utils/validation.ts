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
 * Parse a single CSV line respecting RFC 4180 quoted fields.
 * Returns an array of fields from that line.
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead: escaped quote ("") or closing quote?
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Parse file content (CSV or TXT)
 * CSV import is RFC 4180-aware so files exported by generateCsvContent
 * are safely re-imported.
 */
export function parseFileContent(content: string, filename: string): string[] {
  const extension = filename.toLowerCase().split('.').pop();

  if (extension === 'csv') {
    return content.split(/\r?\n/).flatMap(line => {
      if (line.includes(',') || line.startsWith('"')) {
        return parseCSVLine(line);
      }
      return [line];
    });
  }

  // For TXT and other files, split by newlines
  return content.split(/\r?\n/);
}

/**
 * Escape a single field per RFC 4180:
 * wrap in double-quotes if it contains a comma, double-quote, or newline;
 * double any internal double-quotes.
 */
export function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Generate a CSV string from an array of items (one item per row).
 * Exported files are RFC 4180-compliant and can be re-imported.
 */
export function generateCsvContent(items: string[]): string {
  return items.map(escapeCSVField).join('\n');
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
