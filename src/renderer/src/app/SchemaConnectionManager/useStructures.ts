import { red } from "@mui/material/colors";
import React from "react";

export type SortOrder = 'asc' | 'desc';

/**
 * Definicja pola indeksu dla struktur danych typu T.
 */
export interface IndexField<T> {
    /** Pole, po którym sortujemy */
    name: keyof T;
    /** Kierunek sortowania, domyślnie 'asc' */
    order?: SortOrder;
    /** Czy wartości null powinny być traktowane jako największe (true) czy najmniejsze (false) */
    nullsLast?: boolean;
    /** Czy sortowanie powinno być rozróżniane wielkością liter (true) czy nie (false), domyślnie true */
    caseSensitive?: boolean;
    /**
     * Funkcja do pobierania wartości dla grupy danego pola.
     * To jakby funkcja okienkowa, agregująca dane wg pola `field`.
     * @param data tablica struktur danych typu T, zgrupowana wg pola `field`
     * @returns wartość reprezentująca grupę do porównania
     */
    getGroupedValue?: (data: T[]) => any;
}

/**
 * Definicja indeksu dla struktur danych typu T.
 */
export interface Index<T> {
    /** Pola, które są częścią indeksu */
    fields: IndexField<T>[];
    /** Czy indeks powinien być unikalny, domyślnie false */
    unique?: boolean;
    /** Czy indeks powinien być pamiętany w pamięci podręcznej, domyślnie false */
    cache?: boolean;
}

export type Indexes<T> = Record<string, Index<T>>;

/**
 * Definicja pola grupowania dla struktur danych typu T.
 */
export interface GroupField<T> {
    /** Pole po którym grupujemy */
    name: keyof T;
    /** Czy sortowanie powinno być rozróżniane wielkością liter (true) czy nie (false), domyślnie true */
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
    group: string[];
    /** Zgrupowane dane */
    data: T[];
};

/**
 * Typ reprezentujący wynik grupowania danych typu T.
 */
export type GroupResult<T> = GroupedData<T>[];

/**
 * Funkcja sortująca tablicę danych na podstawie zdefiniowanego indeksu.
 * Obsługuje różne typy danych, wartości null, unikalność oraz grupowanie.
 * @param data Tablica struktur danych typu T do posortowania
 * @param index Definicja indeksu określająca sposób sortowania
 * @returns Posortowana tablica struktur danych typu T
 * @throws Błąd, jeśli indeks jest unikalny i znaleziono duplikaty
 */
export const sortData = <T,>(data: T[], index: Index<T>): T[] => {
    if (index.unique) {
        const seen = new Set<string>();
        for (const item of data) {
            // Tworzymy klucz z wartości wszystkich pól indeksu
            const key = index.fields.map(f => String(item[f.name])).join('|');
            if (seen.has(key)) {
                throw new Error(`Duplicate key found for unique index: ${key}`);
            }
            seen.add(key);
        }
    }

    const getGroupedData = (field: string, data: T[]) => {
        const grouped = data.reduce((acc, item) => {
            const key = String(item[field]);
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        }, {} as Record<string, T[]>);
        return grouped;
    }

    const compareValues = (aValue: any, bValue: any, field: IndexField<T>): number => {
        // Obsługa wartości null
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return field.nullsLast ? 1 : -1;
        if (bValue === null) return field.nullsLast ? -1 : 1;

        // Porównanie wartości w zależności od typu
        let comparison: number;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = ((field.caseSensitive ?? true)
                ? aValue.localeCompare(bValue)
                : aValue.localeCompare(bValue, undefined, { sensitivity: 'base' }));
        } else if (typeof aValue === 'number' || typeof aValue === 'bigint') {
            comparison = Number(aValue) - Number(bValue);
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
            comparison = (aValue === bValue) ? 0 : (aValue ? 1 : -1);
        } else {
            comparison = 0;
        }

        if (comparison === 0) return 0;

        const order = field.order === 'desc' ? -1 : 1;
        return comparison * order;
    }

    const cachedGroupedData: Record<string, Record<string, { value: any, groupedData: T[] }>> = {};
    index.fields.forEach(field => {
        if (field.getGroupedValue) {
            const groupedData = getGroupedData(field.name as string, data);

            const acc: Record<string, { value: any, groupedData: T[] }> = {};
            Object.keys(groupedData).forEach(key => {
                acc[key] = {
                    value: field.getGroupedValue!(groupedData[key]),
                    groupedData: groupedData[key],
                };
            });
            cachedGroupedData[field.name as string] = acc;
        }
    });

    return [...data].sort((a, b) => {
        for (const field of index.fields) {
            if (cachedGroupedData[field.name as string]) {
                const aKey = String(a[field.name]);
                const bKey = String(b[field.name]);
                const aGroup = cachedGroupedData[field.name as string][aKey];
                const bGroup = cachedGroupedData[field.name as string][bKey];
                const aValue = aGroup?.value;
                const bValue = bGroup?.value;
                const comparison = compareValues(aValue, bValue, field);
                if (comparison !== 0) return comparison;
            } else {
                const aValue = a[field.name];
                const bValue = b[field.name];
                const comparison = compareValues(aValue, bValue, field);
                if (comparison !== 0) return comparison;
            }
        }

        return 0; // Równe
    });
}

export const groupData = <T,>(data: T[], group: Group<T>): GroupResult<T> => {
    const groupsMap = new Map<string, GroupedData<T>>();

    for (const item of data) {
        // Tworzymy klucz grupowania z wszystkich pól grupy
        const groupKeys = group.fields.map(field => {
            const value = item[field.name];
            if (value === null || value === undefined || value === '') {
                return field.emptyValue ?? 'NULL';
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
 * Hook do sortowania tablic z wykorzystaniem indeksów
 * @param data 
 * @param indexes
 * @returns {sortBy} funkcja sortBy do sortowania danych wg zadanego indeksu
 */
export const useSortData = <T,>(
    data: T[],
    indexes: Indexes<T>,
) => {
    const [cache, setCache] = React.useState<Record<string, T[]>>({});

    const sortBy = React.useCallback((indexName: string): T[] => {
        const index = indexes[indexName];
        if (!index) return [];

        if (index.cache && cache[indexName] && cache[indexName].length === data.length) {
            return cache[indexName];
        }

        const sorted = sortData(data, index);

        if (index.cache) {
            setCache((prev) => ({ ...prev, [indexName]: sorted }));
        }
        return sorted;
    }, [cache]);

    React.useEffect(() => {
        setCache({});
    }, [data]);

    return { sortBy };
}

/**
 * Hook do grupowania danych
 * Zwracana funkcja groupBy grupuje dane wg zadanego grupowania zachowując sortowanie
 * @param data 
 * @param groups 
 * @returns {groupBy} funkcja groupBy do grupowania danych wg zadanego grupowania
 */
export const useGroupData = <T,>(
    data: T[],
    groups: Groups<T>,
) => {
    const [cache, setCache] = React.useState<Record<string, GroupResult<T>>>({});

    const groupBy = React.useCallback((groupName: string): GroupResult<T> => {
        const group = groups[groupName];
        if (!group) return [];

        if (group.cache && cache[groupName] && cache[groupName].length === data.length) {
            return cache[groupName];
        }

        const grouped = groupData(data, group);

        if (group.cache) {
            setCache((prev) => ({ ...prev, [groupName]: grouped }));
        }
        return grouped;
    }, [cache]);

    React.useEffect(() => {
        setCache({});
    }, [data]);

    return { groupBy };
}
