/**
 * Typ funkcji zwracanej przez debounce(). Jest to zwykła funkcja wywoływalna
 * z tymi samymi argumentami co oryginalna, rozszerzona o metody pomocnicze:
 * - cancel(): anuluje zaplanowane wywołanie
 * - flush(): natychmiast wykonuje ostatnie zaplanowane wywołanie
 */
export type Debounced<T extends (...args: any[]) => void> =
    ((...args: Parameters<T>) => void) & { cancel: () => void; clear: () => void; flush: () => void };

/**
 * Tworzy zdławioną (debounced) wersję funkcji, która opóźnia wykonanie
 * do momentu, aż od ostatniego wywołania minie co najmniej `delay` ms.
 *
 * Właściwości:
 * - wywołanie następuje na "trailing edge" (po czasie bezczynności),
 * - dostępne metody: `cancel()` (anuluj oczekujące wywołanie) i `flush()` (wykonaj natychmiast).
 *
 * Zwracana funkcja jest w pełni typowana na podstawie typu `fn`.
 *
 * @typeParam T - Typ funkcji źródłowej.
 * @param fn - Funkcja do zdławienia.
 * @param delay - Opóźnienie w milisekundach (domyślnie 300).
 * @returns Funkcja debounced z metodami `cancel()` i `flush()`.
 *
 * @example
 * // Proste użycie (DOM)
 * const onResize = debounce(() => console.log(window.innerWidth), 100);
 * window.addEventListener('resize', onResize);
 * // ... później:
 * onResize.cancel(); // anuluje oczekujące wywołanie
 *
 * @example
 * // Z argumentami
 * const search = debounce((q: string) => api.search(q), 250);
 * input.addEventListener('input', (e) => {
 *   search((e.target as HTMLInputElement).value);
 * });
 *
 * @example
 * // W React (zapobiega nadmiernym renderom podczas wpisywania)
 * const runSearch = React.useMemo(
 *   () => debounce((q: string) => setQuery(q), 300),
 *   []
 * );
 * React.useEffect(() => {
 *   runSearch(value);
 *   return () => runSearch.cancel(); // sprzątanie przy zmianie/de-mount
 * }, [value, runSearch]);
 */
export default function debounce<T extends (...args: any[]) => void>(fn: T, delay = 300): Debounced<T> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;

    const debounced = ((...args: Parameters<T>) => {
        lastArgs = args;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn(...(lastArgs as Parameters<T>));
            lastArgs = null;
        }, delay);
    }) as Debounced<T>;

    debounced.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = null;
        lastArgs = null;
    };

    debounced.clear = debounced.cancel;

    debounced.flush = () => {
        if (!timer) return;
        clearTimeout(timer);
        timer = null;
        fn(...(lastArgs as Parameters<T>));
        lastArgs = null;
    };

    return debounced;
}