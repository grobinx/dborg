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

        const groupedResultSet: Record<string, { rows: T[]; summary: Record<string, any> }> = {};

        data.forEach((row) => {
            const groupKey = columns.map((col) => row[col].toString()).join('|'); // Klucz grupy
            if (!groupedResultSet[groupKey]) {
                groupedResultSet[groupKey] = { rows: [], summary: {} };
            }
            groupedResultSet[groupKey].rows.push(row);
        });

        // Oblicz podsumowanie dla każdej grupy
        Object.keys(groupedResultSet).forEach((groupKey) => {
            const groupRows = groupedResultSet[groupKey].rows;
            groupedResultSet[groupKey].summary = calculateSummary(groupRows, columnsState, summaryOperation, true);
            columns.forEach((col) => {
                groupedResultSet[groupKey].summary[col] = groupRows[0][col];
            });
        });

        return Object.values(groupedResultSet).map((group) => group.summary) as T[];
    };

    return {
        columns,
        toggleColumn,
        clearColumns,
        groupData,
        isInGroup,
    };
};
