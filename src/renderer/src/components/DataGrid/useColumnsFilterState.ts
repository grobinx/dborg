import { useEffect, useState } from "react";
import { ColumnDefinition } from "./DataGridTypes";
import { compareValuesByType } from "../../../../../src/api/db";

export type ColumnsFilterOperator =
    | 'equals'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'lessThan'
    | 'lessThanOrEqual'
    | 'like'
    | 'between'
    | 'isNull'
    | 'startsWith'
    | 'endsWith'
    ;

export interface SimpleOperators {
    equals: boolean,
    lessThan: boolean,
    greaterThan: boolean,
    like: boolean,
    isNull: boolean,
};

export const mapSimpleOperators: Record<ColumnsFilterOperator, SimpleOperators> = {
    equals: { equals: true, lessThan: false, greaterThan: false, like: false, isNull: false },
    greaterThan: { equals: false, lessThan: false, greaterThan: true, like: false, isNull: false },
    greaterThanOrEqual: { equals: true, lessThan: false, greaterThan: true, like: false, isNull: false },
    lessThan: { equals: false, lessThan: true, greaterThan: false, like: false, isNull: false },
    lessThanOrEqual: { equals: true, lessThan: true, greaterThan: false, like: false, isNull: false },
    like: { equals: false, lessThan: false, greaterThan: false, like: true, isNull: false },
    between: { equals: true, lessThan: true, greaterThan: true, like: false, isNull: false },
    isNull: { equals: false, lessThan: false, greaterThan: false, like: false, isNull: true },
    startsWith: { equals: false, lessThan: false, greaterThan: true, like: true, isNull: false },
    endsWith: { equals: false, lessThan: true, greaterThan: false, like: true, isNull: false },
};

export interface ColumnFilter {
    active?: boolean;
    operator: ColumnsFilterOperator;
    not: boolean;
    values: string[];
}

export function isColumnFilter(filter: any): filter is ColumnFilter {
    return (
        typeof filter === 'object' &&
        'operator' in filter &&
        'not' in filter &&
        'values' in filter &&
        Array.isArray(filter.values) &&
        typeof filter.operator === 'string' &&
        typeof filter.not === 'boolean'
    );
}

interface ColumnFilterState {
    [key: string]: ColumnFilter;
}

