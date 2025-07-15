import { useState, useEffect, useCallback } from 'react';

type QueryStatus = 'idle' | 'pending' | 'success' | 'error';

interface UseQueryResult<T> {
    data: T | null;
    status: QueryStatus;
    error: Error | null;
    refetch: () => void; // Funkcja do ponownego załadowania danych
}

export function useQuery<T>(
    fetchFunction: () => Promise<T>, // Funkcja asynchroniczna do pobierania danych
    reloadDependency?: any // Opcjonalna zmienna wymuszająca przeładowanie
): UseQueryResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [status, setStatus] = useState<QueryStatus>('idle');
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        setStatus('pending');
        setError(null);
        try {
            const result = await fetchFunction();
            setData(result);
            setStatus('success');
        } catch (err) {
            setError(err as Error);
            setStatus('error');
        }
    }, [fetchFunction]);

    useEffect(() => {
        fetchData();
    }, [fetchData, reloadDependency]);

    return { data, status, error, refetch: fetchData };
}