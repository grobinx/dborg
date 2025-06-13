import React, { useRef, useState, useEffect, useImperativeHandle } from "react"; // Dodaj import useMemo
import { Box, darken, lighten, styled, useTheme } from "@mui/material";
import { CommandManager } from "../CommandPalette/CommandManager";
import { ActionManager } from "../CommandPalette/ActionManager";
import CommandPalette from "../CommandPalette/CommandPalette";
import * as actions from "./actions";
import { columnDataTypeClassMap, ColumnDataValueType, ColumnDefinition, DataGridActionContext, DataGridContext, DataGridStatus, SummaryOperation, summaryOperationDisplayMap, TableCellPosition } from "./DataGridTypes";
import { useSettings } from "@renderer/contexts/SettingsContext";
import { DborgSettings } from "@renderer/app.config";
import { calculateSummary, calculateTextWidth, calculateVisibleColumns, calculateVisibleRows, columnDataFormatter, resolveDataType, scrollToCell, valueToString } from "./DataGridUtils";
import { createDataGridCommands } from "./DataGridCommands";
import { highlightText } from "../CommandPalette/CommandPalette"; // Import funkcji highlightText
import LoadingOverlay from "../useful/LoadingOverlay";
import useRowSelection from "./useRowSelection";
import { useColumnsState } from "./useColumnsState";
import { useSearchState } from "@renderer/hooks/useSearchState";
import { useScrollSync } from "@renderer/hooks/useScrollSync";
import { useFocus } from "@renderer/hooks/useFocus";
import { useTranslation } from "react-i18next";
import { ColumnDataType } from "src/api/db";

export type DataGridMode = "defined" | "data";

interface DataGridProps<T extends object> {
    columns: ColumnDefinition[];
    data: T[];
    rowHeight?: number;
    /**
     * Czy tabela ma być wyświetlana jako tabela danych
     * Tabela danych jest wyświetlana w stylu monospace
     * @default "defined"
     */
    mode?: DataGridMode;
    /**
     * Czy kolumny są resizowalne
     * @default false
     */
    columnsResizable?: boolean;
    /**
     * Liczba wiersz przed i po widocznych wierszach, zapobiega migotaniu
     * przy przewijaniu
     * @default 5
     */
    overscanRowCount?: number;
    /**
     * Czy wyświetlać numer wiersza w pierwszej kolumnie
     * @default true
     */
    columnRowNumber?: boolean;
    /**
     * Wywoływane jest po zamontowaniu komponentu
     * @returns 
     */
    onMount?: (context: DataGridContext<T>) => void;
    /**
     * Wywoływane jest przed odmontowaniem komponentu
     * @returns 
     */
    onDismount?: () => void;
    /**
     * Wywoływane jest za każdym razem kiedy coś się zmieni w układzie tabeli, 
     * @param context 
     */
    onChange?: (context: DataGridStatus) => void;
    /**
     * Wywoływane jest po kliknięciu w wiersz
     * @param row 
     */
    onRowClick?: (row: T | undefined) => void;
    /**
     * Padding w poziomie dla komórek
     */
    cellPaddingX?: number;
    /**
     * Padding w pionie dla komórek
     */
    cellPaddingY?: number;
    /**
     * Czy dane są ładowane
     */
    loading?: string;
    /**
     * Wywoływane, gdy ładowanie jest anulowane
     */
    onCancelLoading?: () => void;

    active?: boolean;

    ref?: React.RefObject<DataGridActionContext<T> | null>;

    /**
     * Extra unique ID for the DataGrid to save column layout, eg for connection schema
     */
    autoSaveId?: string;
}

const StyledTable = styled('div', {
    name: "DataGrid",
    slot: "root",
})({
    position: "relative",
    display: "flex",
    height: "100%",
    width: "100%",
    userSelect: "none", // Wyłączenie zaznaczania tekstu
});

const StyledHeader = styled('div', {
    name: "DataGrid",
    slot: "header",
})(({ theme }) => ({
    position: "sticky",
    top: 0,
    display: "flex",
    zIndex: 2,
    backgroundColor: theme.palette.background.table.header,
    color: theme.palette.table.contrastText,
}));

const StyledHeaderCell = styled('div', {
    name: "DataGrid",
    slot: "headerCell",
    shouldForwardProp: (prop) => prop !== 'rowHeight' && prop !== 'paddingX' && prop !== 'paddingY',
})<{ rowHeight: number; paddingX: number; paddingY: number }>(
    ({ theme, rowHeight, paddingX, paddingY }) => {
        const contentHeight = rowHeight - paddingY * 2; // Wysokość dostępna dla treści

        return {
            fontWeight: "bold",
            textAlign: "left",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            position: "absolute",
            userSelect: "none", // Wyłączenie zaznaczania tekstu
            boxSizing: "border-box",
            height: rowHeight, // Użycie rowHeight w stylach
            padding: `${paddingY}px ${paddingX}px`,
            lineHeight: `${contentHeight}px`, // Ustawienie lineHeight na wysokość treści
            borderRadius: 0, // Ustawienie zaokrąglenia na 0
            alignItems: "center",
            "&:not(:first-of-type)": {
                borderLeft: `1px solid ${theme.palette.divider}`, // Dodanie lewego borderu z wyjątkiem pierwszego
            },
            "& .resize-handle": {
                position: "absolute",
                top: 0,
                right: 0,
                width: "5px",
                height: "100%",
                cursor: "col-resize",
                zIndex: 2,
            },
        };
    }
);

