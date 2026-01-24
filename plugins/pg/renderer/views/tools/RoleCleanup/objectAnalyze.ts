import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { ObjType } from "./roleAudit";
import { versionToNumber } from "../../../../../../src/api/version";
import { t } from "i18next";

export interface DependencyInfo {
    dependent_objects: Array<{
        objtype: string;
        schema: string | null;
        name: string;
        identity: string;
        dependency_type: 'normal' | 'auto' | 'internal' | 'pin' | 'extension';
    }>;
    referenced_by: Array<{
        objtype: string;
        schema: string | null;
        name: string;
        identity: string;
        dependency_type: 'normal' | 'auto' | 'internal' | 'pin' | 'extension';
    }>;
    requires_cascade: boolean;
    safe_to_drop: boolean;
}

/**
 * analyzeDependencies - analizuje zależności obiektów używając pg_depend:
 *
 * Zwraca obiekty zależne (wymagające CASCADE)
 * Zwraca obiekty, od których dany obiekt zależy
 * Określa czy DROP wymaga CASCADE
 * Ocenia bezpieczeństwo usunięcia
 * @param session 
 * @param objtype 
 * @param schema 
 * @param name 
 * @param versionNumber 
 * @returns 
 */
export async function analyzeDependencies(
    session: IDatabaseSession,
    objtype: ObjType,
    schema: string | null,
    name: string,
): Promise<DependencyInfo> {
    let targetOidQuery = '';

    // Zapytanie do znalezienia OID obiektu
    switch (objtype) {
        case 'table':
        case 'view':
        case 'matview':
        case 'sequence':
        case 'foreign_table':
            targetOidQuery = `
                SELECT c.oid 
                FROM pg_class c 
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = $1 AND c.relname = $2
            `;
            break;
        case 'function':
            // Dla funkcji name zawiera sygnaturę
            targetOidQuery = `
                SELECT p.oid
                FROM pg_proc p
                JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = $1 
                and format('%I(%s)', p.proname, pg_get_function_identity_arguments(p.oid)) = $2
            `;
            break;
        case 'type':
        case 'domain':
            targetOidQuery = `
                SELECT t.oid
                FROM pg_type t
                JOIN pg_namespace n ON n.oid = t.typnamespace
                WHERE n.nspname = $1 AND t.typname = $2
            `;
            break;
        case 'schema':
            targetOidQuery = `SELECT oid FROM pg_namespace WHERE nspname = $1`;
            break;
        case 'extension':
            targetOidQuery = `SELECT oid FROM pg_extension WHERE extname = $1`;
            break;
        case 'fdw':
            targetOidQuery = `SELECT oid FROM pg_foreign_data_wrapper WHERE fdwname = $1`;
            break;
        case 'server':
            targetOidQuery = `SELECT oid FROM pg_foreign_server WHERE srvname = $1`;
            break;
        case 'language':
            targetOidQuery = `SELECT oid FROM pg_language WHERE lanname = $1`;
            break;
        case 'database':
            targetOidQuery = `SELECT oid FROM pg_database WHERE datname = $1`;
            break;
        default:
            return {
                dependent_objects: [],
                referenced_by: [],
                requires_cascade: false,
                safe_to_drop: true
            };
    }

    // Zapytanie o zależności
    const sql = `
        WITH target AS (
            ${targetOidQuery}
        ),
        -- Obiekty zależne OD naszego obiektu (inne obiekty mają zależność do nas)
        -- Gdy dropujemy nasz obiekt, te obiekty też muszą być dropnięte (CASCADE)
        deps_out AS (
            SELECT 
                d.deptype,
                d.objid,
                d.classid
            FROM pg_depend d
            JOIN target t ON t.oid = d.refobjid
            WHERE d.deptype IN ('n', 'a', 'i', 'e', 'p')
              AND d.objid != t.oid
              AND d.objid != 0  -- wyklucz systemowe zależności
        ),
        -- Obiekty od których nasz obiekt ZALEŻY (nasz obiekt ma zależność do innych)
        deps_in AS (
            SELECT 
                d.deptype,
                d.refobjid,
                d.refclassid
            FROM pg_depend d
            JOIN target t ON t.oid = d.objid
            WHERE d.deptype IN ('n', 'a', 'i', 'e', 'p')
              AND d.refobjid != t.oid
              AND d.refobjid != 0  -- wyklucz systemowe zależności
        )
        SELECT 
            'out' as direction,
            CASE 
                WHEN c.relkind = 'r' THEN 'table'
                WHEN c.relkind = 'v' THEN 'view'
                WHEN c.relkind = 'm' THEN 'matview'
                WHEN c.relkind = 'S' THEN 'sequence'
                WHEN c.relkind = 'f' THEN 'foreign_table'
                WHEN p.oid IS NOT NULL THEN 'function'
                WHEN t.oid IS NOT NULL THEN CASE t.typtype WHEN 'd' THEN 'domain' ELSE 'type' END
                WHEN ns.oid IS NOT NULL THEN 'schema'
                WHEN e.oid IS NOT NULL THEN 'extension'
                ELSE 'unknown'
            END as objtype,
            COALESCE(n.nspname, '') as schema,
            COALESCE(c.relname, p.proname, t.typname, ns.nspname, e.extname, '') as name,
            CASE
                WHEN c.oid IS NOT NULL AND n.nspname IS NOT NULL THEN format('%I.%I', n.nspname, c.relname)
                WHEN p.oid IS NOT NULL AND pn.nspname IS NOT NULL THEN format('%I.%I(%s)', pn.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
                WHEN t.oid IS NOT NULL AND tn.nspname IS NOT NULL THEN format('%I.%I', tn.nspname, t.typname)
                WHEN ns.oid IS NOT NULL THEN format('%I', ns.nspname)
                WHEN e.oid IS NOT NULL THEN e.extname
                ELSE ''
            END as identity,
            CASE d.deptype
                WHEN 'n' THEN 'normal'
                WHEN 'a' THEN 'auto'
                WHEN 'i' THEN 'internal'
                WHEN 'e' THEN 'extension'
                WHEN 'p' THEN 'pin'
                ELSE 'unknown'
            END as dependency_type
        FROM deps_out d
        LEFT JOIN pg_class c ON c.oid = d.objid AND d.classid = 'pg_class'::regclass
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_proc p ON p.oid = d.objid AND d.classid = 'pg_proc'::regclass
        LEFT JOIN pg_namespace pn ON pn.oid = p.pronamespace
        LEFT JOIN pg_type t ON t.oid = d.objid AND d.classid = 'pg_type'::regclass
        LEFT JOIN pg_namespace tn ON tn.oid = t.typnamespace
        LEFT JOIN pg_namespace ns ON ns.oid = d.objid AND d.classid = 'pg_namespace'::regclass
        LEFT JOIN pg_extension e ON e.oid = d.objid AND d.classid = 'pg_extension'::regclass
        WHERE COALESCE(c.oid, p.oid, t.oid, ns.oid, e.oid) IS NOT NULL  -- tylko znalezione obiekty
        
        UNION ALL
        
        SELECT 
            'in' as direction,
            CASE 
                WHEN c.relkind = 'r' THEN 'table'
                WHEN c.relkind = 'v' THEN 'view'
                WHEN c.relkind = 'm' THEN 'matview'
                WHEN c.relkind = 'S' THEN 'sequence'
                WHEN c.relkind = 'f' THEN 'foreign_table'
                WHEN p.oid IS NOT NULL THEN 'function'
                WHEN t.oid IS NOT NULL THEN CASE t.typtype WHEN 'd' THEN 'domain' ELSE 'type' END
                WHEN ns.oid IS NOT NULL THEN 'schema'
                WHEN e.oid IS NOT NULL THEN 'extension'
                ELSE 'unknown'
            END as objtype,
            COALESCE(n.nspname, '') as schema,
            COALESCE(c.relname, p.proname, t.typname, ns.nspname, e.extname, '') as name,
            CASE
                WHEN c.oid IS NOT NULL AND n.nspname IS NOT NULL THEN format('%I.%I', n.nspname, c.relname)
                WHEN p.oid IS NOT NULL AND pn.nspname IS NOT NULL THEN format('%I.%I(%s)', pn.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
                WHEN t.oid IS NOT NULL AND tn.nspname IS NOT NULL THEN format('%I.%I', tn.nspname, t.typname)
                WHEN ns.oid IS NOT NULL THEN format('%I', ns.nspname)
                WHEN e.oid IS NOT NULL THEN e.extname
                ELSE ''
            END as identity,
            CASE d.deptype
                WHEN 'n' THEN 'normal'
                WHEN 'a' THEN 'auto'
                WHEN 'i' THEN 'internal'
                WHEN 'e' THEN 'extension'
                WHEN 'p' THEN 'pin'
                ELSE 'unknown'
            END as dependency_type
        FROM deps_in d
        LEFT JOIN pg_class c ON c.oid = d.refobjid AND d.refclassid = 'pg_class'::regclass
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_proc p ON p.oid = d.refobjid AND d.refclassid = 'pg_proc'::regclass
        LEFT JOIN pg_namespace pn ON pn.oid = p.pronamespace
        LEFT JOIN pg_type t ON t.oid = d.refobjid AND d.refclassid = 'pg_type'::regclass
        LEFT JOIN pg_namespace tn ON tn.oid = t.typnamespace
        LEFT JOIN pg_namespace ns ON ns.oid = d.refobjid AND d.refclassid = 'pg_namespace'::regclass
        LEFT JOIN pg_extension e ON e.oid = d.refobjid AND d.refclassid = 'pg_extension'::regclass
        WHERE COALESCE(c.oid, p.oid, t.oid, ns.oid, e.oid) IS NOT NULL  -- tylko znalezione obiekty
    `;

    const params = (schema && objtype !== "schema") ? [schema, name] : [name];
    const { rows } = await session.query<any>(sql, params);

    const dependent_objects = rows
        .filter((r: any) => r.direction === 'out' && r.objtype !== 'unknown')
        .map((r: any) => ({
            objtype: r.objtype,
            schema: r.schema || null,
            name: r.name,
            identity: r.identity,
            dependency_type: r.dependency_type as any
        }));

    const referenced_by = rows
        .filter((r: any) => r.direction === 'in' && r.objtype !== 'unknown')
        .map((r: any) => ({
            objtype: r.objtype,
            schema: r.schema || null,
            name: r.name,
            identity: r.identity,
            dependency_type: r.dependency_type as any
        }));

    // Wymaga CASCADE jeśli są normalne zależności (nie auto/internal/pin)
    const requires_cascade = dependent_objects.some(
        d => d.dependency_type === 'normal'
    );

    // Bezpieczny do dropnięcia jeśli:
    // 1. Nie ma żadnych zależności wychodzących (dependent_objects pusta)
    // 2. Lub wszystkie zależności są auto/internal/pin (nie normal/extension)
    const safe_to_drop = dependent_objects.length === 0 ||
        dependent_objects.every(d => ['auto', 'internal', 'pin'].includes(d.dependency_type));

    return {
        dependent_objects,
        referenced_by,
        requires_cascade,
        safe_to_drop
    };
}

