import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSetting } from "./SettingsContext";
import { DateTime } from "luxon";
import { DBORG_DATA_PATH_NAME } from "../../../api/dborg-path";
import { useToast } from "./ToastContext";
import { useTranslation } from "react-i18next";
import SparkMD5 from "spark-md5";
import { QueryHistoryDeduplicateMode } from "@renderer/app.config";
import { uuidv7 } from "uuidv7";
import { QueryHistoryRecord } from "../../../api/entities";

export interface QueryEntry {
    query: string;
    profileName: string;
    executionTime?: number;
    fetchTime?: number;
    rows?: number;
    error?: string;
    startTime: number;
}

interface QueryHistoryContextValue {
    initialized: boolean;
    queryHistory: QueryHistoryRecord[];
    addQueryToHistory: (entry: QueryEntry) => void;
    clearQueryHistory: () => void;
    reloadQueryHistory: () => Promise<void>;
}

const QueryHistoryContext = createContext<QueryHistoryContextValue | undefined>(undefined);

export const QueryHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [queryHistory, setQueryHistory] = useState<QueryHistoryRecord[]>([]);
    const [historyInitialized, setHistoryInitialized] = useState<boolean>(false);
    const [maxAgeDays] = useSetting<number>("app", "query_history.max_age_days");
    const [maxItems] = useSetting<number>("app", "query_history.max_items");
    const [compressQueryText] = useSetting<boolean>("app", "query_history.compress_text");
    const [deduplicateMode] = useSetting<QueryHistoryDeduplicateMode>("app", "query_history.deduplicate_mode");
    const [deduplicateTimeWindow] = useSetting<number>("app", "query_history.deduplicate_time_window"); // w ms
    const addToast = useToast();
    const { t } = useTranslation();
    const [justFetched, setJustFetched] = useState<boolean>(false);
    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Oblicz hash zapytania dla deduplikacji (uwzględniając schemat)
    const hashQuery = useCallback((query: string, profileName: string): string => {
        return SparkMD5.hash(query + '::' + profileName);
    }, []);

    // Kompresja zapytania (usunięcie zbędnych spacji/nowych linii, zachowując stringi)
    const compressQuery = useCallback((query: string): string => {
        let result = '';
        let inString: string | null = null; // Typ aktualnego stringa: ', ", ` lub null
        let escaped = false;

        for (let i = 0; i < query.length; i++) {
            const char = query[i];

            // Obsługa escape sequences
            if (escaped) {
                result += char;
                escaped = false;
                continue;
            }

            if (char === '\\' && inString) {
                result += char;
                escaped = true;
                continue;
            }

            // Wejście/wyjście ze stringa
            if ((char === '"' || char === "'" || char === '`') && !inString) {
                inString = char;
                result += char;
                continue;
            }

            if (char === inString) {
                inString = null;
                result += char;
                continue;
            }

            // Jeśli w stringu, zachowaj wszystko
            if (inString) {
                result += char;
                continue;
            }

            // Poza stringiem: kompresuj białe znaki
            if (/\s/.test(char)) {
                // Zamień wielokrotne spacje/nowe linie na pojedynczą spację
                if (result.length > 0 && !/\s$/.test(result)) {
                    result += ' ';
                }
                continue;
            }

            result += char;
        }

        return result.trim();
    }, []);

    // Wczytaj historię z pliku (z rozpakkowaniem)
    const loadQueryHistory = useCallback(async () => {
        const dataPath = await window.dborg.path.get(DBORG_DATA_PATH_NAME);

        const data = await window.dborg.file.readFile(`${dataPath}/query-history.json`).catch(() => null);
        if (data) {
            try {
                let loadedHistory = JSON.parse(data);
                setQueryHistory(loadedHistory);
                setJustFetched(true);
            } catch (error) {
                addToast("error", t("error-parsing-query-history-json", "Error parsing query-history.json file."), { reason: error });
            }
        }
        setHistoryInitialized(true);
    }, [addToast, t]);

    // Zapisz historię do pliku (z opóźnieniem debounce + kompresja)
    const storeQueryHistory = useCallback(async (history: QueryHistoryRecord[]) => {
        const dataPath = await window.dborg.path.get(DBORG_DATA_PATH_NAME);

        try {
            // Konwersja do JSON z minifikacją (bez pretty-print dla mniejszego rozmiaru)
            const jsonString = JSON.stringify(history);

            await window.dborg.file.writeFile(`${dataPath}/query-history.json`, jsonString);
        } catch (error) {
            addToast("error", t("error-saving-query-history", "Error saving query history."), { reason: error });
        }
    }, [addToast, t]);

    // Załaduj historię przy starcie
    useEffect(() => {
        loadQueryHistory();
    }, [loadQueryHistory]);

    // Debounce zapisywania - zapisuj max co 2 sekundy
    useEffect(() => {
        if (!historyInitialized) {
            return;
        }
        if (justFetched) {
            setJustFetched(false);
            return;
        }

        // Anuluj poprzedni timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Ustaw nowy timeout
        saveTimeoutRef.current = setTimeout(() => {
            storeQueryHistory(queryHistory);
        }, 2000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [queryHistory, historyInitialized, justFetched, storeQueryHistory]);

    const addQueryToHistory = useCallback((entry: QueryEntry) => {
        const maxCount = maxItems;
        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
        const cutoffTime = Date.now() - maxAgeMs;

        // Automatyczne dodanie znacznika czasu i hasha (uwzględniając schema)
        const query = compressQueryText ? compressQuery(entry.query) : entry.query;
        const preparedRecord: QueryHistoryRecord = {
            qh_id: uuidv7(),
            qh_created: DateTime.now().toSQL(),
            qh_updated: DateTime.now().toSQL(),
            qh_profile_name: entry.profileName,
            qh_query: query,
            qh_hash: hashQuery(query, entry.profileName),
            qh_start_time: DateTime.fromMillis(entry.startTime ?? Date.now()).toISO()!,
            qh_execution_time: entry.executionTime ?? null,
            qh_fetch_time: entry.fetchTime ?? null,
            qh_rows: entry.rows ?? null,
            qh_error: entry.error ?? null,
        };

        setQueryHistory((prev) => {
            let updatedHistory = [preparedRecord, ...prev];

            // Oportunistyczne czyszczenie po wieku
            if (updatedHistory.length > 100) {
                updatedHistory = updatedHistory.filter((e) => DateTime.fromISO(e.qh_start_time).toMillis() >= cutoffTime);
            }

            // Zastosuj deduplikację zgodnie z ustawieniami
            if (deduplicateMode === "time-based") {
                // Time-based: grupuj po hash (query + schema), w każdej grupie zachowaj wpisy z okna czasowego + 1 najstarszy
                const timeWindow = deduplicateTimeWindow * 1000;
                const now = Date.now();
                const deduped: QueryHistoryRecord[] = [];
                const groups = new Map<string, QueryHistoryRecord[]>(); // hash -> lista wpisów

                // Pogrupuj po hash (query + schema)
                for (const entry of updatedHistory) {
                    const key = entry.qh_hash!;
                    if (!groups.has(key)) {
                        groups.set(key, []);
                    }
                    groups.get(key)!.push(entry);
                }

                // Dla każdej grupy zachowaj wpisy w oknie + 1 najstarszy spoza okna
                for (const [hash, entries] of groups) {
                    // Sortuj po czasie (najnowsze najpierw)
                    entries.sort((a, b) => DateTime.fromISO(b.qh_start_time).toMillis() - DateTime.fromISO(a.qh_start_time).toMillis());

                    const inWindow: QueryHistoryRecord[] = [];
                    let oldestOutsideWindow: QueryHistoryRecord | null = null;

                    for (const entry of entries) {
                        const age = now - DateTime.fromISO(entry.qh_start_time).toMillis();
                        if (age < timeWindow) {
                            // W oknie - zachowaj wszystkie
                            inWindow.push(entry);
                        } else {
                            // Poza oknem - zachowaj tylko najstarszy
                            if (!oldestOutsideWindow || DateTime.fromISO(entry.qh_start_time).toMillis() < DateTime.fromISO(oldestOutsideWindow.qh_start_time).toMillis()) {
                                oldestOutsideWindow = entry;
                            }
                        }
                    }

                    // Dodaj wpisy z okna
                    deduped.push(...inWindow);
                    // Dodaj najstarszy spoza okna (jeśli istnieje)
                    if (oldestOutsideWindow) {
                        deduped.push(oldestOutsideWindow);
                    }
                }

                // Posortuj z powrotem (najnowsze najpierw)
                deduped.sort((a, b) => DateTime.fromISO(b.qh_start_time).toMillis() - DateTime.fromISO(a.qh_start_time).toMillis());
                updatedHistory = deduped;
            } else if (deduplicateMode === "aggressive") {
                // Aggressive: globalnie deduplikuj — zachowaj tylko ostatni z każdego hasha (query + schema)
                const seen = new Map<string, QueryHistoryRecord>();

                for (const entry of updatedHistory) {
                    const key = entry.qh_hash;
                    if (!seen.has(key) || DateTime.fromISO(entry.qh_start_time).toMillis() > DateTime.fromISO(seen.get(key)!.qh_start_time).toMillis()) {
                        seen.set(key, entry); // Najnowszy wygrywa
                    }
                }

                updatedHistory = Array.from(seen.values()).sort((a, b) => DateTime.fromISO(b.qh_start_time).toMillis() - DateTime.fromISO(a.qh_start_time).toMillis());
            }
            // "none": brak deduplikacji

            // Ogranicz do maxItems
            if (updatedHistory.length > maxCount) {
                updatedHistory = updatedHistory.slice(0, maxCount);
            }

            return updatedHistory;
        });
    }, [maxItems, maxAgeDays, hashQuery, deduplicateMode, deduplicateTimeWindow, compressQuery, compressQueryText]);

    const clearQueryHistory = useCallback(() => {
        setQueryHistory([]);
    }, []);

    const reloadQueryHistory = useCallback(async () => {
        await loadQueryHistory();
    }, [loadQueryHistory]);

    // Lazy cleanup w tle
    useEffect(() => {
        const cleanupHistory = () => {
            const maxAgeMs = (maxAgeDays ?? 60) * 24 * 60 * 60 * 1000;
            const cutoffTime = Date.now() - maxAgeMs;
            const maxCount = maxItems ?? 1000;

            const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

            idleCallback(() => {
                setQueryHistory((prev) => {
                    if (prev.length === 0 || prev.length < maxCount * 0.8) {
                        return prev;
                    }

                    let filtered = prev.filter((entry) => DateTime.fromISO(entry.qh_start_time).toMillis() >= cutoffTime);

                    if (filtered.length > maxCount) {
                        filtered = filtered.slice(0, maxCount);
                    }

                    return filtered.length !== prev.length ? filtered : prev;
                });
            });
        };

        const startupTimeout = setTimeout(cleanupHistory, 5000);
        const interval = setInterval(cleanupHistory, 6 * 60 * 60 * 1000);

        return () => {
            clearTimeout(startupTimeout);
            clearInterval(interval);
        };
    }, [maxAgeDays, maxItems]);

    return (
        <QueryHistoryContext.Provider value={{ initialized: historyInitialized, queryHistory, addQueryToHistory, clearQueryHistory, reloadQueryHistory }}>
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
