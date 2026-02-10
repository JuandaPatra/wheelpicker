import {
    parseItems,
    normalizeItems,
    validateItems,
    parseFileContent,
    shuffleArray,
    sortArrayAZ,
    sortArrayZA,
    MAX_ITEMS,
    MIN_ITEMS_TO_SPIN,
} from '@/utils/validation';

describe('utils/validation', () => {
    describe('constants', () => {
        it('MAX_ITEMS should be 50', () => {
            expect(MAX_ITEMS).toBe(50);
        });

        it('MIN_ITEMS_TO_SPIN should be 2', () => {
            expect(MIN_ITEMS_TO_SPIN).toBe(2);
        });
    });

    // ─── parseItems ──────────────────────────────────────────

    describe('parseItems', () => {
        it('should split by newlines', () => {
            expect(parseItems('a\nb\nc')).toEqual(['a', 'b', 'c']);
        });

        it('should handle Windows-style line endings (\\r\\n)', () => {
            expect(parseItems('a\r\nb\r\nc')).toEqual(['a', 'b', 'c']);
        });

        it('should split a single line by commas', () => {
            expect(parseItems('a,b,c')).toEqual(['a', 'b', 'c']);
        });

        it('should NOT split by commas when there are multiple lines', () => {
            const result = parseItems('a,b\nc,d');
            expect(result).toEqual(['a,b', 'c,d']);
        });

        it('should return single-element array for a single word', () => {
            expect(parseItems('hello')).toEqual(['hello']);
        });

        it('should return array with single empty string for empty input', () => {
            expect(parseItems('')).toEqual(['']);
        });
    });

    // ─── normalizeItems ──────────────────────────────────────

    describe('normalizeItems', () => {
        it('should trim whitespace from items', () => {
            expect(normalizeItems(['  a  ', ' b ', 'c'])).toEqual(['a', 'b', 'c']);
        });

        it('should remove empty strings', () => {
            expect(normalizeItems(['a', '', '  ', 'b'])).toEqual(['a', 'b']);
        });

        it('should return empty array when all items are empty/whitespace', () => {
            expect(normalizeItems(['', '  ', '\t'])).toEqual([]);
        });

        it('should leave clean items unchanged', () => {
            expect(normalizeItems(['apple', 'banana'])).toEqual(['apple', 'banana']);
        });
    });

    // ─── validateItems ───────────────────────────────────────

    describe('validateItems', () => {
        it('should pass through items within the limit', () => {
            const items = ['a', 'b', 'c'];
            const result = validateItems(items);
            expect(result).toEqual({
                items: ['a', 'b', 'c'],
                wasTruncated: false,
                originalCount: 3,
            });
        });

        it('should truncate items exceeding MAX_ITEMS', () => {
            const items = Array.from({ length: 60 }, (_, i) => `item${i}`);
            const result = validateItems(items);
            expect(result.items).toHaveLength(MAX_ITEMS);
            expect(result.wasTruncated).toBe(true);
            expect(result.originalCount).toBe(60);
        });

        it('should respect existingCount when calculating available slots', () => {
            const items = ['a', 'b', 'c', 'd', 'e'];
            const result = validateItems(items, MAX_ITEMS - 3); // only 3 slots left
            expect(result.items).toHaveLength(3);
            expect(result.wasTruncated).toBe(true);
            expect(result.originalCount).toBe(5);
        });

        it('should return empty when existingCount equals MAX_ITEMS', () => {
            const result = validateItems(['a', 'b'], MAX_ITEMS);
            expect(result.items).toHaveLength(0);
            expect(result.wasTruncated).toBe(true);
        });

        it('should normalize items (trim + filter empty)', () => {
            const result = validateItems(['  a  ', '', '  ', 'b']);
            expect(result.items).toEqual(['a', 'b']);
            expect(result.wasTruncated).toBe(false);
            expect(result.originalCount).toBe(2);
        });
    });

    // ─── parseFileContent ────────────────────────────────────

    describe('parseFileContent', () => {
        it('should split CSV content by both newlines and commas', () => {
            const result = parseFileContent('a,b\nc,d', 'data.csv');
            expect(result).toEqual(['a', 'b', 'c', 'd']);
        });

        it('should split CSV lines without commas as single items', () => {
            const result = parseFileContent('apple\nbanana', 'data.csv');
            expect(result).toEqual(['apple', 'banana']);
        });

        it('should split TXT content by newlines only', () => {
            const result = parseFileContent('a,b\nc,d', 'data.txt');
            expect(result).toEqual(['a,b', 'c,d']); // commas preserved for txt
        });

        it('should handle Windows line endings in TXT', () => {
            const result = parseFileContent('a\r\nb\r\nc', 'data.txt');
            expect(result).toEqual(['a', 'b', 'c']);
        });

        it('should treat unknown extensions like TXT', () => {
            const result = parseFileContent('a\nb', 'data.json');
            expect(result).toEqual(['a', 'b']);
        });

        it('should handle case-insensitive extension matching', () => {
            const result = parseFileContent('a,b\nc,d', 'data.CSV');
            expect(result).toEqual(['a', 'b', 'c', 'd']);
        });
    });

    // ─── shuffleArray ────────────────────────────────────────

    describe('shuffleArray', () => {
        it('should return an array of the same length', () => {
            const arr = [1, 2, 3, 4, 5];
            expect(shuffleArray(arr)).toHaveLength(arr.length);
        });

        it('should contain all the same elements', () => {
            const arr = [1, 2, 3, 4, 5];
            const shuffled = shuffleArray(arr);
            expect(shuffled.sort()).toEqual([...arr].sort());
        });

        it('should NOT mutate the original array', () => {
            const arr = [1, 2, 3, 4, 5];
            const copy = [...arr];
            shuffleArray(arr);
            expect(arr).toEqual(copy);
        });

        it('should handle empty array', () => {
            expect(shuffleArray([])).toEqual([]);
        });

        it('should handle single-element array', () => {
            expect(shuffleArray([42])).toEqual([42]);
        });
    });

    // ─── sortArrayAZ ────────────────────────────────────────

    describe('sortArrayAZ', () => {
        it('should sort alphabetically ascending', () => {
            expect(sortArrayAZ(['banana', 'apple', 'cherry'])).toEqual([
                'apple',
                'banana',
                'cherry',
            ]);
        });

        it('should NOT mutate the original array', () => {
            const arr = ['b', 'a', 'c'];
            const copy = [...arr];
            sortArrayAZ(arr);
            expect(arr).toEqual(copy);
        });

        it('should handle empty array', () => {
            expect(sortArrayAZ([])).toEqual([]);
        });

        it('should be case-sensitive via localeCompare', () => {
            const result = sortArrayAZ(['banana', 'Apple', 'cherry']);
            // 'Apple' should come before 'banana' with localeCompare
            expect(result[0]).toBe('Apple');
        });
    });

    // ─── sortArrayZA ────────────────────────────────────────

    describe('sortArrayZA', () => {
        it('should sort alphabetically descending', () => {
            expect(sortArrayZA(['banana', 'apple', 'cherry'])).toEqual([
                'cherry',
                'banana',
                'apple',
            ]);
        });

        it('should NOT mutate the original array', () => {
            const arr = ['b', 'a', 'c'];
            const copy = [...arr];
            sortArrayZA(arr);
            expect(arr).toEqual(copy);
        });

        it('should handle empty array', () => {
            expect(sortArrayZA([])).toEqual([]);
        });
    });
});
