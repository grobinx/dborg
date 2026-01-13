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
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/RefreshSlotContext";
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
    ;

export interface SlotFactoryContext {
    theme: Theme;
    refresh: RefreshSlotFunction;
}

export type BooleanFactory = boolean | ((slotContext: SlotFactoryContext) => boolean);
export type NumberFactory = number | null | ((slotContext: SlotFactoryContext) => number | null);
export type NumberArrayFactory = number[] | ((slotContext: SlotFactoryContext) => number[]);
export type ReactNodeFactory = React.ReactNode | ((slotContext: SlotFactoryContext) => React.ReactNode);
export type IconFactory = React.ReactNode | (() => React.ReactNode) | ThemeIconName;
export type StringFactory = string | ((slotContext: SlotFactoryContext) => string);
export type StringAsyncFactory = Promise<string> | ((slotContext: SlotFactoryContext) => Promise<string>);
export type SelectOptionsFactory = Option[] | ((slotContext: SlotFactoryContext) => Option[]);
export type RecordsAsyncFactory = Promise<Record<string, any>[] | Record<string, any> | string | undefined> | ((slotContext: SlotFactoryContext) => Promise<Record<string, any>[] | Record<string, any> | string> | undefined);
export type ColumnDefinitionsFactory = ColumnDefinition[] | ((slotContext: SlotFactoryContext) => ColumnDefinition[]);
export type ActionFactory<T = any> = Action<T>[] | ((slotContext: SlotFactoryContext) => Action<T>[]);
export type ActionGroupFactory<T = any> = ActionGroup<T>[] | ((slotContext: SlotFactoryContext) => ActionGroup<T>[]);
export type EditorActionsFactory = monaco.editor.IActionDescriptor[] | ((slotContext: SlotFactoryContext) => monaco.editor.IActionDescriptor[]);
export type ToolFactory<T = any> = ToolKind<T>[] | ((slotContext: SlotFactoryContext) => ToolKind<T>[]);
export type SplitSlotPartKindFactory = SplitSlotPartKind | ((slotContext: SlotFactoryContext) => SplitSlotPartKind);
export type TabSlotsFactory = ITabSlot[] | ((slotContext: SlotFactoryContext) => ITabSlot[]);
export type TabLabelSlotKindFactory = TabLabelSlotKind | ((slotContext: SlotFactoryContext) => TabLabelSlotKind);
export type TabContentSlotKindFactory = TabContentSlotKind | ((slotContext: SlotFactoryContext) => TabContentSlotKind);
export type ContentSlotKindFactory = ContentSlotKind | ((slotContext: SlotFactoryContext) => ContentSlotKind);
export type TitleSlotKindFactory = TitleSlotKind | ((slotContext: SlotFactoryContext) => TitleSlotKind);
export type TextSlotKindFactory = TextSlotKind | ((slotContext: SlotFactoryContext) => TextSlotKind);
export type ContentSlotFactory = IContentSlot | ((slotContext: SlotFactoryContext) => IContentSlot);
export type ToolBarSlotKindFactory = ToolBarSlotKind | ((slotContext: SlotFactoryContext) => ToolBarSlotKind);
export type ProgressBarSlotFactory = IProgressBarSlot | ((slotContext: SlotFactoryContext) => IProgressBarSlot);
export type DialogsSlotFactory = IDialogSlot[] | ((slotContext: SlotFactoryContext) => IDialogSlot[]);
export type DialogLayoutItemsKindFactory = DialogLayoutItemKind[] | ((slotContext: SlotFactoryContext) => DialogLayoutItemKind[]);

