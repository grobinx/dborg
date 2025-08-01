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
 

export type FormattedItem = React.ReactNode | string;
export type FormattedContent =
    FormattedItem // pojedynczy element
    | (FormattedItem  // lista z pozycjami wyrównanymi do lewej
        | [FormattedItem, FormattedItem]    // lista z pozycjami wyrównanymi do lewej i prawej
        | [FormattedItem, FormattedItem, FormattedItem]   // lista z pozycjami wyrównanymi do lewej, środka i prawej
    )[];
