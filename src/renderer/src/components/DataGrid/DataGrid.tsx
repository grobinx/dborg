import React, { useRef, useState, useEffect, useImperativeHandle } from "react"; // Dodaj import useMemo
import { Box, darken, lighten, Stack, styled, useTheme } from "@mui/material";
import { CommandManager } from "../CommandPalette/CommandManager";
import { ActionManager } from "../CommandPalette/ActionManager";
import CommandPalette from "../CommandPalette/CommandPalette";
import * as actions from "./actions";
import { columnDataTypeClassMap, ColumnDefinition, DataGridActionContext, DataGridContext, DataGridStatus, SummaryOperation, summaryOperationDisplayMap, summaryOperationToBaseTypeMap, TableCellPosition } from "./DataGridTypes";
import { useSetting } from "@renderer/contexts/SettingsContext";
import { calculateSummary, calculateVisibleColumns, calculateVisibleRows, columnDataFormatter, displayMaxLengh, footerCaptionHeightFactor, scrollToCell } from "./DataGridUtils";
import { createDataGridCommands } from "./DataGridCommands";
import { highlightText } from "../CommandPalette/CommandPalette"; // Import funkcji highlightText
import LoadingOverlay from "../useful/LoadingOverlay";
import useRowSelection from "./useRowSelection";
import { isSameColumnsSet, useColumnsState } from "./useColumnsState";
import { useSearchState } from "@renderer/hooks/useSearchState";
import { useScrollSync } from "@renderer/hooks/useScrollSync";
import { useFocus } from "@renderer/hooks/useFocus";
import { useTranslation } from "react-i18next";
import { ColumnBaseType, columnBaseTypes, compareValuesByType, resolvePrimitiveType, toBaseType, valueToString } from "../../../../../src/api/db";
import { useColumnsGroup } from "./useColumnsGroup";
import { filterToString, isColumnFilter, useColumnFilterState } from "./useColumnsFilterState";
import Tooltip from "../Tooltip";
import calculateTextWidth from "@renderer/utils/canvas";
import clsx from "@renderer/utils/clsx";

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
    shouldForwardProp: (prop) => prop !== 'paddingX' && prop !== 'paddingY',
})<{ paddingX: number; paddingY: number }>(
    ({ theme, paddingX, paddingY }) => {

        return {
            fontWeight: "bold",
            textAlign: "left",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            position: "absolute",
            userSelect: "none", // Wyłączenie zaznaczania tekstu
            boxSizing: "border-box",
            height: "100%",
            padding: `${paddingY}px ${paddingX}px`,
            lineHeight: "1rem",
            alignContent: "center",
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
    gap: 2,
});

const StyledIconContainer = styled('div', {
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
        backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)", // Kolor tła przy najechaniu myszką
    },
    "&.selected": {
        backgroundColor: theme.palette.action.selected, // Kolor tła dla zaznaczonego wiersza
    },
}));

const StyledCell = styled("div", {
    name: "DataGrid",
    slot: "cell",
    shouldForwardProp: (prop) => prop !== 'paddingX' && prop !== 'paddingY',
})<{
    paddingX: number;
    paddingY: number;
}>(
    ({ theme, paddingX, paddingY }) => {

        return {
            overflow: "hidden",
            whiteSpace: "pre",
            textOverflow: "ellipsis",
            position: "absolute",
            userSelect: "none", // Wyłączenie zaznaczania tekstu
            boxSizing: "border-box",
            height: "100%",
            padding: `${paddingY}px ${paddingX}px`,
            lineHeight: "1rem",
            alignContent: "center",
            alignItems: "center",
            zIndex: 1,
            color: "inherit",
            '&.color-enabled': {
                ...columnBaseTypes.reduce((acc, color) => {
                    acc[`&.data-type-${color}`] = {
                        color: theme.palette?.dataType?.[color],
                    };
                    return acc;
                }, {}),
                '&.data-type-null': {
                    color: theme.palette?.dataType?.["null"],
                },
            },
            "&.align-start": {
                textAlign: "left",
            },
            "&.align-end": {
                textAlign: "right",
            },
            "&.align-center": {
                textAlign: "center",
            },
            "&.selected": {
                backgroundColor: theme.palette.action.selected,
            },
            "&.focused": {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: -2,
            },
            "&:not(:first-of-type)": {
                borderLeft: `1px solid ${theme.palette.divider}`, // Dodanie lewego borderu z wyjątkiem pierwszego
            },
            "&:hover": {
                backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)", // Efekt hover
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
    flexDirection: "column",
    zIndex: 3,
    backgroundColor: theme.palette.background.table.footer,
    color: theme.palette.table.contrastText,
}));

