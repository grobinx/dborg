import { ColumnBaseType } from "./DataType";
import { ParameterPlaceholderStyle } from "./Driver";

export type ParamType = "named" | "positional" | "question";

/**
 * Informacje o parametrze SQL wyekstrahowanym z zapytania.
 */
export interface SqlParameterInfo {
    name: string | number;      // nazwa lub numer parametru
    position: number;           // indeks wystąpienia w zapytaniu (od 0)
    paramType: ParamType; // typ parametru
    index: number;      // indeks parametru w kolejności występowania (od 0)
}

/**
 * Wartość parametru SQL wraz z jego typem danych.
 */
export interface SqlParameterValue {
    type: ColumnBaseType;
    value: any;
}

export type SqlParametersValue = Record<string, SqlParameterValue>;

// Przykład funkcji wyciągającej parametry:
export function extractSqlParameters(query: string): SqlParameterInfo[] {
    // Zakresy stringów
    const stringRanges: Array<{ start: number; end: number }> = [];
    const regexString = /('([^']|\\')*')|("([^"]|\\")*")/g;
    let match: RegExpExecArray | null;

    while ((match = regexString.exec(query)) !== null) {
        stringRanges.push({ start: match.index, end: regexString.lastIndex });
    }

    // Zakresy komentarzy
    const commentRanges: Array<{ start: number; end: number }> = [];
    const regexLineComment = /--.*$/gm;
    const regexBlockComment = /\/\*[\s\S]*?\*\//g;

    while ((match = regexLineComment.exec(query)) !== null) {
        commentRanges.push({ start: match.index, end: regexLineComment.lastIndex });
    }
    while ((match = regexBlockComment.exec(query)) !== null) {
        commentRanges.push({ start: match.index, end: regexBlockComment.lastIndex });
    }

    function isInStringOrComment(index: number): boolean {
        return stringRanges.some(r => index >= r.start && index < r.end)
            || commentRanges.some(r => index >= r.start && index < r.end);
    }

    const params: SqlParameterInfo[] = [];
    const regexes: { re: RegExp; type: ParamType }[] = [
        { re: /:([a-zA-Z_][a-zA-Z0-9_]*)/g, type: "named" },
        { re: /@([a-zA-Z_][a-zA-Z0-9_]*)/g, type: "named" },
        { re: /\$([a-zA-Z_][a-zA-Z0-9_]*)/g, type: "named" },
        { re: /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, type: "named" },
        { re: /\$([0-9]+)/g, type: "positional" },
        { re: /\?/g, type: "question" },
    ];

    for (const { re, type } of regexes) {
        while ((match = re.exec(query)) !== null) {
            const idx = match.index;
            if (isInStringOrComment(idx)) continue;
            // IGNORUJ podwójny dwukropek (PostgreSQL cast)
            if (type === "named" && idx > 0 && query[idx - 1] === ":") continue;
            if (type === "named" && query.slice(idx, idx + 2) === "::") continue;
            if (type === "question") {
                params.push({ name: "?", position: idx, paramType: type, index: params.length });
            } else if (type === "positional") {
                params.push({ name: Number(match[1]), position: idx, paramType: type, index: params.length });
            } else if (match[1]) {
                params.push({ name: match[1], position: idx, paramType: type, index: params.length });
            }
        }
    }

    // Posortuj po pozycji wystąpienia w zapytaniu
    params.sort((a, b) => a.position - b.position);

    return params;
}

function makePlaceholder(template: ParameterPlaceholderStyle, index: number, name?: string | number): string {
    const idx = String(index);
    const nm = String(name ?? "");
    
    // Szablon mówi nam, jak formatować placeholder
    if (template === "$n") return "$" + idx;           // $1, $2, ...
    if (template === ":name") return ":" + nm;         // :SCHEMA_NAME, :id, ...
    if (template === "@name") return "@" + nm;         // @SCHEMA_NAME, @id, ...
    if (template === "$name") return "$" + nm;         // $SCHEMA_NAME, $id, ...
    if (template === "{name}") return "{" + nm + "}";  // {SCHEMA_NAME}, {id}, ...
    if (template === "?") return "?";                  // zawsze ?
    
    return template; // fallback
}

