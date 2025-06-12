import React, { useMemo } from "react";
import { ColumnDataValueType, ColumnDefinition, SummaryOperation } from "./DataGridTypes";
import * as api from "../../../../api/db";
import { DateTime } from "luxon";
import Decimal from "decimal.js";

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

export const resolveDataType = (value: any, dataType?: api.ColumnDataType): api.ColumnDataType => {
    if (value === undefined || value === null) {
        return dataType ? dataType : 'null'; // Typ null dla undefined i null
    }
    // Ustal typ na podstawie wartości
    if (typeof value === 'string') {
        return 'string';
    } else if (typeof value === 'number') {
        return 'number';
    } else if (typeof value === 'bigint') {
        return 'bigint';
    } else if (typeof value === 'boolean') {
        return 'boolean';
    } else if (value instanceof Date || !isNaN(Date.parse(value))) {
        return 'datetime';
    } else if (Array.isArray(value)) {
        return 'array';
    } else if (typeof value === 'object') {
        return 'object';
    }

    if (dataType) {
        return dataType; // Jeśli dataType jest podany, zwróć go
    }

    // Jeśli nie można ustalić typu, zwróć 'custom'
    return 'custom';
};

export function formatDecimalWithThousandsSeparator(value: Decimal): string {
    const [intPart, fracPart] = value.toString().split(".");

    // Pobierz przykładowy sformatowany string
    const sample = (1000000.1).toLocaleString();

    // Wyodrębnij separator tysięcy i dziesiętny
    const match = sample.match(/1(.?)000(.?)000(.?)1/);
    const thousandSeparator = match ? match[1] : ",";
    const decimalSeparator = match ? match[3] : ".";

    // Sformatuj część całkowitą ręcznie (dla dużych liczb)
    const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

    return fracPart !== undefined ? `${intWithSep}${decimalSeparator}${fracPart}` : intWithSep;
}

export const valueToString = (value: any, dataType?: api.ColumnDataType): string | null => {
    if (value === undefined || value === null) {
        return null; // Typ null dla undefined i null
    }

    dataType = dataType ? dataType : resolveDataType(value);

    if (dataType === 'string') {
        return String(value); // Zwróć jako string
    } else if (dataType === 'number') {
        return String(value); // Zwróć jako string
    } else if (dataType === 'bigint') {
        return String(value); // Zwróć jako string
    } else if (dataType === 'boolean') {
        return value ? 'true' : 'false'; // Zwróć jako string
    } else if (dataType === 'datetime') {
        if (value instanceof Date) {
            return DateTime.fromJSDate(value).toSQL();
        } else if (typeof value === 'number' || typeof value === 'bigint') {
            return DateTime.fromMillis(Number(value)).toSQL();
        }
        else {
            return value.toString();
        }
    } else if (dataType === 'object' || dataType === 'array') {
        return JSON.stringify(value); // Zwróć jako JSON string
    } else if (dataType === 'decimal') {
        return formatDecimalWithThousandsSeparator(new Decimal(value));
    }

    return String(value); // Domyślnie zwróć jako string
};

export const columnDataFormatter = (value: any, column: ColumnDefinition, nullValue: string) => {
    const nullFormatter = (value: any) => {
        if (value === null || value === undefined) {
            return nullValue || "NULL";
        }
        return React.isValidElement(value) ? value : valueToString(value, column.dataType);
    };

    if (column.formatter) {
        const formattedValue = column.formatter(value);
        return nullFormatter(formattedValue);
    }

    return nullFormatter(value);
};

export const calculateTextWidth = (text: string, fontSize: number, font: string = 'Arial'): number | null => {
    if (!context) {
        console.error('Unable to get canvas context');
        return null;
    }
    context.font = `${fontSize}px ${font}`; // Ustaw czcionkę i rozmiar
    const textMetrics = context.measureText(text);
    return textMetrics.width; // Zwróć szerokość tekstu
}