const StyledFooterCell = styled('div', {
    name: "DataGrid",
    slot: "footerCell",
    shouldForwardProp: (prop) => prop !== 'paddingX' && prop !== 'paddingY',
})<{
    paddingX: number;
    paddingY: number;
}>(
    ({ theme, paddingX, paddingY }) => {

        return {
            fontWeight: "bold",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            position: "absolute",
            userSelect: "none", // Wyłączenie zaznaczania tekstu
            boxSizing: "border-box",
            height: "100%",
            padding: `${paddingY}px ${paddingX}px`,
            lineHeight: "1rem",
            alignContent: "center",
            borderRadius: 0, // Ustawienie zaokrąglenia na 0
            alignItems: "center",
            flexDirection: "column",
            textAlign: "center",
            color: "gray",
            "&:not(:first-of-type)": {
                borderLeft: `1px solid ${theme.palette.divider}`, // Dodanie lewego borderu z wyjątkiem pierwszego
            },
            "&.align-start": {
                textAlign: "left",
            },
            "&.align-end": {
                textAlign: "right",
            },
            "&.align-center": {
                textAlign: "center",
            },
        };
    }
);

const StyledFooterCellHeader = styled('div', {
    name: "DataGrid",
    slot: "footerCellHeader",
})({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    fontSize: "0.8em",
});

