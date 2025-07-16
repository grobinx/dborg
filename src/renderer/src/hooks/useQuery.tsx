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
    refetch: () => void; // Funkcja do ponownego załadowania danych
}

export function useQuery<T>(
    fetchFunction: () => Promise<T>, // Funkcja asynchroniczna do pobierania danych
    options: UseQueryOptions = {} // Obiekt opcji
): UseQueryResult<T> {
    const { reloadDependency, timeout, interval } = options; // Destrukturyzacja opcji

    const [data, setData] = useState<T | null>(null);
    const [status, setStatus] = useState<QueryStatus>('idle');
    const [error, setError] = useState<Error | null>(null);
    const isFetching = useRef<boolean>(false); // Blokada dla interwału

    const fetchData = useCallback(async () => {
        if (isFetching.current) return; // Jeśli trwa inne zapytanie, pomiń

        isFetching.current = true; // Ustaw blokadę
        setStatus('pending');
        setError(null);

        try {
            const result = timeout
                ? await Promise.race([
                      fetchFunction(),
                      new Promise<never>((_, reject) =>
                          setTimeout(() => reject(new Error('Request timed out')), timeout)
                      ),
                  ])
                : await fetchFunction(); // Jeśli timeoutMs nie jest podany, wykonaj fetchFunction bez ograniczenia czasowego

            setData(result as T);
            setStatus('success');
        } catch (err) {
            setError(err as Error);
            setStatus('error');
        } finally {
            isFetching.current = false; // Zwolnij blokadę
        }
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