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
    | 'binary'
    // specjal type error for error caching and handling
    | "error";

export const columnBaseTypes: readonly ColumnBaseType[] = [
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

export const columnStringTypes: readonly ColumnStringType[] = [
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

// Prostsza normalizacja opcji i generowanie klucza cache
const DEFAULT_V2S_OPTIONS: Required<Pick<ValueToStringOptions, 'display' | 'thousandsSeparator'>> = {
    display: true,
    thousandsSeparator: true,
};

function makeCacheKey(value: any, dataType: UnionDataType, baseType: ColumnBaseType, thousandsSeparator: boolean): string {
    const t = typeof value;
    const canInline =
        (t === 'string' && value.length < 200) ||
        t === 'number' ||
        t === 'boolean' ||
        t === 'bigint';
    // dla liczb uwzględnij separator tysięcy w kluczu cache
    const sep = baseType === 'number' ? `|ts:${thousandsSeparator ? 1 : 0}` : '';
    return (canInline ? String(value) : generateHash(value)) + '-' + dataType + sep;
}

export const valueToString = (value: any, dataType: ColumnDataType, opts?: ValueToStringOptions): string => {
    if (value === null || value === undefined) return '';

    const options: ValueToStringOptions = { ...DEFAULT_V2S_OPTIONS, ...opts };
    const { maxLength = Infinity, display, thousandsSeparator = true } = options;

    if (typeof value === 'string' && value.length > maxLength) {
        value = value.substring(0, maxLength);
    }

    const resolvedType = Array.isArray(dataType) ? dataType[0] : dataType;

    if (Array.isArray(value)) {
        const out: string[] = [];
        let currentLen = 0;

        for (let i = 0; i < value.length; i++) {
            const s = valueToString(value[i], resolvedType, options);
            const addLen = (i > 0 ? 2 : 0) + s.length;
            if (i > 0 && currentLen + addLen > maxLength) {
                out.push('...');
                break;
            }
            out.push(s);
            currentLen += addLen;
        }
        return `[${out.join(', ')}]`;
    }

    const baseType = toBaseType(resolvedType);

    // Cache tylko dla trybu display
    let cacheKey: string | undefined;
    if (display) {
        cacheKey = makeCacheKey(value, resolvedType, baseType, thousandsSeparator);
        const hit = cache.get(cacheKey);
        if (hit) return hit;
    }

    let formatted: string;

    switch (baseType) {
        case 'string': {
            const s = typeof value === 'string' ? value : String(value);
            formatted = display ? s : `'${s}'`;
            break;
        }
        case 'number': {
            formatted = formatNumber(value, resolvedType, options);
            break;
        }
        case 'boolean': {
            formatted = formatBoolean(value, resolvedType, options);
            break;
        }
        case 'datetime': {
            const s = formatDateTime(value, resolvedType, options);
            formatted = display ? s : `'${s}'`;
            break;
        }
        case 'object': {
            formatted = formatObject(value, resolvedType, options);
            break;
        }
        case 'binary': {
            formatted = formatBinary(value, resolvedType, options);
            break;
        }
        default: {
            formatted = String(value);
        }
    }

    if (display && cacheKey) cache.set(cacheKey, formatted);
    return formatted;
};

// Pomocnicze: normalizacja DateTime/Duration i bezpieczne JSON
function normalizeDateTime(value: any): DateTime {
    if (DateTime.isDateTime(value)) return value;
    if (value instanceof Date) return DateTime.fromJSDate(value);
    if (typeof value === 'number' || typeof value === 'bigint') return DateTime.fromMillis(Number(value));
    if (typeof value === 'string') {
        const iso = DateTime.fromISO(value, { setZone: true });
        return iso.isValid ? iso : DateTime.fromSQL(value);
    }
    if (value && typeof value === 'object') return DateTime.fromObject(value);
    return DateTime.invalid('Invalid');
}

function normalizeDuration(value: any): Duration {
    if (Duration.isDuration(value)) return value;
    if (typeof value === 'number' || typeof value === 'bigint') return Duration.fromMillis(Number(value));
    if (typeof value === 'string') {
        const iso = Duration.fromISO(value);
        return iso.isValid ? iso : Duration.invalid('Invalid');
    }
    if (value && typeof value === 'object') return Duration.fromObject(value);
    return Duration.invalid('Invalid');
}

function safeStringify(value: any): string {
    try {
        const seen = new WeakSet();
        return JSON.stringify(value, (_k, v) => {
            if (typeof v === 'object' && v !== null) {
                if (seen.has(v)) return '[Circular]';
                seen.add(v);
            }
            return v;
        });
    } catch {
        return String(value);
    }
}

// Funkcja pomocnicza do formatowania liczb
const formatNumber = (value: any, _dataType: ColumnDataType, options: ValueToStringOptions): string => {
    // szybkie ścieżki dla number/bigint
    if (typeof value === 'number' && Number.isFinite(value)) {
        if (options.display && options.thousandsSeparator && Number.isInteger(value)) {
            return formatIntWithThousandsSeparator(value);
        }
        return String(value);
    }
    if (typeof value === 'bigint') {
        const s = value.toString();
        return options.display && options.thousandsSeparator ? formatIntWithThousandsSeparator(s) : s;
    }
    // ogólna ścieżka: Decimal
    try {
        const dec = value instanceof Decimal ? value : new Decimal(value);
        if (!options.display || !options.thousandsSeparator) return dec.toString();
        return formatDecimalWithThousandsSeparator(dec);
    } catch {
        return String(value);
    }
};

// Funkcja pomocnicza do formatowania wartości boolean
const formatBoolean = (value: any, _dataType: ColumnDataType, _options: ValueToStringOptions): string => {
    return value === true ? 'true' : value === false ? 'false' : String(value);
};

// Funkcja pomocnicza do formatowania daty/czasu
const formatDateTime = (value: any, dataType: ColumnDataType, _options: ValueToStringOptions): string => {
    const t = Array.isArray(dataType) ? dataType[0] : dataType;

    if (t === 'duration') {
        const dur = normalizeDuration(value);
        if (!dur.isValid) return String(value);
        // Zachowanie: krótszy format dla <24h, dłuższy dla >=24h
        return dur.as('hours') >= 24
            ? dur.toFormat("d:hh:mm:ss SSS") || ''
            : dur.toFormat("hh:mm:ss SSS") || '';
    }

    const dt = normalizeDateTime(value);
    if (!dt.isValid) return String(value);

    switch (t) {
        case 'date':
            return dt.toISODate() || '';
        case 'time':
            return dt.toFormat('HH:mm:ss') || '';
        default:
            // domyślnie SQL-friendly
            return dt.toSQL() || '';
    }
};

// Funkcja pomocnicza do formatowania obiektów
const formatObject = (value: any, dataType: ColumnDataType, _options: ValueToStringOptions): string => {
    const t = Array.isArray(dataType) ? dataType[0] : dataType;
    if (t === 'xml' || t === 'enum' || t === 'geometry') return String(value);
    // json i inne obiekty – bezpieczne stringify
    return safeStringify(value);
};

// Funkcja pomocnicza do formatowania danych binarnych
const formatBinary = (value: any, _dataType: ColumnDataType, _options: ValueToStringOptions): string => {
    // unikanie createObjectURL (wycieki). Zwracaj krótką informację tekstową.
    if (typeof Blob !== 'undefined' && value instanceof Blob) {
        return `Blob(${value.size}B)`;
    }
    if (typeof Buffer !== 'undefined' && typeof (value?.length) === 'number') {
        return `Binary(${value.length}B)`;
    }
    return String(value);
};

// Lokalno-zależne separatory
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

function formatIntWithThousandsSeparator(n: number | string | bigint): string {
    const s = typeof n === 'string' ? n : n.toString();
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
}

// Funkcja pomocnicza do generowania haszy
export const generateHash = (value: any): string => {
    const stringifiedValue = typeof value === 'string' ? value : safeStringify(value);
    return SparkMD5.hash(stringifiedValue);
};

export const compareValuesByType = (value1: any, value2: any, dataType: ColumnDataType): number => {
    const baseType = toBaseType(dataType);

    switch (baseType) {
        case 'string': {
            const a = typeof value1 === "string" ? value1 : String(value1);
            const b = typeof value2 === "string" ? value2 : String(value2);
            return a < b ? -1 : a > b ? 1 : 0;
        }
        case 'number': {
            // szybka ścieżka gdy to zwykłe liczby
            if (typeof value1 === 'number' && typeof value2 === 'number' && Number.isFinite(value1) && Number.isFinite(value2)) {
                return value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
            }
            try {
                const num1 = new Decimal(value1);
                const num2 = new Decimal(value2);
                return num1.lessThan(num2) ? -1 : num1.greaterThan(num2) ? 1 : 0;
            } catch {
                return 0;
            }
        }
        case 'boolean': {
            const a = value1 === true ? 1 : value1 ? 1 : 0;
            const b = value2 === true ? 1 : value2 ? 1 : 0;
            return a - b;
        }
        case 'datetime': {
            const d1 = normalizeDateTime(value1);
            const d2 = normalizeDateTime(value2);
            const a = d1.isValid ? d1.toMillis() : Number.NaN;
            const b = d2.isValid ? d2.toMillis() : Number.NaN;
            if (Number.isNaN(a) || Number.isNaN(b)) return String(value1).localeCompare(String(value2));
            return a < b ? -1 : a > b ? 1 : 0;
        }
        case 'object': {
            const a = safeStringify(value1);
            const b = safeStringify(value2);
            return a < b ? -1 : a > b ? 1 : 0;
        }
        case 'binary': {
            const len = (v: any) =>
                (typeof Blob !== 'undefined' && v instanceof Blob) ? v.size :
                (typeof Buffer !== 'undefined' && typeof v?.length === 'number') ? v.length :
                String(v).length;
            const a = len(value1), b = len(value2);
            return a < b ? -1 : a > b ? 1 : 0;
        }
        default:
            return String(value1).localeCompare(String(value2));
    }
};