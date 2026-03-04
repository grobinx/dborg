import React, { useEffect, useMemo, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableContainerProps,
    TableHead,
    TableRow,
    TableSortLabel,
    type TableCellProps,
    type TableProps,
} from "@mui/material";
import { ColumnDataType, resolveDataTypeFromValue, valueToString } from "../../../../../src/api/db";
import { Index, useSort } from "@renderer/hooks/useSort";
import { SortDirection } from "./DataGridTypes";
import { useTranslation } from "react-i18next";
import LoadingOverlay from "../useful/LoadingOverlay";

export interface DataPresentationGridColumn<T> {
    key: string;
    label: React.ReactNode;
    formatter?: (value: any, row: T, fieldName: string) => React.ReactNode;
    dataType?: ColumnDataType;
    align?: TableCellProps["align"];
    width?: number | string;
    sortable?: boolean;
}

export interface DataPresentationGridProps<T> {
    data: readonly T[];
    columns?: readonly DataPresentationGridColumn<T>[];
    initialSort?: SortStateOptions;
    limit?: number;
    loading?: boolean;
    slotProps?: {
        table?: Omit<TableProps, "children">;
        container?: Omit<TableContainerProps, "children">;
    };
}

type SortState = { key: string; direction: SortDirection };
export type SortStateOptions = { key: string; direction?: SortDirection };

const isSortable = <T,>(column: DataPresentationGridColumn<T>): boolean => column.sortable ?? true;

const getInitialSort = <T,>(
    columns: readonly DataPresentationGridColumn<T>[],
    initialSort?: SortStateOptions
): SortState | null => {
    if (initialSort) {
        const selected = columns.find((c) => c.key === initialSort.key);
        if (selected && isSortable(selected)) {
            return {
                key: selected.key,
                direction: initialSort.direction ?? "asc",
            };
        }
    }

    const firstSortable = columns.find((c) => isSortable(c));
    if (!firstSortable) return null;

    return {
        key: firstSortable.key,
        direction: "asc",
    };
};

export function DataPresentationGrid<T>({
    data,
    columns,
    initialSort,
    limit,
    loading,
    slotProps,
}: DataPresentationGridProps<T>) {
    const { t } = useTranslation();
    const [sort, setSort] = useState<SortState | null>(() => getInitialSort(columns ?? [], initialSort));

    const resolvedColumns = useMemo(() => {
        if (columns) return columns;

        const keys = new Set<string>();
        data.forEach((row) => {
            Object.keys((row ?? {}) as Record<string, unknown>).forEach((k) => keys.add(k));
        });

        return Array.from(keys).map((key) => {
            const firstValue = data.find((r) => (r as any)[key] !== null && (r as any)[key] !== undefined)?.[key as keyof T];
            return {
                key,
                label: key,
            } as DataPresentationGridColumn<T>;
        });
    }, [columns, data]);

    useEffect(() => {
        setSort((prev) => {
            if (prev) {
                const existing = columns?.find((c) => c.key === prev.key);

                if (existing && isSortable(existing)) return prev;
            }
            return getInitialSort(columns ?? [], initialSort);
        });
    }, [columns, initialSort?.key, initialSort?.direction]);

    const sortIndex = useMemo<Index<T> | null>(() => {
        if (!sort) return null;

        return {
            fields: [
                {
                    name: sort.key as keyof T,
                    order: sort.direction,
                },
            ],
        };
    }, [sort?.key, sort?.direction]);

    const sortedRows = useSort(data as T[], sortIndex) ?? [];

    const visibleRows = useMemo(
        () => (typeof limit === "number" ? sortedRows.slice(0, limit) : sortedRows),
        [sortedRows, limit]
    );

    const onSort = (column: DataPresentationGridColumn<T>) => {
        if (!isSortable(column)) return;

        setSort((prev) => {
            if (prev?.key === column.key) {
                return { key: column.key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key: column.key, direction: "asc" };
        });
    };

    return (
        <TableContainer {...slotProps?.container}>
            {loading && (
                <LoadingOverlay
                    label={t("loading---", "Loading...")}
                />
            )}

            <Table size="small" stickyHeader {...slotProps?.table}>
                {columns && (
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => {
                                const active = sort?.key === column.key;

                                return (
                                    <TableCell key={column.key} align={column.align} sx={column.width ? { width: column.width } : undefined}>
                                        {isSortable(column) ? (
                                            <TableSortLabel
                                                active={active}
                                                direction={active ? sort?.direction ?? "asc" : "asc"}
                                                onClick={() => onSort(column)}
                                            >
                                                {column.label}
                                            </TableSortLabel>
                                        ) : (
                                            column.label
                                        )}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                )}

                <TableBody>
                    {visibleRows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={resolvedColumns.length}>{t("no-data", "No data")}</TableCell>
                        </TableRow>
                    ) : (
                        visibleRows.map((row, rowIndex) => (
                            <TableRow key={rowIndex} hover>
                                {resolvedColumns.map((column) => (
                                    <TableCell key={column.key} align={column.align}>
                                        {column.formatter ?
                                            column.formatter(row[column.key], row, column.key)
                                            : valueToString(row[column.key], column.dataType ?? resolveDataTypeFromValue(row[column.key]) ?? "string")
                                        }
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default DataPresentationGrid;