
export type Size =
    /** Mały rozmiar elementu - przeznaczenie: np. toolbary */
    'small'
    /** Średni rozmiar elementu - przeznaczenie: np. formatki */
    | 'medium'
    /** Duży rozmiar elementu - przeznaczenie: np. nagłówki */
    | 'large';

export const Sizes: Size[] = [
    'small',
    'medium',
    'large',
];
