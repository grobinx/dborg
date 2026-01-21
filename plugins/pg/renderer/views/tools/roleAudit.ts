import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { versionToNumber } from "../../../../../src/api/version";
import { t } from "i18next";

/*typy obiektów w bazie (przykłady wartości dla objtype)
  schema
  table
  view
  matview
  sequence
  function
  type
  domain
  extension
  server
  fdw
  publication
  language
  database
  user_mapping
*/
export type ObjType =
    | "schema" | "table" | "view" | "matview" | "sequence"
    | "function" | "procedure" | "type" | "domain" | "extension"
    | "server" | "fdw" | "publication" | "language" | "database" | "user_mapping"
    | "foreign_table";

export interface OwnedObjectRecord {
    objtype: ObjType;
    schema: string | null;
    name: string;
    identity: string; // w pełni kwalifikowana nazwa (dla funkcji z sygnaturą)
    owner: string;
    choice?: CleanupChoice;
    risk?: RiskLevel;
    [key: string]: any;
}

export interface PrivilegeRecord {
    objtype: ObjType;
    schema: string | null;
    name: string;
    identity: string;
    privilege_type: string;
    is_grantable: boolean;
    grantee_name: string;
    grantor_name: string;
    is_grantee: boolean; // czy analizowana rola jest biorcą
    choice?: PrivilegeChoice;
    [key: string]: any;
}

export async function listOwnedObjects(
    session: IDatabaseSession,
    roleName: string,
    versionNumber: number,
    isSuperuser: boolean
): Promise<OwnedObjectRecord[]> {

    const segments: string[] = [];

    // relacje: table/view/matview/sequence (PG 9.6+)
    segments.push(`
    SELECT
      CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'matview'
        WHEN 'S' THEN 'sequence'
        ELSE 'table'
      END AS objtype,
      format('%I', n.nspname) AS schema,
      c.relname AS name,
      format('%I', c.relname) AS identity,
      pg_get_userbyid(c.relowner) AS owner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN r ON r.oid = c.relowner
    WHERE c.relkind IN ('r','v','m','S')
  `);

    // funkcje (fallback na PG < 11)
    segments.push(`
    SELECT
      'function' AS objtype,
      format('%I', n.nspname) AS schema,
      p.proname AS name,
      format('%I(%s)', p.proname, pg_get_function_identity_arguments(p.oid)) AS identity,
      pg_get_userbyid(p.proowner) AS owner
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN r ON r.oid = p.proowner
  `);

    // typy i domeny (wyklucz typy zależne od tabel/widoków)
    segments.push(`
    SELECT
      CASE t.typtype WHEN 'd' THEN 'domain' ELSE 'type' END AS objtype,
      format('%I', n.nspname) AS schema,
      t.typname AS name,
      format('%I', t.typname) AS identity,
      pg_get_userbyid(t.typowner) AS owner
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN r ON r.oid = t.typowner
    LEFT JOIN pg_class c ON c.reltype = t.oid and c.relkind <> 'c'
    WHERE c.oid IS NULL
      AND t.typname !~ '^_'
  `);

    // schematy (pomijamy systemowe)
    segments.push(`
    SELECT
      'schema' AS objtype,
      format('%I', n.nspname) AS schema,
      n.nspname AS name,
      format('%I', n.nspname) AS identity,
      pg_get_userbyid(n.nspowner) AS owner
    FROM pg_namespace n
    JOIN r ON r.oid = n.nspowner
    WHERE n.nspname NOT IN ('pg_catalog','information_schema','pg_toast') AND n.nspname NOT LIKE 'pg_temp_%'
  `);

    // rozszerzenia
    segments.push(`
    SELECT
      'extension' AS objtype,
      format('%I', n.nspname) AS schema,
      e.extname AS name,
      format('%I', e.extname) AS identity,
      pg_get_userbyid(e.extowner) AS owner
    FROM pg_extension e
    LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
    JOIN r ON r.oid = e.extowner
  `);

    // FDW
    segments.push(`
    SELECT
      'fdw' AS objtype,
      NULL::text AS schema,
      w.fdwname AS name,
      format('%I', w.fdwname) AS identity,
      pg_get_userbyid(w.fdwowner) AS owner
    FROM pg_foreign_data_wrapper w
    JOIN r ON r.oid = w.fdwowner
  `);

    // serwery obce
    segments.push(`
    SELECT
      'server' AS objtype,
      NULL::text AS schema,
      s.srvname AS name,
      format('%I', s.srvname) AS identity,
      pg_get_userbyid(s.srvowner) AS owner
    FROM pg_foreign_server s
    JOIN r ON r.oid = s.srvowner
  `);

    // tabele obce
    segments.push(`
    SELECT
      'foreign_table' AS objtype,
      format('%I', n.nspname) AS schema,
      ft.relname AS name,
      format('%I', ft.relname) AS identity,
      pg_get_userbyid(ft.relowner) AS owner
    FROM pg_class ft
    JOIN pg_namespace n ON n.oid = ft.relnamespace
    JOIN r ON r.oid = ft.relowner
    WHERE ft.relkind = 'f'
  `);

    // publikacje (PG 10+)
    if (versionNumber >= 100000) {
        segments.push(`
      SELECT
        'publication' AS objtype,
        NULL::text AS schema,
        p.pubname AS name,
        format('%I', p.pubname) AS identity,
        pg_get_userbyid(p.pubowner) AS owner
      FROM pg_publication p
      JOIN r ON r.oid = p.pubowner
    `);
    }

    // języki (PG 16+: kolumna lanowner)
    if (versionNumber >= 160000) {
        segments.push(`
        SELECT
          'language' AS objtype,
          NULL::text AS schema,
          l.lanname AS name,
          format('%I', l.lanname) AS identity,
          pg_get_userbyid(l.lanowner) AS owner
        FROM pg_language l
        JOIN r ON r.oid = l.lanowner
      `);
    }

    // bieżąca baza
    segments.push(`
    SELECT
      'database' AS objtype,
      NULL::text AS schema,
      d.datname AS name,
      format('%I', d.datname) AS identity,
      pg_get_userbyid(d.datdba) AS owner
    FROM pg_database d
    JOIN r ON r.oid = d.datdba
    WHERE d.datname = current_database()
  `);

    // user mappings - tylko dla superusera
    if (isSuperuser) {
        segments.push(`
        SELECT
          'user_mapping' AS objtype,
          NULL::text AS schema,
          format('%s ON %s', pg_get_userbyid(um.umuser), s.srvname) AS name,
          format('%I ON %I', pg_get_userbyid(um.umuser), s.srvname) AS identity,
          pg_get_userbyid(um.umuser) AS owner
        FROM pg_user_mapping um
        JOIN pg_foreign_server s ON s.oid = um.umserver
        JOIN r ON r.oid = um.umuser
      `);
    }

    const sql = `
    WITH r AS (SELECT oid, rolname FROM pg_roles WHERE rolname = $1)
    ${segments.join("\nUNION ALL\n")}
  `;
    const { rows } = await session.query<OwnedObjectRecord>(sql, [roleName]);
    return rows;
}

