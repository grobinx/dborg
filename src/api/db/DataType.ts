import Decimal from "decimal.js";
import { DateTime, Duration } from "luxon";
import SparkMD5 from 'spark-md5';
import { LRUCache } from 'lru-cache';

export type ColumnBaseType =
    'string'
    | 'number'
    | 'boolean'
    | 'datetime'
    | 'array'
    | 'object'
    | 'binary';

const columnBaseTypes: readonly ColumnBaseType[] = [
    "string",
    "number",
    "boolean",
    "datetime",
    'array',
    "object",
    "binary"
];

export type ColumnStringType =
    'string'
    | 'uuid'
    | 'email'
    | 'url'
    | 'file'
    | 'phone'
    | 'mac'
    | 'ip'
    | 'barcode'
    | 'hash'
    | 'color';

const columnStringTypes: readonly ColumnStringType[] = [
    "string",
    "uuid",
    "email",
    "url",
    "file",
    "phone",
    "mac",
    "ip",
    "barcode",
    "hash",
    "color"
];

export type ColumnNumberType =
    'number'
    | 'bigint'
    | 'decimal'
    | 'money'
    | 'int';

const columnNumberTypes: readonly ColumnNumberType[] = [
    "number",
    "bigint",
    "decimal",
    "money",
    "int"
];

export type ColumnBooleanType =
    'boolean'
    | 'bit';

const columnBooleanTypes: readonly ColumnBooleanType[] = [
    "boolean",
    "bit"
];

export type ColumnDateTimeType =
    'datetime'
    | 'date'
    | 'time'
    | 'duration'

const columnDateTimeTypes: readonly ColumnDateTimeType[] = [
    "datetime",
    "date",
    "time",
    "duration"
];

export type ColumnObjectType =
    'object'
    | 'json'
    | 'xml'
    | 'enum'
    | 'geometry';

const columnObjectTypes: readonly ColumnObjectType[] = [
    "object",
    "json",
    "xml",
    "enum",
    "geometry"
];

export type ColumnBinaryType =
    'binary'
    | 'blob'
    | 'image';

const columnBinaryTypes: readonly ColumnBinaryType[] = [
    "binary",
    "blob",
    "image"
];

export type UnionDataType =
    ColumnStringType
    | ColumnNumberType
    | ColumnBooleanType
    | ColumnDateTimeType
    | ColumnObjectType
    | ColumnBinaryType;

export type ColumnDataType = UnionDataType | [UnionDataType];


export type ValuePrimitiveType =
    'string'
    | 'number'
    | 'bigint'
    | 'boolean'
    | 'array'
    | 'object';

export const dataTypeToGeneralType: Record<UnionDataType, UnionDataType> = {
    string: 'string',
    uuid: 'string',
    email: 'string',
    url: 'string',
    file: 'string',
    barcode: 'string',
    color: 'string',
    ip: 'string',
    mac: 'string',
    hash: 'string',
    phone: 'string',
    number: 'decimal',
    bigint: 'number',
    decimal: 'decimal',
    money: 'decimal',
    int: 'bigint',
    boolean: 'boolean',
    bit: 'string',
    datetime: 'datetime',
    date: 'datetime',
    time: 'datetime',
    duration: 'duration',
    object: 'object',
    json: 'object',
    xml: 'object',
    enum: 'object',
    geometry: 'object',
    binary: 'binary',
    blob: 'binary',
    image: 'binary',
}

export const dataTypeToBaseType: Record<UnionDataType, ColumnBaseType> = {
    string: 'string',
    uuid: 'string',
    email: 'string',
    url: 'string',
    file: 'string',
    barcode: 'string',
    color: 'string',
    ip: 'string',
    mac: 'string',
    hash: 'string',
    phone: 'string',
    number: 'number',
    bigint: 'number',
    decimal: 'number',
    money: 'number',
    int: 'number',
    boolean: 'boolean',
    bit: 'string',
    datetime: 'datetime',
    date: 'datetime',
    time: 'datetime',
    duration: 'datetime',
    object: 'object',
    json: 'object',
    xml: 'object',
    enum: 'object',
    geometry: 'object',
    binary: 'binary',
    blob: 'binary',
    image: 'binary',
}

export const resolvePrimitiveType = (value: any): ValuePrimitiveType | null => {
    switch (typeof value) {
        case 'symbol':
        case 'string': return 'string';
        case 'number': return 'number';
        case 'bigint': return 'bigint';
        case 'boolean': return 'boolean';
        case 'function':
        case 'object': return Array.isArray(value) ? 'array' : 'object';
        case 'undefined': return null;
        default: return null;
    }
}

