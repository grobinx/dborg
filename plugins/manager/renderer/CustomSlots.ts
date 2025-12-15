import { Monaco } from "@monaco-editor/react";
import { Theme } from "@mui/material";
import { AutoRefreshInterval, AutoRefreshIntervals, AutoRefreshState } from "@renderer/components/AutoRefreshBar";
import { Action, ActionGroup, Actions } from "@renderer/components/CommandPalette/ActionManager";
import { CommandDescriptor } from "@renderer/components/CommandPalette/CommandManager";
import { DataGridMode } from "@renderer/components/DataGrid/DataGrid";
import { DataGridStatusPart } from "@renderer/components/DataGrid/DataGridStatusBar";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { EditorLanguageId } from "@renderer/components/editor/MonacoEditor";
import { Option } from "@renderer/components/inputs/DescribedList";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/RefreshSlotContext";
import { ThemeIconName } from "@renderer/themes/icons";
import { ExportFormat } from "@renderer/utils/arrayTo";
import * as monaco from "monaco-editor";

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
    | "toolbar";

export type RefreshSlotCallback = (slotId: string) => void;

export type BooleanFactory = boolean | ((refresh: RefreshSlotFunction) => boolean);
export type NumberFactory = number | ((refresh: RefreshSlotFunction) => number);
export type NumberArrayFactory = number[] | ((refresh: RefreshSlotFunction) => number[]);
export type ReactNodeFactory = React.ReactNode | ((refresh: RefreshSlotFunction) => React.ReactNode);
export type IconFactory = React.ReactNode | (() => React.ReactNode) | ThemeIconName;
export type StringFactory = string | ((refresh: RefreshSlotFunction) => string);
export type StringAsyncFactory = Promise<string> | ((refresh: RefreshSlotFunction) => Promise<string>);
export type SelectOptionsFactory = Option[] | ((refresh: RefreshSlotFunction) => Option[]);
export type RecordsAsyncFactory = Promise<Record<string, any>[] | Record<string, any> | string | undefined> | ((refresh: RefreshSlotFunction) => Promise<Record<string, any>[] | Record<string, any> | string> | undefined);
export type ColumnDefinitionsFactory = ColumnDefinition[] | ((refresh: RefreshSlotFunction) => ColumnDefinition[]);
export type ActionFactory<T = any> = Action<T>[] | ((refresh: RefreshSlotFunction) => Action<T>[]);
export type ActionGroupFactory<T = any> = ActionGroup<T>[] | ((refresh: RefreshSlotFunction) => ActionGroup<T>[]);
export type EditorActionsFactory = monaco.editor.IActionDescriptor[] | ((refresh: RefreshSlotFunction) => monaco.editor.IActionDescriptor[]);
export type ToolFactory<T = any> = ToolKind<T>[] | ((refresh: RefreshSlotFunction) => ToolKind<T>[]);

export type SplitSlotPartKindFactory = SplitSlotPartKind | ((refresh: RefreshSlotFunction) => SplitSlotPartKind);
export type TabSlotsFactory = ITabSlot[] | ((refresh: RefreshSlotFunction) => ITabSlot[]);
export type TabLabelSlotKindFactory = TabLabelSlotKind | ((refresh: RefreshSlotFunction) => TabLabelSlotKind);
export type TabContentSlotKindFactory = TabContentSlotKind | ((refresh: RefreshSlotFunction) => TabContentSlotKind);
export type ContentSlotKindFactory = ContentSlotKind | ((refresh: RefreshSlotFunction) => ContentSlotKind);
export type TitleSlotKindFactory = TitleSlotKind | ((refresh: RefreshSlotFunction) => TitleSlotKind);
export type TextSlotKindFactory = TextSlotKind | ((refresh: RefreshSlotFunction) => TextSlotKind);
export type ContentSlotFactory = IContentSlot | ((refresh: RefreshSlotFunction) => IContentSlot);
export type ToolBarSlotKindFactory = ToolBarSlotKind | ((refresh: RefreshSlotFunction) => ToolBarSlotKind);

export type ToolKind<T = any> =
    | string
    | Action<T>
    | Actions<T>
    | CommandDescriptor<T>
    | FieldTypeKind
    | IAutoRefresh
    | ICopyData
    ;

export interface ISelectOption {
    value: string,
    label: string,
    description?: string,
}

export type IFieldType = "text" | "number" | "select";

export interface IField {
    type: IFieldType;
    /**
     * Etykieta pola tekstowego.
     */
    placeholder?: string,
    /**
     * Domyśla wartość pola tekstowego.
     */
    defaultValue?: any,
    /**
     * Funkcja wywoływana po zmianie wartości pola tekstowego.
     * Wywołanie jest z opóźnieniem
     */
    onChange: (value: any) => void,
    /**
     * Czy pole tekstowe jest zablokowane.
     */
    disabled?: BooleanFactory;
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
    defaultValue?: string,
    /**
     * Funkcja wywoływana po zmianie wartości pola tekstowego.
     * Wywołanie jest z opóźnieniem
     */
    onChange: (value: string) => void,