export interface CodeUsage {
    type: 'view' | 'function' | 'trigger' | 'constraint' | 'index' | 'rule';
    location: string;
    code_snippet?: string;
    full_definition?: string;
}

/**
 * findUsagesInCode - wyszukuje odwołania w kodzie:
 *
 * Definicje widoków
 * Ciała funkcji
 * Triggery
 * Constraints CHECK
 * Indeksy częściowe
 * Rules
 * @param session 
 * @param schema 
 * @param name 
 * @returns 
 */
export async function findUsagesInCode(
    session: IDatabaseSession,
    schema: string,
    name: string
): Promise<CodeUsage[]> {
    const databases = await session.getMetadata();
    const schemas = Object.values(databases).find(database => database.connected)?.schemas;

    const usages: CodeUsage[] = [];

    for (const schema of Object.values(schemas || {})) {
        for (const routines of Object.values(schema.routines || {})) {
            for (const overload of routines) {
                if (overload.identifiers?.some(word => word.toLowerCase() === name.toLowerCase())) {
                    usages.push({
                        type: "function",
                        location: overload.identity!,
                    });
                }
            }
        }
        for (const view of Object.values(schema.relations || {})) {
            if (view.type === 'view') {
                if (view.identifiers?.some(word => word.toLowerCase() === name.toLowerCase())) {
                    usages.push({
                        type: 'view',
                        location: view.identity!,
                    });
                }
            }
        }
    }

    return usages;
}