export const calculateVisibleColumns = (scrollLeft: number, containerWidth: number, columns: ColumnDefinition[]) => {
    let currentWidth = 0;
    let startColumn = 0;
    let endColumn = columns.length;

    // Oblicz startColumn
    for (let i = 0; i < columns.length; i++) {
        const colWidth = columns[i].width || 150;
        if (currentWidth + colWidth > scrollLeft) {
            startColumn = i;
            break;
        }
        currentWidth += colWidth;
    }

    // Oblicz endColumn
    currentWidth = 0;
    for (let i = startColumn; i < columns.length; i++) {
        const colWidth = columns[i].width || 150;
        currentWidth += colWidth;
        if (currentWidth > containerWidth + scrollLeft) {
            endColumn = i + 1; // Dodajemy +1, aby uwzględnić ostatnią widoczną kolumnę
            break;
        }
    }

    return { startColumn, endColumn };
};

export const calculateVisibleRows = (
    dataLength: number,
    rowHeight: number,
    containerHeight: number,
    scrollTop: number,
    containerRef: React.RefObject<HTMLDivElement | null>
) => {
    const scrollbarHeight = containerRef.current
        ? containerRef.current.offsetHeight - containerRef.current.clientHeight
        : 0;
    const visibleRowCount = Math.ceil((containerHeight - scrollbarHeight) / rowHeight);
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.min(startRow + visibleRowCount, dataLength) - 1;

    return { startRow, endRow };
};


export const scrollToCell = (
    container: HTMLDivElement,
    rowIndex: number,
    columnIndex: number,
    columnLeft: number,
    rowHeight: number,
    columns: ColumnDefinition[],
    footerVisible: boolean,
) => {
    if (columns.length === 0 || columnIndex < 0) {
        return; // Brak kolumn, nie przewijaj
    }
    // Oblicz szerokość i wysokość paska przewijania
    const scrollbarWidth = container.offsetWidth - container.clientWidth;
    const scrollbarHeight = container.offsetHeight - container.clientHeight;

    // Oblicz pozycję w pionie
    const rowTop = Math.max(0, rowIndex * rowHeight); // Ograniczenie do minimum 0
    const rowBottom = Math.min(container.scrollHeight, rowTop + rowHeight + (footerVisible ? (rowHeight * 2) : 0)); // Ograniczenie do maksymalnej wysokości

    const visibleHeight = container.offsetHeight - scrollbarHeight; // Widoczna wysokość kontenera (bez paska przewijania)

    if (rowTop < container.scrollTop) {
        container.scrollTop = rowTop; // Przewiń w górę
    } else if (rowBottom + rowHeight > container.scrollTop + visibleHeight) {
        container.scrollTop = rowBottom - visibleHeight + rowHeight; // Przewiń w dół
    }

    // Oblicz pozycję w poziomie
    const columnRight = columnLeft + (columns[columnIndex].width || 150);

    const visibleWidth = container.offsetWidth - scrollbarWidth; // Widoczna szerokość kontenera (bez paska przewijania)

    if (columnLeft < container.scrollLeft) {
        container.scrollLeft = columnLeft; // Przewiń w lewo
    } else if (columnRight > container.scrollLeft + visibleWidth) {
        container.scrollLeft = columnRight - visibleWidth; // Przewiń w prawo
    }
};

export const queryToDataGridColumns = (resultColumns: api.ColumnInfo[], data: object[]): ColumnDefinition[] => {
    const columns: ColumnDefinition[] = (resultColumns ?? []).map((column) => {
        return {
            key: column.name,
            label: column.name,
            width: 150,
            dataType: column.dataType || resolveDataType(data[0]?.[column.name], column.dataType),
            info: column,
        };
    });

    return columns;
}