export type ToolKind<T = any> =
    | string
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
    onTick(slotContext: SlotFactoryContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy montowaniu komponentu.
     * @param slotContext 
     * @param context 
     */
    onMount?(slotContext: SlotFactoryContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy odmontowaniu komponentu.
     * @param slotContext 
     * @param context 
     */
    onUnmount?(slotContext: SlotFactoryContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy starcie automatycznego odświeżania.
     * @param slotContext 
     * @param context 
     */
    onStart?(slotContext: SlotFactoryContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy zatrzymaniu automatycznego odświeżania.
     * @param slotContext 
     * @param context 
     */
    onStop?(slotContext: SlotFactoryContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy wstrzymaniu automatycznego odświeżania.
     * @param slotContext 
     * @param context 
     */
    onPause?(slotContext: SlotFactoryContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy wznowieniu automatycznego odświeżania.
     * @param slotContext 
     * @param context 
     */
    onResume?(slotContext: SlotFactoryContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy pokazaniu panelu auto refresh.
     * @param slotContext 
     * @param context 
     */
    onShow?(slotContext: SlotFactoryContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana przy ukryciu panelu auto refresh.
     * @param slotContext 
     * @param context 
     */
    onHide?(slotContext: SlotFactoryContext, context: IAutoRefreshContext): void;
    /**
     * Funkcja wywoływana po naciśnięciu przycisku "Clear".
     */
    onClear?(slotContext: SlotFactoryContext, context: IAutoRefreshContext): void;
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
    getData: (slotContext: SlotFactoryContext) => T;
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

    onMount?: (slotContext: SlotFactoryContext) => void;
    onUnmount?: (slotContext: SlotFactoryContext) => void;

    onShow?: (slotContext: SlotFactoryContext) => void;
    onHide?: (slotContext: SlotFactoryContext) => void;
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

    onActivate?: (slotContext: SlotFactoryContext) => void;
    onDeactivate?: () => void;
}

export interface ITabContentSlot extends Omit<ICustomSlot, "onShow" | "onHide"> {
    type: "tabcontent";
    /**
     * Zawartość zakładki (slot lub funkcja zwracająca slot).
     */
    content: ContentSlotKindFactory;

    onActivate?: (slotContext: SlotFactoryContext) => void;
    onDeactivate?: (slotContext: SlotFactoryContext) => void;
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
    onClose?: (slotContext: SlotFactoryContext) => void;
    /**
     * Funkcja wywoływana po przypięciu zakładki.
     * @param slotContext 
     */
    onPin?: (slotContext: SlotFactoryContext) => void;
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
    render: React.FC<{ slotContext: SlotFactoryContext }>;
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
    onClick?: (slotContext: SlotFactoryContext) => void;
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
    onRowSelect?: (row: any, slotContext: SlotFactoryContext) => void;
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
    onCancel?: (slotContext: SlotFactoryContext) => void;
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

    onMounted?: (slotContext: SlotFactoryContext) => void;
    onPositionChanged?: (slotContext: SlotFactoryContext, context: IEditorContext) => void;
    onSelectionChanged?: (slotContext: SlotFactoryContext, context: IEditorContext) => void;
    onFocus?: (slotContext: SlotFactoryContext, context: IEditorContext) => void;
    onBlur?: (slotContext: SlotFactoryContext, context: IEditorContext) => void;
    onContentChanged?: (slotContext: SlotFactoryContext, context: IEditorContext) => void;
    /**
     * Funkcja, która służy do przerwania wykonywania operacji pobierania wierszy.
     * Jeśli jest zdefiniowana, użytkownik może przerwać operację.
     * @param slotContext: SlotFactoryContext
     * @returns 
     */
    onCancel?: (slotContext: SlotFactoryContext) => void;
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

export type DialogFieldType = "text" | "number" | "boolean" | "select";

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
    | IDialogColumn;

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
    onConfirm: (values: Record<string, any>) => void | Promise<void>;
    /**
     * Funkcja wywoływana po anulowaniu dialogu.
     */
    onCancel?: () => void;
    /**
     * Rozmiar dialogu.
     * @default "medium"
     */
    size?: DialogSize;
}

export function resolveStringFactory(factory: StringFactory | undefined, context: SlotFactoryContext): string | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveStringAsyncFactory(factory: StringAsyncFactory | undefined, context: SlotFactoryContext): Promise<string | undefined> | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveReactNodeFactory(factory: ReactNodeFactory | undefined, context: SlotFactoryContext): React.ReactNode {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveBooleanFactory(factory: BooleanFactory | undefined, context: SlotFactoryContext): boolean | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveActionsFactory(factory: ToolFactory | undefined, context: SlotFactoryContext): ToolKind[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveRecordsFactory(factory: RecordsAsyncFactory | undefined, context: SlotFactoryContext): Promise<Record<string, any>[] | Record<string, any> | string | undefined> | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveColumnDefinitionsFactory(factory: ColumnDefinitionsFactory | undefined, context: SlotFactoryContext): ColumnDefinition[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveActionFactory<T = any>(factory: ActionFactory<T> | undefined, context: SlotFactoryContext): Action<T>[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveActionGroupFactory<T = any>(factory: ActionGroupFactory<T> | undefined, context: SlotFactoryContext): ActionGroup<T>[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveEditorActionsFactory(factory: EditorActionsFactory | undefined, context: SlotFactoryContext): monaco.editor.IActionDescriptor[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveSplitSlotPartKindFactory(factory: SplitSlotPartKindFactory | undefined, context: SlotFactoryContext): SplitSlotPartKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveTabSlotsFactory(factory: TabSlotsFactory | undefined, context: SlotFactoryContext): ITabSlot[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveTabLabelKindFactory(factory: TabLabelSlotKindFactory | undefined, context: SlotFactoryContext): TabLabelSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveTabContentSlotKindFactory(factory: TabContentSlotKindFactory | undefined, context: SlotFactoryContext): TabContentSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveContentSlotKindFactory(factory: ContentSlotKindFactory | undefined, context: SlotFactoryContext): ContentSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveTitleSlotKindFactory(factory: TitleSlotKindFactory | undefined, context: SlotFactoryContext): TitleSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveTextSlotKindFactory(factory: TextSlotKindFactory | undefined, context: SlotFactoryContext): TextSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveContentSlotFactory(factory: ContentSlotFactory | undefined, context: SlotFactoryContext): IContentSlot | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveSelectOptionsFactory(factory: SelectOptionsFactory | undefined, context: SlotFactoryContext): Option[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveToolBarSlotKindFactory(factory: ToolBarSlotKindFactory | undefined, context: SlotFactoryContext): ToolBarSlotKind | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveNumberFactory(factory: NumberFactory | undefined, context: SlotFactoryContext): number | null | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveNumberArrayFactory(factory: NumberArrayFactory | undefined, context: SlotFactoryContext): number[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveProgressBarFactory(factory: ProgressBarSlotFactory | undefined, context: SlotFactoryContext): IProgressBarSlot | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveDialogsSlotFactory(factory: DialogsSlotFactory | undefined, context: SlotFactoryContext): IDialogSlot[] | undefined {
    return typeof factory === "function" ? factory(context) : factory;
}
export function resolveDialogLayoutItemsKindFactory(factory: DialogLayoutItemsKindFactory | undefined, context: SlotFactoryContext): DialogLayoutItemKind[] | undefined {
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