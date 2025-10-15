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
     * Funkcja do pobierania wartości dla pola `field`.
     * Przydatne do transformacji wartości przed porównaniem, np. usunięcie spacji, zmiana formatu daty itp.
     * Powinna sprowadzić wartość do typu prostego (string, number, boolean, null).
     * Przydatne gdy w strukturze danych pole jest złożone lub wymaga specjalnej obróbki.
     * @param value wartość pola `field` w strukturze danych typu T
     * @returns typ prosty (string, number, boolean, null)
     */
    getValue?: (value: any) => any;
    /**
     * Funkcja do pobierania wartości dla grupy danego pola.
     * To jakby funkcja okienkowa, agregująca dane wg pola `field`.
     * Powinna sprowadzić wartość do typu prostego (string, number, boolean, null).
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
                const aValue = field.getValue ? field.getValue(a[field.name]) : a[field.name];
                const bValue = field.getValue ? field.getValue(b[field.name]) : b[field.name];
                const comparison = compareValues(aValue, bValue, field);
                if (comparison !== 0) return comparison;
            }
        }

        return 0; // Równe
    });
}
/**
 * Hook do sortowania tablic z wykorzystaniem indeksów
 * @param data 
 * @param indexes
 * @param indexName
 * @returns [sorted] posortowana tablica lub null jeżeli brak danych lub indeksu
 */
export const useSort = <T, I extends Indexes<T>>(
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
