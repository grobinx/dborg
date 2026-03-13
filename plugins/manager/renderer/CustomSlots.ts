import { Theme } from "@mui/material";
import { AutoRefreshInterval, AutoRefreshIntervals, AutoRefreshState } from "@renderer/components/AutoRefreshBar";
import { Action, ActionGroup, Actions } from "@renderer/components/CommandPalette/ActionManager";
import { CommandDescriptor } from "@renderer/components/CommandPalette/CommandManager";
import { DataGridMode, DataGridChangeRow } from "@renderer/components/DataGrid/DataGrid";
import { DataGridStatusPart } from "@renderer/components/DataGrid/DataGridStatusBar";
import { ColumnDefinition, DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import { EditorLanguageId, IEditorActionContext } from "@renderer/components/editor/MonacoEditor";
import { ContentSlotContext } from "@renderer/containers/ViewSlots/ContentSlot";
import { DialogSlotFunction, RefreshSlotFunction } from "@renderer/containers/ViewSlots/ViewSlotContext";
import { TabContentSlotContext } from "@renderer/containers/ViewSlots/TabContentSlot";
import { ThemeIconName } from "@renderer/themes/icons";
import { ThemeColor } from "@renderer/types/colors";
import { ExportFormat } from "@renderer/utils/arrayTo";
import * as monaco from "monaco-editor";
import { LoadingOverlayMode } from "@renderer/components/useful/spinners/Spinners";
import { MessageContextProps } from "@renderer/contexts/MessageContext";
import { DataPresentationGridColumn, SortStateOptions } from "@renderer/components/DataGrid/DataPresentationGrid";
import { BannerSeverity } from "@renderer/components/Banner";

export type CustomSlotType =
    "split"
    | "tabs"
    | "tab"
    | "tablabel"
    | "tabcontent"
    | "content"
    | "title"
    | "grid"
    | "editor"
    | "text"
    | "rendered"
    | "toolbar"
    | "progress"
    | "dialog"
    | "column"
    | "row"
    | "banner"
    ;

export interface SlotRuntimeContext {
    theme: Theme;
    refresh: RefreshSlotFunction;
    /**
     * Function to open a dialog by its ID.
     * @param id The ID of the dialog to open.
     * @return A promise that resolves to the dialog result or null if the dialog was cancelled.
     */
    openDialog: DialogSlotFunction;

    showNotification: (options: {
        message: string;
        severity?: "info" | "success" | "warning" | "error";
    }) => void;

    showConfirmDialog(options: {
        title: string,
        message: string,
        confirmLabel?: string,
        cancelLabel?: string,
        severity: "info" | "success" | "warning" | "error",
    }) : Promise<boolean>;

    messages: MessageContextProps;
}

export type ResolvableValue<C = SlotRuntimeContext, V = any> = V | ((context: C) => V);
export type ResolvableAsyncValue<C = SlotRuntimeContext, V = any> = V | ((context: C) => Promise<V>);

export function resolveValue<T = SlotRuntimeContext, V = any>(resolvable: ResolvableValue<T, V> | undefined, context: T): V | undefined {
    return typeof resolvable === "function" ? (resolvable as (context: T) => V)(context) : resolvable;
}
export async function resolveAsyncValue<T = SlotRuntimeContext, V = any>(resolvable: ResolvableAsyncValue<T, V> | undefined, context: T): Promise<V | undefined> {
    return typeof resolvable === "function" ? (resolvable as (context: T) => Promise<V>)(context) : resolvable;
}

export type ToolKind<T = any> =
    | string | string[]
    | Action<T>
    | Actions<T>
    | CommandDescriptor<T>
    | FieldTypeKind
    | IAutoRefresh
    | ICopyData
    | ITextSlot
    ;

export interface ISelectOption {
    value: string,
    label: string,
    description?: string,
}

export type IFieldType = "search" | "text" | "number" | "select" | "boolean";

export interface IField {
    type: IFieldType;
    /**
     * Etykieta pola tekstowego.
     */
    placeholder?: string;
    /**
     * Domyśla wartość pola tekstowego.
     */
    defaultValue?: any;
    /**
     * Funkcja wywoływana po zmianie wartości pola tekstowego.
     * Wywołanie jest z opóźnieniem
     */
    onChange: (value: any) => void;
    /**
     * Czy pole tekstowe jest zablokowane.
     */
    disabled?: ResolvableValue<SlotRuntimeContext, boolean>;
    /**
     * Maksymalna szerokość pola tekstowego (np. "100px", "50%").
     */
    width?: number | string;
    /**
     * Podpowiedź wyświetlana po najechaniu na pole tekstowe.
     */
    tooltip?: string;
}

export interface ITextField extends IField {
    type: "text";
    /**
     * Domyśla wartość pola tekstowego.
     */
    defaultValue?: string;
    /**
     * Funkcja wywoływana po zmianie wartości pola tekstowego.
     * Wywołanie jest z opóźnieniem
     */
    onChange: (value: string) => void;

    minLength?: number;
    maxLength?: number;
}

export interface ISearchField extends IField {
    type: "search";
    /**
     * Domyśla wartość pola tekstowego.
     */
    defaultValue?: string;
    /**
     * Funkcja wywoływana po zmianie wartości pola tekstowego.
     * Wywołanie jest z opóźnieniem
     */
    onChange: (value: string) => void;

    minLength?: number;
    maxLength?: number;
}

export interface INumberField extends IField {
    type: "number";
    /**
     * Domyśla wartość pola tekstowego.
     */
    defaultValue?: number;
    /**
     * Funkcja wywoływana po zmianie wartości pola tekstowego.
     * Wywołanie jest z opóźnieniem
     */
    onChange: (value: number | null) => void;

    min?: number;
    max?: number;
    step?: number;
}

export interface ISelectField extends IField {
    type: "select";

    options: ResolvableValue<SlotRuntimeContext, ISelectOption[]>;

}

export interface IBooleanField extends IField {
    type: "boolean";
    /**
     * Domyśla wartość pola boolean.
     * @default false
     */
    defaultValue?: boolean;
    /**
     * Etykieta pola boolean.
     */
    label?: string;
    /**
     * Funkcja wywoływana po zmianie wartości pola boolean.
     */
    onChange: (value: boolean) => void;
}

export type FieldTypeKind =
    ITextField
    | INumberField
    | ISelectField
    | ISearchField
    | IBooleanField
    ;

export interface IAutoRefreshContext {
    state: AutoRefreshState;
    interval: AutoRefreshInterval;
    executing: boolean;
    start: () => void;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    clear: () => void;
    setState: (state: AutoRefreshState) => void;
    setInterval: (interval: AutoRefreshInterval) => void;
    setExecuting: (value: boolean) => void;
}

export interface AutoRefreshLifecycle {
    onHide?: "pause" | "stop" | "ignore";
    onShow?: "resume" | "start" | "ignore";
    onMount?: "start" | "stop";
    onUnmount?: "stop";
}

export interface IAutoRefresh {
    /**
     * Domyślny interwał odświeżania
     * @default 5 seconds
     */
    defaultInterval?: AutoRefreshInterval;
    /**
     * Dostępne opcje interwałów odświeżania
     * @default [1, 2, 5, 10, 30, 60]
     */
    intervals?: AutoRefreshIntervals;
    /**
     * Ustawienia cyklu życia automatycznego odświeżania.
     * @default {
     *   onHide: "pause",
     *   onShow: "resume",
     *  onMount: "stop",
     * }
     */
    lifecycle?: AutoRefreshLifecycle;
    /**
     * Ustawienia czyszczenia danych przy starcie lub zatrzymaniu automatycznego odświeżania.
     * @default undefined
     */
    clearOn?: "stop" | "start";
    /**
     * Funkcja wywoływana co określony interwał czasu.
     * @param slotContext 
     * @param context 
     */
    onTick(runtimeContext: SlotRuntimeContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy montowaniu komponentu.
     * @param slotContext 
     * @param context 
     */
    onMount?(runtimeContext: SlotRuntimeContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy odmontowaniu komponentu.
     * @param slotContext 
     * @param context 
     */
    onUnmount?(runtimeContext: SlotRuntimeContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy starcie automatycznego odświeżania.
     * @param slotContext 
     * @param context 
     */
    onStart?(runtimeContext: SlotRuntimeContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy zatrzymaniu automatycznego odświeżania.
     * @param slotContext 
     * @param context 
     */
    onStop?(runtimeContext: SlotRuntimeContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy wstrzymaniu automatycznego odświeżania.
     * @param slotContext 
     * @param context 
     */
    onPause?(runtimeContext: SlotRuntimeContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy wznowieniu automatycznego odświeżania.
     * @param slotContext 
     * @param context 
     */
    onResume?(runtimeContext: SlotRuntimeContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy pokazaniu panelu auto refresh.
     * @param slotContext 
     * @param context 
     */
    onShow?(runtimeContext: SlotRuntimeContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy ukryciu panelu auto refresh.
     * @param slotContext 
     * @param context 
     */
    onHide?(runtimeContext: SlotRuntimeContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana po naciśnięciu przycisku "Clear".
     */
    onClear?(runtimeContext: SlotRuntimeContext, context: IAutoRefreshContext): void;
    /**
     * Czy przycisk "Clear" ma być dostępny.
     * @default false
     */
    canClear?: boolean;
    /**
     * Czy przycisk "Pause" ma być dostępny.
     * @default true
     */
    canPause?: boolean;
    /**
     * Czy przycisk "Refresh" ma być dostępny.
     * @default false
     */
    canRefresh?: boolean;
    /**
     * Czy odświeżanie jest aktualnie wykonywane.
     * To pole służy do zarządzania stanem przycisków w interfejsie użytkownika.
     * @default false
     */
    executing?: ResolvableValue<SlotRuntimeContext, boolean>;
}

export interface ICopyData<T = any> {
    /**
     * Dostępne formaty eksportu danych.
     * @default undefined - all formats
     */
    formats?: ExportFormat[];
    /**
     * Domyślny format eksportu danych.
     * @default "csv"
     */
    defaultFormat?: ExportFormat;
    /**
     * Funkcja zwracająca dane do skopiowania.
     * 
     * @param slotContext 
     * @returns 
     */
    getData: (runtimeContext: SlotRuntimeContext) => T;
    /**
     * Czy pokazać powiadomienie o skopiowaniu danych.
     * @default true
     */
    showNotification?: boolean;
}

export interface ISlot {
    /**
     * Unique identifier for the slot.
     */
    id?: string;
    /**
     * Type of the slot (not defined in this base interface).
     */
    type: string;

    onMount?: (runtimeContext: SlotRuntimeContext) => void;
    onUnmount?: (runtimeContext: SlotRuntimeContext) => void;

    onShow?: (runtimeContext: SlotRuntimeContext) => void;
    onHide?: (runtimeContext: SlotRuntimeContext) => void;
}

/**
 * Interface representing a connection view slot
 */
export interface ICustomSlot extends ISlot {
    /**
     * Type of the slot
     */
    type: CustomSlotType;
}

export type SplitSlotPartKind =
    ISplitSlot
    | ITabsSlot
    | IContentSlot
    | IRenderedSlot
    | IGridSlot
    | IGridPresentationSlot
    | IEditorSlot
    | IColumnSlot
    | IRowSlot
    ;

/**
 * Slot typu split.
 * Pozwala na podział widoku na dwie części (pionowo lub poziomo).
 * Każda część może być kolejnym splitem, zakładkami lub inną zawartością.
 */
export interface ISplitSlot extends Omit<ICustomSlot, "onShow" | "onHide"> {
    type: "split";
    /**
     * Kierunek podziału: "vertical" (góra/dół) lub "horizontal" (lewo/prawo).
     */
    direction: "vertical" | "horizontal";
    /**
     * Zawartość pierwszej części (slot lub funkcja zwracająca slot).
     */
    first: ResolvableValue<SlotRuntimeContext, SplitSlotPartKind>;
    /**
     * Zawartość drugiej części (slot lub funkcja zwracająca slot).
     */
    second: ResolvableValue<SlotRuntimeContext, SplitSlotPartKind>;
    /**
     * Procentowy udział drugiej części (domyślnie 30%).
     * Wartość musi być z zakresu 0-100.
     */
    secondSize?: number;
    /**
     * Identyfikator do automatycznego zapisywania układu (opcjonalnie).
     */
    autoSaveId?: string;
}

/**
 * Slot typu tabs.
 * Pozwala na wyświetlenie grupy zakładek.
 * @property {string} id musi być unikalne w ramach aplikacji.
 */
export interface ITabsSlot extends ICustomSlot {
    type: "tabs";
    /**
     * Tablica zakładek lub funkcja zwracająca tablicę zakładek.
     */
    tabs: ResolvableValue<SlotRuntimeContext, ITabSlot[]>;
    /**
     * Pozyjca zakładek: "top" (góra) lub "bottom" (dół).
     * Domyślnie "top".
     */
    position?: "top" | "bottom";
    /**
     * Akcje dostępne dla listy zakładek (opcjonalnie).
     */
    toolBar?: ResolvableValue<SlotRuntimeContext, ToolBarSlotsKind>;
    /**
     * Domyślny identyfikator zakładki, która ma być aktywna przy pierwszym renderowaniu.
     * Jeśli nie podano, pierwsza zakładka będzie aktywna.
     */
    defaultTabId?: ResolvableValue<SlotRuntimeContext, string>;
}

/**
 * Struktura etykiety zakładki (label).
 */
export interface ITabLabelSlot extends Omit<ICustomSlot, "onShow" | "onHide"> {
    type: "tablabel";
    /**
     * Ikona zakładki (opcjonalnie).
     */
    icon?: ResolvableValue<SlotRuntimeContext, React.ReactNode | ThemeIconName>;
    /**
     * Tekst lub element etykiety zakładki.
     */
    label: ResolvableValue<SlotRuntimeContext, React.ReactNode>;

    onActivate?: (runtimeContext: SlotRuntimeContext) => void;
    onDeactivate?: () => void;
}

export interface ITabContentSlot extends Omit<ICustomSlot, "onShow" | "onHide"> {
    type: "tabcontent";
    /**
     * Zawartość zakładki (slot lub funkcja zwracająca slot).
     */
    content: ResolvableValue<SlotRuntimeContext, ContentSlotKind>;

    onActivate?: (runtimeContext: SlotRuntimeContext) => void;
    onDeactivate?: (runtimeContext: SlotRuntimeContext) => void;
    /**
     * Pasek postępu (slot lub funkcja zwracająca slot).
     */
    progress?: ResolvableValue<SlotRuntimeContext, IProgressBarSlot>;
    /**
     * CommandPalette, grupy akcji dostępne jako dodatkowe w zawartości zakładki (opcjonalnie).
     */
    actionGroups?: ResolvableValue<SlotRuntimeContext, ActionGroup<TabContentSlotContext>[]>;
    /**
     * CommandPalette, akcje podstawowe ">" dostępne w zawartości zakładki (opcjonalnie).
     */
    actions?: ResolvableValue<SlotRuntimeContext, Action<TabContentSlotContext>[]>;
    /**
     * Skrót klawiszowy (sekwencja) dostępu do głównych akcji CommandPalette (opcjonalnie).
     */
    keybinding?: string;
    /**
     * Dialogs dostępne w zawartości zakładki (opcjonalnie).
     */
    dialogs?: ResolvableValue<SlotRuntimeContext, IDialogSlot[]>;
    /**
     * Baner (slot lub funkcja zwracająca slot) do wyświetlenia nad zawartością zakładki (opcjonalnie).
     */
    banner?: ResolvableValue<SlotRuntimeContext, IBannerSlot>;
}

export type TabLabelSlotKind =
    ITabLabelSlot
    | IRenderedSlot;

export type TabContentSlotKind =
    ITabContentSlot
    | IRenderedSlot;

export interface ITabSlot extends Omit<ICustomSlot, "onShow" | "onHide"> {
    id: string;

    type: "tab";
    /**
     * Czy zakładka jest zamykalna (opcjonalnie).
     */
    closable?: ResolvableValue<SlotRuntimeContext, boolean>;
    /**
     * Etykieta zakładki (ikona, tekst).
     */
    label: ResolvableValue<SlotRuntimeContext, TabLabelSlotKind>;
    /**
     * Akcje dostępne w zakładce (opcjonalnie).
     */
    toolBar?: ResolvableValue<SlotRuntimeContext, ToolBarSlotsKind>;
    /**
     * Zawartość zakładki (slot lub funkcja zwracająca slot).
     */
    content: ResolvableValue<SlotRuntimeContext, TabContentSlotKind>;
}

/**
 * Slot typu tab.
 * Reprezentuje pojedynczą zakładkę w TabsSlot.
 */
export interface IPinnableTabSlot extends ITabSlot {
    /**
     * Czy zakładka jest przypinana (opcjonalnie).
     */
    pinnable?: ResolvableValue<SlotRuntimeContext, boolean>;
    /**
     * Funkcja zwracająca slot, który pozwala na przypięcie zakładki.
     * @returns 
     */
    pin?: () => IPinnableTabSlot;
    /**
     * Funkcja wywoływana po zamknięciu zakładki.
     * @param slotContext
     */
    onClose?: (runtimeContext: SlotRuntimeContext) => void;
    /**
     * Funkcja wywoływana po przypięciu zakładki.
     * @param slotContext 
     */
    onPin?: (runtimeContext: SlotRuntimeContext) => void;
}

/**
 * Slot typu rendered.
 * Pozwala na wyświetlenie niestandardowego komponentu React.
 */
export interface IRenderedSlot extends ICustomSlot {
    type: "rendered";
    /**
     * Zawartość slotu (funkcja renderująca).
     */
    render: React.FC<{ runtimeContext: SlotRuntimeContext }>;
}

export type ContentSlotKind =
    ISplitSlot
    | ITabsSlot
    | IRenderedSlot
    | IGridSlot
    | IGridPresentationSlot
    | IEditorSlot
    | IContentSlot
    | IColumnSlot
    | IRowSlot
    | ITitleSlot
    | ITextSlot
    ;

export type TitleSlotKind =
    ITitleSlot
    | IRenderedSlot;

export type TextSlotKind =
    ITextSlot
    | IRenderedSlot;

export interface IContentSlot extends ICustomSlot {
    type: "content";
    /**
     * Tytuł (slot lub funkcja zwracająca slot).
     */
    title?: ResolvableValue<SlotRuntimeContext, TitleSlotKind>;
    /**
     * Slot lub funkcja zwracająca zawartość główną.
     */
    main: ResolvableValue<SlotRuntimeContext, ContentSlotKind>;
    /**
     * Tekst (slot lub funkcja zwracająca slot).
     */
    text?: ResolvableValue<SlotRuntimeContext, TextSlotKind>;
    /**
     * Pasek postępu (slot lub funkcja zwracająca slot).
     */
    progress?: ResolvableValue<SlotRuntimeContext, IProgressBarSlot>;
    /**
     * CommandPalette, grupy akcji dostępne jako dodatkowe w zawartości zakładki (opcjonalnie).
     */
    actionGroups?: ResolvableValue<SlotRuntimeContext, ActionGroup<ContentSlotContext>[]>;
    /**
     * CommandPalette, akcje podstawowe ">" dostępne w zawartości zakładki (opcjonalnie).
     */
    actions?: ResolvableValue<SlotRuntimeContext, Action<ContentSlotContext>[]>;
    /**
     * Skrót klawiszowy (sekwencja) dostępu do głównych akcji CommandPalette (opcjonalnie).
     */
    keybinding?: string;
    /**
     * Dialogs dostępne w zawartości (opcjonalnie).
     */
    dialogs?: ResolvableValue<SlotRuntimeContext, IDialogSlot[]>;
    /**
     * Baner (slot lub funkcja zwracająca slot) do wyświetlenia nad zawartością (opcjonalnie).
     */
    banner?: ResolvableValue<SlotRuntimeContext, IBannerSlot>;
}

/**
 * Slot typu title.
 * Pozwala na wyświetlenie tytułu z opcjonalną ikoną i akcjami.
 */
export interface ITitleSlot extends ICustomSlot {
    type: "title";
    /**
     * Ikona tytułu (opcjonalnie).
     */
    icon?: ResolvableValue<SlotRuntimeContext, React.ReactNode | ThemeIconName>;
    /**
     * Tytuł (tekst lub element).
     */
    title?: ResolvableValue<SlotRuntimeContext, React.ReactNode>;
    /**
     * Akcje dostępne przy tytule (opcjonalnie).
     */
    toolBar?: ResolvableValue<SlotRuntimeContext, ToolBarSlotsKind>;
    /**
     * Funkcja zwracająca style dla tytułu (opcjonalnie).
     */
    style?: ResolvableValue<SlotRuntimeContext, React.CSSProperties>;
}

export interface IBannerSlot extends ICustomSlot {
    type: "banner";
    /**
     * Ikona banera (opcjonalnie).
     * Domyślnie ikona jest ustawiana na podstawie poziomu ważności banera (severity), ale można ją nadpisać własną ikoną.
     */
    icon?: ResolvableValue<SlotRuntimeContext, React.ReactNode | ThemeIconName>;
    /**
     * Tytuł banera (tekst lub element) (opcjonalnie).
     */
    title?: ResolvableValue<SlotRuntimeContext, React.ReactNode>;
    /**
     * Tekst banera (tekst lub element).
     */
    text: ResolvableValue<SlotRuntimeContext, React.ReactNode>;
    /**
     * Czy baner jest zamykalny (opcjonalnie).
     */
    closeable?: ResolvableValue<SlotRuntimeContext, boolean>;
    /**
     * Poziom ważności banera, wpływający na jego styl (opcjonalnie).
     * @default "info"
     */
    severity?: BannerSeverity;
    /**
     * Funkcja wywoływana po zamknięciu banera.
     * @param slotContext
     */
    onClose?: (runtimeContext: SlotRuntimeContext) => void;
    /**
     * Czy baner jest otwarty (opcjonalnie).
     * Nie trzeba zarządząć tym stanem samodzielnie, Wystarczy, że będzie ustawiony text lub title, a baner będzie otwarty. 
     */
    opened?: ResolvableValue<SlotRuntimeContext, boolean>;
}

export type StatusBarValueFunction = () => string;

export interface IGridStatusButton {
    label: ResolvableValue<SlotRuntimeContext, string>;
    icon?: ResolvableValue<SlotRuntimeContext, React.ReactNode | ThemeIconName>;
    tooltip?: ResolvableValue<SlotRuntimeContext, string>;
    onClick?: (runtimeContext: SlotRuntimeContext) => void;
}

/**
 * Slot typu grid.
 * Pozwala na wyświetlenie siatki danych (np. wyników zapytania SQL).
 */
export interface IGridSlot extends ICustomSlot {
    type: "grid";
    /**
     * Tryb działania siatki (np. dynamiczne lub zdefiniowane kolumny).
     * Domyślnie "defined".
     */
    mode?: DataGridMode;
    /**
     * Wiersze siatki.
     */
    rows: ResolvableAsyncValue<SlotRuntimeContext, Record<string, any>[]>;
    /**
     * Zmiany w danych (np. edycje w siatce) do zapisania lub przesłania do backendu (opcjonalnie).
     */
    changes?: ResolvableValue<SlotRuntimeContext, DataGridChangeRow<Record<string, any>>[]>;
    /**
     * Definicje kolumn (opcjonalnie).
     */
    columns?: ResolvableValue<SlotRuntimeContext, ColumnDefinition[]>;
    /**
     * Czy siatka ma być wyświetlana w trybie przestawnym (pivot) (opcjonalnie).
     */
    pivot?: ResolvableValue<SlotRuntimeContext, boolean>;
    /**
     * Kolumny dla odwróconej tabeli (opcjonalnie).
     */
    pivotColumns?: ResolvableValue<SlotRuntimeContext, ColumnDefinition[]>;
    /**
     * Akcje dostępne w gridzie (opcjonalnie).
     */
    actions?: ResolvableValue<SlotRuntimeContext, Action<DataGridActionContext<any>>[]>;
    /**
     * Grupy akcji dostępne w gridzie (opcjonalnie).
     */
    actionGroups?: ResolvableValue<SlotRuntimeContext, ActionGroup<DataGridActionContext<any>>[]>;
    /**
     * Callback po zaznaczeniu wiersza (opcjonalnie).
     */
    onRowSelect?: (row: any, runtimeContext: SlotRuntimeContext) => void;
    /**
     * Identyfikator do przechowywania układu siatki (opcjonalnie).
     */
    autoSaveId?: string;
    /**
     * Statusy siatki (np. liczba wierszy, pozycja) do wyświetlenia w pasku stanu (opcjonalnie).
     */
    statuses?: (DataGridStatusPart | IGridStatusButton)[];
    /**
     * Unikalne pole do identyfikacji wierszy (opcjonalnie).
     */
    uniqueField?: string;
    /**
     * Funkcja zwracająca style dla danego wiersza.
     */
    getRowStyle?: (row: { [key: string]: any }, rowIndex: number, theme: Theme) => React.CSSProperties;
    /**
     * Funkcja, która służy do przerwania wykonywania operacji pobierania wierszy.
     * Jeśli jest zdefiniowana, użytkownik może przerwać operację.
     * @param slotContext 
     * @returns 
     */
    onCancel?: (runtimeContext: SlotRuntimeContext) => void;
    /**
     * Tryb nakładki ładowania (opcjonalnie).
     * @default "small"
     */
    overlayMode?: LoadingOverlayMode;
    /**
     * Tekst wyszukiwania w siatce (opcjonalnie).
     */
    searchText?: ResolvableValue<SlotRuntimeContext, string>;
    /**
     * Pasek postępu (slot lub funkcja zwracająca slot).
     */
    progress?: ResolvableValue<SlotRuntimeContext, IProgressBarSlot>;
    /**
     * Czy wiersze siatki mogą być zaznaczane (opcjonalnie).
     */
    canSelectRows?: ResolvableValue<SlotRuntimeContext, boolean>;
    /**
     * Baner do wyświetlenia nad siatką (slot lub funkcja zwracająca slot) (opcjonalnie).
     */
    banner?: ResolvableValue<SlotRuntimeContext, IBannerSlot>;
}

export interface IGridPresentationSlot extends ICustomSlot {
    type: "grid";
    /**
     * Tryb działania siatki.
     * Siatka jest prosta, służy tylko do prezentacji danych, bez możliwości interakcji (np. zaznaczania wierszy, akcji).
     */
    mode: "presentation";
    /**
     * Wiersze siatki.
     */
    rows: ResolvableAsyncValue<SlotRuntimeContext, Record<string, any>[]>;
    /**
     * Definicje kolumn (opcjonalnie).
     */
    columns?: ResolvableValue<SlotRuntimeContext, DataPresentationGridColumn<any>[]>;
    /**
     * Zainicjalizowane sortowanie (opcjonalnie).
     */
    initialSort?: ResolvableValue<SlotRuntimeContext, SortStateOptions>;
    /**
     * Wysokość siatki (np. "400px", "50vh") (opcjonalnie).
     */
    height?: number | string;
}

/**
 * Slot typu edytor tekstowy.
 * Pozwala na wyświetlenie edytora z opcjonalnymi akcjami.
 */
export interface IEditorSlot extends ICustomSlot {
    type: "editor";
    /**
     * Akcje dostępne w edytorze.
     */
    actions?: ResolvableValue<SlotRuntimeContext, Action<monaco.editor.ICodeEditor>[]>;
    /**
     * Zawartość edytora (tekst lub funkcja zwracająca tekst), domyślny, wstawiany przy montowaniu.
     */
    content: ResolvableAsyncValue<SlotRuntimeContext, string>;
    /**
     * Język składni edytora (np. "sql", "json").
     * @default "sql"
     */
    language?: ResolvableValue<SlotRuntimeContext, EditorLanguageId>;
    /**
     * Czy edytor ma być tylko do odczytu (opcjonalnie).
     * @default false
     */
    readOnly?: ResolvableValue<SlotRuntimeContext, boolean>;
    /**
     * Czy edytor ma zawijać długie linie (opcjonalnie).
     * @default false
     */
    wordWrap?: ResolvableValue<SlotRuntimeContext, boolean>;
    /**
     * Czy edytor ma wyświetlać numery linii (opcjonalnie).
     * @default false
     */
    lineNumbers?: ResolvableValue<SlotRuntimeContext, boolean>;
    /**
     * Czy pasek stanu ma być wyświetlany (opcjonalnie).
     * @default true
     */
    statusBar?: ResolvableValue<SlotRuntimeContext, boolean>;
    /**
     * Czy minimapa ma być wyświetlana (opcjonalnie).
     * @default true
     */
    miniMap?: ResolvableValue<SlotRuntimeContext, boolean>;

    onMounted?: (runtimeContext: SlotRuntimeContext) => void;
    onPositionChanged?: (runtimeContext: SlotRuntimeContext, context: IEditorActionContext) => void;
    onSelectionChanged?: (runtimeContext: SlotRuntimeContext, context: IEditorActionContext) => void;
    onFocus?: (runtimeContext: SlotRuntimeContext, context: IEditorActionContext) => void;
    onBlur?: (runtimeContext: SlotRuntimeContext, context: IEditorActionContext) => void;
    onContentChanged?: (runtimeContext: SlotRuntimeContext, context: IEditorActionContext) => void;
    /**
     * Wywoływane po pomyślnym załadowaniu zawartości do edytora - po zakończeniu operacji asynchronicznej content.
     */
    onContentSuccess?: (runtimeContext: SlotRuntimeContext, context: IEditorActionContext) => void;
    /**
     * Funkcja, która służy do przerwania wykonywania operacji pobierania wierszy.
     * Jeśli jest zdefiniowana, użytkownik może przerwać operację.
     * @param runtimeContext: SlotFactoryContext
     * @returns 
     */
    onCancel?: (runtimeContext: SlotRuntimeContext) => void;
    /**
     * Tryb nakładki ładowania (opcjonalnie).
     * @default "small"
     */
    overlayMode?: LoadingOverlayMode;
    /**
     * Pasek postępu (slot lub funkcja zwracająca slot).
     */
    progress?: ResolvableValue<SlotRuntimeContext, IProgressBarSlot>;
    /**
     * Baner do wyświetlenia nad edytorem (slot lub funkcja zwracająca slot) (opcjonalnie).
     */
    banner?: ResolvableValue<SlotRuntimeContext, IBannerSlot>;
}

/**
 * Slot typu tekst.
 * Pozwala na wyświetlenie tekstu (np. opisu, komunikatu) z opcjonalnym limitem linii.
 */
export interface ITextSlot extends ICustomSlot {
    type: "text";
    /**
     * Tekst do wyświetlenia (może być ReactNode lub funkcją zwracającą ReactNode).
     */
    text: ResolvableValue<SlotRuntimeContext, React.ReactNode>;
    /**
     * Maksymalna liczba wyświetlanych linii tekstu (opcjonalnie, domyślnie 3).
     */
    maxLines?: number;
    /**
     * Styl tekstu (opcjonalnie).
     */
    style?: ResolvableValue<SlotRuntimeContext, React.CSSProperties>;
}

export interface IColumnSlot extends ICustomSlot {
    /**
     * Typ elementu layoutu.
     */
    type: "column";
    /**
     * Zawartość kolumny (pola, wiersze lub kolumny).
     */
    items: ResolvableValue<SlotRuntimeContext, ContentSlotKind[]>;
    /**
     * Szerokość kolumny (1-12, jak w Grid System).
     * @default undefined równa dystrybucja
     */
    size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "auto";
    /**
     * Odstęp wewnętrzny kolumny (np. "10px", 1).
     */
    padding?: string | number;
    /**
     * Odstęp między elementami kolumny (np. "10px", 1).
     */
    gap?: string | number;
}

export interface IRowSlot extends ICustomSlot {
    /**
     * Typ elementu layoutu.
     */
    type: "row";
    /**
     * Zawartość wiersza (pola, wiersze lub kolumny).
     */
    items: ResolvableValue<SlotRuntimeContext, ContentSlotKind[]>;
    /**
     * Wysokość wiersza (1-12, jak w Grid System).
     * @default undefined równa dystrybucja
     */
    size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    /**
     * Odstęp wewnętrzny wiersza (np. "10px", 1).
     */
    padding?: string | number;
}

export interface IToolBarSlot extends ICustomSlot {
    type: "toolbar";
    /**
     * Narzędzia do wyświetlenia na pasku narzędzi.
     */
    tools: ResolvableValue<SlotRuntimeContext, ToolKind[]>;
    /**
     * Id slotu docelowego (opcjonalnie), którego dotyczą identyfikatory akcji (edytor, grid).
     * Działa jeśli w tools jest ciąg znaków z identyfikatorem akcji.
     */
    actionSlotId?: string;
}

export type ToolBarSlotKind =
    IToolBarSlot
    | IRenderedSlot;

export type ToolBarSlotsKind = 
    ToolBarSlotKind 
    | ToolBarSlotKind[];

export type ProgressBarDisplay = "auto" | ResolvableValue<SlotRuntimeContext, boolean>;

/** 
 * Slot typu progressbar.
 * Pozwala na wyświetlenie paska postępu z wartością i etykietą.
 */
export interface IProgressBarSlot extends ICustomSlot {
    type: "progress";
    /**
     * Czy pasek postępu ma być widoczny.
     * "auto" - widoczny gdy wartość postępu jest zdefiniowana.
     * @default "auto"
     */
    display?: ProgressBarDisplay;
    /**
     * Pokaż procent wartości postępu.
     * @default false.
     */
    showPercent?: ResolvableValue<SlotRuntimeContext, boolean>;
    /**
     * Wartość postępu (0-100).
     */
    value?: ResolvableValue<SlotRuntimeContext, number>;
    /**
     * Wartość bufora postępu (0-100) (opcjonalnie).
     */
    bufferValue?: ResolvableValue<SlotRuntimeContext, number>;
    /**
     * Tekst wyświetlany na pasku postępu (opcjonalnie).
     */
    label?: ResolvableValue<SlotRuntimeContext, string>;
    /**
     * Kolor paska postępu (opcjonalnie).
     * @default primary
     */
    color?: ThemeColor;
}

export type DialogFieldType = "text" | "textarea" | "number" | "boolean" | "select" | "editor" | "list";

export type DialogGridSize =
    | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
    | "auto"
    | string;

/**
 * Opcjonalny hint layoutu używany przez IDialogRow (grid).
 * Column go NIE interpretuje (kolumna zawsze układa pionowo).
 */
export interface IDialogGridItem {
    size?: DialogGridSize;
}

export interface IDialogField {
    /**
     * Typ pola.
     */
    type: DialogFieldType;
    /**
     * Klucz pola (identyfikator wartości w wyniku).
     */
    key: string;
    /**
     * Etykieta pola.
     */
    label: ResolvableValue<Record<string, any>, string>;
    /**
     * Wartość domyślna pola.
     */
    defaultValue?: any;
    /**
     * Czy pole jest wymagane.
     * @default false
     */
    required?: ResolvableValue<Record<string, any>, boolean>;
    /**
     * Czy pole jest zablokowane.
     * @default false
     */
    disabled?: ResolvableValue<Record<string, any>, boolean>;
    /**
     * Podpowiedź wyświetlana po najechaniu na pole.
     */
    tooltip?: ResolvableValue<Record<string, any>, string>;
    /**
     * Tekst pomocniczy wyświetlany pod polem.
     */
    helperText?: ResolvableValue<Record<string, any>, string>;
    /**
     * Szerokość pola (np. "100%", 200).
     */
    width?: string | number;
    /**
     * Czy pole ma być automatycznie fokusowane po otwarciu dialogu.
     * @default false
     */
    autoFocus?: boolean;
    /**
     * Funkcja wywoływana po zmianie wartości pola.
     * Wywołanie jest z opóźnieniem.
     */
    onChange?: (values: Record<string, any>, value: any) => void;
    /**
     * Ograniczenia wartości pola, to wyłącznie opis dla użytkownika, nie jest walidacją.
     */
    restrictions?: ResolvableValue<Record<string, any>, string[]>;
}

export interface IDialogTextField extends IDialogField {
    type: "text";
    /**
     * Wartość domyślna pola tekstowego.
     */
    defaultValue?: string;
    /**
     * Minimalna długość tekstu.
     */
    minLength?: number;
    /**
     * Maksymalna długość tekstu.
     */
    maxLength?: number;
}

export interface IDialogTextareaField extends IDialogField {
    type: "textarea";
    /**
     * Wartość domyślna pola tekstowego.
     */
    defaultValue?: string;
    /**
     * Minimalna długość tekstu.
     */
    minLength?: number;
    /**
     * Maksymalna długość tekstu.
     */
    maxLength?: number;
    /**
     * Liczba wierszy tekstu (wysokość pola).
     */
    rows?: number;
    /**
     * Minimalna liczba wierszy tekstu (opcjonalnie).
     */
    minRows?: number;
    /**
     * Maksymalna liczba wierszy tekstu (opcjonalnie).
     */
    maxRows?: number;
}

export interface IDialogEditorField extends IDialogField {
    type: "editor";
    /**
     * Wartość domyślna pola edytora.
     */
    defaultValue?: string;
    /**
     * Język składni edytora (np. "sql", "json").
     * @default "sql"
     */
    language?: EditorLanguageId;
    /**
     * Czy edytor ma być tylko do odczytu (opcjonalnie).
     * @default false
     */
    readOnly?: boolean;
    /**
     * Wysokość edytora (np. "300px", 400).
     */
    height?: string | number;
}

export interface IDialogNumberField extends IDialogField {
    type: "number";
    /**
     * Wartość domyślna pola numerycznego.
     */
    defaultValue?: number;
    /**
     * Minimalna wartość.
     */
    min?: number;
    /**
     * Maksymalna wartość.
     */
    max?: number;
    /**
     * Krok wartości.
     */
    step?: number;
}

export interface IDialogBooleanField extends IDialogField {
    type: "boolean";
    /**
     * Wartość domyślna pola boolean.
     */
    defaultValue?: boolean;
    /**
     * Czy pole może być w stanie nieokreślonym (trójstanowe).
     * @default false
     */
    indeterminate?: boolean;
}

export interface IDialogSelectField extends IDialogField {
    type: "select";
    /**
     * Wartość domyślna pola select.
     */
    defaultValue?: string | string[];
    /**
     * Opcje do wyboru.
     */
    options: ResolvableValue<Record<string, any>, ISelectOption[]>;
    /**
     * Czy pole ma być wielokrotnego wyboru.
     * @default false
     */
    multiple?: boolean;
}

export type DialogFieldKind =
    | IDialogTextField
    | IDialogTextareaField
    | IDialogNumberField
    | IDialogBooleanField
    | IDialogSelectField
    | IDialogEditorField;

/**
 * Layout item może mieć opcjonalne `size`, ale tylko `row` to wykorzystuje.
 */
export type DialogLayoutItemKind =
    (
        | DialogFieldKind
        | IDialogRow
        | IDialogColumn
        | IDialogTabs
        | IDialogStatic
        | IDialogList
    ) & IDialogGridItem;

export interface IDialogStatic {
    type: "static";
    /**
     * Zawartość tekstu (tekst lub funkcja zwracająca tekst).
     */
    text: ResolvableValue<Record<string, any>, string>;
    /**
     * Styl tekstu (opcjonalnie).
     */
    style?: ResolvableValue<Record<string, any>, React.CSSProperties>;
}

export interface IDialogColumn {
    /**
     * Typ elementu layoutu.
     */
    type: "column";
    /**
     * Etykieta kolumny (opcjonalnie).
     */
    label?: ResolvableValue<Record<string, any>, string>;
    /**
     * Zawartość kolumny (pola, wiersze lub kolumny).
     * Kolumna układa elementy pionowo (pod sobą).
     */
    items: ResolvableValue<Record<string, any>, DialogLayoutItemKind[]>;
}

export interface IDialogRow {
    /**
     * Typ elementu layoutu.
     */
    type: "row";
    /**
     * Etykieta wiersza (opcjonalnie).
     */
    label?: ResolvableValue<Record<string, any>, string>;
    /**
     * Zawartość wiersza (pola, wiersze lub kolumny).
     * Wiersz układa elementy poziomo i interpretuje `item.size`.
     */
    items: ResolvableValue<Record<string, any>, DialogLayoutItemKind[]>;
}

export interface IDialogTab {
    id: string;
    /**
     * Etykieta zakładki.
     */
    label: ResolvableValue<Record<string, any>, string>;
    /**
     * Zawartość zakładki (pola, wiersze, kolumny).
     */
    items: ResolvableValue<Record<string, any>, DialogLayoutItemKind[]>;
    /**
     * Funkcja wywoływana po aktywacji zakładki.
     * @returns 
     */
    onActivate?: () => void;
}

export interface IDialogTabs {
    /**
     * Typ elementu layoutu.
     */
    type: "tabs";
    /**
     * Zakładki dialogu.
     */
    tabs: ResolvableValue<Record<string, any>, IDialogTab[]>;
}

export interface IDialogListColumn {
    /**
     * Klucz pola kolumny.
     */
    key: string;
    /**
     * Etykieta kolumny.
     */
    label: ResolvableValue<Record<string, any>, string>;
    /**
     * Rozmiar kolumny.
     */
    size?: DialogGridSize;
}

export interface IDialogList {
    /**
     * Typ elementu layoutu.
     */
    type: "list";
    /**
     * Klucz pola z listą.
     */
    key: string;
    /**
     * Etykieta listy (opcjonalnie).
     */
    label?: ResolvableValue<Record<string, any>, string>;
    /**
     * Elementy elementu listy (pola, wiersze, kolumny).
     * Wszystkie elementy w items będą się odnośić do wartości elementu z listy z klucza `key` 
     */
    items: ResolvableValue<Record<string, any>, DialogLayoutItemKind[]>;
    /**
     * Definicje kolumn listy (opcjonalnie). 
     * Jeśli nie podano, lista kolumn będzie pobrana z items.
     */
    columns?: ResolvableValue<Record<string, any>, IDialogListColumn[]>;
    /**
     * Funkcja wywoływana przy dodawaniu nowego elementu do listy.
     * Można w niej zainicjalizować wartości nowego elementu.
     * @returns Wartości nowego elementu.
     */
    prepareItem?: () => Record<string, any>;
    /**
     * Wysokość listy (np. "300px", 400).
     */
    height?: string | number;
}

export type DialogSize = "small" | "medium" | "large" | "full";

export interface DialogConformButton {
    id: string;
    label: ResolvableValue<Record<string, any>, string>;
    color?: ThemeColor;
    disabled?: ResolvableValue<Record<string, any>, boolean>;
}

export interface IDialogStandalone {
    /**
     * Tytuł dialogu.
     */
    title: ResolvableValue<Record<string, any>, string>;
    /**
     * Układ pól dialogu.
     */
    items: ResolvableValue<Record<string, any>, DialogLayoutItemKind[]>;
    /**
     * Tekst przycisku potwierdzającego.
     * id: "ok", label: "OK", color: "primary"
     * @default "OK"
     */
    confirmLabel?: ResolvableValue<Record<string, any>, string>;
    /**
     * Tekst przycisku anulującego.
     * id: "cancel", label: "Cancel", color: "secondary"
     * @default "Cancel"
     */
    cancelLabel?: ResolvableValue<Record<string, any>, string>;
    /**
     * Etykiety przycisków dialogu (opcjonalnie).
     * Jeśli podane, zastępują domyślne etykiety confirmLabel i cancelLabel.
     */
    buttons?: ResolvableValue<Record<string, any>, DialogConformButton[]>;
    /**
     * Funkcja wywoływana po otwarciu dialogu.
     * @param values Wartości pól dialogu. Może być zmieniona przed wyświetleniem.
     * @returns 
     */
    onOpen?: (values: Record<string, any>) => void;
    /**
     * Funkcja walidacji wywoływana przed zamknięciem dialogu.
     * Jeśli zwróci string, zostanie wyświetlony jako błąd.
     * @param values Wartości pól dialogu.
     * @returns Komunikat błędu lub undefined jeśli walidacja przeszła.
     */
    onValidate?: (values: Record<string, any>) => string | undefined;
    /**
     * Funkcja wywoływana po potwierdzeniu dialogu.
     * @param values Wartości pól dialogu.
     */
    onConfirm?: (values: Record<string, any>, confirmId: string) => void | Promise<void>;
    /**
     * Funkcja wywoływana po anulowaniu dialogu.
     */
    onCancel?: () => void;
    /**
     * Funkcja wywoływana po każdej zmianie wartości pól dialogu.
     * @param values Wartości pól dialogu.
     * @returns 
     */
    onChange?: (values: Record<string, any>) => void;
    /**
     * Rozmiar dialogu.
     * @default "small"
     */
    size?: DialogSize;
    /**
     * Wysokość dialogu (np. "400px", 500).
     */
    height?: string | number;
    /**
     * Czy można wyszukiwać opcji w polach dialogu (np. select) (opcjonalnie).
     * @default false
     */
    canSearch?: boolean;
}

export interface IDialogSlot extends ICustomSlot, IDialogStandalone {
    id: string;

    type: "dialog";
}

export function isIField(obj: any): obj is FieldTypeKind {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof obj.onChange === "function" &&
        "type" in obj
    );
}
export function isTextField(a: any): a is ITextField {
    return isIField(a) && a.type === "text";
}
export function isNumberField(a: any): a is INumberField {
    return isIField(a) && a.type === "number";
}
export function isSelectField(a: any): a is ISelectField {
    return isIField(a) && a.type === "select";
}
export function isSearchField(a: any): a is ISearchField {
    return isIField(a) && a.type === "search";
}
export function isBooleanField(a: any): a is IBooleanField {
    return isIField(a) && a.type === "boolean";
}
export function isAutoRefresh(obj: any): obj is IAutoRefresh {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof obj.onTick === "function"
    );
}
export function isCopyData(obj: any): obj is ICopyData {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof obj.getData === "function"
    );
}
export function isTextSlot(obj: any): obj is ITextSlot {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "text" in obj &&
        "type" in obj &&
        obj.type === "text"
    );
}

export function isGridStatusButton(obj: any): obj is IGridStatusButton {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "label" in obj
    );
}
export function isDialogTextField(field: any): field is IDialogTextField {
    return field?.type === "text";
}

export function isDialogTextareaField(field: any): field is IDialogTextareaField {
    return field?.type === "textarea";
}

export function isDialogNumberField(field: any): field is IDialogNumberField {
    return field?.type === "number";
}

export function isDialogBooleanField(field: any): field is IDialogBooleanField {
    return field?.type === "boolean";
}

export function isDialogSelectField(field: any): field is IDialogSelectField {
    return field?.type === "select";
}

export function isDialogEditorField(field: any): field is IDialogEditorField {
    return field?.type === "editor";
}

export function isDialogRow(item: any): item is IDialogRow {
    return item?.type === "row";
}

export function isDialogColumn(item: any): item is IDialogColumn {
    return item?.type === "column";
}

export function isDialogTabs(item: any): item is IDialogTabs {
    return item?.type === "tabs";
}

export function isDialogTab(item: any): item is IDialogTab {
    return (
        typeof item === "object" &&
        item !== null &&
        "label" in item &&
        "items" in item
    );
}

export function isDialogStatic(item: any): item is IDialogStatic {
    return item?.type === "static";
}

export function isDialogList(item: any): item is IDialogList {
    return item?.type === "list";
}