export const calculateSummary = (
    data: object[],
    columnsState: ColumnDefinition[],
    operation: Record<string, SummaryOperation | null> | null
): Record<string, ColumnDataValueType> => {
    const summary: Record<string, ColumnDataValueType> = {};

    columnsState.forEach((col) => {
        const values = data.map((row) => row[col.key]);
        const columnOperation = operation?.[col.key]; // Safely access operation[col.key]

        if (!columnOperation) {
            summary[col.key] = null; // Skip if no operation is defined for the column
            return;
        }

        if (col.dataType === 'number' || col.dataType === 'decimal' || col.dataType === 'bigint') {
            const numericValues = values.map((value) => Decimal(value));
            switch (columnOperation) {
                case "sum":
                    summary[col.key] = numericValues.reduce((acc, val) => acc.add(val), Decimal(0));
                    break;
                case "avg":
                    summary[col.key] = numericValues.length > 0
                        ? numericValues.reduce((acc, val) => acc.add(val), Decimal(0)).div(numericValues.length)
                        : null;
                    break;
                case "min":
                    summary[col.key] = numericValues.length > 0
                        ? numericValues.reduce((min, val) => (val.comparedTo(min) < 0 ? val : min), Decimal(Infinity))
                        : null;
                    break;
                case "max":
                    summary[col.key] = numericValues.length > 0
                        ? numericValues.reduce((max, val) => (val.comparedTo(max) > 0 ? val : max), Decimal(-Infinity))
                        : null;
                    break;
                case "unique":
                    summary[col.key] = new Set(numericValues).size;
                    break;
                case "median":
                    summary[col.key] = numericValues.length > 0 ? calculateMedian(numericValues) : null;
                    break;
                case "mode":
                    summary[col.key] = numericValues.length > 0 ? calculateMode(numericValues) : null;
                    break;
                case "stdDev":
                    summary[col.key] = numericValues.length > 0 ? calculateStandardDeviation(numericValues) : null;
                    break;
                case "range":
                    summary[col.key] = numericValues.length > 0
                        ? numericValues.reduce((max, val) => (val.comparedTo(max) > 0 ? val : max), Decimal(-Infinity)).minus(
                            numericValues.reduce((min, val) => (val.comparedTo(min) < 0 ? val : min), Decimal(Infinity))
                        ) : null;
                    break;
                case "count":
                    summary[col.key] = numericValues.length;
                    break;
                case "sumOfSquares":
                    summary[col.key] = numericValues.reduce((acc, val) => acc.add(val.pow(2)), Decimal(0));
                    break;
                case "emptyCount":
                    summary[col.key] = values.filter((value) => value == null).length;
                    break;
                case "variance":
                    summary[col.key] = numericValues.length > 0
                        ? numericValues.reduce((acc, val) => acc.add(val.minus(numericValues.reduce((a, b) => a.add(b), Decimal(0)).div(numericValues.length)).pow(2)), Decimal(0)).div(numericValues.length)
                        : null;
                    break;
                case "skewness":
                    if (numericValues.length > 0) {
                        const mean = numericValues.reduce((acc, val) => acc.add(val), Decimal(0)).div(numericValues.length);
                        const variance = numericValues.reduce((acc, val) => acc.add(val.minus(mean).pow(2)), Decimal(0)).div(numericValues.length);
                        const stdDev = variance.sqrt();
                        summary[col.key] = stdDev.comparedTo(Decimal(0)) > 0
                            ? numericValues.reduce((acc, val) => acc.add((val.minus(mean)).div(stdDev).pow(3)), Decimal(0)).div(numericValues.length)
                            : null;
                    } else {
                        summary[col.key] = null;
                    }
                    break;
                case "kurtosis":
                    if (numericValues.length > 0) {
                        const mean = numericValues.reduce((acc, val) => acc.add(val), Decimal(0)).div(numericValues.length);
                        const variance = numericValues.reduce((acc, val) => acc.add(val.minus(mean).pow(2)), Decimal(0)).div(numericValues.length);
                        const stdDev = variance.sqrt();
                        summary[col.key] = stdDev.comparedTo(Decimal(0)) > 0
                            ? numericValues.reduce((acc, val) => acc.add((val.minus(mean)).div(stdDev).pow(4)), Decimal(0)).div(numericValues.length).minus(3)
                            : null;
                    } else {
                        summary[col.key] = null;
                    }
                    break;
                case "iqr":
                    const q1 = calculatePercentile(numericValues, 25);
                    const q3 = calculatePercentile(numericValues, 75);
                    summary[col.key] = q3 !== null && q1 !== null ? q3.minus(q1) : null;
                    break;
                case "sumOfAbsoluteDifferences":
                    const mean = numericValues.reduce((acc, val) => acc.add(val), Decimal(0)).div(numericValues.length);
                    summary[col.key] = numericValues.reduce((acc, val) => acc.add(val.minus(mean).abs()), Decimal(0));
                    break;
                case "geometricMean":
                    summary[col.key] = numericValues.length > 0
                        ? numericValues.reduce((acc, val) => acc.mul(val), Decimal(1)).pow(1 / numericValues.length)
                        : null;
                    break;
                case "harmonicMean":
                    summary[col.key] = numericValues.length > 0
                        ? Decimal(numericValues.length).div(numericValues.reduce((acc, val) => acc.add(Decimal(1).div(val)), Decimal(0)))
                        : null;
                    break;
                default:
                    summary[col.key] = null;
            }
        } else if (col.dataType === "boolean") {
            const booleanValues = values.filter((value) => typeof value === "boolean") as boolean[];
            const trueCount = booleanValues.filter((value) => value === true).length;
            switch (columnOperation) {
                case "sum":
                    summary[col.key] = trueCount;
                    break;
                case "avg":
                    summary[col.key] = booleanValues.length > 0 ? trueCount / booleanValues.length : null;
                    break;
                case "min":
                    summary[col.key] = booleanValues.includes(false) ? false : true;
                    break;
                case "max":
                    summary[col.key] = booleanValues.includes(true) ? true : false;
                    break;
                case "unique":
                    summary[col.key] = new Set(booleanValues).size;
                    break;
                case "truePercentage":
                    summary[col.key] = booleanValues.length > 0
                        ? (trueCount / booleanValues.length) * 100
                        : null;
                    break;
                case "count":
                    summary[col.key] = booleanValues.length;
                    break;
                case "emptyCount":
                    summary[col.key] = values.filter((value) => value == null).length;
                    break;
                case "mode":
                    summary[col.key] = booleanValues.length > 0 ? calculateMode(booleanValues) : null;
                    break;
                default:
                    summary[col.key] = null;
            }
        } else if (col.dataType === "string") {
            const stringValues = values.filter((value) => typeof value === "string") as string[];
            const lengths = stringValues.map((value) => value.length);
            switch (columnOperation) {
                case "sum":
                    summary[col.key] = lengths.reduce((acc, len) => acc + len, 0);
                    break;
                case "avg":
                    summary[col.key] = lengths.length > 0
                        ? lengths.reduce((acc, len) => acc + len, 0) / lengths.length
                        : null;
                    break;
                case "min":
                    summary[col.key] = stringValues.length > 0
                        ? stringValues.reduce((a, b) => (a < b ? a : b))
                        : null;
                    break;
                case "max":
                    summary[col.key] = stringValues.length > 0
                        ? stringValues.reduce((a, b) => (a > b ? a : b))
                        : null;
                    break;
                case "unique":
                    summary[col.key] = new Set(stringValues).size;
                    break;
                case "minLength":
                    summary[col.key] = lengths.length > 0 ? Math.min(...lengths) : null;
                    break;
                case "maxLength":
                    summary[col.key] = lengths.length > 0 ? Math.max(...lengths) : null;
                    break;
                case "count":
                    summary[col.key] = stringValues.length;
                    break;
                case "emptyCount":
                    summary[col.key] = values.filter((value) => value == null).length;
                    break;
                case "mode":
                    summary[col.key] = stringValues.length > 0 ? calculateMode(stringValues) : null;
                    break;
                case "mostFrequentWord":
                    const substringFrequency = stringValues.reduce((acc, str) => {
                        const words = str.split(/\s+/); // Podział na słowa
                        words.forEach((word) => {
                            acc[word] = (acc[word] || 0) + 1;
                        });
                        return acc;
                    }, {} as Record<string, number>);
                    const maxFreq = Math.max(...Object.values(substringFrequency));
                    summary[col.key] = Object.keys(substringFrequency).find((key) => substringFrequency[key] === maxFreq) || null;
                    break;
                case "mostFrequentCharacter":
                    const charFrequency = stringValues.join("").split("").reduce((acc, char) => {
                        acc[char] = (acc[char] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);
                    const maxCharFreq = Math.max(...Object.values(charFrequency));
                    summary[col.key] = Object.keys(charFrequency).find((key) => charFrequency[key] === maxCharFreq) || null;
                    break;
                case "avgWordLength":
                    const allWords = stringValues.flatMap((str) => str.split(/\s+/));
                    const totalLength = allWords.reduce((acc, word) => acc + word.length, 0);
                    summary[col.key] = allWords.length > 0 ? totalLength / allWords.length : null;
                    break;
                case "longestCommonPrefix":
                    if (stringValues.length === 0) {
                        summary[col.key] = null; // Brak wartości w kolumnie
                    } else if (stringValues.length === 1) {
                        summary[col.key] = stringValues[0]; // Jeśli jest tylko jeden element, zwróć go
                    } else {
                        summary[col.key] = stringValues.reduce((prefix, str) => {
                            let i = 0;
                            while (i < prefix.length && i < str.length && prefix[i] === str[i]) {
                                i++;
                            }
                            return prefix.slice(0, i);
                        }, stringValues[0] || "");
                    }
                    break;
                default:
                    summary[col.key] = null;
            }
        } else if (col.dataType === "datetime") {
            const dateValues = values.filter((value) => value instanceof Date) as Date[];
            switch (columnOperation) {
                case "min":
                    summary[col.key] = dateValues.length > 0 ? new Date(Math.min(...dateValues.map((date) => date.getTime()))) : null;
                    break;
                case "max":
                    summary[col.key] = dateValues.length > 0 ? new Date(Math.max(...dateValues.map((date) => date.getTime()))) : null;
                    break;
                case "count":
                    summary[col.key] = dateValues.length;
                    break;
                case "emptyCount":
                    summary[col.key] = values.filter((value) => value == null).length;
                    break;
                case "range":
                    if (dateValues.length > 0) {
                        const minDate = new Date(Math.min(...dateValues.map((date) => date.getTime())));
                        const maxDate = new Date(Math.max(...dateValues.map((date) => date.getTime())));
                        summary[col.key] = maxDate.getTime() - minDate.getTime(); // Różnica w milisekundach
                    } else {
                        summary[col.key] = null;
                    }
                    break;
                case "unique":
                    summary[col.key] = new Set(dateValues.map((date) => date.getTime())).size;
                    break;
                case "mode":
                    summary[col.key] = dateValues.length > 0 ? calculateMode(dateValues.map((date) => new Decimal(date.getTime()))) : null;
                    break;
                case "median":
                    summary[col.key] = dateValues.length > 0
                        ? new Date(calculateMedian(dateValues.map((date) => new Decimal(date.getTime())))!)
                        : null;
                    break;
                case "avg":
                    if (dateValues.length > 0) {
                        const avgTime = dateValues.reduce((acc, date) => acc + date.getTime(), 0) / dateValues.length;
                        summary[col.key] = new Date(avgTime);
                    } else {
                        summary[col.key] = null;
                    }
                    break;
                default:
                    summary[col.key] = null;
            }
        } else {
            switch (columnOperation) {
                case "unique":
                    summary[col.key] = new Set(values.filter((value) => value != null)).size;
                    break;
                case "count":
                    summary[col.key] = values.filter((value) => value != null).length;
                    break;
                case "emptyCount":
                    summary[col.key] = values.filter((value) => value == null).length;
                    break;
                default:
                    summary[col.key] = null;
            }
        }
    });

    return summary;
};

// Funkcje pomocnicze
const calculateMedian = (values: Decimal[]): number | null => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a.comparedTo(b));
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid].toNumber() : (sorted[mid - 1].add(sorted[mid])).div(2).toNumber();
};

