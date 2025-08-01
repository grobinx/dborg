import React from "react";

export type Size =
    /** Mały rozmiar elementu - przeznaczenie: np. toolbary */
    'small'
    /** Średni rozmiar elementu - przeznaczenie: np. formatki */
    | 'medium'
    /** Duży rozmiar elementu - przeznaczenie: np. nagłówki */
    | 'large';

export type PaletteColor =
    /** Kolor podstawowy */
    'primary'
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
 