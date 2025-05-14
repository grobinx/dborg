import { useState } from "react";

interface SearchState {
    text: string | null;
    wholeWord: boolean;
    caseSensitive: boolean;
    exclude: boolean;
}

interface UseSearchState {
    current: SearchState;
    setSearchText: (text: string | null) => void;
    setWholeWord: (wholeWord: boolean) => void;
    setCaseSensitive: (caseSensitive: boolean) => void;
    setExclude: (exclude: boolean) => void;
    resetSearch: () => void;
}

export const useSearchState = (): UseSearchState => {
    const [searchState, setSearchState] = useState<SearchState>({
        text: null,
        wholeWord: false,
        caseSensitive: false,
        exclude: false,
    });

    const setSearchText = (text: string | null) => {
        setSearchState((prev) => ({ ...prev, text }));
    };

    const setWholeWord = (wholeWord: boolean) => {
        setSearchState((prev) => ({ ...prev, wholeWord }));
    };

    const setCaseSensitive = (caseSensitive: boolean) => {
        setSearchState((prev) => ({ ...prev, caseSensitive }));
    };

    const setExclude = (exclude: boolean) => {
        setSearchState((prev) => ({ ...prev, exclude }));
    };

    const resetSearch = () => {
        setSearchState({
            text: null,
            wholeWord: false,
            caseSensitive: false,
            exclude: false,
        });
    };

    return {
        current: searchState,
        setSearchText,
        setWholeWord,
        setCaseSensitive,
        setExclude,
        resetSearch,
    };
};