export async function listPrivileges(
    session: IDatabaseSession,
    roleName: string,
    versionNumber: number
): Promise<PrivilegeRecord[]> {
    const segments: string[] = [];

    // schematy
    segments.push(`
    SELECT 'schema'::text AS objtype, NULL::text AS schema, n.nspname::varchar AS name,
           format('%I', n.nspname) AS identity,
           a.privilege_type, a.is_grantable,
           pg_get_userbyid(a.grantee) AS grantee_name,
           pg_get_userbyid(a.grantor) AS grantor_name,
           true AS is_grantee
    FROM pg_namespace n
    JOIN r ON TRUE
    CROSS JOIN LATERAL aclexplode(n.nspacl) a
    WHERE n.nspacl IS NOT NULL 
      AND a.grantee = r.oid
  `);

    // relacje
    segments.push(`
    SELECT CASE c.relkind WHEN 'r' THEN 'table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'matview' WHEN 'S' THEN 'sequence' ELSE 'table' END AS objtype,
           format('%I', n.nspname) AS schema, 
           c.relname::varchar AS name,
           format('%I', c.relname) AS identity,
           a.privilege_type, a.is_grantable,
           pg_get_userbyid(a.grantee) AS grantee_name,
           pg_get_userbyid(a.grantor) AS grantor_name,
           true AS is_grantee
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN r ON TRUE
    CROSS JOIN LATERAL aclexplode(c.relacl) a
    WHERE c.relacl IS NOT NULL 
      AND a.grantee = r.oid
  `);

    // funkcje
    segments.push(`
    SELECT 'function' AS objtype, 
        format('%I', n.nspname) AS schema, 
        p.proname AS name,
        format('%I(%s)', p.proname, pg_get_function_identity_arguments(p.oid)) AS identity,
        a.privilege_type, a.is_grantable,
        pg_get_userbyid(a.grantee) AS grantee_name,
        pg_get_userbyid(a.grantor) AS grantor_name,
        true AS is_grantee
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN r ON TRUE
    CROSS JOIN LATERAL aclexplode(p.proacl) a
    WHERE p.proacl IS NOT NULL 
      AND a.grantee = r.oid
  `);

    // typy/domeny
    segments.push(`
    SELECT CASE t.typtype WHEN 'd' THEN 'domain' ELSE 'type' END AS objtype,
           format('%I', n.nspname) AS schema, 
           t.typname::varchar AS name,
           format('%I', t.typname) AS identity,
           a.privilege_type, a.is_grantable,
           pg_get_userbyid(a.grantee) AS grantee_name,
           pg_get_userbyid(a.grantor) AS grantor_name,
           true AS is_grantee
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN r ON TRUE
    CROSS JOIN LATERAL aclexplode(t.typacl) a
    WHERE t.typacl IS NOT NULL 
      AND a.grantee = r.oid
  `);

    // FDW
    segments.push(`
    SELECT 'fdw' AS objtype, 
           NULL::text AS schema, 
           w.fdwname::varchar AS name,
           format('%I', w.fdwname) AS identity,
           a.privilege_type, a.is_grantable,
           pg_get_userbyid(a.grantee) AS grantee_name,
           pg_get_userbyid(a.grantor) AS grantor_name,
           true AS is_grantee
    FROM pg_foreign_data_wrapper w
    JOIN r ON TRUE
    CROSS JOIN LATERAL aclexplode(w.fdwacl) a
    WHERE w.fdwacl IS NOT NULL 
      AND a.grantee = r.oid
  `);

    // serwery obce
    segments.push(`
    SELECT 'server' AS objtype, 
           NULL::text AS schema, 
           s.srvname::varchar AS name,
           format('%I', s.srvname) AS identity,
           a.privilege_type, a.is_grantable,
           pg_get_userbyid(a.grantee) AS grantee_name,
           pg_get_userbyid(a.grantor) AS grantor_name,
           true AS is_grantee
    FROM pg_foreign_server s
    JOIN r ON TRUE
    CROSS JOIN LATERAL aclexplode(s.srvacl) a
    WHERE s.srvacl IS NOT NULL 
      AND a.grantee = r.oid
  `);

    // języki (PG 16+)
    if (versionNumber >= 160000) {
        segments.push(`
      SELECT 'language' AS objtype, 
             NULL::text AS schema, 
             l.lanname AS name,
             format('%I', l.lanname) AS identity,
             a.privilege_type, a.is_grantable,
             pg_get_userbyid(a.grantee) AS grantee_name,
             pg_get_userbyid(a.grantor) AS grantor_name,
             true AS is_grantee
      FROM pg_language l
      JOIN r ON TRUE
      CROSS JOIN LATERAL aclexplode(l.lanacl) a
      WHERE l.lanacl IS NOT NULL 
        AND a.grantee = r.oid
    `);
    }

    // bieżąca baza
    segments.push(`
    SELECT 'database' AS objtype, 
           NULL::text AS schema, 
           d.datname AS name,
           format('%I', d.datname) AS identity,
           a.privilege_type, a.is_grantable,
           pg_get_userbyid(a.grantee) AS grantee_name,
           pg_get_userbyid(a.grantor) AS grantor_name,
           true AS is_grantee
    FROM pg_database d
    JOIN r ON TRUE
    CROSS JOIN LATERAL aclexplode(d.datacl) a
    WHERE d.datname = current_database() AND d.datacl IS NOT NULL
      AND a.grantee = r.oid
  `);

    const sql = `
    WITH r AS (SELECT oid, rolname FROM pg_roles WHERE rolname = $1)
    ${segments.join("\nUNION ALL\n")}
  `;
    const { rows } = await session.query<PrivilegeRecord>(sql, [roleName]);
    return rows;
}