export const toBaseType = (dataType: ColumnDataType): ColumnBaseType => {
    if (Array.isArray(dataType)) {
        return 'array';
    }
    return dataTypeToBaseType[dataType];
}

export const areTypesEqual = (dataType1: ColumnDataType, dataType2: ColumnDataType): boolean => {
    // Obsługa tablic jednoelementowych
    const resolvedType1 = Array.isArray(dataType1) ? dataType1[0] : dataType1;
    const resolvedType2 = Array.isArray(dataType2) ? dataType2[0] : dataType2;

    // Porównanie typów
    return resolvedType1 === resolvedType2;
}

export const typeToString = (dataType: ColumnDataType): string => {
    if (Array.isArray(dataType)) {
        return `[${dataType[0]}]`;
    }
    return dataType;
}

/**
 * Funkcję można wykorzystać do
 * - sprawdzania typu dla baz danych zwracających ciągi znaków, np. sqlite
 * - do sprawdzenie wartości w celu jej prezentacji lub dodatkowego działania
 * @param value 
 * @returns 
 */
export const resolveDataTypeFromString = (value: string | null | undefined): ColumnDataType | null => {
    if (value === null || value === undefined) {
        return null;
    }
    // liczby całkowite i zmiennoprzecinkowe
    if (/^-?\d+$/.test(value)) {
        const num = Number(value);
        if (!Number.isNaN(num) && Number.isSafeInteger(num)) {
            return 'int';
        }
        try {
            BigInt(value);
            return 'bigint';
        } catch { }
    }
    if (/^-?\d+\.\d+(e[+-]?\d+)?$/i.test(value)) {
        const num = Number(value);
        if (!Number.isNaN(num) && Number.isFinite(num)) {
            return 'number';
        }
        return 'decimal';
    }
    // boolean/bit
    if (/^(true|false)$/i.test(value)) {
        return 'boolean';
    }
    if (/^(0|1)$/i.test(value)) {
        return 'bit';
    }
    // daty/czas
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}([\. ]\d{3})?\s*(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) {
        return 'datetime';
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return 'date';
    }
    if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
        return 'time';
    }
    if (/^P(?!$)(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?(\d+S)?)?$/.test(value)) {
        return 'duration';
    }
    if (/^(\d+\s*(year|mon|month|day|hour|min|minute|sec|second)s?\s*)+(\d{2}:\d{2}:\d{2}(\.\d+)?)?$/i.test(value)) {
        return 'duration';
    }
    // uuid
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return 'uuid';
    }
    // email
    if (/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[\w-]{2,}$/.test(value)) {
        return 'email';
    }
    // url
    if (/^([a-zA-Z]+):\/\/[^\s\/$.?#].[^\s]*$/.test(value)) {
        return 'url';
    }
    // file
    if (/^([a-zA-Z]:|\/|\\|~|\.\/|\.\.\/)[^\s]*$/.test(value)) {
        return 'file';
    }
    // phone
    if (/^\+?[0-9\s\-\(\)]+$/.test(value)) {
        return 'phone';
    }
    // ip
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
        return 'ip';
    }
    // mac
    if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(value)) {
        return 'mac';
    }
    // json
    if (/^(\{.*\}|\[.*\])$/.test(value)) {
        try {
            JSON.parse(value);
            return 'json';
        } catch { }
    }
    // xml
    if (/^<\?xml.*\?>.*<\/.*>$/.test(value)) {
        return 'xml';
    }
    // geometry
    if (/^(SRID=\d+;)?\s*(POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION)\s*\(.*\)$/i.test(value)) {
        return 'geometry';
    }
    if (/^\s*\{\s*"type"\s*:\s*"(Point|LineString|Polygon|MultiPoint|MultiLineString|MultiPolygon|GeometryCollection)"/i.test(value)) {
        return 'geometry';
    }
    // color
    if (/^(\#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$|hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$|hsla\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*,\s*(0|1|0?\.\d+)\s*\)$|transparent$|currentColor$|inherit$|$)/i.test(value)) {
        return 'color';
    }
    return 'string';
};

/**
 * Zwraca najbardziej ogólny wspólny typ dla tablicy subtypów pobranych np. z 
 * jakiejś puli wartości w danej kolumnie.
 * Korzysta z mapy subTypeToGeneralType, aby sprowadzić subtypy do ogólnych typów.
 */
export function getMostGeneralType(dataTypes: UnionDataType[]): UnionDataType {
    if (!dataTypes.length) return 'string'; // Jeśli brak subtypów, zwróć 'string'

    // Mapuj subtypy do typów ogólnych
    const mapped = dataTypes.map(t => dataTypeToGeneralType[t] ?? t);

    // Jeśli wszystkie ogólne typy są identyczne, zwróć ten typ
    const firstGeneral = mapped[0];
    if (mapped.every(t => t === firstGeneral)) {
        return firstGeneral;
    }

    // Priorytet typów ogólnych: najbardziej precyzyjne do najbardziej ogólnych
    const priority: UnionDataType[] = [
        'string', 'decimal', 'number', 'datetime', 'duration', 'boolean', 'object', 'binary'
    ];

    // Znajdź pierwszy typ z priorytetu, który występuje w mapped
    for (const type of priority) {
        if (mapped.includes(type)) {
            return type;
        }
    }

    // Fallback: jeśli nic nie pasuje, zwróć 'string'
    return 'string';
}

export interface ValueToStringOptions {
    maxLength?: number; // Maksymalna długość sformatowanej wartości, domyślnie undefined
    display?: boolean; // Czy służy wyświetleniu, domyślnie true
    thousandsSeparator?: boolean; // Czy używać separatorów tysięcy, domyślnie true
}

const cache = new LRUCache<string, string>({ max: 10000 }); // Cache dla sformatowanych wartości

export const valueToString = (value: any, dataType: ColumnDataType, options?: ValueToStringOptions): string => {
    // Obsługa wartości null/undefined
    if (value === null || value === undefined) {
        return '';
    }

    options = Object.assign({ display: true, thousandsSeparator: true }, options);
    const { maxLength, display } = options;

    if (maxLength !== undefined && typeof value === 'string' && value.length > maxLength) {
        value = value.substring(0, maxLength);
    }

    dataType = Array.isArray(dataType) ? dataType[0] : dataType; // Obsługa tablicy typów

    // Obsługa tablic
    if (Array.isArray(value)) {
        const dt = Array.isArray(dataType) ? dataType[0] : dataType; // Typ elementów tablicy
        const formattedArray: string[] = [];
        let currentLength = 0;

        for (let i = 0; i < value.length; i++) {
            const itemString = valueToString(value[i], dt, options);
            currentLength += itemString.length + (i > 0 ? 2 : 0); // Dodaj długość elementu + separator (", ")

            if (maxLength !== undefined && currentLength > maxLength && i > 0) {
                formattedArray.push('...');
                break;
            }

            formattedArray.push(itemString);
        }

        return `[${formattedArray.join(', ')}]`;
    }

    let cacheKey: string | undefined;
    if (display) {
        // Generowanie klucza dla cache
        cacheKey = `${generateHash(value)}-${dataType}`;
        const cachedValue = cache.get(cacheKey);
        if (cachedValue) {
            return cachedValue;
        }
    }

    // Obsługa typów bazowych
    const baseType = toBaseType(dataType);
    let formattedValue: string;

    switch (baseType) {
        case 'string':
            formattedValue = display ? String(value) : `'${String(value)}'`;
            break;

        case 'number':
            formattedValue = formatNumber(value, dataType, options);
            break;

        case 'boolean':
            formattedValue = formatBoolean(value, dataType, options);
            break;

        case 'datetime':
            formattedValue = display ? formatDateTime(value, dataType, options) : `'${formatDateTime(value, dataType, options)}'`;
            break;

        case 'object':
            formattedValue = formatObject(value, dataType, options);
            break;

        case 'binary':
            formattedValue = formatBinary(value, dataType, options);
            break;

        default:
            formattedValue = String(value);
    }

    if (display && cacheKey) {
        // Dodanie do cache
        cache.set(cacheKey, formattedValue);
    }

    return formattedValue;
};

// Funkcja pomocnicza do formatowania liczb
const formatNumber = (value: any, dataType: ColumnDataType, options: ValueToStringOptions): string => {
    if (!options.display || !options.thousandsSeparator) {
        return value.toString();
    }
    switch (dataType) {
        case 'decimal':
            return value instanceof Decimal
                ? formatDecimalWithThousandsSeparator(value)
                : formatDecimalWithThousandsSeparator(new Decimal(value));
        case 'money':
            return Number(value).toLocaleString(undefined, { style: 'currency' });
    }
    return value.toString();
};

// Funkcja pomocnicza do formatowania wartości boolean
const formatBoolean = (value: any, _dataType: ColumnDataType, _options: ValueToStringOptions): string => {
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    return String(value);
};

// Funkcja pomocnicza do formatowania daty/czasu
const formatDateTime = (value: any, dataType: ColumnDataType, _options: ValueToStringOptions): string => {
    const dateTime = () => {
        if (value instanceof Date) return DateTime.fromJSDate(value);
        if (typeof value === 'number' || typeof value === 'bigint') return DateTime.fromMillis(Number(value));
        return DateTime.fromObject(value);
    };

    switch (dataType) {
        case 'date':
            return dateTime().toISODate() ?? '';

        case 'time':
            return dateTime().toFormat('HH:mm:ss') ?? '';

        case 'duration':
            const duration = typeof value === 'number' || typeof value === 'bigint'
                ? Duration.fromMillis(Number(value))
                : Duration.fromObject(value);

            return duration.as('hours') >= 24
                ? duration.toFormat("yyyy-MM-dd hh:mm:ss SSS") ?? ''
                : duration.toFormat('hh:mm:ss SSS') ?? '';

        default:
            return dateTime().toSQL() ?? '';
    }
};

// Funkcja pomocnicza do formatowania obiektów
const formatObject = (value: any, dataType: ColumnDataType, _options: ValueToStringOptions): string => {
    if (dataType === 'json') {
        return JSON.stringify(value);
    }
    if (dataType === 'xml' || dataType === 'enum' || dataType === 'geometry') {
        return String(value);
    }
    return JSON.stringify(value);
};

// Funkcja pomocnicza do formatowania danych binarnych
const formatBinary = (value: any, _dataType: ColumnDataType, _options: ValueToStringOptions): string => {
    return value instanceof Blob ? URL.createObjectURL(value) : String(value);
};

const sample = (1000000.1).toLocaleString();
const match = sample.match(/1(.?)000(.?)000(.?)1/);
const thousandSeparator = match ? match[1] : ",";
const decimalSeparator = match ? match[3] : ".";

// Funkcja pomocnicza do formatowania liczb z separatorami
function formatDecimalWithThousandsSeparator(value: Decimal): string {
    const [intPart, fracPart] = value.toString().split(".");
    const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    return fracPart !== undefined ? `${intWithSep}${decimalSeparator}${fracPart}` : intWithSep;
}

// Funkcja pomocnicza do generowania haszy
export const generateHash = (value: any): string => {
    const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);
    return SparkMD5.hash(stringifiedValue);
};

