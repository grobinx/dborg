import { useState } from "react";
import { ColumnDefinition, SummaryOperation } from "./DataGridTypes";
import { calculateSummary } from "./DataGridUtils";

interface ColumnsGroup {
    columns: string[];
    toggleColumn: (column: string) => void;
    clearColumns: () => void;
    isInGroup: (column: string) => boolean;
    groupData<T extends object>(data: T[], columnsState: ColumnDefinition[]): T[]
}

// Zamiast createInterners → zbuduj od razu builder klucza bez alokacji tablicy na każdy wiersz
function createKeyBuilder(keys: string[]) {
    const dicts = keys.map(() => new Map<any, number>());
    const nextIds = keys.map(() => 0);
    const ids = new Array<number>(keys.length); // bufor wielokrotnego użytku

    return (row: any): string => {
        for (let k = 0; k < keys.length; k++) {
            const col = keys[k];
            const dict = dicts[k];
            const v = String(row[col]);
            let id = dict.get(v);
            if (id === undefined) {
                id = nextIds[k]++;
                dict.set(v, id);
            }
            ids[k] = id;
        }
        // szybkie sklejanie bez join (brak alokacji tablicy po drodze)
        let key = "";
        for (let k = 0; k < ids.length; k++) {
            if (k) key += "|";
            key += ids[k];
        }
        return key;
    };
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
    ): T[] => {
        if (columns.length === 0 || data.length === 0) return data;

        const toKey = createKeyBuilder(columns);

        const groupedResultSet = data.reduce(
            (acc, row) => {
                const groupKey = toKey(row);
                let bucket = acc.get(groupKey);
                if (!bucket) {
                    bucket = { rows: [] as T[], summary: {} as Record<string, any> };
                    acc.set(groupKey, bucket);
                }
                bucket.rows.push(row);
                return acc;
            },
            new Map<string, { rows: T[]; summary: Record<string, any> }>()
        );

        // Oblicz podsumowanie dla każdej grupy w jednej iteracji
        groupedResultSet.forEach((group) => {
            const groupRows = group.rows;
            group.summary = calculateSummary(groupRows, columnsState, true);

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
