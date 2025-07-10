import { Palette } from '@mui/material';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { uuidv7 } from 'uuidv7';

export type LogLevel = keyof typeof console;

export interface LogEntry {
    id: string;
    time: number;
    level: LogLevel;
    message: any[];
}

export interface LogLevelEntry {
    level: LogLevel;
    logged: boolean;
}

export const DefaultLogLevels: LogLevelEntry[] = [
    { level: "error", logged: true },
    { level: "log", logged: true },
    { level: "info", logged: true },
    { level: "warn", logged: true },
    { level: "debug", logged: false },
    { level: "clear", logged: false },
    { level: "time", logged: false },
    { level: "assert", logged: false },
    { level: "trace", logged: false },
    { level: "count", logged: false },
    { level: "countReset", logged: false },
    { level: "group", logged: false },
    { level: "groupCollapsed", logged: false },
    { level: "groupEnd", logged: false },
    { level: "table", logged: false },
]

interface ConsoleContextValue {
    logs: LogEntry[];
    logLevels: LogLevelEntry[];
    setLogLevels: (levels: LogLevel[]) => void;
}

export const LOG_LEVEL_COLORS: Partial<Record<LogLevel, string>> = {
    log: 'info', // Czarny
    warn: 'warning', // Pomarańczowy
    error: 'error', // Czerwony
    info: 'info', // Niebieski
    debug: 'gray', // Zielony
    clear: 'gray', // Szary
    time: 'purple', // Fioletowy
    assert: 'error', // Czerwony
    trace: 'brown', // Brązowy
    count: 'mediumSeaGreen', // Zielony morski
};

export function getLogLevelColor(level: LogLevel, palette: Palette): string {
    const colorKey = LOG_LEVEL_COLORS[level] || 'info';
    if (colorKey && palette[colorKey as keyof Palette]) {
        return palette[colorKey as keyof Palette]['main'] as string;
    }
    return colorKey;
}

export const MAX_CONSOLE_LOGS = 1000; // Maksymalna liczba logów do przechowywania

const ConsoleContext = createContext<ConsoleContextValue | undefined>(undefined);

