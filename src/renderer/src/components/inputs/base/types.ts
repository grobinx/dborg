import React from "react";

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

export type PaletteColor =
    /** Kolor główny, neutralny */
    'main'
    /** Kolor podstawowy */
    | 'primary'
    /** Kolor drugorzędny */
    | 'secondary'
    /** Kolor błędu */
    | 'error'
    /** Kolor ostrzeżenia */
    | 'warning'
    /** Kolor informacji */
    | 'info'
    /** Kolor sukcesu */
    | 'success';

export const PaletteColors: PaletteColor[] = [
    'main',
    'primary',
    'secondary',
    'error',
    'warning',
    'info',
    'success',
]