export function replaceNamedParamsWithPositional(
    sql: string,
    params: SqlParameterInfo[],
    parameterPlaceholder: ParameterPlaceholderStyle
): string {
    // Zamieniaj od końca, by nie przesuwać indeksów
    const sortedParams = [...params].sort((a, b) => b.position - a.position);

    let result = sql;
    for (const param of sortedParams) {
        // Ustaw placeholder na podstawie szablonu bazy
        const placeholder = makePlaceholder(parameterPlaceholder, param.index + 1, param.name);

        // Znajdź dopasowanie na pozycji param.position
        let match: string | null = null;
        let matchLength = 0;

        if (param.paramType === "named") {
            const name = String(param.name);
            const prefixes = [":", "@", "$", "{"];
            for (const prefix of prefixes) {
                const suffix = prefix === "{" ? "}" : "";
                const pattern = prefix + name + suffix;
                if (result.slice(param.position, param.position + pattern.length) === pattern) {
                    match = pattern;
                    matchLength = pattern.length;
                    break;
                }
            }
        } else if (param.paramType === "positional") {
            const pattern = "$" + String(param.name);
            if (result.slice(param.position, param.position + pattern.length) === pattern) {
                match = pattern;
                matchLength = pattern.length;
            }
        } else if (param.paramType === "question") {
            if (result[param.position] === "?") {
                match = "?";
                matchLength = 1;
            }
        }

        if (match) {
            result = result.slice(0, param.position) + placeholder + result.slice(param.position + matchLength);
        }
    }
    return result;
}

/**
 * Zwraca tablicę wartości ułożoną dokładnie w kolejności wystąpień
 * przekazanych parametrów (SqlParameterInfo[]).
 *
 * Mapa values powinna być keyed po:
 * - index (numeracja od 0): values[0], values[1], ...
 * - lub po unikatowych kluczach z dialogu: "id", "$1", "?", itp.
 *
 * Gdy brak wpisu w mapie — wstawia null.
 */
export function mapSqlParamsToValues(
    values: SqlParametersValue | Record<string, any>,
    params: SqlParameterInfo[]
): (any | null)[] {

    const resolve = (p: SqlParameterInfo): any | null => {
        // Najpierw spróbuj po indeksie (jeśli values keyed po index)
        if (p.index in values) {
            const v = values[p.index as any];
            return (typeof v === "object" && v && "value" in v) ? v.value : v;
        }

        // Potem spróbuj po grupach (named, positional, question)
        if (p.paramType === "named") {
            const key = String(p.name);
            if (key in values) {
                const v = values[key];
                return (typeof v === "object" && v && "value" in v) ? v.value : v;
            }
        }

        if (p.paramType === "positional") {
            const k1 = `$${p.name}`;
            if (k1 in values) {
                const v = values[k1];
                return (typeof v === "object" && v && "value" in v) ? v.value : v;
            }
            const k2 = String(p.name);
            if (k2 in values) {
                const v = values[k2];
                return (typeof v === "object" && v && "value" in v) ? v.value : v;
            }
            if (typeof p.name === "number" && p.name in values) {
                const v = (values as any)[p.name];
                return (typeof v === "object" && v && "value" in v) ? v.value : v;
            }
        }

        if (p.paramType === "question") {
            const kq = `?${p.index}`;
            if (kq in values) {
                const v = values[kq];
                return (typeof v === "object" && v && "value" in v) ? v.value : v;
            }
            if ("?" in values) {
                const v = values["?"];
                return (typeof v === "object" && v && "value" in v) ? v.value : v;
            }
        }

        return null;
    };

    return params.map(resolve);
}
