import React from "react";
import { ActionDescriptor, ActionGroupDescriptor } from "../CommandPalette/ActionManager";
import { ColumnInfo } from "src/api/db";

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

export type ColumnDataType = 'string' | 'number' | 'boolean' | 'datetime' | 'custom' | 'object' | 'array' | 'null';
export const columnDataTypeClassMap = {
    string: 'data-type-string',
    number: 'data-type-number',
    boolean: 'data-type-boolean',
    datetime: 'data-type-datetime',
    custom: 'data-type-custom',
    object: 'data-type-object',
    array: 'data-type-array',
    null: 'data-type-null',
};
export type ColumnDataValueType = string | number | boolean | any[] | Date | object | null;

export interface TableCellPosition {
    row: number;
    column: number;
}

export type SortDirection = "asc" | "desc";

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
    dataType?: ColumnDataType;
    /**
     * Czy kolumna jest sortowalna i w jakim kierunku.
     */
    sortDirection?: SortDirection;
    /**
     * Kolejność sortowania kolumny.
     */
    sortOrder?: number;
    /**
     * Funkcja formatująca wartość w kolumnie.
     * Jeśli została podana, będzie wywołana, niezależnie od typu danych.
     * @param value Wartość, która ma być sformatowana.
     * @returns 
     */
    formatter?: (value: any) => React.ReactNode;

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
    "longestCommonPrefix";

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
    count: "Count (not empty)",
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
};

export const typeToOperationMap: Record<SummaryOperation, ColumnDataType[]> = {
    sum: ["number", "boolean", "string"],
    avg: ["number", "boolean", "string", "datetime"],
    min: ["number", "boolean", "string", "datetime"],
    max: ["number", "boolean", "string", "datetime"],
    unique: ["number", "boolean", "string", "object", "datetime"],
    median: ["number", "datetime"],
    mode: ["number", "boolean", "string", "datetime"],
    stdDev: ["number"],
    range: ["number", "datetime"],
    count: ["number", "boolean", "string", "object"],
    sumOfSquares: ["number"],
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
};

export interface DataGridActionContext<T extends object> {
    getPosition: () => { row: number; column: number } | null;
    setPosition: (row: number, column: number) => void;
    getValue: () => any | null;
    getRowHeight: () => number;
    setRowHeight: (height: number) => void;
    getColumnWidth: () => number | null;
    setColumnWidth: (newWidth: number) => void;
    getVisibleRows: () => { start: number; end: number };
    getVisibleColumns: () => { start: number; end: number };
    getTotalSize: () => { height: number; width: number };
    getColumnCount: () => number;
    getRowCount: () => number;
    getColumn: (index?: number) => ColumnDefinition | null;
    updateColumn: (index: number, newColumn: Partial<ColumnDefinition>) => void;
    getData: (row: number) => T | null;
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
    sortData: (column: number) => void;
    setSearchWholeWord: (strict: boolean) => void;
    isSearchWholeWord: () => boolean;
    setSearchCaseSensitive: (caseSensitive: boolean) => void;
    isSearchCaseSensitive: () => boolean;
    setSearchExclude: (exclude: boolean) => void;
    isSearchExclude: () => boolean;
    resetSorting: () => void;
    getSummaryFooterOperation: () => SummaryOperation | null;
    setSummaryFooterOperation: (operation: SummaryOperation | null) => void;
    setShowRowNumberColumn: (show: boolean) => void;
    isShowRowNumberColumn: () => boolean;
    clearSummary: () => void;
}

export interface DataGridContext<T extends object> {
    addCommand: (keybinding: string, execute: (context: DataGridActionContext<T>) => void) => void
    addAction: (action: ActionDescriptor<DataGridActionContext<T>>) => void
    addActionGroup(group: ActionGroupDescriptor<DataGridActionContext<T>>): void
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
    valueType: ColumnDataValueType | null;
    valueLength: number | null;
}