export interface TableStats {
    row_count: number;
    size_bytes: number;
    size_pretty: string;
    last_vacuum: Date | null;
    last_analyze: Date | null;
    seq_scan_count: number;
    idx_scan_count: number;
    n_tup_ins: number;
    n_tup_upd: number;
    n_tup_del: number;
    n_live_tup: number;
    n_dead_tup: number;
}

/**
 * getTableStats - pobiera statystyki tabeli z pg_stat_user_tables:
 *
 * Liczba wierszy i rozmiar
 * Daty ostatniego VACUUM/ANALYZE
 * Liczniki skanów (seq/idx)
 * Statystyki operacji DML
 * Liczba żywych/martwych krotek
 * @param session 
 * @param schema 
 * @param tableName 
 * @returns 
 */
export async function getTableStats(
    session: IDatabaseSession,
    schema: string,
    tableName: string
): Promise<TableStats | null> {
    const sql = `
        SELECT 
            COALESCE(c.reltuples::bigint, 0) as row_count,
            COALESCE(pg_total_relation_size(c.oid), 0) as size_bytes,
            pg_size_pretty(COALESCE(pg_total_relation_size(c.oid), 0)) as size_pretty,
            st.last_vacuum,
            st.last_analyze,
            COALESCE(st.seq_scan, 0) as seq_scan_count,
            COALESCE(st.idx_scan, 0) as idx_scan_count,
            COALESCE(st.n_tup_ins, 0) as n_tup_ins,
            COALESCE(st.n_tup_upd, 0) as n_tup_upd,
            COALESCE(st.n_tup_del, 0) as n_tup_del,
            COALESCE(st.n_live_tup, 0) as n_live_tup,
            COALESCE(st.n_dead_tup, 0) as n_dead_tup
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_stat_user_tables st ON st.relid = c.oid
        WHERE n.nspname = $1 AND c.relname = $2
        AND c.relkind IN ('r', 'p')
    `;

    const { rows } = await session.query<any>(sql, [schema, tableName]);
    if (rows.length === 0) return null;

    return rows[0];
}

