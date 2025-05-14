import { useState, useEffect, useRef, useMemo } from "react";
import { produce } from "immer";
import { ColumnDefinition } from "./DataGridTypes";

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


export const useColumnsState = (initialColumns: ColumnDefinition[]): UseColumnsState => {
    const [columnsState, setColumnsState] = useState<ColumnDefinition[]>(initialColumns);
    const [totalWidth, setTotalWidth] = useState(() =>
        initialColumns.reduce((sum, col) => sum + (col.width || 150), 0) // Domyślna szerokość kolumny to 150
    );
    const prevColumnsStateRef = useRef<ColumnDefinition[]>(initialColumns);
    const [stateChanged, setstateChanged] = useState(false);

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

        if (hasRelevantChanges) {
            setstateChanged((prev) => !prev);
        }

        prevColumnsStateRef.current = columnsState;
    }, [columnsState]);

    useEffect(() => {
        const newTotalWidth = columnsState.reduce((sum, col) => sum + (col.width || 150), 0);
        setTotalWidth(newTotalWidth);
    }, [columnsState]);

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