    minLength?: number;
    maxLength?: number;
}

export interface INumberField extends IField {
    type: "number";
    /**
     * Domyśla wartość pola tekstowego.
     */
    defaultValue?: number,
    /**
     * Funkcja wywoływana po zmianie wartości pola tekstowego.
     * Wywołanie jest z opóźnieniem
     */
    onChange: (value: number | null) => void,

    min?: number;
    max?: number;
    step?: number;
}

export interface ISelectField extends IField {
    type: "select";

    options: SelectOptionsFactory;
}

export type FieldTypeKind =
    ITextField
    | INumberField
    | ISelectField;

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
     * @param refresh 
     * @param context 
     */
    onTick(refresh: RefreshSlotFunction, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy montowaniu komponentu.
     * @param refresh 
     * @param context 
     */
    onMount?(refresh: RefreshSlotFunction, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy odmontowaniu komponentu.
     * @param refresh 
     * @param context 
     */
    onUnmount?(refresh: RefreshSlotFunction, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy starcie automatycznego odświeżania.
     * @param refresh 
     * @param context 
     */
    onStart?(refresh: RefreshSlotFunction, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy zatrzymaniu automatycznego odświeżania.
     * @param refresh 
     * @param context 
     */
    onStop?(refresh: RefreshSlotFunction, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy wstrzymaniu automatycznego odświeżania.
     * @param refresh 
     * @param context 
     */
    onPause?(refresh: RefreshSlotFunction, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy wznowieniu automatycznego odświeżania.
     * @param refresh 
     * @param context 
     */
    onResume?(refresh: RefreshSlotFunction, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy pokazaniu panelu auto refresh.
     * @param refresh 
     * @param context 
     */
    onShow?(refresh: RefreshSlotFunction, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy ukryciu panelu auto refresh.
     * @param refresh 
     * @param context 
     */
    onHide?(refresh: RefreshSlotFunction, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana po naciśnięciu przycisku "Clear".
     */
    onClear?(refresh: RefreshSlotFunction, context: IAutoRefreshContext): void;
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
     * @param refresh 
     * @returns 
     */
    getData: (refresh: RefreshSlotFunction) => T;
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
    id: string;
    /**
     * Type of the slot (not defined in this base interface).
     */
    type: string;

    onMount?: (refresh: RefreshSlotFunction) => void;
    onUnmount?: (refresh: RefreshSlotFunction) => void;
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
    | IEditorSlot;

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
 * @property {string} id musi być unikalne w ramach aplikacji.
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
    toolBar?: ToolBarSlotKindFactory;
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

    onActivate?: (refresh: RefreshSlotFunction) => void;
    onDeactivate?: () => void;
}

export interface ITabContentSlot extends ICustomSlot {
    type: "tabcontent";
    /**
     * Zawartość zakładki (slot lub funkcja zwracająca slot).
     */
    content: ContentSlotKindFactory;

    onActivate?: (refresh: RefreshSlotFunction) => void;
    onDeactivate?: (refresh: RefreshSlotFunction) => void;
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
    toolBar?: ToolBarSlotKindFactory;
    /**
     * Id slotu docelowego (opcjonalnie), którego dotyczą identyfikatory akcji (edytor, grid).
     * Działa jeśli w actions jest ciąg znaków z identyfikatorem akcji.
     * Nie zadziała jeśli w toolBar jest Action lub Actions, nie id akcji z obiektu. Czyli albo albo.
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
    render: React.FC<{ refresh: RefreshSlotFunction }>;
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
    title?: ReactNodeFactory;
    /**
     * Akcje dostępne przy tytule (opcjonalnie).
     */
    toolBar?: ToolBarSlotKindFactory;
    /**
     * Id slotu docelowego (opcjonalnie), którego dotyczą identyfikatory akcji (edytor, grid).
     * Działa jeśli w toolBar jest ciąg znaków z identyfikatorem akcji.
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
    rows: RecordsAsyncFactory;
    /**
     * Definicje kolumn (opcjonalnie).
     */
    columns?: ColumnDefinitionsFactory;
    /**
     * Czy siatka ma być wyświetlana w trybie przestawnym (pivot) (opcjonalnie).
     */
    pivot?: BooleanFactory;
    /**
     * Kolumny dla odwróconej tabeli (opcjonalnie).
     */
    pivotColumns?: ColumnDefinitionsFactory;
    /**
     * Akcje dostępne w gridzie (opcjonalnie).
     */
    actions?: ActionFactory;
    /**
     * Grupy akcji dostępne w gridzie (opcjonalnie).
     */
    actionGroups?: ActionGroupFactory;
    /**
     * Callback po zaznaczeniu wiersza (opcjonalnie).
     */
    onRowSelect?: (row: any | undefined, refresh: (id: string) => void) => void;
    /**
     * Identyfikator do przechowywania układu siatki (opcjonalnie).
     */
    autoSaveId?: string;
    /**
     * Statusy siatki (np. liczba wierszy, pozycja) do wyświetlenia w pasku stanu (opcjonalnie).
     */
    status?: DataGridStatusPart[];
    /**
     * Unikalne pole do identyfikacji wierszy (opcjonalnie).
     */
    uniqueField?: string;
    /**
     * Funkcja zwracająca style dla danego wiersza.
     */
    getRowStyle?: (row: { [key: string]: any }, rowIndex: number, theme: Theme) => React.CSSProperties;
}

export interface IEditorContext {
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
    actions?: EditorActionsFactory;
    /**
     * Zawartość edytora (tekst lub funkcja zwracająca tekst), domyślny, wstawiany przy montowaniu.
     */
    content: StringAsyncFactory;
    /**
     * Język składni edytora (np. "sql", "json").
     * @default "sql"
     */
    language?: EditorLanguageId;
    /**
     * Czy edytor ma być tylko do odczytu (opcjonalnie).
     * @default false
     */
    readOnly?: BooleanFactory;
    /**
     * Czy edytor ma zawijać długie linie (opcjonalnie).
     * @default false
     */
    wordWrap?: BooleanFactory;
    /**
     * Czy edytor ma wyświetlać numery linii (opcjonalnie).
     * @default false
     */
    lineNumbers?: BooleanFactory;
    /**
     * Czy pasek stanu ma być wyświetlany (opcjonalnie).
     * @default true
     */
    statusBar?: boolean;
    /**
     * Czy minimapa ma być wyświetlana (opcjonalnie).
     * @default true
     */
    miniMap?: boolean;

    onMounted?: (refresh: RefreshSlotFunction) => void;
    onPositionChanged?: (refresh: RefreshSlotFunction, context: IEditorContext) => void;
    onSelectionChanged?: (refresh: RefreshSlotFunction, context: IEditorContext) => void;
    onFocus?: (refresh: RefreshSlotFunction, context: IEditorContext) => void;
    onBlur?: (refresh: RefreshSlotFunction, context: IEditorContext) => void;
    onContentChanged?: (refresh: RefreshSlotFunction, context: IEditorContext) => void;
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

export interface IToolBarSlot extends ICustomSlot {
    type: "toolbar";
    /**
     * Narzędzia do wyświetlenia na pasku narzędzi.
     */
    tools: ToolFactory;
}

export type ToolBarSlotKind =
    IToolBarSlot
    | IRenderedSlot;

export function resolveStringFactory(factory: StringFactory | undefined, refresh: RefreshSlotFunction): string | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveStringAsyncFactory(factory: StringAsyncFactory | undefined, refresh: RefreshSlotFunction): Promise<string | undefined> | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveReactNodeFactory(factory: ReactNodeFactory | undefined, refresh: RefreshSlotFunction): React.ReactNode {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveBooleanFactory(factory: BooleanFactory | undefined, refresh: RefreshSlotFunction): boolean | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveActionsFactory(factory: ToolFactory | undefined, refresh: RefreshSlotFunction): ToolKind[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveRecordsFactory(factory: RecordsAsyncFactory | undefined, refresh: RefreshSlotFunction): Promise<Record<string, any>[] | Record<string, any> | string | undefined> | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveColumnDefinitionsFactory(factory: ColumnDefinitionsFactory | undefined, refresh: RefreshSlotFunction): ColumnDefinition[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveActionFactory<T = any>(factory: ActionFactory<T> | undefined, refresh: RefreshSlotFunction): Action<T>[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveActionGroupFactory<T = any>(factory: ActionGroupFactory<T> | undefined, refresh: RefreshSlotFunction): ActionGroup<T>[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveEditorActionsFactory(factory: EditorActionsFactory | undefined, refresh: RefreshSlotFunction): monaco.editor.IActionDescriptor[] | undefined {
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
export function resolveSelectOptionsFactory(factory: SelectOptionsFactory | undefined, refresh: RefreshSlotFunction): Option[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveToolBarSlotKindFactory(factory: ToolBarSlotKindFactory | undefined, refresh: RefreshSlotFunction): ToolBarSlotKind | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveNumberFactory(factory: NumberFactory | undefined, refresh: RefreshSlotFunction): number | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
}
export function resolveNumberArrayFactory(factory: NumberArrayFactory | undefined, refresh: RefreshSlotFunction): number[] | undefined {
    return typeof factory === "function" ? factory(refresh) : factory;
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