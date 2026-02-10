import { useTheme } from "@mui/material/styles";
import { useSetting } from "@renderer/contexts/SettingsContext";
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

export interface UseSearchProps<T,> {
    /** Dane do przeszukania */
    data: T[] | null;
    /** Pola do przeszukania, wszystkie pola lub tablica nazw pól */
    fields: string[] | '*';
    /** Tekst do wyszukania, null lub pusty string oznacza brak wyszukiwania */
    searchText: string | null;
    /** Opcje wyszukiwania */
    options?: SearchOptions;
    /** Opóźnienie przed wykonaniem wyszukiwania w ms */
    delay?: number;
    /** Kolor podświetlenia dopasowanego tekstu */
    highlightColor?: ThemeColor;
    /** Opcjonalna funkcja filtrująca element podczas wyszukiwania */
    filter?: (item: T) => boolean;
    /** Opcjonalna funkcja zwracająca obiekt do przeszukania dla danego elementu, obsługuje przypadek złożonej struktury */
    getItem?: (data: T) => Record<string, any>;
}

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

export const searchArray = <T,>(
    data: T[], 
    fields: string[] | '*', 
    searchText: string | null, 
    options?: SearchOptions,
    filter?: (item: T) => boolean,
    getItem?: (data: T) => Record<string, any>
): T[] => {
    const {
        matchMode = 'contains',
        matchAll = true,
        caseSensitive = false,
        exclude = false,
        ignoreDiacritics = true,
        minLength = 1,
        splitWords = true,
    } = options || {};

    searchText = searchText?.trim() ?? '';

    if (data.length === 0) return data;

    // Jeśli searchText jest pusty lub za krótki, ale filter istnieje, filtruj tylko przez filter
    if ((searchText.length === 0 || searchText.length < minLength)) {
        return filter ? data.filter(item => filter(item)) : data;
    }

    const searchParts =
        (splitWords ? searchText.split(' ') : [searchText])
            .map(part => normalize(part, ignoreDiacritics, caseSensitive));

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

    let resolvedFields: string[];
    if (Array.isArray(fields)) {
        resolvedFields = fields;
    } else {
        resolvedFields = Object.keys(getItem ? getItem(data[0]) : data[0] as object) as string[];
    }

    return data.filter(item => {
        if (filter && !filter(item)) return false;
        const element = getItem ? getItem(item) : item;
        for (const field of resolvedFields) {
            if (element[field] === null || element[field] === undefined) continue;
            const value = String(element[field]);
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
export const useSearch = <T,>({
    data,
    fields = '*',
    searchText,
    options,
    delay: initialDelay,
    highlightColor = 'primary',
    filter,
    getItem,
}: UseSearchProps<T>): [T[] | null, (text: string | undefined | null) => React.ReactNode] => {
    const theme = useTheme();
    const [searchedData, setSearchedData] = React.useState<T[] | null>(data);
    const [searchedText, setSearchedText] = React.useState<string>(searchText ?? '');
    const searchedTextRef = React.useRef<string>(searchedText);
    const [firstRun, setFirstRun] = React.useState<boolean>(true);
    const [delay] = useSetting<number>("app", "search.delay");

    React.useEffect(() => {
        if (!data) {
            setSearchedData(null);
            setSearchedText('');
            return;
        }

        // if first run or searchText didn't change during debounce, search immediately
        if (firstRun || searchedTextRef.current === searchText) {
            setFirstRun(false);
            const results = searchArray(data, fields, searchText, options, filter, getItem);
            setSearchedData(results);
            setSearchedText(searchText ?? '');
            return;
        }

        const debouncedSearch = debounce(() => {
            const results = searchArray(data, fields, searchText, options, filter, getItem);
            setSearchedData(results);
            setSearchedText(searchText ?? '');
        }, initialDelay ?? delay);
        debouncedSearch();
        return () => debouncedSearch.clear();
    }, [data, JSON.stringify(fields), searchText, options, filter]);

    React.useEffect(() => {
        searchedTextRef.current = searchedText;
    }, [searchedText]);

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
    const searchParts = search.split(' ').filter(Boolean).map(part => escapeRegExp(normalize(part, ignoreDiacritics, caseSensitive)));

    // Funkcja pomocnicza do sprawdzania, czy część tekstu pasuje do dowolnej części search
    const matchSearch = (part: string) => {
        const normalizedPart = normalize(part, ignoreDiacritics, caseSensitive);
        return searchParts.some((q) => normalizedPart.includes(q));
    };

    // Rozdziel tekst na części, które pasują lub nie pasują do search
    const regex = new RegExp(`(${searchParts.join('|')})`, 'gi');
    const normalizedText = normalize(text, ignoreDiacritics, caseSensitive);
    const textParts = normalizedText.split(regex);

    // Znajdź odpowiadające oryginalne fragmenty tekstu
    let currentIndex = 0;
    const result = textParts.map((part, index) => {
        if (!part) return null;

        // Znajdź oryginalny fragment tekstu
        const originalPart = text.slice(currentIndex, currentIndex + part.length);
        currentIndex += part.length;

        return matchSearch(part) ? (
            <span key={index} style={{ fontWeight: 'bold', color: color ?? 'inherit' }}>
                {originalPart}
            </span>
        ) : (
            originalPart
        );
    });

    return result;
};
