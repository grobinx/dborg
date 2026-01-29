import React from "react";
import { Action, ActionGroup, ActionManager } from "../CommandPalette/ActionManager";
import { ColumnBaseType, ColumnDataType, ColumnInfo, ValuePrimitiveType } from "../../../../../src/api/db";
import { ColumnFilter, ColumnsFilterOperator } from "./useColumnsFilterState";

export interface DataGridInfoMessage {
    /**
     * typ grida
     */
    type: "data" | "static";
    /**
     * całkowita liczba wyświetlanych wierszy
     */
    rows: number;
    /**
     * całkowita liczba kolumn
     */
    columns: number;
    /**
     * na którym wierszu jest kursor
     */
    row?: number;
    /**
     * na której kolumnie jest kursor
     */
    column?: number;
    /**
     * czy grid jest akurat aktywnym elementem
     */
    active: boolean;
}

export const columnDataTypeClassMap: Record<ColumnBaseType | 'null', string> = {
    string: 'data-type-string',
    number: 'data-type-number',
    boolean: 'data-type-boolean',
    datetime: 'data-type-datetime',
    binary: 'data-type-binary',
    array: 'data-type-array',
    object: 'data-type-object',
    null: 'data-type-null',
    error: 'data-type-error',
};
export interface TableCellPosition {
    row: number;
    column: number;
}

export type SortDirection = "asc" | "desc";

export type ColumnFormatter = (value: any, row: any, fieldName: string) => React.ReactNode;

export interface ColumnDefinition {
    /**
     * Unikalny klucz identyfikujący kolumnę.
     * Najczęściej nazwa kolumny w bazie danych.
     */
    key: string;
    /**
     * Etykieta kolumny, która będzie wyświetlana w nagłówku tabeli.
     */
    label: string;
    /**
     * Szerokość kolumny w pikselach.
     * Jeśli nie jest podana, szerokość zostanie obliczona automatycznie na podstawie typu.
     */
    width?: number;
    /**
     * Czy kolumnie można zmieniać szerokość.
     * Jeśli nie jest podana, domyślnie jest ustawiona zależna od właściwości przekazanej do całej DataGrid
     */
    resizable?: boolean; // Dodana opcja, czy kolumna jest resizowalna
    /**
     * Typ danych w coluknie.
     * Jest to typ orientacyjny, moze posłużyć do formatowania danych w kolumnie.
     * Domyślnie jest to 'string'.
     */
    dataType: ColumnDataType;
    /**
     * Czy kolumna jest sortowalna i w jakim kierunku.
     */
    sortDirection?: SortDirection;
    /**
     * Kolejność sortowania kolumny.
     */
    sortOrder?: number;
    /**
     * Czy kolumna jest sortowalna.
     */
    sortable?: boolean;
    /**
     * Czy kolumna jest ukryta.
     * Jeśli jest ukryta, nie będzie wyświetlana w tabeli.
     */
    hidden?: boolean;
    /**
     * Operacja podsumowująca, która ma być wykonana na tej kolumnie.
     */
    summary?: SummaryOperation;
    /**
     * Funkcja formatująca wartość w kolumnie.
     * Jeśli została podana, będzie wywołana, niezależnie od typu danych.
     * @param value Wartość, która ma być sformatowana.
     * @returns 
     */
    formatter?: ColumnFormatter;

    info?: ColumnInfo;
}

export type SummaryOperation =
    "sum" | "avg" | "min" | "max" | "unique" |
    "median" | "mode" | "stdDev" | "range" | "count" |
    "truePercentage" | "minLength" | "maxLength" |
    "sumOfSquares" | "emptyCount" | "variance" |
    "skewness" | "kurtosis" | "iqr" | "sumOfAbsoluteDifferences" |
    "geometricMean" | "harmonicMean" |
    "mostFrequentCharacter" | "mostFrequentWord" | "avgWordLength" |
    "longestCommonPrefix" | "agg" | "uniqueAgg";

export const summaryOperationDisplayMap: Record<SummaryOperation, string> = {
    sum: "Sum",
    avg: "Average",
    min: "Minimum",
    max: "Maximum",
    unique: "Distinct Count",
    median: "Median",
    mode: "Mode",
    stdDev: "Standard Deviation",
    range: "Range",
    count: "Count",
    truePercentage: "% True",
    minLength: "Minimum Length",
    maxLength: "Maximum Length",
    sumOfSquares: "Sum of Squares",
    emptyCount: "Empty Count",
    variance: "Variance",
    skewness: "Skewness",
    kurtosis: "Kurtosis",
    iqr: "Interquartile Range",
    sumOfAbsoluteDifferences: "Sum of Absolute Differences",
    geometricMean: "Geometric Mean",
    harmonicMean: "Harmonic Mean",
    mostFrequentCharacter: "Most Frequent Character",
    mostFrequentWord: "Most Frequent Word",
    avgWordLength: "Average Word Length",
    longestCommonPrefix: "Longest Common Prefix",
    agg: "Aggregate",
    uniqueAgg: "Unique Aggregate"
};

export const summaryOperationToBaseTypeMap: Partial<Record<SummaryOperation, ColumnDataType>> = {
    unique: "number",
    count: "number",
    minLength: "number",
    maxLength: "number",
    emptyCount: "number",
    avgWordLength: "number",
};

