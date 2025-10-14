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
    /** Etykieta indeksu, dla celów UI */
    label?: string;
    /** Podpowiedź indeksu, dla celów UI */
    tooltip?: string;
    /** Opis indeksu, dla celów UI */
    description?: string;
}

export type Indexes<T> = Record<string, Index<T>>;

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
    group: string[];
    /** Zgrupowane dane */
    data: T[];
};

/**
 * Typ reprezentujący wynik grupowania danych typu T.
 */
export type GroupResult<T> = GroupedData<T>[];

/**
 * Tryb dopasowania tekstu w wyszukiwaniu.
 * 'contains' - dowolne dopasowanie zawartości (domyślnie)
 * 'wholeWord' - dopasowanie całych słów
 * 'start' - dopasowanie na początku tekstu
 * 'end' - dopasowanie na końcu tekstu
 */
export type MatchMode = 'contains' | 'wholeWord' | 'start' | 'end';

/**
 * Definicje pól wyszukiwania dla struktur danych.
 */
export interface SearchOptions {
    /** Tryb dopasowania tekstu w wyszukiwaniu */
    matchMode?: MatchMode;
    /** Czy wszystkie części wyszukiwanego tekstu muszą pasować (true) czy dowolna (false), domyślnie true */
    matchAll?: boolean;
    /** Czy uwzględniać wielkość liter, domyślnie false */
    caseSensitive?: boolean;
    /** Czy wykluczać dopasowania, domyślnie false */
    exclude?: boolean;
    /** Czy ignorować diakrytyki, domyślnie true */
    ignoreDiacritics?: boolean;
    /** Minimalna długość wyszukiwanego tekstu */
    minLength?: number;
    /** Czy dzielić tekst wyszukiwania spacją i wyszukiwać wszystkie części w dowolnej kolejności, domyślnie true */
    splitWords?: boolean;
}

/**
 * Funkcja sortująca tablicę danych na podstawie zdefiniowanego indeksu.
 * Obsługuje różne typy danych, wartości null, unikalność oraz grupowanie.
 * @param data Tablica struktur danych typu T do posortowania
 * @param index Definicja indeksu określająca sposób sortowania
 * @returns Posortowana tablica struktur danych typu T
 * @throws Błąd, jeśli indeks jest unikalny i znaleziono duplikaty
 */
export const sortArray = <T,>(data: T[], index: Index<T>): T[] => {
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

export const groupArray = <T,>(data: T[], group: Group<T>): GroupResult<T> => {
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

export const searchArray = <T,>(data: T[], fields: ((keyof T)[]) | '*', searchText: string | null, options?: SearchOptions): T[] => {
    const {
        matchMode = 'contains',
        matchAll = true,
        caseSensitive = false,
        exclude = false,
        ignoreDiacritics = true,
        minLength = 1,
        splitWords = true,
    } = options || {};

    if (data.length === 0) return data;
    if (!searchText || searchText.length === 0) return data;
    if (searchText.length < minLength) return data;

    const normalize = (s: string) => {
        if (ignoreDiacritics) {
            s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
        if (!caseSensitive) {
            s = s.toLowerCase();
        }
        return s;
    };

    const searchParts =
        (splitWords ? searchText.split(' ') : [searchText])
            .map(part => ignoreDiacritics ? part.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : part);

    if (searchParts.length === 0) return data;

    const matches = (value: string): boolean => {
        let v = normalize(value);

        let matched: boolean;

        if (matchMode === 'start') {
            matched = matchAll
                ? searchParts.every(p => v.startsWith(p))
                : searchParts.some(p => v.startsWith(p));
        } else if (matchMode === 'end') {
            matched = matchAll
                ? searchParts.every(p => v.endsWith(p))
                : searchParts.some(p => v.endsWith(p));
        } else if (matchMode === 'wholeWord') {
            const wordSet = new Set(v.split(/\s+/));
            matched = matchAll
                ? searchParts.every(p => wordSet.has(p))
                : searchParts.some(p => wordSet.has(p));
        } else { // contains
            matched = matchAll
                ? searchParts.every(p => v.includes(p))
                : searchParts.some(p => v.includes(p));
        }

        if (exclude) matched = !matched;
        return matched;
    };

    let resolvedFields: (keyof T)[];
    if (Array.isArray(fields)) {
        resolvedFields = fields;
    } else {
        resolvedFields = Object.keys(data[0] as object) as (keyof T)[];
    }

    return data.filter(item => {
        for (const field of resolvedFields) {
            if (item[field] === null || item[field] === undefined) continue;
            const value = String(item[field]);
            if (matches(value)) {
                return true;
            }
        }
        return false;
    });
}

/**
 * Hook do sortowania tablic z wykorzystaniem indeksów
 * @param data 
 * @param indexes
 * @param indexName
 * @returns {[sortBy]} funkcja sortBy do sortowania danych wg zadanego indeksu
 */
export const useSortArray = <T, I extends Indexes<T>>(
    data: T[] | null,
    indexes: I,
    indexName: keyof I | null,
): [T[] | null] => {
    const [sortedData, setSortedData] = React.useState<T[] | null>(null);
    const [cache, setCache] = React.useState<Partial<Record<keyof I, T[] | null>>>({});

    React.useEffect(() => {
        if (!indexes || !data || !indexName) {
            setSortedData(null);
            return;
        }
        const index = indexes[indexName];
        if (!index) {
            setSortedData(null);
            return;
        }
        if (index.cache && cache[indexName]) {
            setSortedData(cache[indexName]);
            return;
        }
        const sortedData = sortArray(data, index);
        setSortedData(sortedData);
        if (index.cache) {
            setCache((prev) => ({ ...prev, [indexName]: sortedData }));
        }
    }, [data, indexes, indexName]);

    React.useEffect(() => {
        setCache({});
    }, [data, indexes]);

    return [sortedData];
}

export interface UseGroupDataCache<T> {
    [groupName: string]: GroupResult<T>;
}

/**
 * Hook do grupowania danych
 * Zwracana funkcja groupBy grupuje dane wg zadanego grupowania zachowując sortowanie
 * @param data 
 * @param groups 
 * @returns {[groupBy]} funkcja groupBy do grupowania danych wg zadanego grupowania
 */
export const useGroupArray = <T,>(
    data: T[] | null,
    groups: Groups<T>,
): [(groupName: string) => GroupResult<T> | null] => {
    const [cache, setCache] = React.useState<UseGroupDataCache<T>>({});

    const groupBy = React.useCallback((groupName: string): GroupResult<T> | null => {
        const group = groups[groupName];
        if (!group || !data) return null;

        if (group.cache && cache[groupName]) {
            return cache[groupName];
        }

        const grouped: GroupResult<T> = groupArray(data, group);

        if (group.cache) {
            setCache((prev: UseGroupDataCache<T>) => ({ ...prev, [groupName]: grouped }));
        }
        return grouped;
    }, [cache, data, groups]);

    React.useEffect(() => {
        setCache({});
    }, [data, groups]);

    return [groupBy];
}

/**
 * Hook do wyszukiwania danych
 * @param data 
 * @param fields wszystkie pola, lub tablica nazw pól, domyślnie '*' - wszystkie pola
 * @param options 
 * @returns 
 */
export const useSearchArray = <T>(
    data: T[],
    fields: ((keyof T)[]) | '*' = '*',
    options?: SearchOptions,
): [(searchText: string) => T[]] => {
    const search = React.useCallback((searchText: string): T[] => {
        if (!searchText) return data;

        return searchArray(data, fields, searchText, options);
    }, [data, fields, options]);

    return [search];
}