export interface SecurityContext {
    is_security_definer: boolean;
    owner: string | null;
    execute_as: 'invoker' | 'definer';
    language: string;
    volatility: 'immutable' | 'stable' | 'volatile';
    parallel_safe: boolean;
}

/**
 * checkSecurityContext - sprawdza kontekst bezpieczeństwa funkcji:
 *
 * SECURITY DEFINER vs INVOKER
 * Właściciel funkcji
 * Język implementacji
 * Volatility (immutable/stable/volatile)
 * Parallel safety (PG 9.6+)
 * @param session 
 * @param objtype 
 * @param identity 
 * @param versionNumber 
 * @returns 
 */
export async function checkSecurityContext(
    session: IDatabaseSession,
    objtype: ObjType,
    schemaName: string,
    name: string,
    identity: string,
): Promise<SecurityContext | null> {
    if (objtype !== 'function') {
        return null;
    }

    const databases = await session.getMetadata();
    const schemas = Object.values(databases).find(database => database.connected)?.schemas;

    const usages: CodeUsage[] = [];

    const schema = schemas?.[schemaName];
    if (schema) {
        const routines = schema.routines?.[name];
        if (routines) {
            for (const overload of routines) {
                if (overload.identity === identity) {
                    return {
                        is_security_definer: overload.data?.is_security_definer || false,
                        owner: overload.owner || null,
                        execute_as: overload.data?.execute_as || 'invoker',
                        language: overload.data?.language || 'unknown',
                        volatility: overload.data?.volatility || 'volatile',
                        parallel_safe: overload.data?.parallel_safe || false,
                    };
                }
            }
        }
    }

    return null;
}

export type RiskLevel = "none" | "low" | "medium" | "high" | "critical";

export interface RiskAssessment {
    level: RiskLevel;
    reasons: string[];
    warnings: string[];
}

/**
 * Ocenia ryzyko na podstawie zależności obiektów
 */
