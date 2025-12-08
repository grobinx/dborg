import { ParameterPlaceholderStyle } from "./Driver";

// Możesz użyć takiego typu:
export interface SqlParameterInfo {
    name: string | number;      // nazwa lub numer parametru
    position: number;           // indeks wystąpienia w zapytaniu (od 0)
    paramType: "named" | "positional" | "question"; // typ parametru
}

// Przykład funkcji wyciągającej parametry:
export function extractSqlParameters(query: string): SqlParameterInfo[] {
    // Zakresy stringów
    const stringRanges: Array<{ start: number; end: number }> = [];
    const regexString = /('([^']|\\')*')|("([^"]|\\")*")/g;
    let match: RegExpExecArray | null;

    while ((match = regexString.exec(query)) !== null) {
        stringRanges.push({ start: match.index, end: regexString.lastIndex });
    }
    function isInString(index: number): boolean {
        return stringRanges.some(r => index >= r.start && index < r.end);
    }

    const params: SqlParameterInfo[] = [];
    const regexes: { re: RegExp; type: "named" | "positional" | "question" }[] = [
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
            if (isInString(idx)) continue;
            // IGNORUJ podwójny dwukropek (PostgreSQL cast)
            if (type === "named" && idx > 0 && query[idx - 1] === ":") continue;
            if (type === "named" && query.slice(idx, idx + 2) === "::") continue;
            if (type === "question") {
                params.push({ name: "?", position: idx, paramType: type });
            } else if (type === "positional") {
                params.push({ name: Number(match[1]), position: idx, paramType: type });
            } else if (match[1]) {
                params.push({ name: match[1], position: idx, paramType: type });
            }
        }
    }

    // Posortuj po pozycji wystąpienia w zapytaniu
    params.sort((a, b) => a.position - b.position);

    return params;
}

function makePlaceholder(template: ParameterPlaceholderStyle, nameOrIndex: string | number): string {
    if (template.includes("$n")) return template.replace("$n", String(nameOrIndex));
    if (template.includes(":name")) return template.replace(":name", String(nameOrIndex));
    if (template.includes("@name")) return template.replace("@name", String(nameOrIndex));
    if (template.includes("$name")) return template.replace("$name", String(nameOrIndex));
    if (template.includes("{name}")) return template.replace("{name}", String(nameOrIndex));
    return template; // np. "?"
}

export function replaceNamedParamsWithPositional(
    sql: string,
    params: SqlParameterInfo[],
    parameterPlaceholder: ParameterPlaceholderStyle
): string {
    // Znajdź zakresy stringów
    const stringRanges: Array<{ start: number; end: number }> = [];
    const regexString = /('([^']|\\')*')|("([^"]|\\")*")/g;
    let match: RegExpExecArray | null;
    
    while ((match = regexString.exec(sql)) !== null) {
        stringRanges.push({ start: match.index, end: regexString.lastIndex });
    }
    function isInString(index: number): boolean {
        return stringRanges.some(r => index >= r.start && index < r.end);
    }

    // Mapuj nazwane parametry na kolejne numery pozycyjne
    const nameToIndex = new Map<string | number, number>();
    let index = 1;
    for (const param of params) {
        if (param.paramType === "named" && !nameToIndex.has(param.name)) {
            nameToIndex.set(param.name, index++);
        }
    }

    // Zamiana od końca, by nie przesuwać indeksów
    const sortedParams = params
        .filter(p => p.paramType === "named")
        .sort((a, b) => b.position - a.position);

    let newSql = sql;
    for (const param of sortedParams) {
        if (isInString(param.position)) continue;
        const regex = new RegExp(
            `([:@\\$])${param.name}\\b`,
            "g"
        );
        newSql = newSql.replace(regex, makePlaceholder(parameterPlaceholder, nameToIndex.get(param.name)!));
    }
    return newSql;
}
