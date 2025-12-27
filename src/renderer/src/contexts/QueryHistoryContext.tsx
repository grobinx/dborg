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
import { collapseWhitespaceExceptQuotes } from "@renderer/components/editor/editorUtils";

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
        return SparkMD5.hash(collapseWhitespaceExceptQuotes(query) + '::' + profileName);
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
        const preparedRecord: QueryHistoryRecord = {
            qh_id: uuidv7(),
            qh_created: DateTime.now().toSQL(),
            qh_updated: DateTime.now().toSQL(),
            qh_profile_name: entry.profileName,
            qh_query: compressQueryText ? collapseWhitespaceExceptQuotes(entry.query) : entry.query,
            qh_hash: hashQuery(entry.query, entry.profileName),
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
                const timeWindow = deduplicateTimeWindow * 1000;
                const now = Date.now();
                const inWindow: QueryHistoryRecord[] = [];
                const dedupMap = new Map<string, QueryHistoryRecord>();
                const createdMap = new Map<string, string>();

                for (const entry of updatedHistory) {
                    const age = now - DateTime.fromISO(entry.qh_start_time).toMillis();
                    const key = entry.qh_hash!;
                    if (age < timeWindow) {
                        // W oknie czasowym: zachowaj wszystkie
                        inWindow.push(entry);
                    } else {
                        // Poza oknem: deduplikuj, zachowaj najnowszy wpis, ale qh_created z najstarszego
                        if (!dedupMap.has(key) || DateTime.fromISO(entry.qh_start_time).toMillis() > DateTime.fromISO(dedupMap.get(key)!.qh_start_time).toMillis()) {
                            dedupMap.set(key, entry); // Najnowszy wpis
                        }
                        // Zapamiętaj najstarszy qh_created dla danego hash
                        if (!createdMap.has(key) || DateTime.fromISO(entry.qh_created).toMillis() < DateTime.fromISO(createdMap.get(key)!).toMillis()) {
                            createdMap.set(key, entry.qh_created);
                        }
                    }
                }

                // Ustaw qh_created z najstarszego dla każdego hash
                for (const [key, record] of dedupMap.entries()) {
                    record.qh_created = createdMap.get(key)!;
                }

                // Połącz wyniki: najpierw wpisy z okna, potem zdeduplikowane najnowsze spoza okna z qh_created z najstarszego
                updatedHistory = [
                    ...inWindow,
                    ...Array.from(dedupMap.values())
                ].sort((a, b) => DateTime.fromISO(b.qh_start_time).toMillis() - DateTime.fromISO(a.qh_start_time).toMillis());
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
    }, [maxItems, maxAgeDays, hashQuery, deduplicateMode, deduplicateTimeWindow, compressQueryText]);

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