export interface CleanupChoice {
    action: "drop_cascade" | "drop_restrict" | "reassign" | "move" | "ignore";
    newOwner?: string;   // docelowy owner dla reassign/move (gdy brak, użyj opts.newOwner)
    newSchema?: string;  // docelowy schemat dla move
}
export interface PrivilegeChoice {
    action: "revoke" | "revoke_grant_option" | "keep";
}
export interface BuildSqlOptions {
    roleName: string;
    newOwner?: string; // domyślny owner, jeśli per-obiekt nie podano
    ownedChoices: Record<string, CleanupChoice>; // key = identity
    privilegeChoices: Record<string, PrivilegeChoice>; // key = identity|privilege_type|grantee|grantor
    dropSchemasCascade?: boolean;
}

function objKeywordForRevoke(objtype: ObjType): string {
    switch (objtype) {
        case "schema": return "SCHEMA";
        case "database": return "DATABASE";
        case "sequence": return "SEQUENCE";
        case "function": return "FUNCTION";
        case "type":
        case "domain": return "TYPE";
        case "matview": return "MATERIALIZED VIEW";
        case "view":
        case "table": return "TABLE";
        case "foreign_table": return "FOREIGN TABLE";
        case "fdw": return "FOREIGN DATA WRAPPER";
        case "server": return "FOREIGN SERVER";
        case "language": return "LANGUAGE";
        default: return "TABLE";
    }
}