export function assessDependencyRisk(depInfo: DependencyInfo | undefined): RiskAssessment {
    if (!depInfo) {
        return { level: "none", reasons: [t("no-analysis", "No analysis performed")], warnings: [] };
    }

    const reasons: string[] = [];
    const warnings: string[] = [];

    if (depInfo.safe_to_drop) {
        reasons.push(t("no-dependencies", "No dependencies"));
        return { level: "low", reasons, warnings };
    }

    // Wylicz liczbę zależności
    const depCount = depInfo.dependent_objects.length;
    const normalDeps = depInfo.dependent_objects.filter(d => d.dependency_type === "normal").length;

    if (normalDeps > 0) {
        warnings.push(t("normal-dependencies-cascade-required", "{{count}} object(s) have normal dependency - CASCADE required", { count: normalDeps }));
    }

    if (depCount > 10) {
        reasons.push(t("many-dependencies", "Many dependencies: {{count}} objects", { count: depCount }));
        return { level: "critical", reasons, warnings };
    }

    if (depCount > 5) {
        reasons.push(t("medium-dependencies", "Medium number of dependencies: {{count}} objects", { count: depCount }));
        return { level: "high", reasons, warnings };
    }

    if (depCount > 0) {
        reasons.push(t("dependent-objects", "Dependent objects: {{count}}", { count: depCount }));
        return { level: "medium", reasons, warnings };
    }

    return { level: "low", reasons: [t("no-normal-dependencies", "No normal dependencies")], warnings };
}

/**
 * Ocenia ryzyko na podstawie użyć w kodzie
 */
export function assessCodeUsageRisk(codeUsages: CodeUsage[] | undefined): RiskAssessment {
    if (!codeUsages || codeUsages.length === 0) {
        return { level: "none", reasons: [t("no-code-usage", "No code usage")], warnings: [] };
    }

    const reasons: string[] = [];
    const warnings: string[] = [];

    const typeCount: Record<string, number> = {};
    for (const usage of codeUsages) {
        typeCount[usage.type] = (typeCount[usage.type] || 0) + 1;
    }

    const totalCount = codeUsages.length;

    // Funkcje wywołujące się nawzajem - wysokie ryzyko
    if (typeCount["function"] && typeCount["function"] > 3) {
        warnings.push(t("many-functions-using-object", "Many functions use this object: {{count}}", { count: typeCount["function"] }));
        reasons.push(t("dependent-functions", "Dependent functions: {{count}}", { count: typeCount["function"] }));
        return { level: "critical", reasons, warnings };
    }

    // Widoki - średnie ryzyko
    if (typeCount["view"] && typeCount["view"] > 2) {
        warnings.push(t("many-views-using-object", "{{count}} views use this object", { count: typeCount["view"] }));
        reasons.push(t("dependent-views", "Dependent views: {{count}}", { count: typeCount["view"] }));
        return { level: "high", reasons, warnings };
    }

    // Triggery - wysokie ryzyko
    if (typeCount["trigger"] && typeCount["trigger"] > 0) {
        warnings.push(t("many-triggers-using-object", "{{count}} triggers use this object", { count: typeCount["trigger"] }));
        reasons.push(t("dependent-triggers", "Dependent triggers: {{count}}", { count: typeCount["trigger"] }));
        return { level: "high", reasons, warnings };
    }

    // Constraints - średnie ryzyko
    if (typeCount["constraint"] && typeCount["constraint"] > 2) {
        warnings.push(t("many-constraints-using-object", "{{count}} constraints use this object", { count: typeCount["constraint"] }));
        reasons.push(t("dependent-constraints", "Dependent constraints: {{count}}", { count: typeCount["constraint"] }));
        return { level: "medium", reasons, warnings };
    }

    if (totalCount > 5) {
        reasons.push(t("many-code-usages", "Many code usages: {{count}}", { count: totalCount }));
        return { level: "medium", reasons, warnings };
    }

    if (totalCount > 0) {
        reasons.push(t("code-usage", "Code usage: {{count}}", { count: totalCount }));
        return { level: "low", reasons, warnings };
    }

    return { level: "low", reasons: [t("no-code-usage", "No code usage")], warnings };
}

/**
 * Ocenia ryzyko na podstawie statystyk tabeli
 */