export function useColumnFilterState() {
    const [filters, setFilters] = useState<ColumnFilterState>({});
    const [activeFilters, setActiveFilters] = useState<ColumnFilterState>({});
    const [temporaryFilter, setTemporaryFilterState] = useState<{ key: string; filter: ColumnFilter } | null>(null);

    const setFilter = (key: string, operator: ColumnsFilterOperator, not: boolean, values: string[]): void => {
        // setting a main filter disables any temporary filter
        if (temporaryFilter) setTemporaryFilterState(null);
        
        setFilters((prev) => {
            const existingFilter = prev[key];
            const isDifferent =
                !existingFilter ||
                existingFilter.operator !== operator ||
                existingFilter.not !== not ||
                JSON.stringify(existingFilter.values) !== JSON.stringify(values);

            if (!isDifferent) {
                return prev;
            }

            return {
                ...prev,
                [key]: { operator, not, values, active: existingFilter?.active ?? false },
            };
        });
    };

    const getFilter = (key: string, active?: boolean) => {
        const filter = filters[key];
        if (!filter || (active !== undefined && filter.active !== active)) return null;
        return filter;
    };

    const clearFilter = (key: string) => {
        if (!filters[key]) return;
        setFilters((prev) => {
            const { [key]: _, ...rest } = prev;
            return rest;
        });
    };

    const clearFilters = () => {
        if (Object.keys(filters).length === 0) return;
        setFilters({});
    };

    const filterActive = (key: string, set?: boolean): boolean => {
        if (set !== undefined && filters[key]?.active !== set) {
            setFilters((prev) => ({
                ...prev,
                [key]: { ...prev[key], active: set },
            }));
        }
        return filters[key]?.active ?? false;
    }

    const filterData = <T extends object>(data: T[], columns: ColumnDefinition[], getItem?: (data: T) => Record<string, any>): T[] => {
        // Use temporary filter if active, otherwise use main filters
        const effectiveFilters: ColumnFilterState = temporaryFilter && temporaryFilter.filter.active
            ? { [temporaryFilter.key]: temporaryFilter.filter }
            : filters;

        if (Object.keys(effectiveFilters).length === 0) {
            return data;
        }

        return data.filter((row) => {
            const item = getItem ? getItem(row) : row as Record<string, any>;
            return Object.entries(effectiveFilters).every(([key, filter]) => {
                if (!filter.active) return true;

                const column = columns.find(col => col.key === key);
                if (!column || (filter.values.length === 0 && filter.operator !== "isNull")) return true;

                const rowValue = item[key];
                const dataType = column.dataType;
                const compare = (v1: any, v2: any) => compareValuesByType(v1, v2, dataType);

                let result = false;
                switch (filter.operator) {
                    case 'equals':
                        result = filter.values.some(val => compare(rowValue, val) === 0);
                        break;
                    case 'greaterThan':
                        result = filter.values.some(val => compare(rowValue, val) > 0);
                        break;
                    case 'greaterThanOrEqual':
                        result = filter.values.some(val => compare(rowValue, val) >= 0);
                        break;
                    case 'lessThan':
                        result = filter.values.some(val => compare(rowValue, val) < 0);
                        break;
                    case 'lessThanOrEqual':
                        result = filter.values.some(val => compare(rowValue, val) <= 0);
                        break;
                    case 'like':
                        result = filter.values.some(val =>
                            String(rowValue ?? '').toLowerCase().includes(String(val).toLowerCase())
                        );
                        break;
                    case 'between':
                        if (filter.values.length === 2) {
                            result =
                                compare(rowValue, filter.values[0]) >= 0 &&
                                compare(rowValue, filter.values[1]) <= 0;
                        }
                        break;
                    case 'isNull':
                        result = rowValue === null || rowValue === undefined;
                        break;
                    case 'startsWith':
                        result = filter.values.some(val =>
                            String(rowValue ?? '').toLowerCase().startsWith(String(val).toLowerCase())
                        );
                        break;
                    case 'endsWith':
                        result = filter.values.some(val =>
                            String(rowValue ?? '').toLowerCase().endsWith(String(val).toLowerCase())
                        );
                        break;
                    default:
                        result = true;
                }
                return filter.not ? !result : result;
            });
        });
    }

    useEffect(() => {
        const newActiveFilters: ColumnFilterState = {};
        
        if (temporaryFilter && temporaryFilter.filter.active) {
            newActiveFilters[temporaryFilter.key] = temporaryFilter.filter;
        } else {
            Object.entries(filters).forEach(([key, filter]) => {
                if (filter.active) {
                    newActiveFilters[key] = filter;
                }
            });
        }
        
        setActiveFilters(prev => {
            const prevKeys = Object.keys(prev);
            const newKeys = Object.keys(newActiveFilters);
            const sameKeys = prevKeys.length === newKeys.length && prevKeys.every(key => newKeys.includes(key));
            if (sameKeys) {
                return prev;
            }
            return newActiveFilters;
        });
    }, [filters, temporaryFilter]);

    const setTemporaryFilter = (key: string, operator: ColumnsFilterOperator, not: boolean, values: string[]) => {
        setTemporaryFilterState({ key, filter: { operator, not, values, active: true } });
    };

    const clearTemporaryFilter = () => setTemporaryFilterState(null);

    const getTemporaryFilter = (key?: string) => {
        if (!temporaryFilter) return null;
        if (key && temporaryFilter.key !== key) return null;
        return temporaryFilter.filter;
    };

    const getEffectiveFilter = (key: string) => {
        if (temporaryFilter?.key === key && temporaryFilter.filter.active) {
            return temporaryFilter.filter;
        }
        return filters[key] ?? null;
    };

    return {
        filters,
        activeFilters,
        setFilter,
        getFilter,
        filterData,
        clearFilter,
        clearFilters,
        filterActive,
        temporaryFilter,
        setTemporaryFilter,
        clearTemporaryFilter,
        getTemporaryFilter,
        getEffectiveFilter,
    };
}

