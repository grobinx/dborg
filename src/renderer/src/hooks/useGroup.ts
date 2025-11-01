import React from "react";

/**
 * Definicja pola grupowania dla struktur danych typu T.
 */
export interface GroupField<T> {
    /** Pole po którym grupujemy */
    name: keyof T;
    /** Czy grupowanie powinno być rozróżniane wielkością liter (true) czy nie (false), domyślnie true */
    caseSensitive?: boolean;
}

/**
 * Definicja grupowania dla struktury danych T
 */
export interface Group<T> {
    /** Pola, po których grupujemy */
    fields: GroupField<T>[];
    cache?: boolean;
}

/**
 * Definicje grupowań dla struktur danych typu T.
 */
export type Groups<T> = Record<string, Group<T>>;

export const groupArray = <T,>(data: T[], group: Group<T>): T[][] => {
    const groupsMap = new Map<string, T[]>();

    for (const item of data) {
        // Tworzymy klucz grupowania z wszystkich pól grupy
        const groupKeys = group.fields.map(field => {
            const value = item[field.name];
            if (value === null || value === undefined || value === '') {
                return value as any;
            }
            return (field.caseSensitive ?? true) ? String(value) : String(value).toLowerCase();
        });

        const groupKey = groupKeys.join('|');

        if (!groupsMap.has(groupKey)) {
            groupsMap.set(groupKey, []);
        }

        groupsMap.get(groupKey)!.push(item);
    }

    return Array.from(groupsMap.values());
};

// type guard do wykrywania pojedynczej definicji grupy
const isSingleGroup = <T,>(g: Groups<T> | Group<T> | null | undefined): g is Group<T> => {
    return !!g && typeof g === 'object' && Array.isArray((g as Group<T>).fields);
};

/**
 * Hook do grupowania danych
 * Zwracana jest tablica pogrupowanych elementów lub null jeśli brak grupowania
 * Funkcja zachowuje porządek elementów źródłowych w ramach grup
 * - Przekaż Groups<T> i nazwę groupName, aby użyć wybranej grupy
 * - Lub przekaż pojedynczy Group<T> bez podawania groupName
 * @param data tablica danych do pogrupowania
 * @param groups definicje grupowań (pojedyncza grupa lub słownik grup)
 * @param groupName nazwa grupowania (wymagana tylko dla słownika Groups<T>)
 * @returns {T[][]} pogrupowana tablica lub null jeśli brak grupowania
 */
export const useGroup = <T,>(
    data: T[] | null,
    groups: Groups<T> | Group<T> | null,
    groupName?: string | null
): T[][] | null => {
    const [cache, setCache] = React.useState<Record<string, T[][]>>({});
    const [groupedData, setGroupedData] = React.useState<T[][] | null>(null);

    React.useEffect(() => {
        if (!data || !groups) {
            setGroupedData(null);
            return;
        }

        let activeGroup: Group<T> | null = null;
        let cacheKey = "__single__";

        if (isSingleGroup<T>(groups)) {
            // pojedyncza grupa – groupName nie jest wymagane
            activeGroup = groups;
            cacheKey = "__single__";
        } else {
            // wiele grup – potrzebna nazwa groupName
            if (!groupName) {
                setGroupedData(null);
                return;
            }
            activeGroup = groups[groupName] ?? null;
            cacheKey = groupName;
        }

        if (!activeGroup) {
            setGroupedData(null);
            return;
        }

        if (activeGroup.cache && cache[cacheKey]) {
            setGroupedData(cache[cacheKey]);
            return;
        }

        const grouped = groupArray(data, activeGroup);
        setGroupedData(grouped);

        if (activeGroup.cache) {
            setCache((prev) => ({ ...prev, [cacheKey]: grouped }));
        }
    }, [data, groups, groupName, cache]);

    React.useEffect(() => {
        setCache({});
    }, [data, groups]);

    return groupedData;
};

