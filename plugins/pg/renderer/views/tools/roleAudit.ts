import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";

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
    | "function" | "type" | "domain" | "extension"
    | "server" | "fdw" | "publication" | "language" | "database" | "user_mapping";

export interface OwnedObject {
    objtype: ObjType;
    schema: string | null;
    name: string;
    identity: string; // w pełni kwalifikowana nazwa (dla funkcji z sygnaturą)
    owner: string;
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
    [key: string]: any;
}

export async function listOwnedObjects(
  session: IDatabaseSession,
  roleName: string,
  versionNumber: number
): Promise<OwnedObject[]> {
  // Funkcyjne identity args: dostępne od PG 8.4+
  const funcIdentityArgs = "pg_get_function_identity_arguments(p.oid)";

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
      n.nspname AS schema,
      c.relname AS name,
      format('%I.%I', n.nspname, c.relname) AS identity,
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
      n.nspname AS schema,
      p.proname AS name,
      format('%I.%I(%s)', n.nspname, p.proname, ${funcIdentityArgs}) AS identity,
      pg_get_userbyid(p.proowner) AS owner
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN r ON r.oid = p.proowner
  `);

    // typy i domeny (bez podwójnego joinu)
    segments.push(`
    SELECT
      CASE t.typtype WHEN 'd' THEN 'domain' ELSE 'type' END AS objtype,
      n.nspname AS schema,
      t.typname AS name,
      format('%I.%I', n.nspname, t.typname) AS identity,
      pg_get_userbyid(t.typowner) AS owner
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN r ON r.oid = t.typowner
    WHERE t.typtype IN ('b','d','e','r') AND t.typname !~ '^_'
  `);

    // schematy (pomijamy systemowe)
    segments.push(`
    SELECT
      'schema' AS objtype,
      n.nspname AS schema,
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
      n.nspname AS schema,
      e.extname AS name,
      e.extname AS identity,
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
      w.fdwname AS identity,
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
      s.srvname AS identity,
      pg_get_userbyid(s.srvowner) AS owner
    FROM pg_foreign_server s
    JOIN r ON r.oid = s.srvowner
  `);

    // publikacje (PG 10+)
    if (versionNumber >= 100000) {
    segments.push(`
      SELECT
        'publication' AS objtype,
        NULL::text AS schema,
        p.pubname AS name,
        p.pubname AS identity,
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
          l.lanname AS identity,
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
      d.datname AS identity,
      pg_get_userbyid(d.datdba) AS owner
    FROM pg_database d
    JOIN r ON r.oid = d.datdba
    WHERE d.datname = current_database()
  `);

    // user mappings
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

    const sql = `
    WITH r AS (SELECT oid, rolname FROM pg_roles WHERE rolname = $1)
    ${segments.join("\nUNION ALL\n")}
  `;
    const { rows } = await session.query<OwnedObject>(sql, [roleName]);
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
    SELECT 'schema'::text AS objtype, NULL::text AS schema, n.nspname AS name,
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
           n.nspname AS schema, c.relname AS name,
           format('%I.%I', n.nspname, c.relname) AS identity,
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
    SELECT 'function' AS objtype, n.nspname AS schema, p.proname AS name,
           format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) AS identity,
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
           n.nspname AS schema, t.typname AS name,
           format('%I.%I', n.nspname, t.typname) AS identity,
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
    SELECT 'fdw' AS objtype, NULL::text AS schema, w.fdwname AS name,
           w.fdwname AS identity,
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
    SELECT 'server' AS objtype, NULL::text AS schema, s.srvname AS name,
           s.srvname AS identity,
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
      SELECT 'language' AS objtype, NULL::text AS schema, l.lanname AS name,
             l.lanname AS identity,
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
    SELECT 'database' AS objtype, NULL::text AS schema, d.datname AS name,
           d.datname AS identity,
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
        case "fdw": return "FOREIGN DATA WRAPPER";
        case "server": return "SERVER";
        case "language": return "LANGUAGE";
        default: return "TABLE";
    }
}

export function buildCleanupSql(
    owned: OwnedObject[],
    privs: PrivilegeRecord[],
    opts: BuildSqlOptions
): string {
    const lines: string[] = [];
    lines.push("BEGIN;");

    for (const o of owned) {
        const choice = opts.ownedChoices[o.identity]?.action ?? "ignore";
        const objOwner = opts.ownedChoices[o.identity]?.newOwner ?? opts.newOwner;
        const targetSchema = opts.ownedChoices[o.identity]?.newSchema;

        if (choice === "ignore") continue;

        const cascade = choice === "drop_cascade" ? " CASCADE" : "";

        if (choice === "drop_cascade" || choice === "drop_restrict") {
            switch (o.objtype) {
                case "table": lines.push(`DROP TABLE IF EXISTS ${o.identity}${cascade};`); break;
                case "view": lines.push(`DROP VIEW IF EXISTS ${o.identity}${cascade};`); break;
                case "matview": lines.push(`DROP MATERIALIZED VIEW IF EXISTS ${o.identity}${cascade};`); break;
                case "sequence": lines.push(`DROP SEQUENCE IF EXISTS ${o.identity}${cascade};`); break;
                case "function": lines.push(`DROP FUNCTION IF EXISTS ${o.identity}${cascade};`); break;
                case "type": lines.push(`DROP TYPE IF EXISTS ${o.identity}${cascade};`); break;
                case "domain": lines.push(`DROP DOMAIN IF EXISTS ${o.identity}${cascade};`); break;
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
                case "table": lines.push(`ALTER TABLE ${o.identity} OWNER TO ${objOwner};`); break;
                case "view": lines.push(`ALTER VIEW ${o.identity} OWNER TO ${objOwner};`); break;
                case "matview": lines.push(`ALTER MATERIALIZED VIEW ${o.identity} OWNER TO ${objOwner};`); break;
                case "sequence": lines.push(`ALTER SEQUENCE ${o.identity} OWNER TO ${objOwner};`); break;
                case "function": lines.push(`ALTER FUNCTION ${o.identity} OWNER TO ${objOwner};`); break;
                case "type": lines.push(`ALTER TYPE ${o.identity} OWNER TO ${objOwner};`); break;
                case "domain": lines.push(`ALTER DOMAIN ${o.identity} OWNER TO ${objOwner};`); break;
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
            const alterSchemaStmt = (kind: string) => `ALTER ${kind} ${o.identity} SET SCHEMA ${targetSchema};`;
            switch (o.objtype) {
                case "table": lines.push(alterSchemaStmt("TABLE")); break;
                case "view": lines.push(alterSchemaStmt("VIEW")); break;
                case "matview": lines.push(alterSchemaStmt("MATERIALIZED VIEW")); break;
                case "sequence": lines.push(alterSchemaStmt("SEQUENCE")); break;
                case "function": lines.push(alterSchemaStmt("FUNCTION")); break;
                case "type": lines.push(alterSchemaStmt("TYPE")); break;
                case "domain": lines.push(alterSchemaStmt("DOMAIN")); break;
                // poniższe nie wspierają SET SCHEMA: extension, schema, server, fdw, publication, language, database, user_mapping
                default: lines.push(`-- MOVE nieobsługiwane dla ${o.objtype} ${o.identity}`); break;
            }
            if (objOwner) {
                const alterOwnerStmt = (kind: string) => `ALTER ${kind} ${o.identity} OWNER TO ${objOwner};`;
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
            continue;
        }
    }

    for (const p of privs) {
        const key = `${p.identity}|${p.privilege_type}|${p.grantee_name}|${p.grantor_name}`;
        const choice = opts.privilegeChoices[key]?.action ?? "keep";
        if (choice === "keep") continue;

        const kw = objKeywordForRevoke(p.objtype);
        if (choice === "revoke") {
            lines.push(`REVOKE ${p.privilege_type} ON ${kw} ${p.identity} FROM ${opts.roleName};`);
        } else if (choice === "revoke_grant_option") {
            lines.push(`REVOKE GRANT OPTION FOR ${p.privilege_type} ON ${kw} ${p.identity} FROM ${opts.roleName};`);
        }
    }

    lines.push(`DROP OWNED BY ${opts.roleName};`);
    lines.push(`-- Uruchom w każdej bazie. Gdy brak zależności w całym klastrze:`);
    lines.push(`DROP ROLE ${opts.roleName};`);
    lines.push("COMMIT;");
    return lines.join("\n");
}