export function assessTableStatsRisk(tableStats: TableStats | null | undefined): RiskAssessment {
    if (!tableStats) {
        return { level: "none", reasons: [t("no-table-stats", "No table statistics available")], warnings: [] };
    }

    const reasons: string[] = [];
    const warnings: string[] = [];

    // Bardzo dużą tabelę
    if (tableStats.row_count > 1000000) {
        warnings.push(t("very-large-table", "Very large table: {{count}}M rows", { count: Number((tableStats.row_count / 1000000).toFixed(2)) }));
        reasons.push(t("table-size", "Table size: {{size}}", { size: tableStats.size_pretty }));
        return { level: "critical", reasons, warnings };
    }

    // Duża tabela
    if (tableStats.row_count > 100000) {
        warnings.push(t("large-table", "Large table: {{count}}K rows", { count: Number((tableStats.row_count / 1000).toFixed(0)) }));
        reasons.push(t("table-size", "Table size: {{size}}", { size: tableStats.size_pretty }));
        return { level: "high", reasons, warnings };
    }

    // Średnia tabela
    if (tableStats.row_count > 10000) {
        reasons.push(t("medium-table", "Medium table: {{count}}K rows", { count: Number((tableStats.row_count / 1000).toFixed(0)) }));
        return { level: "medium", reasons, warnings };
    }

    // Sprawdź martwą pamięć
    // if (tableStats.n_live_tup > 0) {
    //     const deadRatio = (tableStats.n_dead_tup / tableStats.n_live_tup);
    //     if (deadRatio > 0.5) {
    //         warnings.push(t("many-dead-tuples", "Many dead tuples: {{percent}}%", { percent: Number((deadRatio * 100).toFixed(1)) }));
    //         reasons.push(t("requires-vacuum", "Requires VACUUM: {{count}} dead rows", { count: tableStats.n_dead_tup }));
    //         return { level: "medium", reasons, warnings };
    //     }
    // }

    // Sprawdź ostatni VACUUM
    // if (tableStats.last_vacuum) {
    //     const daysSinceVacuum = (Date.now() - tableStats.last_vacuum.getTime()) / (1000 * 60 * 60 * 24);
    //     if (daysSinceVacuum > 30) {
    //         warnings.push(t("vacuum-performed-days-ago", "VACUUM performed {{days}} days ago", { days: Number(daysSinceVacuum.toFixed(0)) }));
    //     }
    // } else {
    //     warnings.push(t("vacuum-never-performed", "VACUUM has never been performed"));
    // }

    // Tabela nie jest intensywnie używana
    if (tableStats.seq_scan_count === 0 && tableStats.idx_scan_count === 0) {
        reasons.push(t("table-not-scanned", "Table is not scanned - may be unused"));
        return { level: "low", reasons, warnings };
    }

    if (tableStats.row_count > 0) {
        reasons.push(t("table-has-data", "Table contains data: {{count}} rows", { count: tableStats.row_count }));
        return { level: "low", reasons, warnings };
    } else if (!tableStats.last_analyze) {
        warnings.push(t("table-never-analyzed", "Table has never been analyzed"));
    }

    return { level: "low", reasons: [t("empty-table", "Empty table")], warnings };
}

/**
 * Ocenia ryzyko na podstawie kontekstu bezpieczeństwa funkcji
 */
export function assessSecurityContextRisk(securityContext: SecurityContext | null | undefined): RiskAssessment {
    if (!securityContext) {
        return { level: "none", reasons: [t("no-security-data", "No security data available")], warnings: [] };
    }

    const reasons: string[] = [];
    const warnings: string[] = [];

    // SECURITY DEFINER z superuserem - krytyczne
    if (securityContext.is_security_definer && securityContext.owner === "postgres") {
        warnings.push(t("security-definer-postgres-owner", "SECURITY DEFINER owned by postgres"));
        warnings.push(t("function-has-superuser-privileges", "Function has superuser privileges"));
        reasons.push(t("function-has-admin-privileges", "Function has administrative privileges"));
        return { level: "critical", reasons, warnings };
    }

    // SECURITY DEFINER + volatile + język zewnętrzny
    if (
        securityContext.is_security_definer &&
        securityContext.volatility === "volatile" &&
        ["plpython", "plperl", "c"].includes(securityContext.language)
    ) {
        warnings.push(t("security-definer-volatile-language", "SECURITY DEFINER + volatile + {{language}}", { language: securityContext.language }));
        warnings.push(t("may-modify-data-with-elevated-privileges", "May modify data with elevated privileges"));
        reasons.push(t("high-risk-combination", "High-risk combination"));
        return { level: "high", reasons, warnings };
    }

    // SECURITY DEFINER z rozszerzeniami C
    if (securityContext.is_security_definer && securityContext.language === "c") {
        warnings.push(t("security-definer-native-c-extension", "SECURITY DEFINER + native extension (C)"));
        reasons.push(t("native-extension-with-elevated-privileges", "Native extension with elevated privileges"));
        return { level: "high", reasons, warnings };
    }

    // SECURITY DEFINER w ogóle
    if (securityContext.is_security_definer) {
        warnings.push(t("security-definer-general", "SECURITY DEFINER: Executes as {{owner}}", { owner: securityContext.owner }));
        reasons.push(t("function-has-different-user-privileges", "Function has privileges of a different user"));
        return { level: "medium", reasons, warnings };
    }

    // Volatile funkcje mogą modyfikować dane
    if (securityContext.volatility === "volatile") {
        if (["plpython", "plperl"].includes(securityContext.language)) {
            warnings.push(t("volatile-language-may-modify-data", "Volatile {{language}} - may modify data", { language: securityContext.language }));
            reasons.push(t("function-may-have-side-effects", "Function may have side effects"));
            return { level: "medium", reasons, warnings };
        }
    }

    // Immutable SQL - zwykle bezpieczna
    if (securityContext.volatility === "immutable" && securityContext.language === "sql") {
        reasons.push(t("sql-immutable-safe", "SQL immutable - safe"));
        return { level: "low", reasons, warnings };
    }

    // Stable SQL
    if (securityContext.volatility === "stable" && securityContext.language === "sql") {
        reasons.push(t("sql-stable-safe", "SQL stable - safe"));
        return { level: "low", reasons, warnings };
    }

    // Brak parallel safety
    if (!securityContext.parallel_safe) {
        warnings.push(t("not-parallel-safe", "Not parallel-safe"));
    }

    reasons.push(`${securityContext.language} (${securityContext.volatility})`);
    return { level: "low", reasons, warnings };
}

