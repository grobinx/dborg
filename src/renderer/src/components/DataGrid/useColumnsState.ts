import { useState, useEffect, useRef, useMemo } from "react";
import { produce } from "immer";
import { ColumnDefinition, SummaryOperation } from "./DataGridTypes";
import { DataGridMode } from "./DataGrid";
import { ColumnDataType, generateHash, areTypesEqual, typeToString } from "../../../../../src/api/db";

interface UseColumnsState {
    current: ColumnDefinition[];
    totalWidth: number;
    /** zmienił się kolumny, typ danych lub sortDirection */
    stateChanged: boolean;
    layoutChanged: boolean;
    showHiddenColumns: boolean;
    anySummarized: boolean;
    saveColumnsLayout: () => void;
    sortColumn: (displayColumnIndex: number) => void;
    resetColumns: () => void;
    moveColumn: (fromDiplayIndex: number, toDisplayIndex: number) => void;
    updateColumn: (displayIndex: number, updatedValues: Partial<ColumnDefinition>) => void;
    resetSorting: () => void;
    columnLeft: (displayColumnIndex: number) => number;
    toggleHidden: (columnKey: string) => void;
    toggleShowHiddenColumns: () => void;
    resetHiddenColumns: () => void;
    setSummary: (columnKey: string, operation?: SummaryOperation) => void;
    resetSummary: () => void;
}

// Pomocnicza funkcja do generowania klucza układu
function getColumnsLayoutKey(columns: ColumnDefinition[], autoSaveId?: string): string {
    const keyString = columns
        .slice()
        .sort((a, b) => {
            return (a.key || "").localeCompare(b.key || "");
        })
        .map((col) => `${col.key}:${typeToString(col.dataType)}`)
        .join("|");
    return "datagrid-layout-" + generateHash(keyString + (autoSaveId ? "|" + autoSaveId : ""));
}

// Zapisz tylko szerokość, kolejność i datę modyfikacji
function storeColumnsLayout(columns: ColumnDefinition[], key: string, useSession: boolean, onSave?: () => Record<string, any>) {
    const layout = columns.map((col) => ({
        key: col.key,
        dataType: col.dataType,
        width: col.width,
        hidden: col.hidden,
        sortDirection: col.sortDirection,
        sortOrder: col.sortOrder,
        label: useSession ? col.label : undefined,
        summary: col.summary,
    }));
    const toStore = {
        layout,
        modified: new Date().toISOString(),
        data: onSave ? onSave() : {}
    };
    const storage = useSession ? sessionStorage : localStorage;
    storage.setItem(key, JSON.stringify(toStore));
}

// Odtwórz szerokość i kolejność, jeśli zestaw kolumn się zgadza
function restoreColumnsLayout(
    initialColumns: ColumnDefinition[],
    key: string,
    useSession: boolean,
    onRestore?: (data: Record<string, any> | null) => void,
): ColumnDefinition[] {
    const storage = useSession ? sessionStorage : localStorage;
    const saved = storage.getItem(key);

    if (!saved) {
        if (onRestore) {
            onRestore(null);
        }
        return initialColumns;
    }

    try {
        const parsed = JSON.parse(saved);
        const layout = parsed.layout ?? parsed; // dla kompatybilności wstecznej

        if (
            !isSameColumnsSet(
                initialColumns.map(col => ({ key: col.key, dataType: col.dataType })),
                layout.map((col: any) => ({ key: col.key, dataType: col.dataType }))
            )
        ) {
            if (onRestore) {
                onRestore(null);
            }
            return initialColumns;
        }
        else {
            if (onRestore) {
                onRestore(parsed.data ?? {});
            }
        }

        // Odtwórz kolejność i typ kolumny
        return layout.map((savedCol: ColumnDefinition) => {
            const orig = initialColumns.find(
                (col) =>
                    col.key === savedCol.key && areTypesEqual(col.dataType, savedCol.dataType)
            );
            const result = orig
                ? {
                    ...orig,
                    width: savedCol.width ?? orig.width,
                    hidden: savedCol.hidden ?? orig.hidden,
                    sortDirection: savedCol.sortDirection ?? orig.sortDirection,
                    sortOrder: savedCol.sortOrder ?? orig.sortOrder,
                    label: savedCol.label ?? orig.label,
                    summary: savedCol.summary ?? orig.summary,
                }
                : orig!;
            return result;
        });
    } catch {
        return initialColumns;
    }
}

export function isSameColumnsSet(
    a: { key: string; dataType: ColumnDataType }[],
    b: { key: string; dataType: ColumnDataType }[]
): boolean {
    if (a.length !== b.length) return false;
    const aSet = new Set(a.map(col => `${col.key}:${typeToString(col.dataType)}`));
    const bSet = new Set(b.map(col => `${col.key}:${typeToString(col.dataType)}`));
    if (aSet.size !== bSet.size) return false;
    for (const item of aSet) {
        if (!bSet.has(item)) return false;
    }
    return true;
}

