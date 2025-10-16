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
                return value;
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
}

/**
 * Hook do grupowania danych
 * Zwracana jest tablica pogrupowanych elementów lub null jeśli brak grupowania
 * Funkcja zachowuje porządek elementów źródłowych w ramach grup
 * @param data tablica danych do pogrupowania
 * @param groups definicje grupowań
 * @param groupName nazwa grupowania zdefiniowanego w groups
 * @returns {T[][]} pogrupowana tablica lub null jeśli brak grupowania
 */
export const useGroup = <T,>(
    data: T[] | null,
    groups: Groups<T>,
    groupName: string | null = null
): [T[][] | null] => {
    const [cache, setCache] = React.useState<Record<string, T[][]>>({});
    const [groupedData, setGroupedData] = React.useState<T[][] | null>(null);

    React.useEffect(() => {
        if (!data || !groupName) {
            setGroupedData(null);
            return;
        }

        const group = groups[groupName];
        if (!group || !data) {
            setGroupedData(null);
            return;
        }

        if (group.cache && cache[groupName]) {
            setGroupedData(cache[groupName]);
            return;
        }

        const grouped = groupArray(data, group);
        setGroupedData(grouped);
        if (group.cache) {
            setCache((prev) => ({ ...prev, [groupName]: grouped }));
        }
    }, [data, groups, groupName]);

    React.useEffect(() => {
        setCache({});
    }, [data, groups]);

    return [groupedData];
}

