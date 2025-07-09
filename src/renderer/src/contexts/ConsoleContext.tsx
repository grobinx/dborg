import { Palette } from '@mui/material';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type LogLevel = keyof typeof console;

interface LogEntry {
    level: LogLevel;
    message: any[];
}

interface ConsoleContextValue {
    logs: LogEntry[];
}

export const LOG_LEVEL_COLORS: Partial<Record<LogLevel, string>> = {
    log: 'info', // Czarny
    warn: 'warning', // Pomarańczowy
    error: 'error', // Czerwony
    info: 'info', // Niebieski
    debug: 'gray', // Zielony
    clear: 'gray', // Szary
    time: 'purple', // Fioletowy
    assert: 'orangeRed', // Pomarańczowo-czerwony
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

    useEffect(() => {
        const originalConsole = { ...console };

        const logHandler = (level: LogLevel, ...args: any[]) => {
            logQueue.current.push({ level, message: args });
            const fn = (originalConsole as any)[level] as ((...args: any[]) => void) | undefined;
            if (typeof fn === "function") {
                fn(...args);
            }
        };

        // Obsługa console.clear
        console.clear = () => {
            logQueue.current = []; // Wyczyść kolejkę
            setLogs([]); // Wyczyść logi w stanie
            logHandler('clear', 'Console cleared'); // Dodaj wpis o czyszczeniu konsoli
            originalConsole.clear(); // Wywołaj oryginalną metodę console.clear
        };

        // Obsługa console.time
        console.time = (label: string) => {
            setTimers((prevTimers) => ({
                ...prevTimers,
                [label]: performance.now(),
            }));
        };

        // Obsługa console.timeEnd
        console.timeEnd = (label: string) => {
            setTimers((prevTimers) => {
                const startTime = prevTimers[label];
                if (startTime !== undefined) {
                    const duration = performance.now() - startTime;
                    logHandler('time', `${label}: ${duration.toFixed(2)}ms`);
                    const { [label]: _, ...rest } = prevTimers; // Usuń timer po zakończeniu
                    return rest;
                }
                logHandler('warn', `Timer "${label}" does not exist`);
                return prevTimers;
            });
        };

        // Obsługa console.timeLog
        console.timeLog = (label: string, ...args: any[]) => {
            const startTime = timers[label];
            if (startTime !== undefined) {
                const duration = performance.now() - startTime;
                logHandler('time', `${label}: ${duration.toFixed(2)}ms`, ...args);
            } else {
                logHandler('warn', `Timer "${label}" does not exist`);
            }
        };

        // Obsługa console.group
        console.group = (label: string) => {
            logHandler('group', `Group: ${label}`);
        };

        // Obsługa console.groupCollapsed
        console.groupCollapsed = (label: string) => {
            logHandler('groupCollapsed', `Group (collapsed): ${label}`);
        };

        // Obsługa console.groupEnd
        console.groupEnd = () => {
            logHandler('groupEnd', 'Group End');
        };

        // Obsługa console.table
        console.table = (data: any) => {
            logHandler('table', data);
        };

        // Obsługa console.assert
        console.assert = (condition: boolean, ...args: any[]) => {
            if (!condition) {
                logHandler('assert', 'Assertion failed:', ...args);
            }
        };

        // Obsługa console.trace
        console.trace = (...args: any[]) => {
            logHandler('trace', 'Trace:', ...args);
        };

        // Obsługa console.count
        const counters: Record<string, number> = {};
        console.count = (label: string = 'default') => {
            counters[label] = (counters[label] || 0) + 1;
            logHandler('count', `${label}: ${counters[label]}`);
        };

        // Obsługa console.countReset
        console.countReset = (label: string = 'default') => {
            if (counters[label]) {
                counters[label] = 0;
                logHandler('countReset', `${label} counter reset`);
            } else {
                logHandler('warn', `Counter "${label}" does not exist`);
            }
        };

        // Obsługa podstawowych metod console
        console.log = (...args: any[]) => logHandler('log', ...args);
        console.warn = (...args: any[]) => logHandler('warn', ...args);
        console.error = (...args: any[]) => logHandler('error', ...args);
        console.info = (...args: any[]) => logHandler('info', ...args);
        console.debug = (...args: any[]) => logHandler('debug', ...args);

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


    return (
        <ConsoleContext.Provider value={{ logs }}>
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