function cleanupOldColumnLayouts() {
    const now = Date.now();
    const monthMs = 30 * 24 * 60 * 60 * 1000; // 30 dni w ms

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("datagrid-layout-")) {
            try {
                const value = localStorage.getItem(key);
                if (!value) continue;
                const parsed = JSON.parse(value);
                const modified = parsed.modified ? Date.parse(parsed.modified) : NaN;
                if (isNaN(modified) || now - modified > monthMs) {
                    localStorage.removeItem(key);
                }
            } catch {
                // Jeśli nie da się sparsować, usuń (np. stary format)
                localStorage.removeItem(key);
            }
        }
    }
}

export const useColumnsState = (
    initialColumns: ColumnDefinition[],
    mode: DataGridMode,
    autoSaveId?: string,
    onSave?: () => Record<string, any>,
    onRestore?: (data: Record<string, any> | null) => void
): UseColumnsState => {
    const layoutKey = useMemo(() => getColumnsLayoutKey(initialColumns, autoSaveId), [initialColumns]);
    const [columnsState, setColumnsState] = useState<ColumnDefinition[]>(() =>
        restoreColumnsLayout(initialColumns, layoutKey, mode === "data", onRestore)
    );
    const [totalWidth, setTotalWidth] = useState(() =>
        columnsState.reduce((sum, col) => sum + (col.width || 150), 0)
    );
    const prevColumnsStateRef = useRef<ColumnDefinition[]>(columnsState);
    const [stateChanged, setstateChanged] = useState(false);
    const [layoutChanged, setLayoutChanged] = useState(false);
    const [showHiddenColumns, setShowHiddenColumns] = useState(false);
    const [displayColumns, setDisplayColumns] = useState<ColumnDefinition[]>(() =>
        columnsState.filter(col => !col.hidden || showHiddenColumns)
    );
    const [anySummarized, setAnySummarized] = useState(
        columnsState.some(col => col.summary !== undefined)
    );

    // Funkcja do przełączania trybu pokazywania ukrytych kolumn
    const toggleShowHiddenColumns = () => {
        setShowHiddenColumns(prev => !prev);
    };

    // Zapisuj układ przy każdej zmianie columnsState
    useEffect(() => {
        if (
            isSameColumnsSet(
                columnsState.map(col => ({ key: col.key, dataType: col.dataType })),
                initialColumns.map(col => ({ key: col.key, dataType: col.dataType }))
            )
        ) {
            if (columnsState.length > 0) {
                storeColumnsLayout(columnsState, layoutKey, mode === "data", onSave);
            }
        }
    }, [columnsState, layoutKey, initialColumns, mode]);

    // Aktualizacja stanu kolumn i detekcja zmian
    useEffect(() => {
        const prevColumnsState = prevColumnsStateRef.current;

        const hasRelevantChanges = columnsState.some((col, index) => {
            const prevCol = prevColumnsState[index];
            return (
                col.key !== prevCol?.key ||
                col.dataType !== prevCol?.dataType ||
                col.sortDirection !== prevCol?.sortDirection ||
                col.summary !== prevCol?.summary
            );
        });

        if (hasRelevantChanges) {
            setstateChanged(prew => !prew);
        }

        prevColumnsStateRef.current = columnsState;
        setAnySummarized(
            columnsState.some(col => col.summary !== undefined)
        );
    }, [columnsState]);

    // Synchronizuj columnsState z initialColumns, jeśli zestaw kolumn się zmienił
    useEffect(() => {
        // Jeśli zestaw kolumn się zmienił (nie tylko kolejność/szerokość), zresetuj columnsState
        if (!isSameColumnsSet(
            columnsState.map(col => ({ key: col.key, dataType: col.dataType })),
            initialColumns.map(col => ({ key: col.key, dataType: col.dataType }))
        )) {
            setColumnsState(restoreColumnsLayout(initialColumns, layoutKey, mode === "data", onRestore));
            setLayoutChanged(true);
        } else {
            setLayoutChanged(false);
        }
    }, [initialColumns, layoutKey, mode, showHiddenColumns]);

    useEffect(() => {
        const newDisplayColumns = columnsState.filter(col => !col.hidden || showHiddenColumns);
        setDisplayColumns(newDisplayColumns);
    }, [showHiddenColumns, columnsState]);

    useEffect(() => {
        const newTotalWidth = displayColumns.reduce((sum, col) => sum + (col.width || 150), 0);
        setTotalWidth(newTotalWidth);
    }, [displayColumns]);

    // Funkcja do sortowania kolumny
    const sortColumn = (displayColumnIndex: number) => {
        setColumnsState((prevColumns) =>
            produce(prevColumns, (draft) => {
                // Pobierz klucz kolumny z displayColumns
                const columnKey = displayColumns[displayColumnIndex]?.key;
                if (!columnKey) return; // Jeśli klucz nie istnieje, zakończ

                // Znajdź kolumnę w columnsState na podstawie klucza
                const column = draft.find(col => col.key === columnKey);
                if (!column) return; // Jeśli kolumna nie istnieje, zakończ

                // Zmień sortDirection
                column.sortDirection =
                    column.sortDirection === undefined
                        ? "asc"
                        : column.sortDirection === "asc"
                            ? "desc"
                            : undefined;

                // Zmień sortOrder
                if (column.sortDirection === undefined) {
                    column.sortOrder = undefined;
                } else if (column.sortOrder === undefined) {
                    const maxSortOrder = Math.max(
                        ...draft
                            .filter((col) => col.sortOrder !== undefined && col.key !== columnKey)
                            .map((col) => col.sortOrder ?? 0),
                        0
                    );
                    column.sortOrder = maxSortOrder + 1;
                }

                // Aktualizuj sortOrder dla wszystkich kolumn
                const sortedColumns = draft
                    .filter((col) => col.sortOrder !== undefined)
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

                sortedColumns.forEach((col, index) => {
                    col.sortOrder = index + 1;
                });
            })
        );
    };

    // Funkcja do ukrywania/odkrywania kolumn
    const toggleHidden = (columnKey: string) => {
        setColumnsState(prevColumns => {
            return prevColumns.map(col => {
                if (col.key === columnKey) {
                    return { ...col, hidden: !col.hidden };
                }
                return col;
            });
        });
    };

    const resetHiddenColumns = () => {
        setColumnsState(prevColumns => {
            return prevColumns.map(col => {
                return { ...col, hidden: false };
            });
        });
    };

    // Funkcja do resetowania stanu kolumn
    const resetColumns = () => {
        setColumnsState(initialColumns);
    };

    // Funkcja do przenoszenia kolumn
    const moveColumn = (fromDisplayIndex: number, toDisplayIndex: number) => {
        setColumnsState(prevColumns =>
            produce(prevColumns, draft => {
                // Pobierz klucze kolumn z displayColumns
                const fromKey = displayColumns[fromDisplayIndex]?.key;
                const toKey = displayColumns[toDisplayIndex]?.key;

                // Sprawdź, czy klucze istnieją
                if (!fromKey || !toKey) return;

                // Znajdź indeksy w columnsState na podstawie kluczy
                const fromIndex = draft.findIndex(col => col.key === fromKey);
                const toIndex = draft.findIndex(col => col.key === toKey);

                // Sprawdź, czy indeksy są poprawne
                if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

                // Przenieś kolumnę w columnsState
                const [movedColumn] = draft.splice(fromIndex, 1);
                draft.splice(toIndex, 0, movedColumn);
            })
        );
    };

    // Funkcja do częściowej aktualizacji kolumny
    const updateColumn = (displayIndex: number, updatedValues: Partial<ColumnDefinition>) => {
        setColumnsState(prevColumns => 
            produce(prevColumns, draft => {
                // Pobierz klucz kolumny z displayColumns
                const columnKey = displayColumns[displayIndex]?.key;
                if (!columnKey) return; // Jeśli klucz nie istnieje, zakończ

                // Znajdź kolumnę w columnsState na podstawie klucza
                const column = draft.find(col => col.key === columnKey);
                if (column) {
                    Object.assign(column, updatedValues); // Zaktualizuj właściwości kolumny
                }
            })
        );
    };

    const saveColumnsLayout = () => {
        storeColumnsLayout(columnsState, layoutKey, mode === "data", onSave);
    };

    // Funkcja do resetowania sortowania
    const resetSorting = () => {
        setColumnsState(prevColumns =>
            produce(prevColumns, draft => {
                draft.forEach(column => {
                    column.sortDirection = undefined;
                    column.sortOrder = undefined;
                });
            })
        );
    };

    const columnLeft = (displayColumnIndex: number): number => {
        return displayColumns
            .slice(0, displayColumnIndex)
            .reduce((sum, col) => sum + (col.width || 150), 0);
    };

    const setSummary = (columnKey: string, operation?: SummaryOperation) => {
        setColumnsState(prevColumns =>
            produce(prevColumns, draft => {
                const column = draft.find(col => col.key === columnKey);
                if (column) {
                    column.summary = operation;
                }
            })
        );
    }

    const resetSummary = () => {
        setColumnsState(prevColumns =>
            produce(prevColumns, draft => {
                draft.forEach(col => {
                    col.summary = undefined;
                });
            })
        );
    };

    return {
        current: displayColumns,
        totalWidth,
        stateChanged,
        layoutChanged,
        showHiddenColumns,
        anySummarized,
        saveColumnsLayout,
        sortColumn,
        resetColumns,
        moveColumn,
        updateColumn,
        resetSorting,
        columnLeft,
        toggleHidden,
        toggleShowHiddenColumns,
        resetHiddenColumns,
        setSummary,
        resetSummary,
    };
};

cleanupOldColumnLayouts();