export function filterToString(filter: ColumnFilter): string;
export function filterToString(operator: ColumnsFilterOperator, not: boolean, values: string[]): string;
export function filterToString(arg1: ColumnFilter | ColumnsFilterOperator, arg2?: boolean, arg3?: string[]): string {
    const operatorDescriptions: Record<ColumnsFilterOperator, string> = {
        equals: "=",
        greaterThan: ">",
        greaterThanOrEqual: ">=",
        lessThan: "<",
        lessThanOrEqual: "<=",
        like: "like",
        between: "between",
        isNull: "is null",
        startsWith: "starts with",
        endsWith: "ends with",
    };

    let operator: ColumnsFilterOperator;
    let not: boolean;
    let values: string[];

    if (typeof arg1 === "string") {
        operator = arg1;
        not = arg2 ?? false;
        values = arg3 ?? [];
    } else {
        operator = arg1.operator;
        not = arg1.not ?? false;
        values = arg1.values ?? [];
    }

    let description = operatorDescriptions[operator] || "unknown operator";

    if (operator === "between") {
        description += ` ${(values[0] ?? '') === '' ? '?' : values[0]} and ${(values[1] ?? '') === '' ? '?' : values[1]}`;
    } else if (operator === "isNull") {
        description += "";
    } else {
        description += ` ${values.join(" or ")}`;
    }

    if (not) {
        description = `not ${description}`;
    }

    return description;
}

export function convertToSimpleOperators(operator: ColumnsFilterOperator): SimpleOperators {
    return {
        ...mapSimpleOperators[operator] || {
            equals: true,
            lessThan: false,
            greaterThan: false,
            like: false,
            isNull: false,
        }
    };
}

export function convertToColumnsFilterOperator(simpleOperators: SimpleOperators): ColumnsFilterOperator {
    const operatorEntries = Object.entries(mapSimpleOperators);

    for (const [operator, mappedSimpleOperators] of operatorEntries) {
        if (
            mappedSimpleOperators.equals === simpleOperators.equals &&
            mappedSimpleOperators.lessThan === simpleOperators.lessThan &&
            mappedSimpleOperators.greaterThan === simpleOperators.greaterThan &&
            mappedSimpleOperators.like === simpleOperators.like &&
            mappedSimpleOperators.isNull === simpleOperators.isNull
        ) {
            return operator as ColumnsFilterOperator;
        }
    }

    return 'equals'; // Jeśli brak dopasowania
}

export function validateSimpleOperators(simpleOperators: SimpleOperators): boolean {
    const operatorEntries = Object.entries(mapSimpleOperators);

    // Sprawdź, czy istnieje dopasowanie w mapSimpleOperators
    return operatorEntries.some(([_, mappedSimpleOperators]) => {
        return (
            mappedSimpleOperators.equals === simpleOperators.equals &&
            mappedSimpleOperators.lessThan === simpleOperators.lessThan &&
            mappedSimpleOperators.greaterThan === simpleOperators.greaterThan &&
            mappedSimpleOperators.like === simpleOperators.like &&
            mappedSimpleOperators.isNull === simpleOperators.isNull
        );
    });
}

export function resetSimpleOperators(operators: Partial<SimpleOperators>): SimpleOperators {
    return {
        ...{
            equals: false,
            lessThan: false,
            greaterThan: false,
            like: false,
            isNull: false,
        } as SimpleOperators,
        ...operators
    };
}