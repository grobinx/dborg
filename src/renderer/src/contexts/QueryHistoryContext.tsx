import React, { createContext, useContext, useState } from "react";

const MAX_HISTORY_SIZE = 100; // Maksymalna liczba wpisów w historii

export interface QueryHistoryEntry {
    query: string; // Wykonane zapytanie
    schema: string; // Schemat połączenia
    executionTime?: number; // Czas wykonania zapytania (ms)
    fetchTime?: number; // Czas pobrania danych (ms)
    rows?: number; // Liczba pobranych wierszy
    error?: string; // Ewentualny błąd
    startTime: number; // Godzina uruchomienia zapytania
}

interface QueryHistoryContextValue {
    queryHistory: QueryHistoryEntry[];
    addQueryToHistory: (entry: QueryHistoryEntry) => void;
    clearQueryHistory: () => void;
}

const QueryHistoryContext = createContext<QueryHistoryContextValue | undefined>(undefined);

export const QueryHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [queryHistory, setQueryHistory] = useState<QueryHistoryEntry[]>([]);

    const addQueryToHistory = (entry: QueryHistoryEntry) => {
        setQueryHistory((prev) => {
            const updatedHistory = [entry, ...prev]; // Tworzenie nowej tablicy
            if (updatedHistory.length > MAX_HISTORY_SIZE) {
                updatedHistory.pop(); // Usuń ostatni element, jeśli liczba przekracza MAX_HISTORY_SIZE
            }
            return updatedHistory; // Zwrócenie nowej referencji
        });
    };

    const clearQueryHistory = () => {
        setQueryHistory([]); // Czyść historię zapytań
    };

    return (
        <QueryHistoryContext.Provider value={{ queryHistory, addQueryToHistory, clearQueryHistory }}>
            {children}
        </QueryHistoryContext.Provider>
    );
};

export const useQueryHistory = (): QueryHistoryContextValue => {
    const context = useContext(QueryHistoryContext);
    if (!context) {
        throw new Error("useQueryHistory must be used within a QueryHistoryProvider");
    }
    return context;
};