export interface ForeignKeyDependency {
    direction: 'in' | 'out';
    constraint_name: string;
    from_schema: string;
    from_table: string;
    from_columns: string;
    to_schema: string;
    to_table: string;
    to_columns: string;
    on_update?: string;
    on_delete?: string;
    [key: string]: any;
}

/**
 * analyzeForeignKeyDependencies - analizuje zależności Foreign Key dla tabeli
 * 
 * Zwraca FK wychodzące (OUT) - z tej tabeli do innych
 * Zwraca FK przychodzące (IN) - z innych tabel do tej
 * @param session 
 * @param schemaName 
 * @param tableName 
 * @returns 
 */
export async function analyzeForeignKeyDependencies(
    session: IDatabaseSession,
    schemaName: string,
    tableName: string
): Promise<ForeignKeyDependency[]> {
    const databases = await session.getMetadata();
    const schemas = Object.values(databases).find(database => database.connected)?.schemas;

    const foreignKeys: ForeignKeyDependency[] = [];

    for (const schema of Object.values(schemas || {})) {
        for (const relation of Object.values(schema.relations || {})) {
            if (relation.type === 'table') {
                if (relation.foreignKeys) {
                    for (const fk of relation.foreignKeys) {
                        if (fk.referencedSchema === schema.name && fk.referencedTable === tableName) {
                            foreignKeys.push({
                                direction: 'in',
                                constraint_name: fk.name,
                                from_schema: schema.name,
                                from_table: relation.name,
                                from_columns: fk.column.join(', '),
                                to_schema: fk.referencedSchema,
                                to_table: fk.referencedTable,
                                to_columns: fk.referencedColumn.join(', '),
                                on_update: fk.onUpdate,
                                on_delete: fk.onDelete,
                            });
                        }
                        if (schema.name === schemaName && relation.name === tableName) {
                            foreignKeys.push({
                                direction: 'out',
                                constraint_name: fk.name,
                                from_schema: schema.name,
                                from_table: relation.name,
                                from_columns: fk.column.join(', '),
                                to_schema: fk.referencedSchema,
                                to_table: fk.referencedTable,
                                to_columns: fk.referencedColumn.join(', '),
                                on_update: fk.onUpdate,
                                on_delete: fk.onDelete,
                            });
                        }
                    }
                }
            }
        }
    }

    return foreignKeys;
}

/**
 * Ocenia ryzyko na podstawie Foreign Key dependencies
 */
