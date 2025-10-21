import { useTheme } from "@mui/material/styles";
import { ThemeColor } from "@renderer/types/colors";
import { resolveColor } from "@renderer/utils/colors";
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


const normalize = (s: string, ignoreDiacritics: boolean, caseSensitive: boolean) => {
    let result = s;
    if (ignoreDiacritics) {
        result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        result = result
            .replace(/ł/g, 'l')
            .replace(/Ł/g, 'L');
    }
    if (!caseSensitive) {
        result = result.toLowerCase();
    }
    return result;
};

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

    const searchParts =
        (splitWords ? searchText.split(' ') : [searchText])
            .map(part => normalize(part, ignoreDiacritics, caseSensitive));

    if (searchParts.length === 0) return data;

    const matches = (value: string): boolean => {
        let v = normalize(value, ignoreDiacritics, caseSensitive);

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
 * @param searchText tekst do wysukania, null lub pusty string oznacza brak wyszukiwania
 * @param options 
 * @returns T[] | null - przefiltrowane dane lub null jeżeli brak danych wejściowych, string - aktualny tekst po wyszukiwaniu
 */
export const useSearch = <T,>(
    data: T[] | null,
    fields: ((keyof T)[]) | '*' = '*',
    searchText: string | null,
    options?: SearchOptions,
    delay: number = 300,
    highlightColor: ThemeColor = 'primary',
): [T[] | null, (text: string | undefined | null) => React.ReactNode] => {
    const theme = useTheme();
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
        return () => debouncedSearch.clear();
    }, [data, JSON.stringify(fields), searchText, options]);

    const renderHighlightedText = React.useCallback((text: string | undefined | null): React.ReactNode => {
        return highlightText(
            text,
            searchedText,
            options?.ignoreDiacritics ?? true,
            options?.caseSensitive ?? false,
            resolveColor(highlightColor, theme)?.main
        );
    }, [searchedText, highlightColor]);

    return [searchedData, renderHighlightedText];
}

export const highlightText = (text: string | undefined | null, search: string, ignoreDiacritics: boolean, caseSensitive: boolean, color: string) => {
    if (!search || search.trim() === '') return text;
    if (!text || text.trim() === '') return text;

    // Funkcja pomocnicza do escapowania znaków specjalnych w wyrażeniu regularnym
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Rozdziel query na części oddzielone spacją i escapuj znaki specjalne
    const queryParts = search.split(' ').filter(Boolean).map(part => escapeRegExp(normalize(part, ignoreDiacritics, caseSensitive)));

    // Funkcja pomocnicza do sprawdzania, czy część tekstu pasuje do dowolnej części query
    const matchQuery = (part: string) => {
        const normalizedPart = normalize(part, ignoreDiacritics, caseSensitive);
        return queryParts.some((q) => normalizedPart.includes(q));
    };

    // Rozdziel tekst na części, które pasują lub nie pasują do query
    const regex = new RegExp(`(${queryParts.join('|')})`, 'gi');
    const normalizedText = normalize(text, ignoreDiacritics, caseSensitive);
    const parts = normalizedText.split(regex);

    // Znajdź odpowiadające oryginalne fragmenty tekstu
    let currentIndex = 0;
    const result = parts.map((part, index) => {
        if (!part) return null;
        
        // Znajdź oryginalny fragment tekstu
        const originalPart = text.slice(currentIndex, currentIndex + part.length);
        currentIndex += part.length;

        return matchQuery(part) ? (
            <span key={index} style={{ fontWeight: 'bold', color: color ?? 'inherit' }}>
                {originalPart}
            </span>
        ) : (
            originalPart
        );
    });

    return result;
};