const StyledFooterCellContent = styled('div', {
    name: "DataGrid",
    slot: "footerCellContent",
})({
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    width: "100%",
    "&.align-start": {
        textAlign: "left",
    },
    "&.align-end": {
        textAlign: "right",
    },
    "&.align-center": {
        textAlign: "center",
    },
});

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
    const [null_value] = useSetting("dborg", "data_grid.null_value");
    const [colors_enabled] = useSetting<boolean>("dborg", "data_grid.colors_enabled");
    const [rowHeight, setRowHeight] = useState(initialRowHeight);
    const [dataState, setDataState] = useState<T[] | null>(null);
    const searchState = useSearchState();
    const { scrollTop, scrollLeft } = useScrollSync(containerRef, !!loading);
    const [containerHeight, setContainerHeight] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [resizingColumn, setResizingColumn] = useState<number | null>(null);
    const filterColumns = useColumnFilterState();
    const groupingColumns = useColumnsGroup();

    const onSaveColumnsState = () => {
        return {
            filters: filterColumns.filters,
            grouping: groupingColumns.columns,
        };
    };

    const onRestoreColumnsState = (data: Record<string, any> | null) => {
        filterColumns.clearFilters();
        if (data?.filters) {
            Object.entries(data.filters).forEach(([key, filter]) => {
                if (isColumnFilter(filter)) {
                    filterColumns.setFilter(key, filter.operator, filter.not, filter.values);
                    filterColumns.filterActive(key, filter.active);
                }
            });
        }
        groupingColumns.clearColumns();
        if (data?.grouping && Array.isArray(data.grouping)) {
            data.grouping.forEach((grouping: string) => {
                groupingColumns.toggleColumn(grouping);
            });
        }
        if (!data) {
            setTimeout(() => {
                setAdjustWidthExecuted(true); // Wymuś ponowne przeliczenie szerokości kolumn
            }, 100);
        }
    };

    const columnsState = useColumnsState(columns, mode, autoSaveId, onSaveColumnsState, onRestoreColumnsState);
    const [openCommandPalette, setOpenCommandPalette] = useState(false);
    const [commandPalettePrefix, setCommandPalettePrefix] = useState<string>("");
    const [selectedCell, setSelectedCell] = useState<TableCellPosition | null>(null);
    const [adjustWidthExecuted, setAdjustWidthExecuted] = useState(false);
    const [filteredDataState, setFilteredDataState] = useState<T[]>([]);
    const [summaryRow, setSummaryRow] = useState<Record<string, any>>({});
    const [rowNumberColumnWidth, setRowNumberColumnWidth] = useState(50); // Domyślna szerokość kolumny z numerami wierszy
    const [showRowNumberColumn, setShowRowNumberColumn] = useState(columnRowNumber); // Dodano stan
    const previousStatusRef = useRef<DataGridStatus | null>(null);
    const { selectedRows, toggleRowSelection, setSelectedRows } = useRowSelection();
    const [fontFamily, setFontFamily] = useState<string>("inherit");
    const [fontSize, setFontSize] = useState<number>(16);
    const [userData, setUserData] = useState<Record<string, any>>({});
    const columnsRef = useRef<ColumnDefinition[]>(columns);

    useImperativeHandle(ref, () => dataGridActionContext);

    console.count("DataGrid render");

    useEffect(() => {
        console.debug("DataGrid mounted");
        setDataState(data);
        setSelectedRows([]);
        //setSelectedCell(null);
    }, [data]);

    useEffect(() => {
        // Sprawdź, czy zmieniły się kolumny
        console.debug("Columns changed");
        if (!isSameColumnsSet(
            columns.map(col => ({ key: col.key, dataType: col.dataType })),
            columnsRef.current.map(col => ({ key: col.key, dataType: col.dataType }))
        )) {
            columnsRef.current = columns;
            setSummaryRow({});
            //groupingColumns.clearColumns();
            searchState.resetSearch();
            //filterColumns.clearFilters();
            //columnsState.resetHiddenColumns();
            setSelectedCell({ row: 0, column: 0 });
        }
    }, [columns]);

    useEffect(() => {
        console.debug("DataGrid filtering");
        let resultSet: T[] = [...(dataState || [])];

        resultSet = filterColumns.filterData(resultSet, columnsState.current);

        if (mode === "data") {
            resultSet = groupingColumns.groupData(resultSet, columnsState.current);
        }

        // Filtrowanie na podstawie queryData, wholeWordQuery i caseSensitiveQuery
        if (searchState.current.text) {
            const queryParts = searchState.current.caseSensitive
                ? searchState.current.text.split(' ').filter(Boolean) // Bez konwersji na małe litery
                : searchState.current.text.toLowerCase().split(' ').filter(Boolean);

            resultSet = resultSet.filter((row) => {
                const matchesQuery = queryParts.every((part) =>
                    Object.values(row).some((value) => {
                        if (value === null || value === undefined) return false; // Jeśli wartość jest null/undefined, pomiń

                        const cellValue = searchState.current.caseSensitive
                            ? value.toString() // Bez konwersji na małe litery
                            : value.toString().toLowerCase();

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
            .filter((col) => col.sortDirection) // Uwzględnij tylko kolumny z sortDirection
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)); // Posortuj według sortOrder

        if (sortedColumns.length > 0) {
            resultSet.sort((a, b) => {
                for (const col of sortedColumns) {
                    const valueA = a[col.key];
                    const valueB = b[col.key];

                    if (valueA === valueB) continue; // Jeśli wartości są równe, przejdź do następnej kolumny

                    const comparisonResult = compareValuesByType(
                        valueA, valueB,
                        col.summary !== undefined
                            ? (summaryOperationToBaseTypeMap[col.summary] ?? col.dataType)
                            : col.dataType);
                    if (comparisonResult !== 0) {
                        return col.sortDirection === "asc" ? comparisonResult : -comparisonResult;
                    }
                }
                return 0; // Jeśli wszystkie wartości są równe, nie zmieniaj kolejności
            });
        }

        setFilteredDataState(resultSet);
    }, [dataState, searchState.current, columnsState.stateChanged, groupingColumns.columns, filterColumns.activeFilters]);

    useEffect(() => {
        console.debug("DataGrid row correction");
        // Upewnij się, że zaznaczony wiersz nie wykracza poza odfiltrowane rekordy
        if (selectedCell?.row !== undefined && selectedCell.row >= filteredDataState.length) {
            updateSelectedCell(filteredDataState.length > 0 ? { row: filteredDataState.length - 1, column: selectedCell.column ?? 0 } : null);
        }
    }, [filteredDataState.length, selectedCell?.row]);

    useEffect(() => {
        console.debug("DataGrid summary");
        if (columnsState.anySummarized) {
            const dataForSummary = selectedRows.length > 0
                ? selectedRows.map((rowIndex) => filteredDataState[rowIndex]) // Dane tylko z zaznaczonych wierszy
                : filteredDataState; // Wszystkie dane, jeśli brak zaznaczenia

            setSummaryRow(calculateSummary(dataForSummary, columnsState.current));
        }
    }, [filteredDataState, selectedRows, columnsState.stateChanged]);

    useEffect(() => {
        console.debug("DataGrid save columns layout");
        columnsState.saveColumnsLayout();
    }, [filterColumns.filters, groupingColumns.columns]);

    useEffect(() => {
        console.debug("DataGrid update status bar");
        if (onChange) {
            const timeoutRef = setTimeout(() => {
                const value = selectedCell?.row !== undefined && selectedCell.column !== undefined ?
                    filteredDataState[selectedCell.row][columnsState.current[selectedCell.column].key]
                    : null;
                const newStatus: DataGridStatus = {
                    isActive: !!active || isFocused || openCommandPalette,
                    isLoading: !!loading,
                    isSummaryVisible: columnsState.anySummarized,
                    isRowNumberVisible: showRowNumberColumn,
                    columnCount: columnsState.current.length,
                    rowCount: filteredDataState.length,
                    position: selectedCell,
                    dataRowCount: dataState?.length || 0,
                    selectedRowCount: selectedRows.length,
                    column: selectedCell?.column !== undefined ? columnsState.current[selectedCell.column] || null : null,
                    valueType: resolvePrimitiveType(value),
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
        console.debug("DataGrid set initial selected cell");
        if (filteredDataState.length > 0) {
            const selected = updateSelectedCell(selectedCell);
            if (containerRef.current) {
                scrollToCell(
                    containerRef.current,
                    selected?.row ?? 0,
                    selected?.column ?? 0,
                    columnsState.columnLeft(selected?.column ?? 0),
                    rowHeight,
                    columnsState.current,
                    columnsState.anySummarized);
            }
        } else {
            updateSelectedCell(null); // Jeśli brak wyników, resetuj zaznaczenie
        }
    }, [filteredDataState.length, rowHeight, columnsState.current, selectedCell]);

    const totalHeight = filteredDataState.length * rowHeight;
    const { startRow, endRow } = calculateVisibleRows(filteredDataState.length, rowHeight, containerHeight, scrollTop, containerRef);
    const { startColumn, endColumn } = calculateVisibleColumns(scrollLeft, containerWidth, columnsState.current);

    useEffect(() => {
        console.debug("DataGrid update font");
        if (containerRef.current) {
            const style = window.getComputedStyle(containerRef.current);
            setFontFamily(style.fontFamily || "inherit");
            setFontSize(parseFloat(style.fontSize) || 16);
        }
    }, [rowHeight, mode]);

    useEffect(() => {
        console.debug("DataGrid row click");
        if (onRowClick) {
            if (selectedCell?.row !== undefined) {
                onRowClick(filteredDataState[selectedCell.row]);
            }
            else {
                onRowClick(undefined);
            }
        }
    }, [filteredDataState, selectedCell?.row]);

    const updateSelectedCell = React.useCallback((cell: TableCellPosition | null): TableCellPosition | null => {
        console.debug("DataGrid update selected cell", cell);
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

        setSelectedCell(prev => (prev?.row !== row || prev?.column !== column ? { row, column } : prev));
        return { row, column };
    }, [filteredDataState.length, columnsState.current.length]);

    useEffect(() => {
        if (showRowNumberColumn) {
            console.debug("DataGrid adjust row number column width");
            if (containerRef.current) {
                const maxRowNumber = filteredDataState.length; // Maksymalny numer wiersza
                const text = maxRowNumber.toString(); // Tekst do obliczenia szerokości
                const calculatedWidth = Math.max(calculateTextWidth(text, fontSize, fontFamily) ?? 40, 40);
                setRowNumberColumnWidth(calculatedWidth + cellPaddingX * 2); // Minimalna szerokość to 50px
            }
        }
    }, [filteredDataState.length, fontSize, showRowNumberColumn]);

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
                scrollToCell(containerRef.current, position.row, position.column, columnsState.columnLeft(position.column), rowHeight, columnsState.current, columnsState.anySummarized);
            }
        },
        getRowHeight: () => rowHeight,
        setRowHeight: (height) => {
            setRowHeight(height); // Funkcja do zmiany rowHeight
            if (containerRef.current && selectedCell) {
                const { row, column } = selectedCell;
                scrollToCell(containerRef.current, row, column, columnsState.columnLeft(column), height, columnsState.current, columnsState.anySummarized);
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
        openCommandPalette: (prefix, query) => {
            setCommandPalettePrefix(prefix);
            setOpenCommandPalette(true);
            if (prefix === "*") {
                searchState.current.text = query ?? "";
            }
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
        getSearchText: () => searchState.current.text ?? "", // Zwrócenie queryData
        sortData: (columnIndex: number) => columnsState.sortColumn(columnIndex),
        resetSorting: () => columnsState.resetSorting(),
        getSummaryOperation: () => {
            if (!selectedCell) return;
            const column = columnsState.current[selectedCell?.column];
            return column?.summary;
        },
        setSummaryOperation: (operation) => {
            if (!selectedCell) return;
            const column = columnsState.current[selectedCell?.column];
            if (column) {
                if (column.summary === operation) {
                    columnsState.setSummary(column.key);
                } else {
                    columnsState.setSummary(column.key, operation);
                }
            }
        },
        setShowRowNumberColumn: (show) => {
            setShowRowNumberColumn(show); // Ustawienie stanu dla kolumny z numerami wierszy
            if (!show) {
                setSelectedRows([]); // Resetuj zaznaczenie, jeśli kolumna z numerami wierszy jest ukryta
            }
        },
        isShowRowNumberColumn: () => showRowNumberColumn, // Zwrócenie stanu dla kolumny z numerami wierszy
        clearSummary: () => {
            columnsState.resetSummary();
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
        toggleGroupColumn() {
            if (!selectedCell || mode !== "data") return;
            const columnKey = columnsState.current[selectedCell.column ?? 0]?.key;
            groupingColumns.toggleColumn(columnKey);
        },
        isGroupedColumn: () => {
            if (!selectedCell || mode !== "data") return false;
            const columnKey = columnsState.current[selectedCell.column ?? 0]?.key;
            return groupingColumns.isInGroup(columnKey);
        },
        clearGrouping: () => {
            groupingColumns.clearColumns();
        },
        setFilter: (operator, not, values) => {
            if (!selectedCell) return;
            const columnKey = columnsState.current[selectedCell.column]?.key;
            filterColumns.setFilter(columnKey, operator, not, values);
        },
        getFilter: () => {
            if (!selectedCell) return null;
            const columnKey = columnsState.current[selectedCell.column]?.key;
            return filterColumns.getFilter(columnKey);
        },
        clearFilter: () => {
            if (!selectedCell) return;
            const columnKey = columnsState.current[selectedCell.column]?.key;
            filterColumns.clearFilter(columnKey);
        },
        clearFilters: () => {
            filterColumns.clearFilters();
        },
        filterActive: (set) => {
            if (!selectedCell) return;
            const columnKey = columnsState.current[selectedCell.column]?.key;
            return filterColumns.filterActive(columnKey, set);
        },
        toggleHideColumn: () => {
            if (!selectedCell) return;
            const columnKey = columnsState.current[selectedCell.column]?.key;
            columnsState.toggleHidden(columnKey);
        },
        isColumnHidden: () => {
            if (!selectedCell) return false;
            return columnsState.current[selectedCell.column]?.hidden || false;
        },
        toggleShowHiddenColumns: () => {
            columnsState.toggleShowHiddenColumns();
        },
        isShowHiddenColumns: () => columnsState.showHiddenColumns,
        resetHiddenColumns: () => {
            columnsState.resetHiddenColumns();
        }
    }

    useEffect(() => {
        if (mode === "data" && adjustWidthExecuted && actionManager.current && filteredDataState.length > 0 && startRow >= 0) {
            console.debug("DataGrid adjust width to data");
            actionManager.current.executeAction(actions.AdjustWidthToData_ID, dataGridActionContext);
            setAdjustWidthExecuted(false); // Resetuj flagę po wykonaniu akcji
        }
    }, [adjustWidthExecuted, actionManager.current, filteredDataState.length, mode, startRow]);

    useEffect(() => {
        console.debug("DataGrid mount effect");
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
            actionManager.current.registerActionGroup(actions.FilterColumnDataGroup());

            actionManager.current.registerAction(actions.IncreaseFontSize());
            actionManager.current.registerAction(actions.DecreaseFontSize());
            actionManager.current.registerAction(actions.IncreaseColumnWidth());
            actionManager.current.registerAction(actions.DecreaseColumnWidth());
            actionManager.current.registerAction(actions.MoveColumnToEnd());
            actionManager.current.registerAction(actions.MoveColumnFromEnd());
            actionManager.current.registerAction(actions.ResetFontSize(initialRowHeight));
            actionManager.current.registerAction(actions.CopyValueToClipboard());
            actionManager.current.registerAction(actions.GeneralReset());
            actionManager.current.registerAction(actions.SearchReset());
            actionManager.current.registerAction(actions.AdjustWidthToData());
            actionManager.current.registerAction(actions.SwitchColumnSort());
            actionManager.current.registerAction(actions.ToggleShowRowNumberColumn());
            actionManager.current.registerAction(actions.ResetColumnsLayout());
            actionManager.current.registerAction(actions.ToggleShowHiddenColumns());
            actionManager.current.registerAction(actions.ToggleHideColumn());
            if (mode === "data") {
                actionManager.current.registerAction(actions.ToggleGroupColumn());
            }

            actionManager.current.registerAction(actions.OpenCommandPalette());
            actionManager.current.registerAction(actions.GotoColumn());
            actionManager.current.registerAction(actions.SearchData());
            actionManager.current.registerAction(actions.SummaryFooter());
            actionManager.current.registerAction(actions.FilterColumnData());
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
            scrollToCell(containerRef.current, position.row, position.column, columnsState.columnLeft(position.column), rowHeight, columnsState.current, columnsState.anySummarized);
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
            columnsState.anySummarized
        );
    };

    useEffect(() => {
        console.debug("DataGrid mouse move and up listeners");
        if (resizingColumn !== null) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizingColumn]);

    const content = (
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

            <StyledTableContainer
                ref={containerRef}
                className="DataGrid-tableContainer"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                rowHeight={rowHeight}
                paddingY={cellPaddingY}
                onFocus={handleFocus}
                style={{
                    fontFamily: (mode === "data" ? theme.typography.monospace.fontFamily : "inherit"),
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
                    searchText={commandPalettePrefix === "*" ? searchState.current.text ?? "" : ""}
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
                                <Stack flexGrow={1} />
                                {(filterColumns.getFilter(col.key, true) !== null) && (
                                    <StyledIconContainer
                                        onClick={(event) => {
                                            filterColumns.filterActive(col.key, false)
                                            event.stopPropagation();
                                        }}
                                    >
                                        <Tooltip
                                            title={t("filter-description", 'Filter {{column}} {{filter}}', {
                                                column: col.label,
                                                filter: filterToString(filterColumns.getFilter(col.key, true)!)
                                            })}
                                        >
                                            <theme.icons.Filter />
                                        </Tooltip>
                                    </StyledIconContainer>
                                )}
                                {groupingColumns.isInGroup(col.key) && (
                                    <StyledIconContainer
                                        onClick={(event) => {
                                            groupingColumns.toggleColumn(col.key);
                                            event.stopPropagation();
                                        }}
                                    >
                                        <Tooltip
                                            title={t("grouped-column", "Grouped column")}
                                        >
                                            <span className="group-icon">[]</span>
                                        </Tooltip>
                                    </StyledIconContainer>
                                )}
                                {columnsState.showHiddenColumns && (
                                    <StyledIconContainer
                                        onClick={(event) => {
                                            columnsState.toggleHidden(col.key);
                                            event.stopPropagation();
                                        }}
                                    >
                                        <Tooltip
                                            title={t("toggle-hidden", "Toggle hidden")}
                                        >
                                            {col.hidden ? <theme.icons.VisibilityOff /> : <theme.icons.Visibility />}
                                        </Tooltip>
                                    </StyledIconContainer>
                                )}
                                {col.sortDirection && (
                                    <StyledIconContainer>
                                        <span className="sort-icon">{col.sortDirection === "asc" ? "▲" : "▼"}</span>
                                        {col.sortOrder !== undefined && <span className="sort-order">{col.sortOrder}</span>}
                                    </StyledIconContainer>
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
                        let columnLeft = columnsState.columnLeft(startColumn);

                        return (
                            <StyledRow
                                key={absoluteRowIndex}
                                className={clsx(
                                    'DataGrid-row',
                                    rowClass,
                                    selectedRows.includes(absoluteRowIndex) && "selected"
                                )}
                                style={{
                                    top: absoluteRowIndex * rowHeight,
                                    height: rowHeight,
                                }}
                            >
                                {columnsState.current.slice(startColumn, endColumn).map((col, colIndex) => {
                                    const absoluteColIndex = startColumn + colIndex;
                                    const isCellSelected = isRowSelected && selectedCell?.column === absoluteColIndex;
                                    const columnDataType = (col.summary && groupingColumns.columns.length ? summaryOperationToBaseTypeMap[col.summary] : undefined) ?? col.dataType ?? 'string';
                                    let styleDataType: ColumnBaseType | "null" = toBaseType(columnDataType);
                                    if (row[col.key] === undefined || row[col.key] === null) {
                                        styleDataType = "null";
                                    }
                                    if (!groupingColumns.isInGroup(col.key) && (!col.summary) && groupingColumns.columns.length && Array.isArray(row[col.key])) {
                                        styleDataType = "null";
                                    }

                                    let formattedValue: React.ReactNode;

                                    try {
                                        formattedValue = columnDataFormatter(
                                            row[col.key],
                                            columnDataType,
                                            col.formatter,
                                            null_value, {
                                            maxLength: displayMaxLengh,
                                            //display: (searchState.current.text ?? '').trim() === ''
                                        });
                                        if (typeof formattedValue === "string") {
                                            formattedValue = highlightText(formattedValue, searchState.current.text || "", theme);
                                        }
                                    }
                                    catch (error: Error | any) {
                                        formattedValue = "{error}";
                                        styleDataType = "error";
                                    }

                                    const result = (
                                        <StyledCell
                                            key={colIndex}
                                            className={clsx(
                                                "DataGrid-cell",
                                                isCellSelected && "selected",
                                                isCellSelected && isFocused && "focused",
                                                `data-type-${styleDataType}`,
                                                (mode === "defined" ? colors_enabled : true) && 'color-enabled',
                                                styleDataType === 'number' ? 'align-end' : styleDataType === 'boolean' ? 'align-center' : 'align-start'
                                            )}
                                            style={{
                                                width: col.width || 150,
                                                left: columnLeft,
                                            }}
                                            onClick={() => handleCellClick(absoluteRowIndex, absoluteColIndex)}
                                            paddingX={cellPaddingX}
                                            paddingY={cellPaddingY}
                                        >
                                            {formattedValue}
                                        </StyledCell>
                                    );

                                    columnLeft += col.width || 150;

                                    return result;
                                })}
                            </StyledRow>
                        );
                    })}
                </StyledRowsContainer>
                {columnsState.anySummarized && (
                    <StyledFooter
                        style={{ width: columnsState.totalWidth, height: (rowHeight * footerCaptionHeightFactor) + rowHeight }}
                        className="DataGrid-footer"
                    >
                        {columnsState.current.slice(startColumn, endColumn).map((col, colIndex) => {
                            const absoluteColIndex = startColumn + colIndex;
                            let styleDataType: ColumnBaseType | 'null' = toBaseType((col.summary ? summaryOperationToBaseTypeMap[col.summary] : undefined) ?? col.dataType);

                            return (
                                <StyledFooterCell
                                    key={colIndex}
                                    className={clsx(
                                        'DataGrid-footerCell',
                                        `data-type-${styleDataType}`,
                                        styleDataType === 'number' ? 'align-end' : styleDataType === 'boolean' ? 'align-center' : 'align-start'
                                    )}
                                    style={{
                                        width: col.width || 150,
                                        left: columnsState.columnLeft(startColumn + colIndex),
                                    }}
                                    paddingX={cellPaddingX}
                                    paddingY={cellPaddingY}
                                    onClick={() => {
                                        handleCellClick(selectedCell?.row ?? 0, absoluteColIndex);
                                        actionManager.current?.executeAction(actions.SummaryFooter_ID, dataGridActionContext);
                                    }}
                                >
                                    {(col.summary !== undefined) && [
                                        <StyledFooterCellHeader
                                            key="header"
                                            className={clsx(
                                                "DataGrid-footerCellHeader",
                                                `data-type-${styleDataType}`,
                                                styleDataType === 'number' ? 'align-end' : styleDataType === 'boolean' ? 'align-center' : 'align-start'
                                            )}
                                        >
                                            {summaryOperationDisplayMap[col.summary] || ""}
                                            <StyledIconContainer
                                                onClick={(event) => {
                                                    columnsState.setSummary(col.key);
                                                    event.stopPropagation();
                                                }}
                                            >
                                                <Tooltip
                                                    title={t("summary-off", "Toggle summary off")}
                                                >
                                                    <theme.icons.Close />
                                                </Tooltip>
                                            </StyledIconContainer>
                                        </StyledFooterCellHeader>,
                                        <StyledFooterCellContent
                                            key="content"
                                            className={clsx(
                                                "DataGrid-footerCellContent",
                                                `data-type-${styleDataType}`,
                                                styleDataType === 'number' ? 'align-end' : styleDataType === 'boolean' ? 'align-center' : 'align-start'
                                            )}
                                        >
                                            {valueToString(summaryRow[col.key], (col.summary ? summaryOperationToBaseTypeMap[col.summary] : undefined) ?? col.dataType, { display: true, maxLength: displayMaxLengh })}
                                        </StyledFooterCellContent>
                                    ]}
                                </StyledFooterCell>
                            );
                        })}
                    </StyledFooter>
                )}
            </StyledTableContainer>
        </StyledTable>
    );

    return content;
};