export const compareValuesByType = (value1: any, value2: any, dataType: ColumnDataType): number => {
    const baseType = toBaseType(dataType);

    switch (baseType) {
        case 'string':
            return String(value1).localeCompare(String(value2));

        case 'number':
            try {
                const num1 = new Decimal(value1);
                const num2 = new Decimal(value2);
                return num1.lessThan(num2) ? -1 : num1.greaterThan(num2) ? 1 : 0;
            } catch (e) {
                return 0;
            }

        case 'boolean':
            try {
                const bool1 = Boolean(value1);
                const bool2 = Boolean(value2);
                return bool1 === bool2 ? 0 : bool1 ? 1 : -1;
            } catch (e) {
                return 0;
            }

        case 'datetime':
            try {
                const dateTime1 = value1 instanceof Date
                    ? DateTime.fromJSDate(value1)
                    : DateTime.fromISO(String(value1));
                const dateTime2 = value2 instanceof Date
                    ? DateTime.fromJSDate(value2)
                    : DateTime.fromISO(String(value2));
                return dateTime1.toMillis() < dateTime2.toMillis() ? -1 : dateTime1.toMillis() > dateTime2.toMillis() ? 1 : 0;
            } catch (e) {
                return 0;
            }

        case 'object':
            const str1 = JSON.stringify(value1);
            const str2 = JSON.stringify(value2);
            return str1.localeCompare(str2);

        case 'binary':
            const bin1 = value1 instanceof Blob ? value1.size : String(value1).length;
            const bin2 = value2 instanceof Blob ? value2.size : String(value2).length;
            return bin1 < bin2 ? -1 : bin1 > bin2 ? 1 : 0;

        default:
            return String(value1).localeCompare(String(value2));
    }
};