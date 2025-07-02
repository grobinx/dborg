import { useState } from "react";
import { ColumnDefinition, SummaryOperation } from "./DataGridTypes";
import { calculateSummary } from "./DataGridUtils";

interface ColumnsGroup {
    columns: string[];
    toggleColumn: (column: string) => void;
    clearColumns: () => void;
    isInGroup: (column: string) => boolean;
    groupData<T extends object>(data: T[], columnsState: ColumnDefinition[], summaryOperation: Record<string, SummaryOperation | null> | null): T[]
}

export const useColumnsGroup = (): ColumnsGroup => {
    const [columns, setColumns] = useState<string[]>([]);

    const toggleColumn = (column: string) => {
        setColumns((prev) =>
            prev.includes(column) ? prev.filter((col) => col !== column) : [...prev, column]
        );
    };

    const clearColumns = () => {
        setColumns([]);
    };

    const isInGroup = (column: string) => {
        return columns.includes(column);
    };

    const groupData = <T extends object>(
        data: T[],
        columnsState: ColumnDefinition[],
        summaryOperation: Record<string, SummaryOperation | null> | null
    ): T[] => {
        if (columns.length === 0 || data.length === 0) {
            return data;
        }

        // Użycie Map zamiast obiektu
        const groupedResultSet = new Map<string, { rows: T[]; summary: Record<string, any> }>();

        data.forEach((row) => {
            // Budowanie klucza grupy raz
            const groupKey = columns.map((col) => row[col]?.toString() ?? '').join('|');

            if (!groupedResultSet.has(groupKey)) {
                groupedResultSet.set(groupKey, { rows: [], summary: {} });
            }

            groupedResultSet.get(groupKey)!.rows.push(row);
        });

        // Oblicz podsumowanie dla każdej grupy w jednej iteracji
        groupedResultSet.forEach((group) => {
            const groupRows = group.rows;
            group.summary = calculateSummary(groupRows, columnsState, summaryOperation, true);

            // Dodanie wartości pierwszego wiersza dla kolumn grupujących
            columns.forEach((col) => {
                group.summary[col] = groupRows[0][col];
            });
        });

        // Zwrócenie wyników jako tablica
        return Array.from(groupedResultSet.values()).map((group) => group.summary) as T[];
    };

    return {
        columns,
        toggleColumn,
        clearColumns,
        groupData,
        isInGroup,
    };
};