const StyledHeaderCellContent = styled('div', {
    name: "DataGrid",
    slot: "headerCellContent",
})({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
});

const StyledSortIconContainer = styled('div', {
    name: "DataGrid",
    slot: "sortIconContainer",
})({
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.8em",
    color: "gray",
});

// Styled components
const StyledTableContainer = styled('div', {
    name: "DataGrid",
    slot: "tableContainer",
    shouldForwardProp: (prop) => prop !== 'rowHeight' && prop !== 'paddingY',
})<{ rowHeight: number; paddingY: number }>(
    ({ rowHeight, paddingY }) => {
        const contentHeight = rowHeight - paddingY * 2;
        const fontSize = Math.max(12, contentHeight * 0.8);
        return {
            position: "relative",
            overflow: "auto",
            width: "100%",
            height: "100%",
            userSelect: "none",
            borderRadius: 0,
            fontSize: `${fontSize}px`,
        };
    }
);

const StyledRow = styled("div", {
    name: "DataGrid",
    slot: "row",
})(({ theme }) => ({
    display: "flex",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    //transition: "background-color 0.2s ease", // Płynna zmiana koloru tła
    backgroundColor: theme.palette.background.table.container,
    // "&.odd": {
    //     backgroundColor: theme.palette.mode === "dark" ?
    //         darken(theme.palette.background.table.container, 0.05) :
    //         lighten(theme.palette.background.table.container, 0.05),
    // },
    "&.even": {
        backgroundColor: theme.palette.mode === "dark" ?
            lighten(theme.palette.background.table.container, 0.05) :
            darken(theme.palette.background.table.container, 0.05),
    },
    "&:hover": {
        backgroundColor: theme.palette.action.hover, // Kolor tła przy najechaniu myszką
    },
    "&.Mui-selected": {
        backgroundColor: theme.palette.action.selected, // Kolor tła dla zaznaczonego wiersza
    },
}));

const StyledCell = styled("div", {
    name: "DataGrid",
    slot: "cell",
    shouldForwardProp: (prop) => prop !== 'rowHeight' && prop !== 'paddingX' && prop !== 'paddingY' && prop !== 'dataType' && prop !== 'colorsEnabled',
})<{
    rowHeight: number;
    paddingX: number;
    paddingY: number;
    dataType?: ColumnDataType;
    colorsEnabled: boolean;
}>(
    ({ theme, rowHeight, paddingX, paddingY, dataType, colorsEnabled }) => {
        const contentHeight = rowHeight - paddingY * 2; // Wysokość dostępna dla treści

        return {
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            position: "absolute",
            userSelect: "none", // Wyłączenie zaznaczania tekstu
            boxSizing: "border-box",
            height: rowHeight,
            padding: `${paddingY}px ${paddingX}px`,
            lineHeight: `${contentHeight}px`, // Ustawienie lineHeight na wysokość treści
            alignItems: "center",
            color: colorsEnabled ? theme.palette?.dataType?.[dataType ?? "string"] : "inherit",
            textAlign: (dataType === 'number' || dataType === 'decimal' || dataType === 'bigint') ? 'right' : dataType === 'boolean' ? 'center' : 'left',
            zIndex: 1,
            "&.Mui-selected": {
                backgroundColor: theme.palette.action.selected,
            },
            "&.Mui-focused": {
                outline: `2px solid ${theme.palette.primary.main}`,
            },
            "&:not(:first-of-type)": {
                borderLeft: `1px solid ${theme.palette.divider}`, // Dodanie lewego borderu z wyjątkiem pierwszego
            },
            "&:hover": {
                backgroundColor: theme.palette.action.hover, // Efekt hover
            },
        };
    }
);

const StyledRowsContainer = styled("div", {
    name: "DataGrid",
    slot: "rowsContainer",
})({
    position: "relative",
});

const StyledFooter = styled('div', {
    name: "DataGrid",
    slot: "footer",
})(({ theme }) => ({
    position: "sticky",
    bottom: 0,
    display: "flex",
    zIndex: 3,
    backgroundColor: theme.palette.background.table.footer,
    color: theme.palette.table.contrastText,
}));

const StyledFooterCell = styled('div', {
    name: "DataGrid",
    slot: "footerCell",
    shouldForwardProp: (prop) => prop !== 'rowHeight' && prop !== 'paddingX' && prop !== 'paddingY' && prop !== 'dataType',
})<{
    rowHeight: number;
    paddingX: number;
    paddingY: number;
    dataType?: ColumnDataType;
}>(
    ({ theme, rowHeight, paddingX, paddingY, dataType }) => {
        const contentHeight = rowHeight - paddingY * 2; // Wysokość dostępna dla treści

        return {
            fontWeight: "bold",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            position: "absolute",
            userSelect: "none", // Wyłączenie zaznaczania tekstu
            boxSizing: "border-box",
            height: rowHeight, // Użycie rowHeight w stylach
            padding: `${paddingY}px ${paddingX}px`,
            lineHeight: `${contentHeight}px`, // Ustawienie lineHeight na wysokość treści
            borderRadius: 0, // Ustawienie zaokrąglenia na 0
            alignItems: "center",
            textAlign: (dataType === 'number' || dataType === 'bigint' || dataType === 'decimal') ? 'right' : dataType === 'boolean' ? 'center' : 'left',
            "&:not(:first-of-type)": {
                borderLeft: `1px solid ${theme.palette.divider}`, // Dodanie lewego borderu z wyjątkiem pierwszego
            },
        };
    }
);

