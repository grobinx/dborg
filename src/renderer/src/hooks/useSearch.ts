import { red } from "@mui/material/colors";
import debounce from "@renderer/utils/debounce";
import React from "react";


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
 * Hook do wyszukiwania danych.
 * Jeśli searchText jest null lub pusty, zwracane są wszystkie dane.
 * 
 * @param data 
 * @param fields wszystkie pola, lub tablica nazw pól, domyślnie '*' - wszystkie pola
 * @param searchText tekst do wyszukania, null lub pusty string oznacza brak wyszukiwania
 * @param options 
 * @returns T[] | null - przefiltrowane dane lub null jeżeli brak danych wejściowych, string - aktualny tekst po wyszukiwaniu
 */
export const useSearch = <T>(
    data: T[] | null,
    fields: ((keyof T)[]) | '*' = '*',
    searchText: string | null,
    options?: SearchOptions,
    delay: number = 300,
): [T[] | null, string] => {
    const [searchedData, setSearchedData] = React.useState<T[] | null>(data);
    const [searchedText, setSearchedText] = React.useState<string>(searchText ?? '');

    React.useEffect(() => {
        if (!data) {
            setSearchedData(null);
            setSearchedText('');
            return;
        }

        const debouncedSearch = debounce(() => {
            const results = searchArray(data, fields, searchText, options);
            setSearchedData(results);
            setSearchedText(searchText ?? '');
        }, delay);
        debouncedSearch();
        return () => debouncedSearch.cancel();
    }, [data, fields, searchText, options]);

    return [searchedData, searchedText];
}
