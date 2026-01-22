import { Theme } from "@mui/material";
import { AutoRefreshInterval, AutoRefreshIntervals, AutoRefreshState } from "@renderer/components/AutoRefreshBar";
import { Action, ActionGroup, Actions } from "@renderer/components/CommandPalette/ActionManager";
import { CommandDescriptor } from "@renderer/components/CommandPalette/CommandManager";
import { DataGridMode } from "@renderer/components/DataGrid/DataGrid";
import { DataGridStatusPart } from "@renderer/components/DataGrid/DataGridStatusBar";
import { ColumnDefinition, DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import { EditorLanguageId } from "@renderer/components/editor/MonacoEditor";
import { Option } from "@renderer/components/inputs/DescribedList";
import { LoadingOverlayMode } from "@renderer/components/useful/LoadingOverlay";
import { ContentSlotContext } from "@renderer/containers/ViewSlots/ContentSlot";
import { DialogSlotFunction, RefreshSlotFunction } from "@renderer/containers/ViewSlots/ViewSlotContext";
import { TabContentSlotContext } from "@renderer/containers/ViewSlots/TabContentSlot";
import { ThemeIconName } from "@renderer/themes/icons";
import { ThemeColor } from "@renderer/types/colors";
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
    | "toolbar"
    | "progress"
    | "dialog"
    | "column"
    | "row"
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
}

export type BooleanFactory = boolean | ((runtimeContext: SlotRuntimeContext) => boolean);
export type NumberFactory = number | null | ((runtimeContext: SlotRuntimeContext) => number | null);
export type NumberArrayFactory = number[] | ((runtimeContext: SlotRuntimeContext) => number[]);
export type ReactNodeFactory = React.ReactNode | ((runtimeContext: SlotRuntimeContext) => React.ReactNode);
export type IconFactory = React.ReactNode | (() => React.ReactNode) | ThemeIconName;
export type StringFactory = string | ((runtimeContext: SlotRuntimeContext) => string);
export type StringAsyncFactory = Promise<string> | ((runtimeContext: SlotRuntimeContext) => Promise<string>);
export type SelectOptionsFactory = Option[] | ((runtimeContext: SlotRuntimeContext) => Option[]);
export type RecordsAsyncFactory = Promise<Record<string, any>[] | Record<string, any> | string | undefined> | ((runtimeContext: SlotRuntimeContext) => Promise<Record<string, any>[] | Record<string, any> | string> | undefined);
export type ColumnDefinitionsFactory = ColumnDefinition[] | ((runtimeContext: SlotRuntimeContext) => ColumnDefinition[]);
export type ActionFactory<T = any> = Action<T>[] | ((runtimeContext: SlotRuntimeContext) => Action<T>[]);
export type ActionGroupFactory<T = any> = ActionGroup<T>[] | ((runtimeContext: SlotRuntimeContext) => ActionGroup<T>[]);
export type EditorActionsFactory = monaco.editor.IActionDescriptor[] | ((runtimeContext: SlotRuntimeContext) => monaco.editor.IActionDescriptor[]);
export type ToolFactory<T = any> = ToolKind<T>[] | ((runtimeContext: SlotRuntimeContext) => ToolKind<T>[]);
export type SplitSlotPartKindFactory = SplitSlotPartKind | ((runtimeContext: SlotRuntimeContext) => SplitSlotPartKind);
export type TabSlotsFactory = ITabSlot[] | ((runtimeContext: SlotRuntimeContext) => ITabSlot[]);
export type TabLabelSlotKindFactory = TabLabelSlotKind | ((runtimeContext: SlotRuntimeContext) => TabLabelSlotKind);
export type TabContentSlotKindFactory = TabContentSlotKind | ((runtimeContext: SlotRuntimeContext) => TabContentSlotKind);
export type ContentSlotKindFactory = ContentSlotKind | ((runtimeContext: SlotRuntimeContext) => ContentSlotKind);
export type ContentSlotKindsFactory = ContentSlotKind[] | ((runtimeContext: SlotRuntimeContext) => ContentSlotKind[]);
export type TitleSlotKindFactory = TitleSlotKind | ((runtimeContext: SlotRuntimeContext) => TitleSlotKind);
export type TextSlotKindFactory = TextSlotKind | ((runtimeContext: SlotRuntimeContext) => TextSlotKind);
export type ContentSlotFactory = IContentSlot | ((runtimeContext: SlotRuntimeContext) => IContentSlot);
export type ToolBarSlotKindFactory = ToolBarSlotKind | ((runtimeContext: SlotRuntimeContext) => ToolBarSlotKind);
export type ProgressBarSlotFactory = IProgressBarSlot | ((runtimeContext: SlotRuntimeContext) => IProgressBarSlot);
export type DialogsSlotFactory = IDialogSlot[] | ((runtimeContext: SlotRuntimeContext) => IDialogSlot[]);
export type DialogLayoutItemsKindFactory = DialogLayoutItemKind[] | ((runtimeContext: SlotRuntimeContext) => DialogLayoutItemKind[]);
export type DialogTabsTabsFactory = IDialogTab[] | ((runtimeContext: SlotRuntimeContext) => IDialogTab[]);

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

