import Decimal from "decimal.js";
import { DateTime, Duration } from "luxon";

export type ColumnBaseType =
    'string'
    | 'number'
    | 'boolean'
    | 'datetime'
    | 'object'
    | 'binary';

const columnBaseTypes: readonly ColumnBaseType[] = [
    "string",
    "number",
    "boolean",
    "datetime",
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

export type ColumnDataType = ColumnStringType | ColumnNumberType | ColumnBooleanType | ColumnDateTimeType | ColumnObjectType | ColumnBinaryType;

export type ValuePrimitiveType =
    'string'
    | 'number'
    | 'bigint'
    | 'boolean'
    /** obiekt w tym array */
    | 'object';

export const dataTypeToGeneralType: Record<ColumnDataType, ColumnDataType> = {
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
    bit: 'boolean',
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

export const dataTypeToBaseType: Record<ColumnDataType, ColumnBaseType> = {
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
    bit: 'boolean',
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
        case 'string': return 'string';
        case 'number': return 'number';
        case 'bigint': return 'bigint';
        case 'boolean': return 'boolean';
        case 'object': return 'object';
        case 'undefined': return null;
        default: return null;
    }
}

export const toBaseType = (dataType: ColumnDataType): ColumnBaseType => {
    return dataTypeToBaseType[dataType];
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
export function getMostGeneralType(dataTypes: ColumnDataType[]): ColumnDataType {
    if (!dataTypes.length) return 'string'; // Jeśli brak subtypów, zwróć 'string'

    // Mapuj subtypy do typów ogólnych
    const mapped = dataTypes.map(t => dataTypeToGeneralType[t] ?? t);

    // Jeśli wszystkie ogólne typy są identyczne, zwróć ten typ
    const firstGeneral = mapped[0];
    if (mapped.every(t => t === firstGeneral)) {
        return firstGeneral;
    }

    // Priorytet typów ogólnych: najbardziej precyzyjne do najbardziej ogólnych
    const priority: ColumnDataType[] = [
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

function formatDecimalWithThousandsSeparator(value: Decimal): string {
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

export const valueToString = (value: any, dataType: ColumnDataType, nullValue?: string): string => {
    if (value === null || value === undefined) {
        return nullValue ?? '';
    }

    if (Array.isArray(value)) {
        return '[' + value.map(item => valueToString(item, dataType)).join(', ') + ']';
    }

    switch (toBaseType(dataType)) {
        case 'string':
            return String(value);
        case 'number':
            if (dataType === 'decimal') {
                if (value instanceof Decimal) {
                    return formatDecimalWithThousandsSeparator(value);
                }
                return formatDecimalWithThousandsSeparator(new Decimal(value));
            }
            if (dataType === 'money') {
                return Number(value).toLocaleString(undefined, { style: 'currency', });
            }
            if (dataType === 'bigint' || typeof value === 'bigint') {
                return value.toString();
            }
            return formatDecimalWithThousandsSeparator(new Decimal(value));
        case 'boolean':
            if (dataType === 'bit') {
                return value ? '1' : '0';
            }
            if (typeof value === 'boolean') {
                return value ? 'true' : 'false';
            }
            return String(value).toLowerCase() === 'true' ? 'true' : 'false';
        case 'datetime':
            if (value instanceof Date) {
                if (dataType === 'date') {
                    return DateTime.fromJSDate(value).toISODate() ?? '';
                } else if (dataType === 'time') {
                    return DateTime.fromJSDate(value).toFormat('HH:mm:ss') ?? '';
                }
                return DateTime.fromJSDate(value).toSQL() ?? '';
            } else if (typeof value === 'number' || typeof value === 'bigint') {
                if (dataType === 'date') {
                    return DateTime.fromMillis(Number(value)).toISODate() ?? '';
                } else if (dataType === 'time') {
                    return DateTime.fromMillis(Number(value)).toFormat('HH:mm:ss') ?? '';
                } else if (dataType === 'duration') {
                    if (typeof value === 'object') {
                        return Duration.fromObject(value).toFormat('hhhh-MM-dd hh:mm:ss SSS');
                    } else if (typeof value === 'number' || typeof value === 'bigint') {
                        return Duration.fromMillis(Number(value)).toFormat('hhhh-MM-dd hh:mm:ss SSS');
                    } else if (typeof value === 'string') {
                        return Duration.fromISO(value).toFormat('hhhh-MM-dd hh:mm:ss SSS');
                    }
                    return DateTime.fromMillis(Number(value)).toSQL() ?? '';
                }
                return value.toString();
            } else if (typeof value === 'object') {
                if (dataType === 'date') {
                    return DateTime.fromObject(value).toISODate() ?? '';
                } else if (dataType === 'time') {
                    return DateTime.fromObject(value).toFormat('HH:mm:ss') ?? '';
                } else if (dataType === 'duration') {
                    return Duration.fromObject(value).toFormat('hhhh-MM-dd hh:mm:ss SSS');
                }
                return DateTime.fromObject(value).toISODate() ?? '';
            }
            return String(value);
        case 'object':
            if (dataType === 'json') {
                if (typeof value === 'object') {
                    return JSON.stringify(value);
                }
                return String(value);
            } else if (dataType === 'xml') {
                // zakładamy, że value jest poprawnym XML-em
                return value.toString();
            } else if (dataType === 'enum') {
                // zakładamy, że value jest obiektem enum
                return JSON.stringify(value);
            } else if (dataType === 'geometry') {
                if (typeof value === 'object') {
                    // zakładamy, że value jest obiektem geojson
                    return JSON.stringify(value);
                }
                return String(value);
            }
            return JSON.stringify(value);
        case 'binary':
            return value instanceof Blob ? URL.createObjectURL(value) : String(value);
        default:
            return String(value);
    }
};