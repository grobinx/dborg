import { ActionDescriptor, ActionGroupDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { DataGridMode } from "@renderer/components/DataGrid/DataGrid";
import { ColumnDataType, ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { ReactNode } from "react";

export type CustomSlotType =
    "split"
    | "tabs"
    | "tab"
    | "content"
    | "title"
    | "grid"
    | "editor"
    | "text"
    | "rendered";

export type RefreshSlotCallback = (slotId: string) => void;

/**
 * Interface representing a connection view slot
 */
export interface CustomSlot {
    /**
     * Unique identifier for the slot.
     */
    id: string;
    /**
     * Type of the slot
     */
    type: CustomSlotType;
}

export type SplitSlotType =
    SplitSlot
    | TabsSlot
    | ContentSlot;

/**
 * Slot typu split.
 * Pozwala na podział widoku na dwie części (pionowo lub poziomo).
 * Każda część może być kolejnym splitem, zakładkami lub inną zawartością.
 */
export interface SplitSlot extends CustomSlot {
    type: "split";
    /**
     * Kierunek podziału: "vertical" (góra/dół) lub "horizontal" (lewo/prawo).
     */
    direction: "vertical" | "horizontal";
    /**
     * Zawartość pierwszej części (slot lub funkcja zwracająca slot).
     */
    first: SplitSlotType | (() => SplitSlotType);
    /**
     * Zawartość drugiej części (slot lub funkcja zwracająca slot).
     */
    second: SplitSlotType | (() => SplitSlotType);
}

/**
 * Slot typu tabs.
 * Pozwala na wyświetlenie grupy zakładek.
 */
export interface TabsSlot extends CustomSlot {
    type: "tabs";
    /**
     * Tablica zakładek lub funkcja zwracająca tablicę zakładek.
     */
    tabs: TabSlot[] | (() => TabSlot[]);
}

/**
 * Struktura etykiety zakładki (label).
 */
export interface TabLabel {
    /**
     * Ikona zakładki (opcjonalnie).
     */
    icon?: React.ReactNode | (() => React.ReactNode);
    /**
     * Tekst lub element etykiety zakładki.
     */
    label: React.ReactNode | (() => React.ReactNode);
}

/**
 * Slot typu tab.
 * Reprezentuje pojedynczą zakładkę w TabsSlot.
 */
export interface TabSlot extends CustomSlot {
    type: "tab";
    /**
     * Czy zakładka jest zamykalna (opcjonalnie).
     */
    closable?: boolean | (() => boolean);
    /**
     * Etykieta zakładki (ikona, tekst).
     */
    label: TabLabel | (() => TabLabel);
    /**
     * Akcje dostępne w zakładce (opcjonalnie).
     */
    actions?: string[] | (() => string[]);
    /**
     * Id slotu docelowego (opcjonalnie), którego dotyczą identyfikatory akcji (edytor, grid).
     */
    actionSlotId?: string;
    /**
     * Zawartość zakładki (slot lub funkcja zwracająca slot).
     */
    content: ContentSlot | (() => ContentSlot);
}

/**
 * Slot typu rendered.
 * Pozwala na wyświetlenie niestandardowego komponentu React.
 */
export interface RenderedSlot extends CustomSlot {
    type: "rendered";
    /**
     * Zawartość slotu (funkcja renderująca).
     */
    render: () => React.ReactNode;
}

export type ContentSlotType =
    SplitSlot
    | TabsSlot
    | RenderedSlot
    | (TitleSlot
        | GridSlot
        | EditorSlot
        | TextSlot)[];

export interface ContentSlot extends CustomSlot {
    type: "content";
    /**
     * Tablica slotów lub funkcja zwracająca tablicę slotów.
     */
    content: ContentSlotType | (() => ContentSlotType);
}

/**
 * Slot typu title.
 * Pozwala na wyświetlenie tytułu z opcjonalną ikoną i akcjami.
 */
export interface TitleSlot extends CustomSlot {
    type: "title";
    /**
     * Ikona tytułu (opcjonalnie).
     */
    icon?: React.ReactNode | (() => React.ReactNode);
    /**
     * Tytuł (tekst lub element).
     */
    title: React.ReactNode | (() => React.ReactNode);
    /**
     * Akcje dostępne przy tytule (opcjonalnie).
     */
    actions?: string[] | (() => string[]);
    /**
     * Id slotu docelowego (opcjonalnie), którego dotyczą identyfikatory akcji (edytor, grid).
     */
    actionSlotId?: string;
}

/**
 * Slot typu grid.
 * Pozwala na wyświetlenie siatki danych (np. wyników zapytania SQL).
 */
export interface GridSlot extends CustomSlot {
    type: "grid";
    /**
     * Tryb działania siatki (np. dynamiczne lub zdefiniowane kolumny).
     */
    mode: DataGridMode;
    /**
     * Zapytanie SQL do pobrania danych.
     */
    sql: string;
    /**
     * Definicje kolumn (opcjonalnie).
     */
    columns?: ColumnDefinition[] | (() => ColumnDefinition[]);
    /**
     * Akcje dostępne w gridzie (opcjonalnie).
     */
    actions?: ActionDescriptor<any>[] | (() => ActionDescriptor<any>[]);
    /**
     * Grupy akcji dostępne w gridzie (opcjonalnie).
     */
    actionGroups?: ActionGroupDescriptor<any>[] | (() => ActionGroupDescriptor<any>[]);
    /**
     * Callback po kliknięciu w wiersz (opcjonalnie).
     */
    onRowClick?: (row: any, refreshSlot: RefreshSlotCallback) => void;
}

/**
 * Slot typu edytor tekstowy.
 * Pozwala na wyświetlenie edytora z opcjonalnymi akcjami.
 */
export interface EditorSlot extends CustomSlot {
    type: "editor";
    /**
     * Akcje dostępne w edytorze.
     */
    actions?: ActionDescriptor<any>[] | (() => ActionDescriptor<any>[]);
    /**
     * Zawartość edytora (tekst lub funkcja zwracająca tekst).
     */
    content: string | (() => string);
}

/**
 * Slot typu tekst.
 * Pozwala na wyświetlenie tekstu (np. opisu, komunikatu) z opcjonalnym limitem linii.
 */
export interface TextSlot extends CustomSlot {
    type: "text";
    /**
     * Tekst do wyświetlenia (może być ReactNode lub funkcją zwracającą ReactNode).
     */
    text: React.ReactNode | (() => React.ReactNode);
    /**
     * Maksymalna liczba wyświetlanych linii tekstu (opcjonalnie).
     */
    maxLines?: number;
}