export interface ISearchField extends IField {
    type: "search";
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
    id: string;
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
    | IEditorSlot;

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
export interface ITabLabelSlot extends Omit<ICustomSlot, "onShow" | "onHide"> {
    type: "tablabel";
    /**
     * Ikona zakładki (opcjonalnie).
     */
    icon?: IconFactory;
    /**
     * Tekst lub element etykiety zakładki.
     */
    label: ReactNodeFactory;

    onActivate?: (runtimeContext: SlotRuntimeContext) => void;
    onDeactivate?: () => void;
}

export interface ITabContentSlot extends Omit<ICustomSlot, "onShow" | "onHide"> {
    type: "tabcontent";
    /**
     * Zawartość zakładki (slot lub funkcja zwracająca slot).
     */
    content: ContentSlotKindFactory;

    onActivate?: (runtimeContext: SlotRuntimeContext) => void;
    onDeactivate?: (runtimeContext: SlotRuntimeContext) => void;
    /**
     * Pasek postępu (slot lub funkcja zwracająca slot).
     */
    progress?: ProgressBarSlotFactory;
    /**
     * CommandPalette, grupy akcji dostępne jako dodatkowe w zawartości zakładki (opcjonalnie).
     */
    actionGroups?: ActionGroupFactory<TabContentSlotContext>;
    /**
     * CommandPalette, akcje podstawowe ">" dostępne w zawartości zakładki (opcjonalnie).
     */
    actions?: ActionFactory<TabContentSlotContext>;
    /**
     * Skrót klawiszowy (sekwencja) dostępu do głównych akcji CommandPalette (opcjonalnie).
     */
    keybinding?: string;
    /**
     * Dialogs dostępne w zawartości zakładki (opcjonalnie).
     */
    dialogs?: DialogsSlotFactory;
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
export interface ITabSlot extends Omit<ICustomSlot, "onShow" | "onHide"> {
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
     * Zawartość zakładki (slot lub funkcja zwracająca slot).
     */
    content: TabContentSlotKindFactory;
    /**
     * Czy zakładka jest przypinana (opcjonalnie).
     */
    pinnable?: BooleanFactory;
    /**
     * Funkcja zwracająca slot, który pozwala na przypięcie zakładki.
     * @returns 
     */
    pin?: () => ITabSlot;
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
    | IEditorSlot
    | IContentSlot
    | IColumnSlot
    | IRowSlot
    | ITitleSlot
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
    title?: TitleSlotKindFactory;
    /**
     * Slot lub funkcja zwracająca zawartość główną.
     */
    main: ContentSlotKindFactory;
    /**
     * Tekst (slot lub funkcja zwracająca slot).
     */
    text?: TextSlotKindFactory;
    /**
     * Pasek postępu (slot lub funkcja zwracająca slot).
     */
    progress?: ProgressBarSlotFactory;
    /**
     * CommandPalette, grupy akcji dostępne jako dodatkowe w zawartości zakładki (opcjonalnie).
     */
    actionGroups?: ActionGroupFactory<ContentSlotContext>;
    /**
     * CommandPalette, akcje podstawowe ">" dostępne w zawartości zakładki (opcjonalnie).
     */
    actions?: ActionFactory<ContentSlotContext>;
    /**
     * Skrót klawiszowy (sekwencja) dostępu do głównych akcji CommandPalette (opcjonalnie).
     */
    keybinding?: string;
    /**
     * Dialogs dostępne w zawartości (opcjonalnie).
     */
    dialogs?: DialogsSlotFactory;
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
}

export type StatusBarValueFunction = () => string;

export interface IGridStatusButton {
    label: StringFactory;
    icon?: IconFactory;
    tooltip?: StringFactory;
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
    actions?: ActionFactory<DataGridActionContext<any>>;
    /**
     * Grupy akcji dostępne w gridzie (opcjonalnie).
     */
    actionGroups?: ActionGroupFactory<DataGridActionContext<any>>;
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
    searchText?: StringFactory;
    /**
     * Pasek postępu (slot lub funkcja zwracająca slot).
     */
    progress?: ProgressBarSlotFactory;
    /**
     * CommandPalette, grupy akcji dostępne jako dodatkowe w siatce (opcjonalnie).
     */
    canSelectRows?: BooleanFactory;
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

