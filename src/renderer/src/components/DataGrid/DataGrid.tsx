import { alpha, darken, lighten, styled, useTheme } from "@mui/material";
import { useSetting } from "@renderer/contexts/SettingsContext";
import { useFocus } from "@renderer/hooks/useFocus";
import { useScrollSync } from "@renderer/hooks/useScrollSync";
import { useSearchState } from "@renderer/hooks/useSearchState";
import calculateTextWidth from "@renderer/utils/canvas";
import clsx from "@renderer/utils/clsx";
import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"; // Dodaj import useMemo
import { useTranslation } from "react-i18next";
import { ColumnBaseType, columnBaseTypes, compareValuesByType, resolvePrimitiveType, toBaseType, valueToString } from "../../../../../src/api/db";
import { ActionManager } from "../CommandPalette/ActionManager";
import { CommandManager } from "../CommandPalette/CommandManager";
import CommandPalette, { highlightText } from "../CommandPalette/CommandPalette";
import Tooltip from "../Tooltip";
import LoadingOverlay from "../useful/LoadingOverlay";
import * as actions from "./actions";
import { createDataGridCommands } from "./DataGridCommands";
import { ColumnDefinition, DataGridActionContext, DataGridContext, DataGridStatus, summaryOperationDisplayMap, summaryOperationToBaseTypeMap, TableCellPosition } from "./DataGridTypes";
import { calculateSummary, calculateVisibleColumns, calculateVisibleRows, columnDataFormatter, displayMaxLengh, footerCaptionHeightFactor, scrollToCell } from "./DataGridUtils";
import { filterToString, isColumnFilter, useColumnFilterState } from "./useColumnsFilterState";
import { useColumnsGroup } from "./useColumnsGroup";
import { isSameColumnsSet, useColumnsState } from "./useColumnsState";
import useRowSelection from "./useRowSelection";

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
})<{}>(
    ({ }) => ({
        position: "relative",
        display: "flex",
        height: "100%",
        width: "100%",
        userSelect: "none", // Wyłączenie zaznaczania tekstu
    })
);

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
})<{}>(
    ({ theme }) => ({
        fontWeight: "bold",
        textAlign: "left",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        position: "absolute",
        userSelect: "none", // Wyłączenie zaznaczania tekstu
        boxSizing: "border-box",
        height: "100%",
        padding: 'var(--dg-cell-py) var(--dg-cell-px)',
        lineHeight: "1rem",
        alignContent: "center",
        borderRadius: 0, // Ustawienie zaokrąglenia na 0
        alignItems: "center",
        "&:not(:last-of-type)": {
            borderRight: `1px solid ${theme.palette.divider}`, // Dodanie lewego borderu z wyjątkiem pierwszego
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
        '&.active-column': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
        },
        '&.row-number-cell': {
            backgroundColor: theme.palette.background.table.container,
        },
    })
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
    slot: "iconContainer",
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
})<{}>(
    ({ }) => ({
        position: "relative",
        overflow: "auto",
        width: "100%",
        height: "100%",
        userSelect: "none",
        borderRadius: 0,
        outline: "none",
    })
);

const StyledRowsContainer = styled("div", {
    name: "DataGrid",
    slot: "rowsContainer",
})({
    position: "relative",
    willChange: "transform",
    transform: "translateZ(0)", // promuje do warstwy GPU przy scrollu
});

const StyledRow = styled("div", {
    name: "DataGrid",
    slot: "row",
})(({ theme }) => ({
    display: "flex",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    backgroundColor: theme.palette.background.table.container,
    willChange: "transform", // było: "transform, top"
    //transition: "background-color 0.2s ease", // Płynna zmiana koloru tła
    //backgroundColor: theme.palette.background.table.container,
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
        backgroundColor: theme.palette.background.table.selected,
    },
}));