// Dodaj styled komponent dla kolumny z numerami wierszy
const StyledRowNumberColumn = styled('div', {
    name: "DataGrid",
    slot: "rowNumberColumn",
})(({ theme }) => ({
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    borderRight: "1px solid #ddd", // Dodanie prawego obramowania
    boxSizing: "border-box",
    fontSize: "0.9em",
    textAlign: "center",
    userSelect: "none",
    backgroundColor: theme.palette.background.table.container,
    overflow: "hidden",
}));

const StyledRowNumberCell = styled('div', {
    name: "DataGrid",
    slot: "rowNumberCell",
    shouldForwardProp: (prop) => prop !== 'rowHeight' && prop !== 'paddingY',
})<{ rowHeight: number }>(({ theme, rowHeight }) => ({
    position: "absolute",
    width: "100%",
    height: rowHeight,
    lineHeight: `${rowHeight}px`,
    borderBottom: `1px solid ${theme.palette.divider}`, // Dodanie dolnego obramowania
    boxSizing: "border-box",
    "&.Mui-selected": {
        backgroundColor: theme.palette.action.selected,
    },
}));

const StyledNoRowsInfo = styled('div', {
    name: "DataGrid",
    slot: "noRowsInfo",
})(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "70%",
    width: "100%",
    color: theme.palette.text.disabled, // Użycie koloru z motywu
    fontSize: "1.3em",
}));

