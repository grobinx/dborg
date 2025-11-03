import { useState, useEffect, useCallback, useRef } from 'react';

type QueryStatus = 'idle' | 'pending' | 'success' | 'error';

interface UseQueryOptions {
    /** Opcjonalna zmienna wymuszająca przeładowanie */
    reloadDependency?: any;
    /** Opcjonalny maksymalny czas oczekiwania w milisekundach */
    timeout?: number;
    /** Opcjonalny interwał w milisekundach do automatycznego odświeżania */
    interval?: number;
}

interface UseQueryResult<T> {
    data: T | null;
    status: QueryStatus;
    error: Error | null;
    refetch: (...args: any[]) => Promise<void>; // Funkcja do ponownego załadowania danych
}

export function useQuery<T>(
    fetchFunction: (...args: any[]) => Promise<T>, // Funkcja asynchroniczna do pobierania danych
    options: UseQueryOptions = {} // Obiekt opcji
): UseQueryResult<T> {
    const { reloadDependency, timeout, interval } = options; // Destrukturyzacja opcji

    const [data, setData] = useState<T | null>(null);
    const [status, setStatus] = useState<QueryStatus>('idle');
    const [error, setError] = useState<Error | null>(null);

    // Mechanizm kolejkowania
    const lastPromiseRef = useRef<Promise<void>>(Promise.resolve());

    const fetchData = useCallback(async (...args: any[]) => {
        // Dodajemy żądanie do kolejki
        lastPromiseRef.current = lastPromiseRef.current.then(async () => {
            setStatus('pending');
            setError(null);
            try {
                const result = timeout
                    ? await Promise.race([
                        fetchFunction(...args),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('Przekroczono limit czasu żądania')), timeout)
                        ),
                    ])
                    : await fetchFunction(...args); // Jeśli timeout nie jest podany, wykonaj fetchFunction bez ograniczenia czasowego

                setData(result);
                setStatus('success');
            } catch (err) {
                setError(err as Error);
                setStatus('error');
            }
        });
        // Czekaj na zakończenie tego żądania (ale nie blokuj kolejki)
        return lastPromiseRef.current;
    }, [fetchFunction, timeout]);

    useEffect(() => {
        fetchData();
    }, [fetchData, reloadDependency]);

    // Obsługa interwału
    useEffect(() => {
        if (!interval) return; // Jeśli interwał nie jest ustawiony, pomiń

        const intervalId = setInterval(() => {
            fetchData();
        }, interval);

        return () => clearInterval(intervalId); // Czyszczenie interwału przy odmontowaniu komponentu
    }, [fetchData, interval]);

    return { data, status, error, refetch: fetchData };
}