const calculateMode = <T extends string | Decimal | number | boolean>(values: T[]): T | null => {
    if (values.length === 0) return null;

    const frequencyMap = values.reduce((acc, value) => {
        const key = value.toString();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const maxFrequency = Math.max(...Object.values(frequencyMap));
    const modes = Object.entries(frequencyMap)
        .filter(([_, frequency]) => frequency === maxFrequency)
        .map(([key]) => key as unknown as T);

    return modes.length === 1 ? modes[0] : null; // Return the mode if there's only one, otherwise null
};

const calculateStandardDeviation = (values: Decimal[]): Decimal | null => {
    if (values.length === 0) return null;
    const mean = values.reduce((acc, val) => acc.add(val), new Decimal(0)).div(values.length);
    const variance = values.reduce((acc, val) => acc.add(val.sub(mean).pow(2)), new Decimal(0)).div(values.length);
    return variance.sqrt();
};

const calculatePercentile = (values: Decimal[], percentile: number): Decimal | null => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a.comparedTo(b));
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || null;
};

export const generateColumnHash = (columns: ColumnDefinition[]) => {
    const keys = columns.map((col) => col.key).join(",");
    let hash = 2166136261; // FNV offset basis
    for (let i = 0; i < keys.length; i++) {
        hash ^= keys.charCodeAt(i);
        hash *= 16777619; // FNV prime
    }
    return (hash >>> 0).toString(16); // Zwróć hash jako 32-bitowy hex
};