const StyledCell = styled("div", {
    name: "DataGrid",
    slot: "cell",
})<{}>(
    ({ theme }) => ({
        overflow: "hidden",
        whiteSpace: "pre",
        textOverflow: "ellipsis",
        position: "absolute",
        userSelect: "none",
        boxSizing: "border-box",
        height: "100%",
        padding: 'var(--dg-cell-py) var(--dg-cell-px)',
        lineHeight: "1rem",
        alignContent: "center",
        alignItems: "center",
        zIndex: 1,
        color: "inherit",
        willChange: "transform", // GPU-friendly dla translate3d
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
        "&:not(:last-of-type)": {
            borderRight: `1px solid ${theme.palette.divider}`, // Dodanie prawego borderu z wyjątkiem ostatniego
        },
        "&:hover": {
            backgroundColor: theme.palette.action.hover, // Efekt hover
        },
        '&.active-column': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
        },
        '&.active-row': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
        },
        "&.active-cell": {
            outline: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            outlineOffset: -2,
        },
        "&.focused": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: -2,
        },
        '&.row-number-cell': {
            backgroundColor: theme.palette.background.table.container,
            '.selected &': {
                backgroundColor: theme.palette.background.table.selected,
            },
            fontWeight: "bold",
            borderBottom: `1px solid ${theme.palette.divider}`,
        },
        borderBottom: `1px solid transparent`,
        '.selected &': {
            borderBottom: `1px solid ${theme.palette.divider}`,
        },
    })
);

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
})<{}>(
    ({ theme }) => ({
        fontWeight: "bold",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        position: "absolute",
        userSelect: "none", // Wyłączenie zaznaczania tekstu
        boxSizing: "border-box",
        height: "100%",
        padding: 'var(--dg-cell-py) var(--dg-cell-px)',
        lineHeight: "1rem",
        alignContent: "center",
        borderRadius: 0, // Ustawienie zaokrąglenia na 0
        alignItems: "center",
        flexDirection: "column",
        textAlign: "center",
        color: "gray",
        "&:not(:last-of-type)": {
            borderRight: `1px solid ${theme.palette.divider}`, // Dodanie prawego borderu z wyjątkiem ostatniego
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
        '&.active-column': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
        },
        '&.row-number-cell': {
            backgroundColor: theme.palette.background.table.container,
        },
    })
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

const StyledGrow = styled('div', {
    name: "DataGrid",
    slot: "grow",
})(({ }) => ({
    display: "flex",
    flexGrow: 1,
}));

const StyledLabel = styled('span', {
    name: "DataGrid",
    slot: "label",
})(({ }) => ({
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "block",
    maxWidth: "100%",
}));

export const DataGrid = <T extends object>({
    columns,
    data,
    mode = "defined",
    columnsResizable = true,
    overscanRowCount = 2,
    columnRowNumber,
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
    const containerRef = useRef<HTMLDivElement | null>(null);
    const commandManager = useRef<CommandManager<DataGridActionContext<T>> | null>(null);
    const actionManager = useRef<ActionManager<DataGridActionContext<T>> | null>(null);
    const isFocused = useFocus(containerRef);
    const [null_value] = useSetting("dborg", "data_grid.null_value");
    const [colors_enabled] = useSetting<boolean>("dborg", `data_grid.${mode}.colors_enabled`);
    const [active_highlight] = useSetting<boolean>("dborg", "data_grid.active_highlight");
    const [dataState, setDataState] = useState<T[] | null>(null);
    const searchState = useSearchState();
    const { scrollTop, scrollLeft } = useScrollSync(containerRef, !!loading);
    const [containerHeight, setContainerHeight] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerWidthRef = useRef(0);
    const containerHeightRef = useRef(0);
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

    const [rowNumberColumnWidth, setRowNumberColumnWidth] = useState(50); // Domyślna szerokość kolumny z numerami wierszy
    const columnsState = useColumnsState(columns, mode, autoSaveId, onSaveColumnsState, onRestoreColumnsState, rowNumberColumnWidth);
    const [openCommandPalette, setOpenCommandPalette] = useState(false);
    const [commandPalettePrefix, setCommandPalettePrefix] = useState<string>("");
    const [selectedCell, setSelectedCell] = useState<TableCellPosition | null>(null);
    const selectedCellRef = useRef<TableCellPosition | null>(null);
    const [adjustWidthExecuted, setAdjustWidthExecuted] = useState(false);
    const previousStatusRef = useRef<DataGridStatus | null>(null);
    const previousStatusStringRef = useRef<string | null>(null);
    const { selectedRows, toggleRowSelection, setSelectedRows } = useRowSelection();
    const [fontFamily] = useSetting("ui", mode === "data" ? "monospaceFontFamily" : "fontFamily");
    const [settingFontSize] = useSetting<number>("dborg", `data_grid.${mode}.font_size`);
    const [settingRowNumberColumn] = useSetting<boolean>("dborg", `data_grid.${mode}.row_number_column`);
    const [showRowNumberColumn, setShowRowNumberColumn] = useState(columnRowNumber ?? settingRowNumberColumn); // Dodano stan
    const [userData, setUserData] = useState<Record<string, any>>({});
    const columnsRef = useRef<ColumnDefinition[]>(columns);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollStopTimer = useRef<number | null>(null);
    const [fontSize, setFontSize] = useState(settingFontSize);

    useImperativeHandle(ref, () => dataGridActionContext);

    console.count("DataGrid render");

    const classes = React.useMemo(() => {
        return clsx(
            `mode-${mode}`,
            colors_enabled && 'color-enabled',
        );
    }, [mode, colors_enabled]);

    useEffect(() => {
        setFontSize(settingFontSize);
    }, [settingFontSize]);

    const rowHeight = useMemo(() => {
        return Math.round((fontSize * 1.3) + cellPaddingY * 2);
    }, [fontSize, cellPaddingY]);

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
            //groupingColumns.clearColumns();
            searchState.resetSearch();
            //filterColumns.clearFilters();
            //columnsState.resetHiddenColumns();
            updateSelectedCell({ row: 0, column: 0 });
        }
    }, [columns]);

    const filteredDataState = React.useMemo<T[]>(() => {
        console.debug("DataGrid derive filteredDataState (memo)");
        let resultSet: T[] = [...(dataState || [])];

        // Filtry kolumn
        resultSet = filterColumns.filterData(resultSet, columnsState.current);

        // Grupowanie (tylko w trybie 'data')
        if (mode === "data") {
            resultSet = groupingColumns.groupData(resultSet, columnsState.current);
        }

        // Wyszukiwanie
        if (searchState.current.text) {
            const queryParts = (searchState.current.caseSensitive
                ? searchState.current.text
                : searchState.current.text.toLowerCase())
                .split(' ')
                .filter(Boolean);

            resultSet = resultSet.filter((row) => {
                const matchesQuery = queryParts.every((part) =>
                    Object.values(row).some((value) => {
                        if (value === null || value === undefined) return false;
                        const cellValue = searchState.current.caseSensitive
                            ? value.toString()
                            : value.toString().toLowerCase();

                        if (searchState.current.wholeWord) {
                            return cellValue.split(/\s+/).includes(part);
                        }
                        return cellValue.includes(part);
                    })
                );
                return searchState.current.exclude ? !matchesQuery : matchesQuery;
            });
        }

        // Sortowanie wielokolumnowe
        const sortedColumns = columnsState.current
            .filter(c => c.sortDirection)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map(col => ({
                key: col.key,
                sortDirection: col.sortDirection!,
                dataType: col.dataType,
                summary: col.summary,
                grouped: groupingColumns.isInGroup(col.key),
            }));

        if (sortedColumns.length) {
            resultSet.sort((a, b) => {
                for (const col of sortedColumns) {
                    const va = (a as any)[col.key];
                    const vb = (b as any)[col.key];
                    if (va === vb) continue;
                    const cmp = compareValuesByType(
                        va, vb,
                        (col.summary !== undefined && col.grouped)
                            ? (summaryOperationToBaseTypeMap[col.summary] ?? col.dataType)
                            : col.dataType
                    );
                    if (cmp !== 0) return col.sortDirection === "asc" ? cmp : -cmp;
                }
                return 0;
            });
        }

        return resultSet;
    }, [
        dataState,
        searchState.current,
        columnsState.stateChanged,
        groupingColumns.columns,
        filterColumns.activeFilters,
        mode
    ]);

    useEffect(() => {
        console.debug("DataGrid row correction");
        // Upewnij się, że zaznaczony wiersz nie wykracza poza odfiltrowane rekordy
        if (selectedCellRef.current && selectedCellRef.current.row !== undefined && selectedCellRef.current.row >= filteredDataState.length) {
            updateSelectedCell(filteredDataState.length > 0 ? { row: filteredDataState.length - 1, column: selectedCellRef.current.column ?? 0 } : null);
        }
    }, [filteredDataState.length]);

    const summaryRow = React.useMemo<Record<string, any>>(() => {
        if (!columnsState.anySummarized) return {};
        console.debug("DataGrid derive summaryRow (memo)");
        const dataForSummary = selectedRows.length > 0
            ? selectedRows.map(i => filteredDataState[i]).filter(Boolean)
            : filteredDataState;
        return calculateSummary(dataForSummary, columnsState.current);
    }, [
        filteredDataState,
        selectedRows,
        columnsState.stateChanged,
        columnsState.anySummarized
    ]);

    useEffect(() => {
        console.debug("DataGrid save columns layout");
        columnsState.saveColumnsLayout();
    }, [filterColumns.filters, groupingColumns.columns]);

    useEffect(() => {
        console.debug("DataGrid update status bar");
        if (onChange) {
            const timeoutRef = setTimeout(() => {
                const value = selectedCell?.row !== undefined && selectedCell.column !== undefined
                    ? filteredDataState[selectedCell.row][columnsState.current[selectedCell.column].key]
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
                    valueLength: value ? (value as any)?.length ?? null : null,
                };

                // Jeśli chcesz pominąć nieistotne pole:
                // const { valueLength, ...stablePart } = newStatus;
                // const newStatusString = JSON.stringify(stablePart);

                const newStatusString = JSON.stringify(newStatus);

                if (previousStatusStringRef.current !== newStatusString) {
                    onChange(newStatus);
                    previousStatusRef.current = newStatus;
                    previousStatusStringRef.current = newStatusString;
                }
            }, 200);

            return () => clearTimeout(timeoutRef);
        }
        return;
    }, [
        filteredDataState,
        selectedCell?.row,
        selectedCell?.column,
        loading,
        showRowNumberColumn,
        columnsState.current,
        selectedRows,
        isFocused,
        openCommandPalette,
        onChange,
        active,
        dataState,
        columnsState.anySummarized
    ]);

    const updateSelectedCell = React.useCallback((cell: TableCellPosition | null) => {
        console.debug("DataGrid update selected cell", cell);
        if (!cell) {
            if (selectedCellRef.current !== null) {
                setSelectedCell(null);
                selectedCellRef.current = null;
            }
            return;
        }
        const maxRow = filteredDataState.length - 1;
        const maxCol = columnsState.current.length - 1;
        if (maxRow < 0 || maxCol < 0) {
            if (selectedCellRef.current !== null) {
                setSelectedCell(null);
                selectedCellRef.current = null;
            }
            return;
        }
        const row = Math.max(0, Math.min(cell.row, maxRow));
        const column = Math.max(0, Math.min(cell.column, maxCol));
        const prev = selectedCellRef.current;
        if (prev && prev.row === row && prev.column === column) {
            return; // no-op
        }
        const next = { row, column };
        requestAnimationFrame(() => {
            setSelectedCell(next);
            selectedCellRef.current = next;
            requestAnimationFrame(() => {
                if (containerRef.current) {
                    scrollToCell(containerRef.current, next.row, next.column, columnsState.columnLeft(next.column), rowHeight, columnsState.current, columnsState.anySummarized, rowNumberColumnWidth);
                }
            });
        });
    }, [filteredDataState.length, columnsState.columnLeft, rowHeight, columnsState.current.length]);

    // Ustawienie selectedCell na pierwszy wiersz po odfiltrowaniu
    // useEffect(() => {
    //     console.debug("DataGrid set initial selected cell");
    //     if (filteredDataState.length > 0) {
    //         if (!selectedCellRef.current) {
    //             updateSelectedCell({ row: 0, column: 0 });
    //         }
    //     } else if (selectedCellRef.current) {
    //         updateSelectedCell(null);
    //     }
    // }, [filteredDataState.length, rowHeight, columnsState.current, updateSelectedCell]);

    const totalHeight = filteredDataState.length * rowHeight;
    const { startRow, endRow } = calculateVisibleRows(filteredDataState.length, rowHeight, containerHeight, scrollTop, containerRef);
    const { startColumn, endColumn } = calculateVisibleColumns(scrollLeft, containerWidth, columnsState.current);
    const overscanFrom = Math.max(startRow - overscanRowCount, 0);
    const overscanTo = Math.min(endRow + overscanRowCount, filteredDataState.length);

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

    useEffect(() => {
        if (showRowNumberColumn) {
            console.debug("DataGrid adjust row number column width");
            if (containerRef.current) {
                const maxRowNumber = filteredDataState.length; // Maksymalny numer wiersza
                const text = maxRowNumber.toString(); // Tekst do obliczenia szerokości
                const calculatedWidth = Math.max(calculateTextWidth(text, fontSize, fontFamily, 'bold') ?? 30, 30);
                setRowNumberColumnWidth(calculatedWidth + cellPaddingX * 2 + 4); // Minimalna szerokość to 50px
            }
        }
        else {
            setRowNumberColumnWidth(0);
        }
    }, [filteredDataState.length, fontSize, fontFamily, showRowNumberColumn, cellPaddingX]);

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
            updateSelectedCell({ row, column });
        },
        getFontSize: () => fontSize,
        setFontSize: (height) => {
            setFontSize(height); // Funkcja do zmiany fontSize
            if (containerRef.current && selectedCell) {
                const { row, column } = selectedCell;
                scrollToCell(containerRef.current, row, column, columnsState.columnLeft(column), height, columnsState.current, columnsState.anySummarized, rowNumberColumnWidth);
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
            let canceled = false;
            requestAnimationFrame(() => {
                if (canceled) return;
                actionManager.current!.executeAction(actions.AdjustWidthToData_ID, dataGridActionContext);
                setAdjustWidthExecuted(false);
            });
            return () => { canceled = true; };
        }
        return;
    }, [adjustWidthExecuted, actionManager.current, filteredDataState.length, mode, startRow]);

    useEffect(() => {
        console.debug("DataGrid mount effect");
        const container = containerRef.current;

        // Obserwator rozmiaru kontenera
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect) {
                    if (containerWidthRef.current !== entry.contentRect.width) {
                        containerWidthRef.current = entry.contentRect.width;
                        setContainerWidth(entry.contentRect.width);
                    }
                    if (containerHeightRef.current !== entry.contentRect.height) {
                        containerHeightRef.current = entry.contentRect.height;
                        setContainerHeight(entry.contentRect.height);
                    }
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
            actionManager.current.registerAction(actions.ResetFontSize(settingFontSize));
            actionManager.current.registerAction(actions.CopyValueToClipboard());
            actionManager.current.registerAction(actions.GeneralReset());
            actionManager.current.registerAction(actions.SearchReset());
            actionManager.current.registerAction(actions.AdjustWidthToData());
            actionManager.current.registerAction(actions.SwitchColumnSort());
            actionManager.current.registerAction(actions.ToggleShowRowNumberColumn(!settingRowNumberColumn));
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

    const handleCellClick = (rowIndex: number, columnIndex: number) => {
        updateSelectedCell({ row: rowIndex, column: columnIndex });
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
    };

    const onScroll = React.useCallback(() => {
        if (!isScrolling) setIsScrolling(true);
        if (scrollStopTimer.current) window.clearTimeout(scrollStopTimer.current);
        scrollStopTimer.current = window.setTimeout(() => setIsScrolling(false), 80);
    }, [isScrolling]);

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

    // Delegacja klików z kontenera wierszy
    const onRowsContainerMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const el = (e.target as HTMLElement).closest<HTMLElement>('[data-r][data-c]');
        if (!el) {
            // if (!selectedCell && filteredDataState.length > 0) {
            //     updateSelectedCell({ row: 0, column: 0 });
            // }
            return;
        }
        const r = Number(el.dataset.r);
        const c = Number(el.dataset.c);
        updateSelectedCell({ row: r, column: c });
    }, [updateSelectedCell]);

    function focusHandler(): void {
        setTimeout(() => {
            if (!selectedCellRef.current && filteredDataState.length > 0) {
                updateSelectedCell({ row: 0, column: 0 });
            }
        }, 10);
    }

    return (
        <StyledTable
            className={clsx("DataGrid-table", classes)}
            style={{
                ['--dg-cell-px' as any]: `${cellPaddingX}px`,
                ['--dg-cell-py' as any]: `${cellPaddingY}px`,
                fontFamily: fontFamily,
                fontSize: fontSize,
            }}
        >

            {loading && (
                <LoadingOverlay
                    label={loading.trim() === "" ? t("loading---", "Loading...") : loading}
                    onCancelLoading={onCancelLoading}
                />
            )}

            <StyledTableContainer
                ref={containerRef}
                className={clsx("DataGrid-tableContainer", classes)}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onScroll={onScroll}
                onFocus={focusHandler}
                style={{
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
                    className={clsx("DataGrid-header", classes)}
                    style={{
                        width: columnsState.totalWidth,
                        height: rowHeight
                    }}
                >
                    {showRowNumberColumn && (filteredDataState.length > 0) && (
                        <StyledHeaderCell
                            key="row-number-cell"
                            className={clsx(
                                "DataGrid-headerCell",
                                "row-number-cell",
                                classes,
                            )}
                            style={{
                                position: 'sticky',
                                zIndex: 5,
                                width: rowNumberColumnWidth,
                                left: 0,
                                textAlign: 'center',
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                borderRight: `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            #
                        </StyledHeaderCell>
                    )}
                    {Array.from({ length: endColumn - startColumn }, (_, localColIndex) => {
                        const absoluteColIndex = startColumn + localColIndex;
                        const col = columnsState.current[absoluteColIndex];
                        return (
                            <StyledHeaderCell
                                key={localColIndex}
                                className={clsx(
                                    "DataGrid-headerCell",
                                    classes,
                                    mode === "data" && active_highlight && absoluteColIndex === selectedCell?.column && 'active-column',
                                )}
                                style={{
                                    width: col.width || 150,
                                    left: columnsState.columnLeft(absoluteColIndex),
                                }}
                                onClick={() => {
                                    if (!resizingColumn) {
                                        updateSelectedCell({ row: selectedCell?.row ?? startRow, column: absoluteColIndex });
                                        dataGridActionContext.sortData(absoluteColIndex);
                                    }
                                }}
                            >
                                <StyledHeaderCellContent
                                    className={clsx(
                                        "DataGrid-headerCellContent",
                                        classes,
                                        mode === "data" && active_highlight && startColumn + localColIndex === selectedCell?.column && 'active-column',
                                    )}
                                >
                                    <StyledLabel>
                                        {col.label}
                                    </StyledLabel>
                                    <StyledGrow />
                                    {(filterColumns.getFilter(col.key, true) !== null) && (
                                        <Tooltip
                                            title={t("filter-description", 'Filter {{column}} {{filter}}', {
                                                column: col.label,
                                                filter: filterToString(filterColumns.getFilter(col.key, true)!)
                                            })}
                                        >
                                            <StyledIconContainer
                                                onClick={(event) => {
                                                    filterColumns.filterActive(col.key, false)
                                                    event.stopPropagation();
                                                }}
                                            >
                                                <theme.icons.Filter />
                                            </StyledIconContainer>
                                        </Tooltip>
                                    )}
                                    {groupingColumns.isInGroup(col.key) && (
                                        <Tooltip
                                            title={t("grouped-column", "Grouped column")}
                                        >
                                            <StyledIconContainer
                                                onClick={(event) => {
                                                    groupingColumns.toggleColumn(col.key);
                                                    event.stopPropagation();
                                                }}
                                            >
                                                <span className="group-icon">[]</span>
                                            </StyledIconContainer>
                                        </Tooltip>
                                    )}
                                    {columnsState.showHiddenColumns && (
                                        <Tooltip
                                            title={t("toggle-hidden", "Toggle hidden")}
                                        >
                                            <StyledIconContainer
                                                onClick={(event) => {
                                                    columnsState.toggleHidden(col.key);
                                                    event.stopPropagation();
                                                }}
                                            >
                                                {col.hidden ? <theme.icons.VisibilityOff /> : <theme.icons.Visibility />}
                                            </StyledIconContainer>
                                        </Tooltip>
                                    )}
                                    {col.sortDirection && (
                                        <Tooltip
                                            title={t("toggle-sort", "Toggle sort")}
                                        >
                                            <StyledIconContainer>
                                                <span className="sort-icon">{col.sortDirection === "asc" ? "▲" : "▼"}</span>
                                                {col.sortOrder !== undefined && <span className="sort-order">{col.sortOrder}</span>}
                                            </StyledIconContainer>
                                        </Tooltip>
                                    )}
                                </StyledHeaderCellContent>
                                {(col.resizable ?? columnsResizable) && (
                                    <div
                                        className="resize-handle"
                                        onMouseDown={(event) => handleMouseDown(startColumn + localColIndex, event)}
                                    />
                                )}
                            </StyledHeaderCell>
                        )
                    })}
                </StyledHeader>
                {filteredDataState.length === 0 && (
                    <StyledNoRowsInfo className={clsx("DataGrid-noRowsInfo", classes)}>
                        {t("no-rows-to-display", "No rows to display")}
                    </StyledNoRowsInfo>
                )}
                <StyledRowsContainer
                    style={{
                        height: totalHeight,
                        width: columnsState.totalWidth,
                    }}
                    className={clsx("DataGrid-rowsContainer", classes)}
                    onMouseDown={onRowsContainerMouseDown} // delegacja
                >
                    {Array.from({ length: overscanTo - overscanFrom }, (_, localRowIndex) => {
                        const absoluteRowIndex = overscanFrom + localRowIndex;
                        const row = filteredDataState[absoluteRowIndex];
                        const isRowActive = selectedCell?.row === absoluteRowIndex;
                        const rowClass = absoluteRowIndex % 2 === 0 ? "even" : "odd";

                        return (
                            <StyledRow
                                key={localRowIndex}
                                className={clsx(
                                    'DataGrid-row',
                                    classes,
                                    rowClass,
                                    selectedRows.includes(absoluteRowIndex) && "selected",
                                    mode === "data" && active_highlight && absoluteRowIndex === selectedCell?.row && 'active-row',
                                )}
                                style={{
                                    top: absoluteRowIndex * rowHeight,
                                    height: rowHeight,
                                }}
                            >
                                {showRowNumberColumn && (filteredDataState.length > 0) && (
                                    <StyledCell
                                        key="row-number-cell"
                                        className={clsx(
                                            "DataGrid-cell",
                                            'row-number-cell',
                                            classes,
                                            'align-center',
                                            mode === "data" && active_highlight && absoluteRowIndex === selectedCell?.row && 'active-row',
                                        )}
                                        style={{
                                            position: 'sticky',
                                            zIndex: 5,
                                            width: rowNumberColumnWidth,
                                            left: 0,
                                        }}
                                        onClick={(event) => handleRowNumberCellClick(event, absoluteRowIndex)}
                                    >
                                        {absoluteRowIndex + 1}
                                    </StyledCell>
                                )}
                                {Array.from({ length: endColumn - startColumn }, (_, localColIndex) => {
                                    const absoluteColIndex = startColumn + localColIndex;
                                    const col = columnsState.current[absoluteColIndex];
                                    const isCellActive = isRowActive && selectedCell?.column === absoluteColIndex;
                                    const columnDataType = (col.summary && groupingColumns.columns.length
                                        ? summaryOperationToBaseTypeMap[col.summary]
                                        : undefined) ?? col.dataType ?? 'string';

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
                                            null_value,
                                            { maxLength: displayMaxLengh }
                                        );
                                        if (typeof formattedValue === "string" && (searchState.current.text || '').trim() !== '') {
                                            formattedValue = highlightText(formattedValue, searchState.current.text || "", theme);
                                        }
                                    } catch {
                                        formattedValue = "{error}";
                                        styleDataType = "error";
                                    }

                                    return (
                                        <StyledCell
                                            key={localColIndex}
                                            data-r={absoluteRowIndex} // potrzebne do delegacji
                                            data-c={absoluteColIndex} // potrzebne do delegacji
                                            className={clsx(
                                                "DataGrid-cell",
                                                classes,
                                                isCellActive && "active-cell",
                                                isCellActive && isFocused && "focused",
                                                `data-type-${styleDataType}`,
                                                styleDataType === 'number' ? 'align-end' : styleDataType === 'boolean' ? 'align-center' : 'align-start',
                                                mode === "data" && active_highlight && absoluteColIndex === selectedCell?.column && 'active-column',
                                                mode === "data" && active_highlight && absoluteRowIndex === selectedCell?.row && 'active-row',
                                            )}
                                            style={{
                                                width: col.width || 150,
                                                left: columnsState.columnLeft(absoluteColIndex),
                                            }}
                                        >
                                            {formattedValue}
                                        </StyledCell>
                                    );
                                })}
                            </StyledRow>
                        );
                    })}
                </StyledRowsContainer>
                {columnsState.anySummarized && (
                    <StyledFooter
                        style={{
                            width: columnsState.totalWidth,
                            height: (rowHeight * footerCaptionHeightFactor) + rowHeight
                        }}
                        className={clsx("DataGrid-footer", classes)}
                    >
                        {showRowNumberColumn && (filteredDataState.length > 0) && (
                            <StyledFooterCell
                                key="row-number-cell"
                                className={clsx(
                                    'DataGrid-footerCell',
                                    "row-number-cell",
                                    classes,
                                )}
                                style={{
                                    position: 'sticky',
                                    zIndex: 5,
                                    width: rowNumberColumnWidth,
                                    height: "100%",
                                    left: 0,
                                    borderTop: `1px solid ${theme.palette.divider}`,
                                    borderRight: `1px solid ${theme.palette.divider}`,
                                }}
                            />
                        )}
                        {Array.from({ length: endColumn - startColumn }, (_, localColIndex) => {
                            const absoluteColIndex = startColumn + localColIndex;
                            const col = columnsState.current[absoluteColIndex];
                            let styleDataType: ColumnBaseType | 'null' = toBaseType((col.summary ? summaryOperationToBaseTypeMap[col.summary] : undefined) ?? col.dataType);

                            return (
                                <StyledFooterCell
                                    key={col.key}
                                    className={clsx(
                                        'DataGrid-footerCell',
                                        classes,
                                        `data-type-${styleDataType}`,
                                        styleDataType === 'number' ? 'align-end' : styleDataType === 'boolean' ? 'align-center' : 'align-start',
                                        mode === "data" && active_highlight && startColumn + localColIndex === selectedCell?.column && 'active-column',
                                    )}
                                    style={{
                                        width: col.width || 150,
                                        left: columnsState.columnLeft(startColumn + localColIndex),
                                    }}
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
                                                classes,
                                                `data-type-${styleDataType}`,
                                                styleDataType === 'number' ? 'align-end' : styleDataType === 'boolean' ? 'align-center' : 'align-start',
                                                mode === "data" && active_highlight && startColumn + localColIndex === selectedCell?.column && 'active-column',
                                            )}
                                        >
                                            <StyledLabel>
                                                {summaryOperationDisplayMap[col.summary] || ""}
                                            </StyledLabel>
                                            <StyledGrow />
                                            <Tooltip
                                                title={t("summary-off", "Toggle summary off")}
                                            >
                                                <StyledIconContainer
                                                    onClick={(event) => {
                                                        columnsState.setSummary(col.key);
                                                        event.stopPropagation();
                                                    }}
                                                >
                                                    <theme.icons.Close />
                                                </StyledIconContainer>
                                            </Tooltip>
                                        </StyledFooterCellHeader>,
                                        <StyledFooterCellContent
                                            key="content"
                                            className={clsx(
                                                "DataGrid-footerCellContent",
                                                classes,
                                                `data-type-${styleDataType}`,
                                                styleDataType === 'number' ? 'align-end' : styleDataType === 'boolean' ? 'align-center' : 'align-start',
                                                mode === "data" && active_highlight && startColumn + localColIndex === selectedCell?.column && 'active-column',
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
};
