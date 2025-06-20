import { useState, useEffect, useRef, useMemo } from "react";
import { produce } from "immer";
import { ColumnDefinition } from "./DataGridTypes";
import { DataGridMode } from "./DataGrid";
import { ColumnBaseType, ColumnDataType } from "src/api/db";

interface UseColumnsState {
    current: ColumnDefinition[];
    totalWidth: number;
    stateChanged: boolean;
    sortColumn: (columnIndex: number) => void;
    resetColumns: () => void;
    moveColumn: (fromIndex: number, toIndex: number) => void;
    updateColumn: (columnIndex: number, updatedValues: Partial<ColumnDefinition>) => void;
    resetSorting: () => void;
    columnLeft: (columnIndex: number) => number;
}

// Funkcja do haszowania łańcuchów
function hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
}

// Pomocnicza funkcja do generowania klucza układu
function getColumnsLayoutKey(columns: ColumnDefinition[], autoSaveId?: string): string {
    const keyString = columns
        .slice()
        .sort((a, b) => {
            return (a.key || "").localeCompare(b.key || "");
        })
        .map((col) => `${col.key}:${col.dataType}`)
        .join("|");
    return "datagrid-layout-" + hashString(keyString + (autoSaveId ? "|" + autoSaveId : ""));
}

// Zapisz tylko szerokość, kolejność i datę modyfikacji
function saveColumnsLayout(columns: ColumnDefinition[], key: string, useSession: boolean) {
    const layout = columns.map((col) => ({
        key: col.key,
        dataType: col.dataType,
        width: col.width,
    }));
    const toStore = {
        layout,
        modified: new Date().toISOString(),
    };
    const storage = useSession ? sessionStorage : localStorage;
    storage.setItem(key, JSON.stringify(toStore));
}

// Odtwórz szerokość i kolejność, jeśli zestaw kolumn się zgadza
function restoreColumnsLayout(
    initialColumns: ColumnDefinition[],
    key: string,
    useSession: boolean
): ColumnDefinition[] {
    const storage = useSession ? sessionStorage : localStorage;
    const saved = storage.getItem(key);
    if (!saved) return initialColumns;
    try {
        const parsed = JSON.parse(saved);
        const layout = parsed.layout ?? parsed; // dla kompatybilności wstecznej

        if (
            !isSameColumnsSet(
                initialColumns.map(col => ({ key: col.key, dataType: col.dataType })),
                layout.map((col: any) => ({ key: col.key, dataType: col.dataType }))
            )
        ) {
            return initialColumns;
        }

        // Odtwórz kolejność i typ kolumny
        return layout.map((savedCol: any) => {
            const orig = initialColumns.find(
                (col) =>
                    col.key === savedCol.key && col.dataType === savedCol.dataType
            );
            return orig
                ? { ...orig, width: savedCol.width ?? orig.width }
                : orig!;
        });
    } catch {
        return initialColumns;
    }
}

