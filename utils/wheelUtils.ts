/**
 * Logic for generating wheel items based on repeat and disable settings
 */

export interface WheelItemMap {
    wheelItems: string[];
    originalIndices: number[];
}

/**
 * Calculates the items to be displayed on the wheel
 * @param items Original source items
 * @param disabledIndices Indices of items that should be excluded
 * @param repeatCount Number of times to repeat the resulting list
 * @returns Object containing the flattened wheel items and their mapping to original indices
 */
export function getWheelItems(
    items: string[],
    disabledIndices: number[],
    repeatCount: number
): WheelItemMap {
    if (!items || items.length === 0) {
        return { wheelItems: [], originalIndices: [] };
    }

    // 1. Get enabled items and their original indices
    const activeItems: { text: string; originalIndex: number }[] = [];

    items.forEach((text, index) => {
        if (!disabledIndices.includes(index)) {
            activeItems.push({ text, originalIndex: index });
        }
    });

    if (activeItems.length === 0) {
        return { wheelItems: [], originalIndices: [] };
    }

    // 2. Repeat the list
    const wheelItems: string[] = [];
    const originalIndices: number[] = [];

    for (let r = 0; r < repeatCount; r++) {
        activeItems.forEach(item => {
            wheelItems.push(item.text);
            originalIndices.push(item.originalIndex);
        });
    }

    return { wheelItems, originalIndices };
}
