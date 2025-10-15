import React from "react";

/**
 * Definicja pola grupowania dla struktur danych typu T.
 */
export interface GroupField<T> {
    /** Pole po którym grupujemy */
    name: keyof T;
    /** Czy grupowanie powinno być rozróżniane wielkością liter (true) czy nie (false), domyślnie true */
    caseSensitive?: boolean;
    /** Wartość zastępcza dla pustych wartości, null, undefined oraz "" */
    emptyValue?: string;
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

/**
 * Struktura przechowująca zgrupowane dane.
 */
export interface GroupedData<T> {
    /** Klucze grupowania */
    group: (string | null)[];
    /** Zgrupowane dane */
    data: T[];
};

/**
 * Typ reprezentujący wynik grupowania danych typu T.
 */
export type GroupResult<T> = GroupedData<T>[];

export const groupArray = <T,>(data: T[], group: Group<T>): GroupedData<T>[] => {
    const groupsMap = new Map<string, GroupedData<T>>();

    for (const item of data) {
        // Tworzymy klucz grupowania z wszystkich pól grupy
        const groupKeys = group.fields.map(field => {
            const value = item[field.name];
            if (value === null || value === undefined || value === '') {
                if (field.emptyValue !== undefined) {
                    return field.emptyValue;
                }
                return null;
            }
            return (field.caseSensitive ?? true) ? String(value) : String(value).toLowerCase();
        });

        const groupKey = groupKeys.join('|');

        if (!groupsMap.has(groupKey)) {
            groupsMap.set(groupKey, {
                group: groupKeys,
                data: []
            });
        }

        groupsMap.get(groupKey)!.data.push(item);
    }

    return Array.from(groupsMap.values());
}

/**
 * Hook do grupowania danych
 * Zwracana funkcja groupBy grupuje dane wg zadanego grupowania zachowując sortowanie
 * @param data 
 * @param groups 
 * @returns {[groupBy]} funkcja groupBy do grupowania danych wg zadanego grupowania
 */
export const useGroup = <T,>(
    data: T[] | null,
    groups: Groups<T>,
    groupName: string | null = null
): [GroupedData<T>[] | null] => {
    const [cache, setCache] = React.useState<Record<string, GroupedData<T>[]>>({});
    const [groupedData, setGroupedData] = React.useState<GroupedData<T>[] | null>(null);

    React.useEffect(() => {
        if (!data || !groups || !groupName) {
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

        const grouped: GroupResult<T> = groupArray(data, group);
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

