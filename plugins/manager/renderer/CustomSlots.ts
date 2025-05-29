import { ActionDescriptor, ActionGroupDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { CommandDescriptor } from "@renderer/components/CommandPalette/CommandManager";
import { DataGridMode } from "@renderer/components/DataGrid/DataGrid";
import { DataGridStatusPart } from "@renderer/components/DataGrid/DataGridStatusBar";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/RefreshSlotContext";
import * as monaco from "monaco-editor";
import { HTMLInputTypeAttribute } from "react";

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
    | "rendered";

export type RefreshSlotCallback = (slotId: string) => void;

export type BooleanFactory = boolean | ((refresh: RefreshSlotFunction) => boolean);
export type ReactNodeFactory = React.ReactNode | ((refresh: RefreshSlotFunction) => React.ReactNode);
export type IconFactory = React.ReactNode | (() => React.ReactNode);
export type StringFactory = string | ((refresh: RefreshSlotFunction) => string);
export type SelectOptionsFactory = ISelectOption[] | ((refresh: RefreshSlotFunction) => ISelectOption[]);
export type ActionsFactory = ActionKind[] | ((refresh: RefreshSlotFunction) => ActionKind[]);
export type RecordsFactory = Promise<Record<string, any>[] | undefined> | ((refresh: RefreshSlotFunction) => Promise<Record<string, any>[]> | undefined);
export type ColumnDefinitionsFactory = ColumnDefinition[] | ((refresh: RefreshSlotFunction) => ColumnDefinition[]);
export type ActionDescriptorsFactory<T = any> = ActionDescriptor<T>[] | ((refresh: RefreshSlotFunction) => ActionDescriptor<T>[]);
export type ActionGroupDescriptorsFactory<T = any> = ActionGroupDescriptor<T>[] | ((refresh: RefreshSlotFunction) => ActionGroupDescriptor<T>[]);
export type EditorActionDescriptorsFactory = monaco.editor.IActionDescriptor[] | ((refresh: RefreshSlotFunction) => monaco.editor.IActionDescriptor[]);

export type SplitSlotPartKindFactory = SplitSlotPartKind | ((refresh: RefreshSlotFunction) => SplitSlotPartKind);
export type TabSlotsFactory = ITabSlot[] | ((refresh: RefreshSlotFunction) => ITabSlot[]);
export type TabLabelSlotKindFactory = TabLabelSlotKind | ((refresh: RefreshSlotFunction) => TabLabelSlotKind);
export type TabContentSlotKindFactory = TabContentSlotKind | ((refresh: RefreshSlotFunction) => TabContentSlotKind);
export type ContentSlotKindFactory = ContentSlotKind | ((refresh: RefreshSlotFunction) => ContentSlotKind);
export type TitleSlotKindFactory = TitleSlotKind | ((refresh: RefreshSlotFunction) => TitleSlotKind);
export type TextSlotKindFactory = TextSlotKind | ((refresh: RefreshSlotFunction) => TextSlotKind);
export type ContentSlotFactory = IContentSlot | ((refresh: RefreshSlotFunction) => IContentSlot);

export type ActionKind<T = any> = string | ActionDescriptor<T> | CommandDescriptor<T> | ITextField;

export interface ISelectOption {
    value: string,
    label: string,
}

export interface ITextField {
    /**
     * Typ pola tekstowego, np. "text", "password", "email" itp.
     * @default "text"
     */
    type?: HTMLInputTypeAttribute | "select",
    /**
     * Etykieta pola tekstowego.
     */
    placeholder?: string,
    /**
     * Domyśla wartość pola tekstowego.
     */
    defaultValue?: string,
    /**
     * Funkcja wywoływana po zmianie wartości pola tekstowego.
     */
    onChange: (value: string) => void,
    /**
     * Czy pole tekstowe jest zablokowane.
     */
    disabled?: BooleanFactory;
    /**
     * Opcje dla typu select
     */
    options?: SelectOptionsFactory;
}

export interface ISlot {
    /**
     * Unique identifier for the slot.
     */
    id: string;
    /**
     * Type of the slot (not defined in this base interface).
     */
    type: string;
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
    | IRenderedSlot;

/**
 * Slot typu split.
 * Pozwala na podział widoku na dwie części (pionowo lub poziomo).
 * Każda część może być kolejnym splitem, zakładkami lub inną zawartością.
 */
export interface ISplitSlot extends ICustomSlot {
    type: "split";
    /**
     * Kierunek podziału: "vertical" (góra/dół) lub "horizontal" (lewo/prawo).
     */
    direction: "vertical" | "horizontal";
    /**
     * Zawartość pierwszej części (slot lub funkcja zwracająca slot).
     */
    first: SplitSlotPartKindFactory;
    /**
     * Zawartość drugiej części (slot lub funkcja zwracająca slot).
     */
    second: SplitSlotPartKindFactory;
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
 */
export interface ITabsSlot extends ICustomSlot {
    type: "tabs";
    /**
     * Tablica zakładek lub funkcja zwracająca tablicę zakładek.
     */
    tabs: TabSlotsFactory;
    /**
     * Pozyjca zakładek: "top" (góra) lub "bottom" (dół).
     * Domyślnie "top".
     */
    position?: "top" | "bottom";
    /**
     * Akcje dostępne dla listy zakładek (opcjonalnie).
     */
    actions?: ActionDescriptorsFactory;
    /**
     * Domyślny identyfikator zakładki, która ma być aktywna przy pierwszym renderowaniu.
     * Jeśli nie podano, pierwsza zakładka będzie aktywna.
     */
    defaultTabId?: StringFactory;
}

/**
 * Struktura etykiety zakładki (label).
 */
export interface ITabLabelSlot extends ICustomSlot {
    type: "tablabel";
    /**
     * Ikona zakładki (opcjonalnie).
     */
    icon?: IconFactory;
    /**
     * Tekst lub element etykiety zakładki.
     */
    label: ReactNodeFactory;
}

export interface ITabContentSlot extends ICustomSlot {
    type: "tabcontent";
    /**
     * Zawartość zakładki (slot lub funkcja zwracająca slot).
     */
    content: ContentSlotKindFactory;
}

export type TabLabelSlotKind =
    ITabLabelSlot
    | IRenderedSlot;

export type TabContentSlotKind =
    ITabContentSlot
    | IRenderedSlot;

/**
 * Slot typu tab.
 * Reprezentuje pojedynczą zakładkę w TabsSlot.
 */
export interface ITabSlot extends ICustomSlot {
    type: "tab";
    /**
     * Czy zakładka jest zamykalna (opcjonalnie).
     */
    closable?: BooleanFactory;
    /**
     * Etykieta zakładki (ikona, tekst).
     */
    label: TabLabelSlotKindFactory;
    /**
     * Akcje dostępne w zakładce (opcjonalnie).
     */
    actions?: ActionsFactory;
    /**
     * Id slotu docelowego (opcjonalnie), którego dotyczą identyfikatory akcji (edytor, grid).
     * Działa jeśli w actions jest ciąg znaków z identyfikatorem akcji.
     */
    actionSlotId?: string;
    /**
     * Zawartość zakładki (slot lub funkcja zwracająca slot).
     */
    content: TabContentSlotKindFactory;
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
    render: () => React.ReactNode;
}

export type ContentSlotKind =
    ISplitSlot
    | ITabsSlot
    | IRenderedSlot
    | IGridSlot
    | IEditorSlot
    | IContentSlot;

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
    title?: TitleSlotKindFactory;
    /**
     * Slot lub funkcja zwracająca zawartość główną.
     */
    main: ContentSlotKindFactory;
    /**
     * Tekst (slot lub funkcja zwracająca slot).
     */
    text?: TextSlotKindFactory;
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
    icon?: IconFactory;
    /**
     * Tytuł (tekst lub element).
     */
    title: ReactNodeFactory;
    /**
     * Akcje dostępne przy tytule (opcjonalnie).
     */
    actions?: ActionsFactory;
    /**
     * Id slotu docelowego (opcjonalnie), którego dotyczą identyfikatory akcji (edytor, grid).
     * Działa jeśli w actions jest ciąg znaków z identyfikatorem akcji.
     */
    actionSlotId?: string;
}

/**
 * Slot typu grid.
 * Pozwala na wyświetlenie siatki danych (np. wyników zapytania SQL).
 */
export interface IGridSlot extends ICustomSlot {
    type: "grid";
    /**
     * Tryb działania siatki (np. dynamiczne lub zdefiniowane kolumny).
     * Domyślnie "data".
     */
    mode?: DataGridMode;
    /**
     * Zapytanie SQL do pobrania danych.
     */
    rows: RecordsFactory;
    /**
     * Definicje kolumn (opcjonalnie).
     */
    columns?: ColumnDefinitionsFactory;
    /**
     * Akcje dostępne w gridzie (opcjonalnie).
     */
    actions?: ActionDescriptorsFactory;
    /**
     * Grupy akcji dostępne w gridzie (opcjonalnie).
     */
    actionGroups?: ActionGroupDescriptorsFactory;
    /**
     * Callback po kliknięciu w wiersz (opcjonalnie).
     */
    onRowClick?: (row: any | undefined, refresh: (id: string) => void) => void;
    /**
     * Identyfikator do przechowywania układu siatki (opcjonalnie).
     */
    autoSaveId?: string;
    /**
     * Statusy siatki (np. liczba wierszy, pozycja) do wyświetlenia w pasku stanu (opcjonalnie).
     */
    status?: DataGridStatusPart[];
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
    actions?: EditorActionDescriptorsFactory;
    /**
     * Zawartość edytora (tekst lub funkcja zwracająca tekst), domyślny, wstawiany przy montowaniu.
     */
    content: StringFactory;
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
    text: ReactNodeFactory;
    /**
     * Maksymalna liczba wyświetlanych linii tekstu (opcjonalnie, domyślnie 3).
     */
    maxLines?: number;
}

export function resolveStringFactory(factory: StringFactory | undefined, refresh: RefreshSlotFunction): string | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveReactNodeFactory(factory: ReactNodeFactory | undefined, refresh: RefreshSlotFunction): React.ReactNode {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveBooleanFactory(factory: BooleanFactory | undefined, refresh: RefreshSlotFunction): boolean | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveActionsFactory(factory: ActionsFactory | undefined, refresh: RefreshSlotFunction): ActionKind[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveRecordsFactory(factory: RecordsFactory | undefined, refresh: RefreshSlotFunction): Promise<Record<string, any>[] | undefined> | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveColumnDefinitionsFactory(factory: ColumnDefinitionsFactory | undefined, refresh: RefreshSlotFunction): ColumnDefinition[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveActionDescriptorsFactory<T = any>(factory: ActionDescriptorsFactory<T> | undefined, refresh: RefreshSlotFunction): ActionDescriptor<T>[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveActionGroupDescriptorsFactory<T = any>(factory: ActionGroupDescriptorsFactory<T> | undefined, refresh: RefreshSlotFunction): ActionGroupDescriptor<T>[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveEditorActionDescriptorsFactory(factory: EditorActionDescriptorsFactory | undefined, refresh: RefreshSlotFunction): monaco.editor.IActionDescriptor[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveSplitSlotPartKindFactory(factory: SplitSlotPartKindFactory | undefined, refresh: RefreshSlotFunction): SplitSlotPartKind | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveTabSlotsFactory(factory: TabSlotsFactory | undefined, refresh: RefreshSlotFunction): ITabSlot[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveTabLabelKindFactory(factory: TabLabelSlotKindFactory | undefined, refresh: RefreshSlotFunction): TabLabelSlotKind | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveTabContentSlotKindFactory(factory: TabContentSlotKindFactory | undefined, refresh: RefreshSlotFunction): TabContentSlotKind | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveContentSlotKindFactory(factory: ContentSlotKindFactory | undefined, refresh: RefreshSlotFunction): ContentSlotKind | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveTitleSlotKindFactory(factory: TitleSlotKindFactory | undefined, refresh: RefreshSlotFunction): TitleSlotKind | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveTextSlotKindFactory(factory: TextSlotKindFactory | undefined, refresh: RefreshSlotFunction): TextSlotKind | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveContentSlotFactory(factory: ContentSlotFactory | undefined, refresh: RefreshSlotFunction): IContentSlot | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveSelectOptionsFactory(factory: SelectOptionsFactory | undefined, refresh: RefreshSlotFunction): ISelectOption[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}

export function isITextField(obj: any): obj is ITextField {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof obj.onChange === "function"
    );
}