export const ConsoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const logQueue = useRef<LogEntry[]>([]); // Kolejka logów
    const [timers, setTimers] = useState<Record<string, number>>({}); // Przechowywanie czasów dla console.time
    const [logLevels, setLogLevels] = useState<LogLevelEntry[]>(DefaultLogLevels);
    const [loggedLevels, setLoggedLevels] = useState<LogLevel[]>(DefaultLogLevels.filter(entry => entry.logged).map(entry => entry.level));
    const originalConsole = useRef({ ...console });
    const logHandlerRef = useRef<((level: LogLevel, ...args: any[]) => void) | null>(null);

    logHandlerRef.current = (level: LogLevel, ...args: any[]) => {
        if (loggedLevels.includes(level)) {
            logQueue.current.push({ id: uuidv7(), time: performance.now(), level, message: args });
            const fn = (originalConsole.current as any)[level] as ((...args: any[]) => void) | undefined;
            if (typeof fn === "function") {
                fn(...args);
            }
        }
    };

    useEffect(() => {
        setLoggedLevels(logLevels.filter(entry => entry.logged).map(entry => entry.level));
    }, [logLevels]);

    useEffect(() => {
        // Obsługa console.clear
        console.clear = () => {
            logQueue.current = []; // Wyczyść kolejkę
            setLogs([]); // Wyczyść logi w stanie
            logHandlerRef.current!('clear', 'Console cleared'); // Dodaj wpis o czyszczeniu konsoli
            originalConsole.current.clear(); // Wywołaj oryginalną metodę console.clear
        };

        // Obsługa console.time
        console.time = (label: string) => {
            setTimers((prevTimers) => {
                if (prevTimers[label] !== undefined) {
                    logHandlerRef.current!('warn', `Timer "${label}" already exists`);
                    return prevTimers; // Nie nadpisuj istniejącego timera
                }
                return {
                    ...prevTimers,
                    [label]: performance.now(),
                };
            });
        };

        // Obsługa console.timeEnd
        console.timeEnd = (label: string) => {
            setTimers((prevTimers) => {
                const startTime = prevTimers[label];
                if (startTime !== undefined) {
                    const duration = performance.now() - startTime;
                    logHandlerRef.current!('time', `${label}: ${duration.toFixed(2)}ms`);
                    const { [label]: _, ...rest } = prevTimers; // Usuń timer po zakończeniu
                    return rest;
                }
                logHandlerRef.current!('warn', `Timer "${label}" does not exist`);
                return prevTimers;
            });
        };

        // Obsługa console.timeLog
        console.timeLog = (label: string, ...args: any[]) => {
            const startTime = timers[label];
            if (startTime !== undefined) {
                const duration = performance.now() - startTime;
                logHandlerRef.current!('time', `${label}: ${duration.toFixed(2)}ms`, ...args);
            } else {
                logHandlerRef.current!('warn', `Timer "${label}" does not exist`);
            }
        };

        // Obsługa console.group
        console.group = (label: string) => {
            logHandlerRef.current!('group', `Group: ${label}`);
        };

        // Obsługa console.groupCollapsed
        console.groupCollapsed = (label: string) => {
            logHandlerRef.current!('groupCollapsed', `Group (collapsed): ${label}`);
        };

        // Obsługa console.groupEnd
        console.groupEnd = () => {
            logHandlerRef.current!('groupEnd', 'Group End');
        };

        // Obsługa console.table
        console.table = (data: any) => {
            logHandlerRef.current!('table', data);
        };

        // Obsługa console.assert
        console.assert = (condition: boolean, ...args: any[]) => {
            if (!condition) {
                logHandlerRef.current!('assert', 'Assertion failed:', ...args);
            }
        };

        // Obsługa console.trace
        console.trace = (...args: any[]) => {
            logHandlerRef.current!('trace', 'Trace:', ...args);
        };

        // Obsługa console.count
        const counters: Record<string, number> = {};
        console.count = (label: string = 'default') => {
            counters[label] = (counters[label] || 0) + 1;
            logHandlerRef.current!('count', `${label}: ${counters[label]}`);
        };

        // Obsługa console.countReset
        console.countReset = (label: string = 'default') => {
            if (counters[label]) {
                counters[label] = 0;
                logHandlerRef.current!('countReset', `${label} counter reset`);
            } else {
                logHandlerRef.current!('warn', `Counter "${label}" does not exist`);
            }
        };

        // Obsługa podstawowych metod console
        console.log = (...args: any[]) => logHandlerRef.current!('log', ...args);
        console.warn = (...args: any[]) => logHandlerRef.current!('warn', ...args);
        console.error = (...args: any[]) => logHandlerRef.current!('error', ...args);
        console.info = (...args: any[]) => logHandlerRef.current!('info', ...args);
        console.debug = (...args: any[]) => logHandlerRef.current!('debug', ...args);

        return () => {
            // Przywróć oryginalny obiekt console po odmontowaniu
            Object.assign(console, originalConsole);
        };
    }, []);

    // Aktualizuj stan logs w sposób bezpieczny
    useEffect(() => {
        const interval = setInterval(() => {
            if (logQueue.current.length > 0) {
                setLogs((prevLogs) => {
                    const newLogs = [...prevLogs, ...logQueue.current];
                    logQueue.current = []; // Wyczyść kolejkę

                    // Ogranicz liczbę logów do MAX_CONSOLE_LOGS
                    if (newLogs.length > MAX_CONSOLE_LOGS) {
                        return newLogs.slice(-MAX_CONSOLE_LOGS); // Usuń najstarsze logi
                    }

                    return newLogs;
                });
            }
        }, 100); // Aktualizuj co 100 ms

        return () => clearInterval(interval);
    }, []);

    // Funkcja do ustawiania poziomów logowania
    const setLogLevelsHandle = (levels: LogLevel[]) => {
        setLogLevels(prev => {
            return prev.map(entry => ({
                ...entry,
                logged: levels.includes(entry.level),
            }));
        });
    };

    return (
        <ConsoleContext.Provider value={{ logs, logLevels, setLogLevels: setLogLevelsHandle }}>
            {children}
        </ConsoleContext.Provider>
    );
};

export const useConsole = (): ConsoleContextValue => {
    const context = useContext(ConsoleContext);
    if (!context) {
        throw new Error('useConsole must be used within a ConsoleProvider');
    }
    return context;
};