    onMounted?: (runtimeContext: SlotRuntimeContext) => void;
    onPositionChanged?: (runtimeContext: SlotRuntimeContext, context: IEditorContext) => void;
    onSelectionChanged?: (runtimeContext: SlotRuntimeContext, context: IEditorContext) => void;
    onFocus?: (runtimeContext: SlotRuntimeContext, context: IEditorContext) => void;
    onBlur?: (runtimeContext: SlotRuntimeContext, context: IEditorContext) => void;
    onContentChanged?: (runtimeContext: SlotRuntimeContext, context: IEditorContext) => void;
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
    progress?: ProgressBarSlotFactory;
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

export interface IColumnSlot extends ICustomSlot {
    /**
     * Typ elementu layoutu.
     */
    type: "column";
    /**
     * Zawartość kolumny (pola, wiersze lub kolumny).
     */
    items: ContentSlotKindsFactory;
    /**
     * Szerokość kolumny (1-12, jak w Grid System).
     * @default undefined równa dystrybucja
     */
    size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "auto";
    /**
     * Odstęp wewnętrzny kolumny (np. "10px", 1).
     */
    padding?: string | number;
}

export interface IRowSlot extends ICustomSlot {
    /**
     * Typ elementu layoutu.
     */
    type: "row";
    /**
     * Zawartość wiersza (pola, wiersze lub kolumny).
     */
    items: ContentSlotKindsFactory;
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
    tools: ToolFactory;
    /**
     * Id slotu docelowego (opcjonalnie), którego dotyczą identyfikatory akcji (edytor, grid).
     * Działa jeśli w tools jest ciąg znaków z identyfikatorem akcji.
     */
    actionSlotId?: string;
}

export type ToolBarSlotKind =
    IToolBarSlot
    | IRenderedSlot;

export type ProgressBarDisplay = "auto" | BooleanFactory;

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
    showPercent?: BooleanFactory;
    /**
     * Wartość postępu (0-100).
     */
    value?: NumberFactory;
    /**
     * Wartość bufora postępu (0-100) (opcjonalnie).
     */
    bufferValue?: NumberFactory;
    /**
     * Tekst wyświetlany na pasku postępu (opcjonalnie).
     */
    label?: StringFactory;
    /**
     * Kolor paska postępu (opcjonalnie).
     * @default primary
     */
    color?: ThemeColor;
}

export type DialogFieldType = "text" | "number" | "boolean" | "select" | "editor";

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
    label: StringFactory;
    /**
     * Wartość domyślna pola.
     */
    defaultValue?: any;
    /**
     * Czy pole jest wymagane.
     * @default false
     */
    required?: BooleanFactory;
    /**
     * Czy pole jest zablokowane.
     * @default false
     */
    disabled?: BooleanFactory;
    /**
     * Podpowiedź wyświetlana po najechaniu na pole.
     */
    tooltip?: StringFactory;
    /**
     * Tekst pomocniczy wyświetlany pod polem.
     */
    helperText?: StringFactory;
    /**
     * Szerokość pola (np. "100%", 200).
     */
    width?: string | number;
    /**
     * Czy pole ma być automatycznie fokusowane po otwarciu dialogu.
     * @default false
     */
    autoFocus?: boolean;
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
    options: SelectOptionsFactory;
    /**
     * Czy pole ma być wielokrotnego wyboru.
     * @default false
     */
    multiple?: boolean;
}

export type DialogFieldKind =
    | IDialogTextField
    | IDialogNumberField
    | IDialogBooleanField
    | IDialogSelectField;

export type DialogLayoutItemKind =
    | DialogFieldKind
    | IDialogRow
    | IDialogColumn
    | IDialogTabs;

export interface IDialogColumn {
    /**
     * Typ elementu layoutu.
     */
    type: "column";
    /**
     * Etykieta kolumny (opcjonalnie).
     */
    label?: StringFactory;
    /**
     * Zawartość kolumny (pola, wiersze lub kolumny).
     */
    items: DialogLayoutItemsKindFactory;
    /**
     * Szerokość kolumny (1-12, jak w Grid System).
     * @default undefined równa dystrybucja
     */
    width?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

export interface IDialogRow {
    /**
     * Typ elementu layoutu.
     */
    type: "row";
    /**
     * Etykieta wiersza (opcjonalnie).
     */
    label?: StringFactory;
    /**
     * Zawartość wiersza (pola, wiersze lub kolumny).
     */
    items: DialogLayoutItemsKindFactory;
}

export interface IDialogTab {
    /**
     * Etykieta zakładki.
     */
    label: StringFactory;
    /**
     * Zawartość zakładki (pola, wiersze, kolumny).
     */
    items: DialogLayoutItemsKindFactory;
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
    tabs: DialogTabsTabsFactory;
}

export type DialogSize = "small" | "medium" | "large" | "full";

export interface IDialogSlot extends ICustomSlot {
    type: "dialog";
    /**
     * Tytuł dialogu.
     */
    title: StringFactory;
    /**
     * Układ pól dialogu.
     */
    items: DialogLayoutItemsKindFactory;
    /**
     * Tekst przycisku potwierdzającego.
     * @default "OK"
     */
    confirmLabel?: StringFactory;
    /**
     * Tekst przycisku anulującego.
     * @default "Cancel"
     */
    cancelLabel?: StringFactory;
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
    onConfirm?: (values: Record<string, any>) => void | Promise<void>;
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
}

export function resolveStringFactory(factory: StringFactory | undefined, context: SlotRuntimeContext): string | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveStringAsyncFactory(factory: StringAsyncFactory | undefined, context: SlotRuntimeContext): Promise<string | undefined> | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveReactNodeFactory(factory: ReactNodeFactory | undefined, context: SlotRuntimeContext): React.ReactNode {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveBooleanFactory(factory: BooleanFactory | undefined, context: SlotRuntimeContext): boolean | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveActionsFactory(factory: ToolFactory | undefined, context: SlotRuntimeContext): ToolKind[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveRecordsFactory(factory: RecordsAsyncFactory | undefined, context: SlotRuntimeContext): Promise<Record<string, any>[] | Record<string, any> | string | undefined> | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveColumnDefinitionsFactory(factory: ColumnDefinitionsFactory | undefined, context: SlotRuntimeContext): ColumnDefinition[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveActionFactory<T = any>(factory: ActionFactory<T> | undefined, context: SlotRuntimeContext): Action<T>[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveActionGroupFactory<T = any>(factory: ActionGroupFactory<T> | undefined, context: SlotRuntimeContext): ActionGroup<T>[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveEditorActionsFactory(factory: EditorActionsFactory | undefined, context: SlotRuntimeContext): monaco.editor.IActionDescriptor[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveSplitSlotPartKindFactory(factory: SplitSlotPartKindFactory | undefined, context: SlotRuntimeContext): SplitSlotPartKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveTabSlotsFactory(factory: TabSlotsFactory | undefined, context: SlotRuntimeContext): ITabSlot[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveTabLabelKindFactory(factory: TabLabelSlotKindFactory | undefined, context: SlotRuntimeContext): TabLabelSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveTabContentSlotKindFactory(factory: TabContentSlotKindFactory | undefined, context: SlotRuntimeContext): TabContentSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveContentSlotKindFactory(factory: ContentSlotKindFactory | undefined, context: SlotRuntimeContext): ContentSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveContentSlotKindsFactory(factory: ContentSlotKindsFactory | undefined, context: SlotRuntimeContext): ContentSlotKind[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveTitleSlotKindFactory(factory: TitleSlotKindFactory | undefined, context: SlotRuntimeContext): TitleSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveTextSlotKindFactory(factory: TextSlotKindFactory | undefined, context: SlotRuntimeContext): TextSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveContentSlotFactory(factory: ContentSlotFactory | undefined, context: SlotRuntimeContext): IContentSlot | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveSelectOptionsFactory(factory: SelectOptionsFactory | undefined, context: SlotRuntimeContext): Option[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveToolBarSlotKindFactory(factory: ToolBarSlotKindFactory | undefined, context: SlotRuntimeContext): ToolBarSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveNumberFactory(factory: NumberFactory | undefined, context: SlotRuntimeContext): number | null | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveNumberArrayFactory(factory: NumberArrayFactory | undefined, context: SlotRuntimeContext): number[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveProgressBarFactory(factory: ProgressBarSlotFactory | undefined, context: SlotRuntimeContext): IProgressBarSlot | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveDialogsSlotFactory(factory: DialogsSlotFactory | undefined, context: SlotRuntimeContext): IDialogSlot[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveDialogLayoutItemsKindFactory(factory: DialogLayoutItemsKindFactory | undefined, context: SlotRuntimeContext): DialogLayoutItemKind[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}

export function resolveDialogTabsFactory(factory: DialogTabsTabsFactory | undefined, context: SlotRuntimeContext): IDialogTab[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
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

export function isDialogNumberField(field: any): field is IDialogNumberField {
    return field?.type === "number";
}

export function isDialogBooleanField(field: any): field is IDialogBooleanField {
    return field?.type === "boolean";
}

export function isDialogSelectField(field: any): field is IDialogSelectField {
    return field?.type === "select";
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