export const typeToOperationMap: Record<SummaryOperation, ColumnBaseType[]> = {
    sum: ["number", "boolean"],
    avg: ["number", "boolean", "datetime"],
    min: ["number", "boolean", "string", "datetime"],
    max: ["number", "boolean", "string", "datetime"],
    unique: ["number", "boolean", "string", "object", "datetime"],
    median: ["number", "boolean", "datetime"],
    mode: ["number", "boolean", "string", "datetime"],
    stdDev: ["number", "boolean"],
    range: ["number", "boolean", "string", "datetime"],
    count: ["number", "boolean", "string", "object", "datetime"],
    sumOfSquares: ["number", "boolean"],
    emptyCount: ["boolean", "string", "object", "datetime"],
    variance: ["number"],
    skewness: ["number"],
    kurtosis: ["number"],
    iqr: ["number"],
    sumOfAbsoluteDifferences: ["number"],
    geometricMean: ["number"],
    harmonicMean: ["number"],
    truePercentage: ["boolean"],
    minLength: ["string"],
    maxLength: ["string"],
    mostFrequentCharacter: ["string"],
    mostFrequentWord: ["string"],
    avgWordLength: ["string"],
    longestCommonPrefix: ["string"],
    agg: ["number", "boolean", "string", "object", "datetime"],
    uniqueAgg: ["number", "boolean", "string", "object", "datetime"]
};

export interface DataGridActionContext<T extends object> {
    focus: () => void;
    isFocused: () => boolean;
    getPosition: () => TableCellPosition | null;
    setPosition: (position: TableCellPosition) => void;
    getValue: () => any | null;
    getFontSize: () => number;
    setFontSize: (height: number) => void;
    getColumnWidth: () => number | null;
    setColumnWidth: (newWidth: number) => void;
    getVisibleRows: () => { start: number; end: number };
    getVisibleColumns: () => { start: number; end: number };
    getTotalSize: () => { height: number; width: number };
    getColumnCount: () => number;
    getRowCount: (oryginalData?: boolean) => number;
    getColumn: (index?: number) => ColumnDefinition | null;
    updateColumn: (index: number, newColumn: Partial<ColumnDefinition>) => void;
    getData: (row?: number) => T | null;
    /** Zwraca wszystkie wiersze */
    getRows: () => T[];
    /** Zwraca indeksy zaznaczonych wierszy */
    getSelectedRows: () => number[];
    getField: () => keyof T | null;
    openCommandPalette: (prefix: string, query: string) => void;
    closeCommandPalette: () => void;
    moveColumn(from: number, to: number): void;
    /**
     * Zwraca szerokość tekstu w pikselach lub null, jeśli nie można obliczyć szerokości
     * @returns Szerokość tekstu w pikselach lub null
     */
    getTextWidth: (text: string) => number | null;
    setSearchText: (query?: string) => void;
    sortData: (column: number, force?: boolean) => void;
    setSearchWholeWord: (strict: boolean) => void;
    isSearchWholeWord: () => boolean;
    setSearchCaseSensitive: (caseSensitive: boolean) => void;
    isSearchCaseSensitive: () => boolean;
    setSearchExclude: (exclude: boolean) => void;
    isSearchExclude: () => boolean;
    getSearchText: () => string;
    resetSorting: () => void;
    getSummaryOperation: () => SummaryOperation | undefined;
    setSummaryOperation: (operation: SummaryOperation | undefined) => void;
    setShowRowNumberColumn: (show: boolean) => void;
    isShowRowNumberColumn: () => boolean;
    clearSummary: () => void;
    resetColumnsLayout: () => void;
    actionManager: () => ActionManager<DataGridActionContext<T>> | null;
    setUserData: (key: string, value: any) => void;
    getUserData: (key: string) => any;
    toggleGroupColumn: () => void;
    isGroupedColumn: () => boolean;
    clearGrouping: () => void;
    setFilter: (operator: ColumnsFilterOperator, not: boolean, values: string[]) => void;
    getFilter: () => ColumnFilter | null;
    clearFilter: () => void;
    clearFilters: () => void;
    filterActive: (set?: boolean) => boolean | undefined;
    setTemporaryFilter: (operator: ColumnsFilterOperator, not: boolean, values: string[]) => void;
    clearTemporaryFilter: () => void;
    isTemporaryFilter: () => boolean;
    toggleHideColumn: () => void;
    isColumnHidden: () => boolean;
    toggleShowHiddenColumns: () => void;
    isShowHiddenColumns: () => boolean;
    resetHiddenColumns: () => void;
    isPivoted: () => boolean;
    togglePivot: () => void;
    canPivot: () => boolean;
    getPivotMap: () => Record<string, ColumnDataType> | null;
    showDialog: (dialog: React.ReactNode) => void;
}

export interface DataGridContext<T extends object> {
    addCommand: (keybinding: string, execute: (context: DataGridActionContext<T>) => void) => void
    addAction: (...action: Action<DataGridActionContext<T>>[]) => void
    addActionGroup(...group: ActionGroup<DataGridActionContext<T>>[]): void
}

export interface DataGridStatus {
    isLoading: boolean;
    isActive: boolean;
    isSummaryVisible: boolean;
    isRowNumberVisible: boolean;
    position: TableCellPosition | null;
    columnCount: number;
    rowCount: number;
    dataRowCount: number;
    selectedRowCount: number;
    column: ColumnDefinition | null;
    valueType: ValuePrimitiveType | null;
    valueLength: number | null;
}