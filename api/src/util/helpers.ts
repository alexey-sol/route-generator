/**
 * Picks a number of elements (elementsToPick) from the array evenly but with an offset (if jitterRange is
 * greater than default 1).
 * Jitter may produce duplicate elements in the result array.
 */
export const pickEvenlyWithJitter = <T>(
    array: T[],
    elementsToPick: number,
    jitterRange = 1,
): T[] => {
    if (elementsToPick <= 0) {
        return [];
    }

    if (elementsToPick === 1) {
        return [array[0]];
    }

    if (elementsToPick >= array.length) {
        return [...array];
    }

    const step = (array.length - 1) / (elementsToPick - 1);

    return Array.from({ length: elementsToPick }, (_, index) => {
        const evenIndex = Math.round(index * step);
        const offset = Math.floor(Math.random() * (jitterRange * 2 + 1)) - jitterRange;
        const jitteredIndex = Math.max(0, Math.min(array.length - 1, evenIndex + offset));

        return array[jitteredIndex];
    });
};