export function assessForeignKeyRisk(fkDeps: ForeignKeyDependency[] | undefined): RiskAssessment {
    if (!fkDeps || fkDeps.length === 0) {
        return { level: "none", reasons: [t("no-fk-dependencies", "No foreign key dependencies")], warnings: [] };
    }

    const reasons: string[] = [];
    const warnings: string[] = [];

    const incomingFKs = fkDeps.filter(fk => fk.direction === 'in');
    const outgoingFKs = fkDeps.filter(fk => fk.direction === 'out');

    // FK przychodzące (IN) - inne tabele wskazują na tę tabelę
    if (incomingFKs.length > 0) {
        const cascadeDeletes = incomingFKs.filter(fk => fk.on_delete === 'cascade');
        const restrictDeletes = incomingFKs.filter(fk => fk.on_delete === 'restrict' || fk.on_delete === 'no action');

        if (restrictDeletes.length > 0) {
            warnings.push(t("fk-restrict-prevents-delete", "{{count}} FK(s) with RESTRICT/NO ACTION prevent deletion", { count: restrictDeletes.length }));
            reasons.push(t("incoming-fk-restrict", "Incoming FK restrictions: {{count}}", { count: restrictDeletes.length }));
            return { level: "high", reasons, warnings };
        }

        if (cascadeDeletes.length > 5) {
            warnings.push(t("many-cascade-deletes", "{{count}} tables will CASCADE DELETE", { count: cascadeDeletes.length }));
            reasons.push(t("many-cascade-fks", "Many CASCADE FKs: {{count}}", { count: cascadeDeletes.length }));
            return { level: "critical", reasons, warnings };
        }

        if (cascadeDeletes.length > 0) {
            warnings.push(t("cascade-deletes-warning", "{{count}} table(s) will be affected by CASCADE DELETE", { count: cascadeDeletes.length }));
            reasons.push(t("cascade-fks", "CASCADE FKs: {{count}}", { count: cascadeDeletes.length }));
            return { level: "medium", reasons, warnings };
        }

        reasons.push(t("incoming-fks", "Incoming FKs: {{count}}", { count: incomingFKs.length }));
        return { level: "low", reasons, warnings };
    }

    // FK wychodzące (OUT) - ta tabela wskazuje na inne
    if (outgoingFKs.length > 0) {
        reasons.push(t("outgoing-fks", "Outgoing FKs: {{count}}", { count: outgoingFKs.length }));
        return { level: "low", reasons, warnings };
    }

    return { level: "none", reasons: [t("no-fk-dependencies", "No foreign key dependencies")], warnings };
}

// Zaktualizuj assessOverallRisk
export function assessOverallRisk(
    depRisk: RiskAssessment,
    codeRisk: RiskAssessment,
    statsRisk: RiskAssessment,
    securityRisk: RiskAssessment,
    fkRisk?: RiskAssessment
): RiskAssessment {
    const riskLevels: RiskLevel[] = [
        depRisk.level,
        codeRisk.level,
        statsRisk.level,
        securityRisk.level
    ];

    if (fkRisk) {
        riskLevels.push(fkRisk.level);
    }

    const riskPriority: Record<RiskLevel, number> = {
        "none": 0,
        "low": 1,
        "medium": 2,
        "high": 3,
        "critical": 4
    };

    const maxRiskLevel = riskLevels.reduce((max, curr) => {
        return riskPriority[curr] > riskPriority[max] ? curr : max;
    });

    const allReasons: string[] = [];
    const allWarnings: string[] = [];

    if (depRisk.level !== "none") {
        allReasons.push(t("[dependencies]", "[Dependencies]") + ` ${depRisk.reasons.join(", ")}`);
        allWarnings.push(...depRisk.warnings);
    }

    if (codeRisk.level !== "none") {
        allReasons.push(t("[code]", "[Code]") + ` ${codeRisk.reasons.join(", ")}`);
        allWarnings.push(...codeRisk.warnings);
    }

    if (statsRisk.level !== "none") {
        allReasons.push(t("[statistics]", "[Statistics]") + ` ${statsRisk.reasons.join(", ")}`);
        allWarnings.push(...statsRisk.warnings);
    }

    if (securityRisk.level !== "none") {
        allReasons.push(t("[security]", "[Security]") + ` ${securityRisk.reasons.join(", ")}`);
        allWarnings.push(...securityRisk.warnings);
    }

    if (fkRisk && fkRisk.level !== "none") {
        allReasons.push(t("[foreign-keys]", "[Foreign Keys]") + ` ${fkRisk.reasons.join(", ")}`);
        allWarnings.push(...fkRisk.warnings);
    }

    return {
        level: maxRiskLevel,
        reasons: allReasons,
        warnings: allWarnings
    };
}
