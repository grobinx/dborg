/**
 * Zaawansowane porównanie głębokie dwóch struktur (obsługuje obiekty, tablice, daty, mapy, zbiory, cykle).
 */
export function deepEqual(a: any, b: any, seen = new WeakMap()): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;

    // Obsługa dat
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }

    // Obsługa Map
    if (a instanceof Map && b instanceof Map) {
        if (a.size !== b.size) return false;
        for (const [key, val] of a) {
            if (!b.has(key) || !deepEqual(val, b.get(key), seen)) return false;
        }
        return true;
    }

    // Obsługa Set
    if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size) return false;
        for (const val of a) {
            if (!b.has(val)) return false;
        }
        return true;
    }

    // Obsługa ArrayBuffer i typów pochodnych
    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
        if (a.constructor !== b.constructor || (a as any).byteLength !== (b as any).byteLength) return false;
        for (let i = 0; i < (a as any).byteLength; i++) {
            if ((a as any)[i] !== (b as any)[i]) return false;
        }
        return true;
    }

    // Obsługa cyklicznych referencji
    if (typeof a === "object" && typeof b === "object") {
        if (seen.has(a)) return seen.get(a) === b;
        seen.set(a, b);

        const aKeys = Reflect.ownKeys(a);
        const bKeys = Reflect.ownKeys(b);
        if (aKeys.length !== bKeys.length) return false;

        for (const key of aKeys) {
            if (!bKeys.includes(key)) return false;
            if (!deepEqual(a[key], b[key], seen)) return false;
        }
        return true;
    }

    return false;
}