export function buildCleanupSql(
    owned: OwnedObjectRecord[],
    privs: PrivilegeRecord[],
    opts: BuildSqlOptions
): string {
    const lines: string[] = [];
    lines.push("BEGIN;");

    // Drop w kolejności zależności: najpierw obiekty najbardziej zależne
    const dropPriority: Record<ObjType, number> = {
        view: 10,
        matview: 12,
        foreign_table: 13,      // tabele obce przed funkcjami
        function: 15,
        procedure: 15,
        table: 20,
        sequence: 25,
        type: 40,
        domain: 40,
        schema: 60,
        extension: 70,
        fdw: 80,
        server: 85,
        publication: 90,
        language: 95,
        database: 100,
        user_mapping: 110,
    };

    const ownedSorted = [...owned].sort((a, b) => {
        const pa = dropPriority[a.objtype] ?? 999;
        const pb = dropPriority[b.objtype] ?? 999;
        if (pa !== pb) return pa - pb;
        return a.identity.localeCompare(b.identity);
    });

    for (const o of ownedSorted) {
        const choice = opts.ownedChoices[o.identity]?.action ?? "ignore";
        const objOwner = opts.ownedChoices[o.identity]?.newOwner ?? opts.newOwner;
        const targetSchema = opts.ownedChoices[o.identity]?.newSchema;

        if (choice === "ignore") continue;

        const cascade = choice === "drop_cascade" ? " CASCADE" : "";

        if (choice === "drop_cascade" || choice === "drop_restrict") {
            switch (o.objtype) {
                case "table": lines.push(`DROP TABLE IF EXISTS ${o.schema}.${o.identity}${cascade};`); break;
                case "foreign_table": lines.push(`DROP FOREIGN TABLE IF EXISTS ${o.schema}.${o.identity}${cascade};`); break;
                case "view": lines.push(`DROP VIEW IF EXISTS ${o.schema}.${o.identity}${cascade};`); break;
                case "matview": lines.push(`DROP MATERIALIZED VIEW IF EXISTS ${o.schema}.${o.identity}${cascade};`); break;
                case "sequence": lines.push(`DROP SEQUENCE IF EXISTS ${o.schema}.${o.identity}${cascade};`); break;
                case "function": lines.push(`DROP FUNCTION IF EXISTS ${o.schema}.${o.identity}${cascade};`); break;
                case "type": lines.push(`DROP TYPE IF EXISTS ${o.schema}.${o.identity}${cascade};`); break;
                case "domain": lines.push(`DROP DOMAIN IF EXISTS ${o.schema}.${o.identity}${cascade};`); break;
                case "extension": lines.push(`DROP EXTENSION IF EXISTS ${o.identity}${cascade};`); break;
                case "schema": lines.push(`DROP SCHEMA IF EXISTS ${o.identity}${cascade || (opts.dropSchemasCascade ? " CASCADE" : "")};`); break;
                case "server": lines.push(`DROP SERVER IF EXISTS ${o.identity}${cascade};`); break;
                case "fdw": lines.push(`DROP FOREIGN DATA WRAPPER IF EXISTS ${o.identity}${cascade};`); break;
                case "publication": lines.push(`DROP PUBLICATION IF EXISTS ${o.identity};`); break;
                case "language": lines.push(`DROP LANGUAGE IF EXISTS ${o.identity}${cascade};`); break;
                case "database": lines.push(`-- Ręcznie: DROP/ALTER DATABASE ${o.identity}`); break;
                case "user_mapping": lines.push(`DROP USER MAPPING FOR ${opts.roleName} SERVER ${o.name.split(" ON ")[1]};`); break;
            }
            continue;
        }

        if (choice === "reassign") {
            if (!objOwner) throw new Error("Brak newOwner dla reassign");
            switch (o.objtype) {
                case "table": lines.push(`ALTER TABLE ${o.schema}.${o.identity} OWNER TO ${objOwner};`); break;
                case "foreign_table": lines.push(`ALTER FOREIGN TABLE ${o.schema}.${o.identity} OWNER TO ${objOwner};`); break;
                case "view": lines.push(`ALTER VIEW ${o.schema}.${o.identity} OWNER TO ${objOwner};`); break;
                case "matview": lines.push(`ALTER MATERIALIZED VIEW ${o.schema}.${o.identity} OWNER TO ${objOwner};`); break;
                case "sequence": lines.push(`ALTER SEQUENCE ${o.schema}.${o.identity} OWNER TO ${objOwner};`); break;
                case "function": lines.push(`ALTER FUNCTION ${o.schema}.${o.identity} OWNER TO ${objOwner};`); break;
                case "type": lines.push(`ALTER TYPE ${o.schema}.${o.identity} OWNER TO ${objOwner};`); break;
                case "domain": lines.push(`ALTER DOMAIN ${o.schema}.${o.identity} OWNER TO ${objOwner};`); break;
                case "extension": lines.push(`ALTER EXTENSION ${o.identity} OWNER TO ${objOwner};`); break;
                case "schema": lines.push(`ALTER SCHEMA ${o.identity} OWNER TO ${objOwner};`); break;
                case "server": lines.push(`ALTER SERVER ${o.identity} OWNER TO ${objOwner};`); break;
                case "fdw": lines.push(`ALTER FOREIGN DATA WRAPPER ${o.identity} OWNER TO ${objOwner};`); break;
                case "publication": lines.push(`ALTER PUBLICATION ${o.identity} OWNER TO ${objOwner};`); break;
                case "language": lines.push(`ALTER LANGUAGE ${o.identity} OWNER TO ${objOwner};`); break;
                case "database": lines.push(`ALTER DATABASE ${o.identity} OWNER TO ${objOwner};`); break;
                case "user_mapping": /* zwykle drop wraz z rolą */ break;
            }
            continue;
        }

        if (choice === "move") {
            if (!targetSchema) throw new Error("Brak newSchema dla move");
            if (objOwner) {
                const alterOwnerStmt = (kind: string) => `ALTER ${kind} ${o.schema}.${o.identity} OWNER TO ${objOwner};`;
                switch (o.objtype) {
                    case "table": lines.push(alterOwnerStmt("TABLE")); break;
                    case "view": lines.push(alterOwnerStmt("VIEW")); break;
                    case "matview": lines.push(alterOwnerStmt("MATERIALIZED VIEW")); break;
                    case "sequence": lines.push(alterOwnerStmt("SEQUENCE")); break;
                    case "function": lines.push(alterOwnerStmt("FUNCTION")); break;
                    case "type": lines.push(alterOwnerStmt("TYPE")); break;
                    case "domain": lines.push(alterOwnerStmt("DOMAIN")); break;
                }
            }
            const alterSchemaStmt = (kind: string) => `ALTER ${kind} ${o.schema}.${o.identity} SET SCHEMA ${targetSchema};`;
            switch (o.objtype) {
                case "table": lines.push(alterSchemaStmt("TABLE")); break;
                case "foreign_table": lines.push(alterSchemaStmt("FOREIGN TABLE")); break;
                case "view": lines.push(alterSchemaStmt("VIEW")); break;
                case "matview": lines.push(alterSchemaStmt("MATERIALIZED VIEW")); break;
                case "sequence": lines.push(alterSchemaStmt("SEQUENCE")); break;
                case "function": lines.push(alterSchemaStmt("FUNCTION")); break;
                case "type": lines.push(alterSchemaStmt("TYPE")); break;
                case "domain": lines.push(alterSchemaStmt("DOMAIN")); break;
                // poniższe nie wspierają SET SCHEMA: extension, schema, server, fdw, publication, language, database, user_mapping
                default: lines.push(`-- MOVE nieobsługiwane dla ${o.objtype} ${o.identity}`); break;
            }
            continue;
        }
    }

    for (const p of privs) {
        const key = `${p.identity}|${p.privilege_type}|${p.grantee_name}|${p.grantor_name}`;
        const choice = opts.privilegeChoices[key]?.action ?? "keep";
        if (choice === "keep") continue;

        const kw = objKeywordForRevoke(p.objtype);
        const isServer = p.objtype === "server" || p.objtype === "fdw";

        if (choice === "revoke") {
            if (isServer) {
                // ALL działa na FOREIGN SERVER/FDW pewnie
                lines.push(`REVOKE ALL ON ${kw} ${p.identity} FROM ${opts.roleName};`);
            } else {
                lines.push(`REVOKE ${p.privilege_type} ON ${kw} ${p.schema ? p.schema + "." : ""}${p.identity} FROM ${opts.roleName};`);
            }
        } else if (choice === "revoke_grant_option") {
            // grant option pozostaje per-privilege
            lines.push(`REVOKE GRANT OPTION FOR ${p.privilege_type} ON ${kw} ${p.schema ? p.schema + "." : ""}${p.identity} FROM ${opts.roleName};`);
        }
    }

    lines.push(`-- DROP OWNED BY ${opts.roleName};`);
    lines.push(`-- DROP ROLE ${opts.roleName};`);
    lines.push("COMMIT;");
    return lines.join("\n");
}