function isSameColumnsSet(
    a: { key: string; dataType: ColumnDataType | ColumnBaseType | undefined }[],
    b: { key: string; dataType: ColumnDataType | ColumnBaseType | undefined }[]
): boolean {
    if (a.length !== b.length) return false;
    const aSet = new Set(a.map(col => `${col.key}:${col.dataType}`));
    const bSet = new Set(b.map(col => `${col.key}:${col.dataType}`));
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

export const useColumnsState = (initialColumns: ColumnDefinition[], mode: DataGridMode, autoSaveId?: string): UseColumnsState => {
    const layoutKey = useMemo(() => getColumnsLayoutKey(initialColumns, autoSaveId), [initialColumns]);
    const [columnsState, setColumnsState] = useState<ColumnDefinition[]>(() =>
        restoreColumnsLayout(initialColumns, layoutKey, mode === "data")
    );
    const [totalWidth, setTotalWidth] = useState(() =>
        columnsState.reduce((sum, col) => sum + (col.width || 150), 0)
    );
    const prevColumnsStateRef = useRef<ColumnDefinition[]>(columnsState);
    const [stateChanged, setstateChanged] = useState(false);

    // Zapisuj układ przy każdej zmianie columnsState
    useEffect(() => {
        if (
            isSameColumnsSet(
                columnsState.map(col => ({ key: col.key, dataType: col.dataType })),
                initialColumns.map(col => ({ key: col.key, dataType: col.dataType }))
            )
        ) {
            saveColumnsLayout(columnsState, layoutKey, mode === "data");
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
                col.sortDirection !== prevCol?.sortDirection
            );
        });

        setstateChanged(hasRelevantChanges);

        prevColumnsStateRef.current = columnsState;
    }, [columnsState]);

    useEffect(() => {
        const newTotalWidth = columnsState.reduce((sum, col) => sum + (col.width || 150), 0);
        setTotalWidth(newTotalWidth);
    }, [columnsState]);

    // Synchronizuj columnsState z initialColumns, jeśli zestaw kolumn się zmienił
    useEffect(() => {
        // Jeśli zestaw kolumn się zmienił (nie tylko kolejność/szerokość), zresetuj columnsState
        if (!isSameColumnsSet(
            columnsState.map(col => ({ key: col.key, dataType: col.dataType })),
            initialColumns.map(col => ({ key: col.key, dataType: col.dataType }))
        )) {
            setColumnsState(restoreColumnsLayout(initialColumns, layoutKey, mode === "data"));
        }
    }, [initialColumns, layoutKey, mode]);

    // Funkcja do sortowania kolumn
    const sortColumn = (columnIndex: number) => {
        setColumnsState((prevColumns) =>
            produce(prevColumns, (draft) => {
                const column = draft[columnIndex];

                column.sortDirection =
                    column.sortDirection === undefined
                        ? "asc"
                        : column.sortDirection === "asc"
                            ? "desc"
                            : undefined;

                if (column.sortDirection === undefined) {
                    column.sortOrder = undefined;
                } else if (column.sortOrder === undefined) {
                    const maxSortOrder = Math.max(
                        ...draft
                            .filter((_, index) => index !== columnIndex)
                            .map((col) => col.sortOrder ?? 0),
                        0
                    );
                    column.sortOrder = maxSortOrder + 1;
                }

                const sortedColumns = draft
                    .filter((col) => col.sortOrder !== undefined)
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

                sortedColumns.forEach((col, index) => {
                    col.sortOrder = index + 1;
                });
            })
        );
    };

    // Funkcja do resetowania stanu kolumn
    const resetColumns = () => {
        setColumnsState(initialColumns);
    };

    // Funkcja do przenoszenia kolumn
    const moveColumn = (fromIndex: number, toIndex: number) => {
        if (fromIndex !== toIndex) {
            setColumnsState((prevColumns) =>
                produce(prevColumns, (draft) => {
                    const [movedColumn] = draft.splice(fromIndex, 1);
                    draft.splice(toIndex, 0, movedColumn);
                })
            );
        }
    };

    // Funkcja do częściowej aktualizacji kolumny
    const updateColumn = (columnIndex: number, updatedValues: Partial<ColumnDefinition>) => {
        setColumnsState((prevColumns) =>
            produce(prevColumns, (draft) => {
                draft[columnIndex] = { ...draft[columnIndex], ...updatedValues };
            })
        );
    };

    // Funkcja do resetowania sortowania
    const resetSorting = () => {
        setColumnsState((prevColumns) =>
            produce(prevColumns, (draft) => {
                draft.forEach((column) => {
                    column.sortDirection = undefined;
                    column.sortOrder = undefined;
                });
            })
        );
    };

    const columnLeft = useMemo(() => {
        const cache = new Map<number, number>();

        return (columnIndex: number) => {
            if (cache.has(columnIndex)) {
                return cache.get(columnIndex)!;
            }

            const left = columnsState
                .slice(0, columnIndex)
                .reduce((sum, col) => sum + (col.width || 150), 0);

            cache.set(columnIndex, left);
            return left;
        };
    }, [columnsState]);

    return {
        current: columnsState,
        totalWidth,
        stateChanged,
        sortColumn,
        resetColumns,
        moveColumn,
        updateColumn,
        resetSorting,
        columnLeft,
    };
};

cleanupOldColumnLayouts();