export const DataGrid = <T extends object>({
    columns,
    data,
    rowHeight: initialRowHeight = 20,
    mode = "defined",
    columnsResizable = true,
    overscanRowCount = 3,
    columnRowNumber = false,
    onMount,
    onDismount,
    onChange,
    onRowClick,
    cellPaddingX = 3,
    cellPaddingY = 1,
    loading,
    onCancelLoading,
    active,
    ref,
    autoSaveId,
}: DataGridProps<T>) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const commandManager = useRef<CommandManager<DataGridActionContext<T>> | null>(null);
    const actionManager = useRef<ActionManager<DataGridActionContext<T>> | null>(null);
    const isFocused = useFocus(containerRef);
    const [settings] = useSettings<DborgSettings>("dborg");
    const [rowHeight, setRowHeight] = useState(initialRowHeight);
    const [dataState, setDataState] = useState<T[] | null>(null);
    const searchState = useSearchState();
    const { scrollTop, scrollLeft } = useScrollSync(containerRef, !!loading);
    const [containerHeight, setContainerHeight] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [resizingColumn, setResizingColumn] = useState<number | null>(null);
    const columnsState = useColumnsState(columns, mode, autoSaveId);
    const [openCommandPalette, setOpenCommandPalette] = useState(false);
    const [commandPalettePrefix, setCommandPalettePrefix] = useState<string>("");
    const [selectedCell, setSelectedCell] = useState<TableCellPosition | null>(null);
    const [adjustWidthExecuted, setAdjustWidthExecuted] = useState(false);
    const [filteredDataState, setFilteredDataState] = useState<T[]>([]);
    const [summaryRow, setSummaryRow] = useState<Record<string, ColumnDataValueType>>({});
    const [summaryOperation, setSummaryOperation] = useState<Record<string, SummaryOperation | null> | null>(null);
    const [footerVisible, setFooterVisible] = useState(false); // Dodaj stan dla StyledFooter
    const [rowNumberColumnWidth, setRowNumberColumnWidth] = useState(50); // Domyślna szerokość kolumny z numerami wierszy
    const [showRowNumberColumn, setShowRowNumberColumn] = useState(columnRowNumber); // Dodano stan
    const previousStatusRef = useRef<DataGridStatus | null>(null);
    const { selectedRows, toggleRowSelection, setSelectedRows } = useRowSelection();
    const [fontFamily, setFontFamily] = useState<string>("inherit");
    const [fontSize, setFontSize] = useState<number>(16);
    const [userData, setUserData] = useState<Record<string, any>>({});

    useImperativeHandle(ref, () => dataGridActionContext);

    useEffect(() => {
        setDataState(data);
        setSummaryRow({});
        setSummaryOperation(null);
        setFooterVisible(false);
        setSelectedRows([]);
        setSelectedCell(null);
        searchState.resetSearch();
    }, [columns, data])

    useEffect(() => {
        let resultSet: T[] = [...(dataState || [])];

        // Filtrowanie na podstawie queryData, wholeWordQuery i caseSensitiveQuery
        if (searchState.current.text) {
            const queryParts = searchState.current.caseSensitive
                ? searchState.current.text.split(' ').filter(Boolean) // Bez konwersji na małe litery
                : searchState.current.text.toLowerCase().split(' ').filter(Boolean);

            resultSet = resultSet.filter((row) => {
                const matchesQuery = queryParts.every((part) =>
                    Object.values(row).some((value) => {
                        const cellValue = searchState.current.caseSensitive
                            ? value?.toString() // Bez konwersji na małe litery
                            : value?.toString().toLowerCase();

                        if (!cellValue) return false; // Jeśli wartość jest null/undefined, pomiń

                        if (searchState.current.wholeWord) {
                            // Podziel cellValue na wyrazy i sprawdź, czy part jest jednym z nich
                            const cellWords = cellValue.split(/\s+/); // Podział na wyrazy
                            return cellWords.includes(part); // Dopasowanie całych wyrazów
                        } else {
                            return cellValue.includes(part); // Dopasowanie zawierające
                        }
                    })
                );

                // Jeśli excludeQuery jest włączone, wyklucz rekordy pasujące do queryData
                return searchState.current.exclude ? !matchesQuery : matchesQuery;
            });
        }

        // Sortowanie na podstawie sortDirection i sortOrder
        const sortedColumns = columnsState.current
            .filter((col) => col.sortDirection !== null) // Uwzględnij tylko kolumny z sortDirection
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)); // Posortuj według sortOrder

        if (sortedColumns.length > 0) {
            resultSet.sort((a, b) => {
                for (const col of sortedColumns) {
                    const valueA = a[col.key];
                    const valueB = b[col.key];

                    if (valueA === valueB) continue; // Jeśli wartości są równe, przejdź do następnej kolumny

                    if (col.sortDirection === "asc") {
                        return valueA > valueB ? 1 : -1;
                    } else if (col.sortDirection === "desc") {
                        return valueA < valueB ? 1 : -1;
                    }
                }
                return 0; // Jeśli wszystkie wartości są równe, nie zmieniaj kolejności
            });
        }

        setFilteredDataState(resultSet);
    }, [dataState, searchState.current, columnsState.stateChanged]);

    useEffect(() => {
        // Upewnij się, że zaznaczony wiersz nie wykracza poza odfiltrowane rekordy
        if (selectedCell?.row !== undefined && selectedCell.row >= filteredDataState.length) {
            updateSelectedCell(filteredDataState.length > 0 ? { row: filteredDataState.length - 1, column: selectedCell.column ?? 0 } : null);
        }
    }, [filteredDataState]);

    useEffect(() => {
        if (footerVisible) {
            const dataForSummary = selectedRows.length > 0
                ? selectedRows.map((rowIndex) => filteredDataState[rowIndex]) // Dane tylko z zaznaczonych wierszy
                : filteredDataState; // Wszystkie dane, jeśli brak zaznaczenia

            setSummaryRow(calculateSummary(dataForSummary, columnsState.current, summaryOperation));
        }
    }, [filteredDataState, selectedRows, columnsState.stateChanged, footerVisible, summaryOperation]);

    useEffect(() => {
        if (onChange) {
            const timeoutRef = setTimeout(() => {
                const value = selectedCell?.row !== undefined && selectedCell.column !== undefined ?
                    filteredDataState[selectedCell.row][columnsState.current[selectedCell.column].key]
                    : null;
                const newStatus: DataGridStatus = {
                    isActive: !!active || isFocused || openCommandPalette,
                    isLoading: !!loading,
                    isSummaryVisible: footerVisible,
                    isRowNumberVisible: showRowNumberColumn,
                    columnCount: columnsState.current.length,
                    rowCount: filteredDataState.length,
                    position: selectedCell,
                    dataRowCount: dataState?.length || 0,
                    selectedRowCount: selectedRows.length,
                    column: selectedCell?.column !== undefined ? columnsState.current[selectedCell.column] || null : null,
                    valueType: resolveDataType(value),
                    valueLength: value ? value.length : null,
                };

                // Porównaj nowy status z poprzednim
                if (JSON.stringify(previousStatusRef.current) !== JSON.stringify(newStatus)) {
                    onChange(newStatus); // Wywołaj onChange tylko, jeśli status się zmienił
                    previousStatusRef.current = newStatus; // Zaktualizuj poprzedni status
                }
            }, 100); // Opóźnienie 100 ms

            return () => clearTimeout(timeoutRef); // Resetuj opóźnienie, jeśli dane wejściowe się zmienią
        }
        return;
    }, [
        filteredDataState,
        selectedCell,
        loading,
        footerVisible,
        showRowNumberColumn,
        columnsState.current,
        selectedRows,
        isFocused,
        openCommandPalette,
        onChange,
        active,
        dataState,
    ]);

    // Ustawienie selectedCell na pierwszy wiersz po odfiltrowaniu
    useEffect(() => {
        if (filteredDataState.length > 0) {
            if (containerRef.current) {
                scrollToCell(
                    containerRef.current,
                    selectedCell?.row ?? 0,
                    selectedCell?.column ?? 0,
                    columnsState.columnLeft(selectedCell?.column ?? 0),
                    rowHeight,
                    columnsState.current,
                    footerVisible);
            }
        } else {
            updateSelectedCell(null); // Jeśli brak wyników, resetuj zaznaczenie
        }
    }, [filteredDataState, rowHeight, columnsState.current]);

    const totalHeight = filteredDataState.length * rowHeight;
    const { startRow, endRow } = calculateVisibleRows(filteredDataState.length, rowHeight, containerHeight, scrollTop, containerRef);
    const { startColumn, endColumn } = calculateVisibleColumns(scrollLeft, containerWidth, columnsState.current);

    useEffect(() => {
        if (containerRef.current) {
            const style = window.getComputedStyle(containerRef.current);
            setFontFamily(style.fontFamily || "inherit");
            setFontSize(parseFloat(style.fontSize) || 16);
        }
    }, [rowHeight, mode]);

    useEffect(() => {
        if (onRowClick) {
            if (selectedCell?.row !== undefined) {
                onRowClick(filteredDataState[selectedCell.row]);
            }
            else {
                onRowClick(undefined);
            }
        }
    }, [filteredDataState, selectedCell?.row]);

    const updateSelectedCell = (cell: TableCellPosition | null): TableCellPosition | null => {
        if (!cell) {
            setSelectedCell(null);
            return null;
        }
        // Skoryguj indeksy, jeśli wykraczają poza zakres
        const maxRow = filteredDataState.length - 1;
        const maxCol = columnsState.current.length - 1;
        const row = Math.max(0, Math.min(cell.row, maxRow));
        const column = Math.max(0, Math.min(cell.column, maxCol));
        // Jeśli nie ma żadnych wierszy lub kolumn, resetuj zaznaczenie
        if (maxRow < 0 || maxCol < 0) {
            setSelectedCell(null);
            return null;
        }
        setSelectedCell((prev) =>
            prev?.row === row && prev?.column === column ? prev : { row, column }
        );
        return { row, column };
    };

    useEffect(() => {
        if (containerRef.current) {
            const maxRowNumber = filteredDataState.length; // Maksymalny numer wiersza
            const text = maxRowNumber.toString(); // Tekst do obliczenia szerokości
            const calculatedWidth = Math.max(calculateTextWidth(text, fontSize, fontFamily) ?? 40, 40);
            setRowNumberColumnWidth(calculatedWidth + cellPaddingX * 2); // Minimalna szerokość to 50px
        }
    }, [filteredDataState.length, fontSize, fontFamily]);

    const dataGridActionContext: DataGridActionContext<T> = {
        focus: () => {
            if (containerRef.current) {
                containerRef.current.focus();
            }
        },
        isFocused: () => isFocused,
        getValue: () => {
            if (selectedCell) {
                const column = columnsState.current[selectedCell.column];
                return filteredDataState[selectedCell.row][column.key];
            }
            return null;
        },
        getPosition: () => selectedCell,
        setPosition: ({ row, column }) => {
            const position = updateSelectedCell({ row, column });
            if (containerRef.current && position) {
                scrollToCell(containerRef.current, position.row, position.column, columnsState.columnLeft(position.column), rowHeight, columnsState.current, footerVisible);
            }
        },
        getRowHeight: () => rowHeight,
        setRowHeight: (height) => {
            setRowHeight(height); // Funkcja do zmiany rowHeight
            if (containerRef.current && selectedCell) {
                const { row, column } = selectedCell;
                scrollToCell(containerRef.current, row, column, columnsState.columnLeft(column), height, columnsState.current, footerVisible);
            }
        },
        getColumnWidth: () => columnsState.current[selectedCell?.column ?? 0]?.width || null,
        setColumnWidth: (newWidth) => selectedCell ? columnsState.updateColumn(selectedCell.column, { width: newWidth }) : null,
        getVisibleRows: () => ({ start: startRow, end: endRow }),
        getVisibleColumns: () => ({ start: startColumn, end: endColumn }),
        getTotalSize: () => ({ height: totalHeight, width: columnsState.totalWidth }),
        getColumnCount: () => columnsState.current.length,
        getRowCount: () => filteredDataState.length,
        getColumn: (index) => (index !== undefined ? columnsState.current[index] : selectedCell ? columnsState.current[selectedCell.column] : null),
        updateColumn: (index, newColumn) => columnsState.updateColumn(index, newColumn),
        getData: (row) => {
            if (row === undefined) {
                if (selectedCell) {
                    return filteredDataState[selectedCell.row] || null;
                }
                return null;
            }
            return filteredDataState[row] || null;
        },
        getField: () => {
            if (selectedCell) {
                return columnsState.current[selectedCell.column].key as keyof T;
            }
            return null;
        },
        openCommandPalette: (prefix, _query) => {
            setCommandPalettePrefix(prefix);
            setOpenCommandPalette(true);
        },
        closeCommandPalette: () => setOpenCommandPalette(false),
        moveColumn: (from, to) => columnsState.moveColumn(from, to),
        getTextWidth: (text: string) => {
            if (containerRef.current) {
                return calculateTextWidth(text, fontSize, fontFamily);
            }
            return null;
        },
        setSearchText: (query) => searchState.setSearchText(query ?? null), // Ustawienie queryData
        setSearchWholeWord: (strict) => searchState.setWholeWord(strict), // Ustawienie strictQuery
        isSearchWholeWord: () => searchState.current.wholeWord, // Zwrócenie wartości strictQuery
        setSearchCaseSensitive: (caseSensitive) => searchState.setCaseSensitive(caseSensitive), // Ustawienie caseSensitiveQuery
        isSearchCaseSensitive: () => searchState.current.caseSensitive, // Zwrócenie wartości caseSensitiveQuery
        setSearchExclude: (exclude) => searchState.setExclude(exclude), // Ustawienie excludeQuery
        isSearchExclude: () => searchState.current.exclude, // Zwrócenie wartości excludeQuery
        sortData: (columnIndex: number) => columnsState.sortColumn(columnIndex),
        resetSorting: () => columnsState.resetSorting(),
        getSummaryFooterOperation: () => {
            if (summaryOperation) {
                const column = columnsState.current[selectedCell?.column ?? 0];
                return summaryOperation[column.key] || null; // Zwrócenie operacji dla wybranej kolumny
            }
            return null;
        },
        setSummaryFooterOperation: (operation) => {
            setSummaryOperation((prev) => {
                const columnKey = columnsState.current[selectedCell?.column ?? 0]?.key;

                if (!columnKey) return prev;

                const updatedOperation = {
                    ...prev,
                    [columnKey]: prev?.[columnKey] === operation ? null : operation, // Wyczyść operację, jeśli jest taka sama
                };

                // Sprawdź, czy wszystkie operacje są puste
                const allOperationsEmpty = Object.values(updatedOperation).every((op) => op === null);

                setFooterVisible(!allOperationsEmpty); // Ukryj stopkę tylko, jeśli wszystkie operacje są puste

                return updatedOperation;
            });
        },
        setShowRowNumberColumn: (show) => {
            setShowRowNumberColumn(show); // Ustawienie stanu dla kolumny z numerami wierszy
            if (!show) {
                setSelectedRows([]); // Resetuj zaznaczenie, jeśli kolumna z numerami wierszy jest ukryta
            }
        },
        isShowRowNumberColumn: () => showRowNumberColumn, // Zwrócenie stanu dla kolumny z numerami wierszy
        clearSummary: () => {
            setSummaryOperation(null); // Wyczyść operacje
            setFooterVisible(false); // Ukryj stopkę
        },
        resetColumnsLayout: () => {
            columnsState.resetColumns();
        },
        actionManager: () => actionManager.current,
        setUserData(key, value) {
            setUserData((prev) => ({ ...prev, [key]: value }));
        },
        getUserData(key) {
            return userData[key];
        },
    }

    useEffect(() => {
        if (mode === "data" && !adjustWidthExecuted && actionManager.current && filteredDataState.length > 0 && startRow >= 0) {
            actionManager.current.executeAction(actions.AdjustWidthToData_ID, dataGridActionContext);
            setAdjustWidthExecuted(true);
        }
    }, [adjustWidthExecuted, actionManager.current, filteredDataState, mode]);

    // Resetuj stan przy zmianie dataState
    useEffect(() => {
        if (mode === "data") {
            setAdjustWidthExecuted(false);
        }
    }, [dataState]);

    useEffect(() => {
        const container = containerRef.current;

        // Obserwator rozmiaru kontenera
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect) {
                    setContainerHeight(entry.contentRect.height);
                    setContainerWidth(entry.contentRect.width);
                }
            }
        });

        if (container) {
            resizeObserver.observe(container);
        }

        // Inicjalizacja CommandManager i ActionManager
        if (!commandManager.current && !actionManager.current) {
            commandManager.current = new CommandManager<DataGridActionContext<T>>();
            commandManager.current.registerCommand(createDataGridCommands<T>());

            actionManager.current = new ActionManager<DataGridActionContext<T>>();

            actionManager.current.registerActionGroup(actions.GotoColumnGroup());
            actionManager.current.registerActionGroup(actions.SearchDataGroup());
            actionManager.current.registerActionGroup(actions.SummaryFooterGroup());

            actionManager.current.registerAction(actions.IncreaseFontSize());
            actionManager.current.registerAction(actions.DecreaseFontSize());
            actionManager.current.registerAction(actions.IncreaseColumnWidth());
            actionManager.current.registerAction(actions.DecreaseColumnWidth());
            actionManager.current.registerAction(actions.MoveColumnToEnd());
            actionManager.current.registerAction(actions.MoveColumnFromEnd());
            actionManager.current.registerAction(actions.ResetFontSize(initialRowHeight));
            actionManager.current.registerAction(actions.CopyValueToClipboard());
            actionManager.current.registerAction(actions.GeneralReset());
            actionManager.current.registerAction(actions.AdjustWidthToData());
            actionManager.current.registerAction(actions.SwitchColumnSort());
            actionManager.current.registerAction(actions.ToggleShowRowNumberColumn());
            actionManager.current.registerAction(actions.ResetColumnsLayout());

            actionManager.current.registerAction(actions.OpenCommandPalette());
            actionManager.current.registerAction(actions.GotoColumn());
            actionManager.current.registerAction(actions.SearchData());
            actionManager.current.registerAction(actions.SummaryFooter());
        }

        if (onMount) {
            onMount({
                addCommand: (keybinding, execute) => {
                    commandManager.current?.registerCommand(keybinding, execute);
                },
                addAction: (...action) => {
                    actionManager.current?.registerAction(...action);
                },
                addActionGroup: (...group) => {
                    actionManager.current?.registerActionGroup(...group);
                },
            });
        }

        return () => {
            if (container) {
                resizeObserver.disconnect();
            }

            if (onDismount) {
                onDismount();
            }
        };
    }, []);

    const handleFocus = () => {
        if (!selectedCell && filteredDataState.length > 0) {
            updateSelectedCell({ row: 0, column: 0 });
        }
    };

    const handleRowNumberColumnScroll = (event: React.WheelEvent) => {
        if (containerRef.current) {
            const container = containerRef.current;
            const maxScrollTop = container.scrollHeight - container.clientHeight;

            // Oblicz nową wartość scrollTop
            let newScrollTop = container.scrollTop + event.deltaY;

            // Ogranicz wartość scrollTop do zakresu [0, maxScrollTop]
            newScrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));

            container.scrollTop = newScrollTop;
        }
    };

    const handleCellClick = (rowIndex: number, columnIndex: number) => {
        const position = updateSelectedCell({ row: rowIndex, column: columnIndex });

        if (containerRef.current && position) {
            scrollToCell(containerRef.current, position.row, position.column, columnsState.columnLeft(position.column), rowHeight, columnsState.current, footerVisible);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (loading) return; // Ignoruj zdarzenia klawiatury, gdy loading jest aktywne

        if (document.activeElement !== containerRef.current) return;

        if (!selectedCell) return;

        const context: DataGridActionContext<T> = dataGridActionContext;
        if (commandManager.current?.executeCommand(event, context)) {
            event.preventDefault();
            return;
        }
        if (actionManager.current?.executeActionByKeybinding(event, context)) {
            event.preventDefault();
            return;
        }
    };

    const handleMouseDown = (colIndex: number, event: React.MouseEvent) => {
        setResizingColumn(colIndex);
        event.preventDefault();
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (resizingColumn !== null && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const newWidth = Math.max(
                25, // Minimalna szerokość kolumny
                event.clientX - containerRect.left + containerRef.current.scrollLeft - columnsState.columnLeft(resizingColumn)
            );
            columnsState.updateColumn(resizingColumn, { width: newWidth });
        }
    };

    const handleMouseUp = () => {
        // problem z onClick sortowania
        setTimeout(() => setResizingColumn(null), 0);
    };

    const handleRowNumberCellClick = (
        event: React.MouseEvent,
        absoluteRowIndex: number
    ) => {
        if (containerRef.current) {
            containerRef.current.focus(); // Ustaw focus na StyledTableContainer
        }

        toggleRowSelection(absoluteRowIndex, event.ctrlKey, event.shiftKey);
        updateSelectedCell({ row: absoluteRowIndex, column: selectedCell?.column ?? 0 });
        scrollToCell(
            containerRef.current!,
            absoluteRowIndex,
            0,
            columnsState.columnLeft(0),
            rowHeight,
            columnsState.current,
            footerVisible
        );
    };

    useEffect(() => {
        if (resizingColumn !== null) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizingColumn]);

    return (
        <StyledTable className="DataGrid-table">
            {/* Kolumna z numerami wierszy */}
            {showRowNumberColumn && (
                <StyledRowNumberColumn
                    className="DataGrid-rowNumberColumn"
                    style={{
                        width: rowNumberColumnWidth,
                        height: containerHeight + (
                            containerRef.current?.offsetHeight !== undefined && containerRef.current?.clientHeight !== undefined
                                ? containerRef.current.offsetHeight - containerRef.current.clientHeight
                                : 0
                        ), // wysokość kontenera, nie całej tabeli!
                        fontFamily: fontFamily,
                        // usuń transform: translateY(-${scrollTop}px)
                    }}
                    onWheel={handleRowNumberColumnScroll}
                >
                    <div
                        style={{
                            position: "relative",
                            top: rowHeight + -scrollTop, // przesuwaj numery wierszy
                        }}
                    >
                        {Array.from({ length: Math.min(endRow + 2, filteredDataState.length) - Math.max(startRow - 1, 0) }, (_, rowIndex) => {
                            const absoluteRowIndex = Math.max(startRow - 1, 0) + rowIndex;
                            return (
                                <StyledRowNumberCell
                                    key={absoluteRowIndex}
                                    className={`DataGrid-rowNumberCell ${selectedRows.includes(absoluteRowIndex) ? "Mui-selected" : ""}`}
                                    rowHeight={rowHeight}
                                    style={{
                                        top: absoluteRowIndex * rowHeight,
                                    }}
                                    onClick={(event) => handleRowNumberCellClick(event, absoluteRowIndex)}
                                >
                                    {absoluteRowIndex + 1}
                                </StyledRowNumberCell>
                            );
                        })}
                    </div>
                </StyledRowNumberColumn>
            )}

            {loading && (
                <LoadingOverlay
                    label={loading.trim() === "" ? t("loading---", "Loading...") : loading}
                    onCancelLoading={onCancelLoading}
                />
            )}

            {/* Główna tabela */}
            <StyledTableContainer
                ref={containerRef}
                className="DataGrid-tableContainer"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                rowHeight={rowHeight}
                paddingY={cellPaddingY}
                onFocus={handleFocus}
                style={{
                    fontFamily: (mode === "data" ? "monospace" : "inherit"),
                    marginLeft: showRowNumberColumn ? `${rowNumberColumnWidth}px` : "0px",
                    pointerEvents: loading ? "none" : "auto", // Zablokuj interakcje, gdy loading jest aktywne
                }}
            >
                <CommandPalette
                    manager={actionManager.current!}
                    open={openCommandPalette}
                    onClose={() => setOpenCommandPalette(false)}
                    getContext={() => dataGridActionContext}
                    parentRef={containerRef}
                    prefix={commandPalettePrefix}
                />
                <StyledHeader
                    className="DataGrid-header"
                    style={{ width: columnsState.totalWidth, height: rowHeight }}
                >
                    {columnsState.current.slice(startColumn, endColumn).map((col, colIndex) => (
                        <StyledHeaderCell
                            key={colIndex}
                            className="DataGrid-headerCell"
                            style={{
                                width: col.width || 150,
                                left: columnsState.columnLeft(startColumn + colIndex),
                            }}
                            paddingX={cellPaddingX}
                            paddingY={cellPaddingY}
                            rowHeight={rowHeight}
                            onClick={() => {
                                if (!resizingColumn) {
                                    updateSelectedCell({ row: selectedCell?.row ?? startRow, column: startColumn + colIndex });
                                    dataGridActionContext.sortData(startColumn + colIndex);
                                }
                            }}
                        >
                            <StyledHeaderCellContent className="DataGrid-headerCellContent">
                                <span
                                    className="label"
                                    style={{
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "block",
                                        maxWidth: "100%",
                                    }}
                                >
                                    {col.label}
                                </span>
                                {col.sortDirection && (
                                    <StyledSortIconContainer>
                                        <span className="sort-icon">{col.sortDirection === "asc" ? "▲" : "▼"}</span>
                                        {col.sortOrder !== undefined && <span className="sort-order">{col.sortOrder}</span>}
                                    </StyledSortIconContainer>
                                )}
                            </StyledHeaderCellContent>
                            {(col.resizable ?? columnsResizable) && (
                                <div
                                    className="resize-handle"
                                    onMouseDown={(event) => handleMouseDown(startColumn + colIndex, event)}
                                />
                            )}
                        </StyledHeaderCell>
                    ))}
                </StyledHeader>
                {filteredDataState.length === 0 && (
                    <StyledNoRowsInfo className="DataGrid-noRowsInfo">
                        {t("no-rows-to-display", "No rows to display")}
                    </StyledNoRowsInfo>
                )}
                <StyledRowsContainer
                    style={{ height: totalHeight, width: columnsState.totalWidth }}
                    className="DataGrid-rowsContainer"
                >
                    {filteredDataState.slice(Math.max(startRow - overscanRowCount, 0), Math.min(endRow + overscanRowCount, filteredDataState.length)).map((row, rowIndex) => {
                        const absoluteRowIndex = Math.max(startRow - overscanRowCount, 0) + rowIndex;
                        const isRowSelected = selectedCell?.row === absoluteRowIndex;
                        const rowClass = absoluteRowIndex % 2 === 0 ? "even" : "odd";

                        return (
                            <StyledRow
                                key={absoluteRowIndex}
                                className={`DataGrid-row ${rowClass} ${selectedRows.includes(absoluteRowIndex) ? "Mui-selected" : ""}`}
                                style={{
                                    top: absoluteRowIndex * rowHeight,
                                    height: rowHeight,
                                }}
                            >
                                {columnsState.current.slice(startColumn, endColumn).map((col, colIndex) => {
                                    const absoluteColIndex = startColumn + colIndex;
                                    const isCellSelected = isRowSelected && selectedCell?.column === absoluteColIndex;
                                    let dataType = col.dataType || resolveDataType(row[col.key], col.dataType);
                                    if (row[col.key] === undefined || row[col.key] === null) {
                                        dataType = "null";
                                    }

                                    let formattedValue: React.ReactNode = columnDataFormatter(row[col.key], col, settings.data_grid.null_value);
                                    if (typeof formattedValue === "string") {
                                        formattedValue = highlightText(formattedValue, searchState.current.text || "", theme);
                                    }

                                    return (
                                        <StyledCell
                                            key={colIndex}
                                            className={
                                                "DataGrid-cell" +
                                                (isCellSelected ? " Mui-selected" : "") +
                                                (isCellSelected && isFocused ? " Mui-focused" : "") +
                                                (" " + columnDataTypeClassMap[dataType] || "")
                                            }
                                            style={{
                                                width: col.width || 150,
                                                left: columnsState.columnLeft(absoluteColIndex),
                                            }}
                                            onClick={() => handleCellClick(absoluteRowIndex, absoluteColIndex)}
                                            rowHeight={rowHeight}
                                            paddingX={cellPaddingX}
                                            paddingY={cellPaddingY}
                                            dataType={dataType}
                                            colorsEnabled={mode === "defined" ? settings.data_grid.colors_enabled : true}
                                        >
                                            {formattedValue}
                                        </StyledCell>
                                    );
                                })}
                            </StyledRow>
                        );
                    })}
                </StyledRowsContainer>
                {footerVisible && (
                    <StyledFooter
                        style={{ width: columnsState.totalWidth, height: rowHeight * 2 }}
                        className="DataGrid-footer"
                    >
                        {columnsState.current.slice(startColumn, endColumn).map((col, colIndex) => {
                            const dataType = col.dataType || resolveDataType(summaryRow[col.key], col.dataType);
                            let operationLabel = "";
                            if (summaryOperation && summaryOperation?.[col.key] !== null) {
                                operationLabel = summaryOperationDisplayMap[summaryOperation[col.key]!] || "";
                            }

                            return (
                                <React.Fragment key={colIndex}>
                                    <StyledFooterCell
                                        className={`DataGrid-footerCell ${columnDataTypeClassMap[dataType] || ""}`}
                                        style={{
                                            width: col.width || 150,
                                            left: columnsState.columnLeft(startColumn + colIndex),
                                            textAlign: "center",
                                            fontSize: "0.8em",
                                            color: "gray",
                                        }}
                                        rowHeight={rowHeight}
                                        paddingX={cellPaddingX}
                                        paddingY={cellPaddingY}
                                        dataType={dataType}
                                    >
                                        {operationLabel}
                                    </StyledFooterCell>
                                    <StyledFooterCell
                                        className={`DataGrid-footerCell ${columnDataTypeClassMap[dataType] || ""}`}
                                        style={{
                                            width: col.width || 150,
                                            left: columnsState.columnLeft(startColumn + colIndex),
                                            top: rowHeight + 1,
                                        }}
                                        rowHeight={rowHeight}
                                        paddingX={cellPaddingX}
                                        paddingY={cellPaddingY}
                                        dataType={dataType}
                                    >
                                        {valueToString(summaryRow[col.key], col.dataType)}
                                    </StyledFooterCell>
                                </React.Fragment>
                            );
                        })}
                    </StyledFooter>
                )}
            </StyledTableContainer>
        </StyledTable>
    );
};