export function isValidCleanupAction(objtype: ObjType, action: CleanupChoice["action"]): boolean {
    switch (action) {
        case "drop_cascade":
        case "drop_restrict":
            // Wszystkie typy można droppować
            return true;

        case "reassign":
            // Nie można reassignować user_mapping
            return objtype !== "user_mapping";

        case "move":
            // Tylko obiekty w schemacie można przenosić
            return ["table", "view", "matview", "sequence", "function", "type", "domain", "foreign_table"].includes(objtype);

        case "ignore":
            return true;

        default:
            return false;
    }
}

export function getValidActionsForObjectType(objtype: ObjType): CleanupChoice["action"][] {
    const allActions: CleanupChoice["action"][] = ["drop_cascade", "drop_restrict", "reassign", "move", "ignore"];
    return allActions.filter(action => isValidCleanupAction(objtype, action));
}

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
    code_snippet: string;
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
    const searchPattern = `%${schema}.${name}%`;
    const namePattern = `%${name}%`;
    const versionNumber = versionToNumber(session.getVersion() || "0.0.0");

    // Warunek dla funkcji zależny od wersji
    const funcCondition = versionNumber >= 110000
        ? "p.prokind IN ('f','p')"  // PG 11+
        : "NOT p.proisagg AND NOT p.proiswindow";  // PG 9.6-10

    const sql = `
        -- Widoki
        SELECT 
            'view'::text as type,
            n.nspname || '.' || c.relname as location,
            pg_get_viewdef(c.oid, true) as definition
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'v' 
        AND (
            pg_get_viewdef(c.oid, true) ILIKE $1
            OR pg_get_viewdef(c.oid, true) ILIKE $2
        )

        UNION ALL

        -- Funkcje
        SELECT 
            'function'::text as type,
            n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as location,
            pg_get_functiondef(p.oid) as definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE ${funcCondition}
          AND (
            pg_get_functiondef(p.oid) ILIKE $1
            OR pg_get_functiondef(p.oid) ILIKE $2
        )

        UNION ALL

        -- Triggery
        SELECT 
            'trigger'::text as type,
            n.nspname || '.' || c.relname || ' -> ' || t.tgname as location,
            pg_get_triggerdef(t.oid) as definition
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE NOT t.tgisinternal
        AND (
            pg_get_triggerdef(t.oid) ILIKE $1
            OR pg_get_triggerdef(t.oid) ILIKE $2
        )

        UNION ALL

        -- Constraints (CHECK)
        SELECT 
            'constraint'::text as type,
            n.nspname || '.' || c.relname || ' -> ' || con.conname as location,
            pg_get_constraintdef(con.oid) as definition
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE con.contype = 'c'
        AND (
            pg_get_constraintdef(con.oid) ILIKE $1
            OR pg_get_constraintdef(con.oid) ILIKE $2
        )

        UNION ALL

        -- Indeksy częściowe
        SELECT 
            'index'::text as type,
            n.nspname || '.' || c.relname || ' -> ' || i.relname as location,
            pg_get_indexdef(i.oid) as definition
        FROM pg_index idx
        JOIN pg_class i ON i.oid = idx.indexrelid
        JOIN pg_class c ON c.oid = idx.indrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE idx.indpred IS NOT NULL
        AND (
            pg_get_indexdef(i.oid) ILIKE $1
            OR pg_get_indexdef(i.oid) ILIKE $2
        )

        UNION ALL

        -- Rules
        SELECT 
            'rule'::text as type,
            n.nspname || '.' || c.relname || ' -> ' || r.rulename as location,
            pg_get_ruledef(r.oid) as definition
        FROM pg_rewrite r
        JOIN pg_class c ON c.oid = r.ev_class
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE r.rulename != '_RETURN'
        AND (
            pg_get_ruledef(r.oid) ILIKE $1
            OR pg_get_ruledef(r.oid) ILIKE $2
        )
    `;

    const { rows } = await session.query<any>(sql, [searchPattern, namePattern]);
    
    return rows.map(row => ({
        type: row.type,
        location: row.location,
        code_snippet: row.definition.substring(0, 200) + (row.definition.length > 200 ? '...' : ''),
        full_definition: row.definition
    }));
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
    function_owner: string | null;
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
    schema: string,
    identity: string,
): Promise<SecurityContext | null> {
    if (objtype !== 'function') {
        return null;
    }

    const versionNumber = versionToNumber(session.getVersion() || "0.0.0");

    // Dla funkcji name zawiera sygnaturę
    const sql = `
        SELECT 
            p.prosecdef as is_security_definer,
            pg_get_userbyid(p.proowner) as function_owner,
            CASE WHEN p.prosecdef THEN 'definer' ELSE 'invoker' END as execute_as,
            l.lanname as language,
            CASE p.provolatile
                WHEN 'i' THEN 'immutable'
                WHEN 's' THEN 'stable'
                WHEN 'v' THEN 'volatile'
            END as volatility,
            ${versionNumber >= 90600 ? 'p.proparallel != \'u\' as parallel_safe' : 'false as parallel_safe'}
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        JOIN pg_language l ON l.oid = p.prolang
        WHERE n.nspname = $1 
        AND format('%I(%s)', p.proname, pg_get_function_identity_arguments(p.oid)) = $2::varchar
    `;

    const { rows } = await session.query<any>(sql, [schema, identity]);
    if (rows.length === 0) return null;

    return rows[0];
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
    if (securityContext.is_security_definer && securityContext.function_owner === "postgres") {
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
        warnings.push(t("security-definer-general", "SECURITY DEFINER: Executes as {{owner}}", { owner: securityContext.function_owner }));
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
    on_update: string;
    on_delete: string;
    match_type: string;
    is_deferrable: boolean;
    is_deferred: boolean;
    [key: string]: any;
}

/**
 * analyzeForeignKeyDependencies - analizuje zależności Foreign Key dla tabeli
 * 
 * Zwraca FK wychodzące (OUT) - z tej tabeli do innych
 * Zwraca FK przychodzące (IN) - z innych tabel do tej
 * @param session 
 * @param schema 
 * @param tableName 
 * @returns 
 */
export async function analyzeForeignKeyDependencies(
    session: IDatabaseSession,
    schema: string,
    tableName: string
): Promise<ForeignKeyDependency[]> {
    const sql = `
        WITH ct AS (
            SELECT c.oid, n.nspname as nsp, c.relname as rel
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = $1 AND c.relname = $2
        )
        SELECT *
        FROM (
            -- FK wychodzące z bieżącej tabeli
            SELECT
                'out'::text as direction,
                con.conname as constraint_name,
                n.nspname as from_schema,
                c.relname as from_table,
                COALESCE(array_to_string(ARRAY(
                    SELECT att.attname
                    FROM unnest(con.conkey) WITH ORDINALITY k(attnum, ord)
                    JOIN pg_attribute att ON att.attrelid = c.oid AND att.attnum = k.attnum
                    ORDER BY k.ord
                ), ', '), '') as from_columns,
                rn.nspname as to_schema,
                rc.relname as to_table,
                COALESCE(array_to_string(ARRAY(
                    SELECT ratt.attname
                    FROM unnest(con.confkey) WITH ORDINALITY rk(attnum, ord)
                    JOIN pg_attribute ratt ON ratt.attrelid = rc.oid AND ratt.attnum = rk.attnum
                    ORDER BY rk.ord
                ), ', '), '') as to_columns,
                CASE con.confupdtype
                    WHEN 'a' THEN 'no action' WHEN 'r' THEN 'restrict'
                    WHEN 'c' THEN 'cascade'   WHEN 'n' THEN 'set null'
                    WHEN 'd' THEN 'set default' ELSE con.confupdtype::text 
                END as on_update,
                CASE con.confdeltype
                    WHEN 'a' THEN 'no action' WHEN 'r' THEN 'restrict'
                    WHEN 'c' THEN 'cascade'   WHEN 'n' THEN 'set null'
                    WHEN 'd' THEN 'set default' ELSE con.confdeltype::text 
                END as on_delete,
                CASE con.confmatchtype
                    WHEN 'f' THEN 'full' WHEN 'p' THEN 'partial'
                    WHEN 's' THEN 'simple' ELSE con.confmatchtype::text 
                END as match_type,
                con.condeferrable as is_deferrable,
                con.condeferred as is_deferred
            FROM pg_constraint con
            JOIN ct t ON con.conrelid = t.oid
            JOIN pg_class c ON c.oid = con.conrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_class rc ON rc.oid = con.confrelid
            JOIN pg_namespace rn ON rn.oid = rc.relnamespace
            WHERE con.contype = 'f'

            UNION ALL

            -- FK przychodzące do bieżącej tabeli
            SELECT
                'in'::text as direction,
                con.conname as constraint_name,
                n.nspname as from_schema,
                c.relname as from_table,
                COALESCE(array_to_string(ARRAY(
                    SELECT att.attname
                    FROM unnest(con.conkey) WITH ORDINALITY k(attnum, ord)
                    JOIN pg_attribute att ON att.attrelid = c.oid AND att.attnum = k.attnum
                    ORDER BY k.ord
                ), ', '), '') as from_columns,
                t.nsp as to_schema,
                t.rel as to_table,
                COALESCE(array_to_string(ARRAY(
                    SELECT ratt.attname
                    FROM unnest(con.confkey) WITH ORDINALITY rk(attnum, ord)
                    JOIN pg_attribute ratt ON ratt.attrelid = t.oid AND ratt.attnum = rk.attnum
                    ORDER BY rk.ord
                ), ', '), '') as to_columns,
                CASE con.confupdtype
                    WHEN 'a' THEN 'no action' WHEN 'r' THEN 'restrict'
                    WHEN 'c' THEN 'cascade'   WHEN 'n' THEN 'set null'
                    WHEN 'd' THEN 'set default' ELSE con.confupdtype::text 
                END as on_update,
                CASE con.confdeltype
                    WHEN 'a' THEN 'no action' WHEN 'r' THEN 'restrict'
                    WHEN 'c' THEN 'cascade'   WHEN 'n' THEN 'set null'
                    WHEN 'd' THEN 'set default' ELSE con.confdeltype::text 
                END as on_delete,
                CASE con.confmatchtype
                    WHEN 'f' THEN 'full' WHEN 'p' THEN 'partial'
                    WHEN 's' THEN 'simple' ELSE con.confmatchtype::text 
                END as match_type,
                con.condeferrable as is_deferrable,
                con.condeferred as is_deferred
            FROM pg_constraint con
            JOIN ct t ON con.confrelid = t.oid
            JOIN pg_class c ON c.oid = con.conrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE con.contype = 'f'
        ) q
        ORDER BY direction, from_schema, from_table, constraint_name
    `;

    const { rows } = await session.query<ForeignKeyDependency>(sql, [schema, tableName]);
    return rows;
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