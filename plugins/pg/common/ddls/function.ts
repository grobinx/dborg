import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { versionToNumber } from "../../../../src/api/version";

export async function functionDdl(
    session: IDatabaseSession,
    schemaName: string,
    functionName: string,
    args: string
): Promise<string> {
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");
    
    return [
        await session
            .query<{ source: string }>(functionBodyDdl(versionNumber), [schemaName, functionName, args])
            .then((res) => res.rows.map((row) => row.source).join("\n")),
        await session
            .query<{ source: string }>(functionOwnerDdl(versionNumber), [schemaName, functionName, args])
            .then((res) => res.rows.map((row) => row.source).join("\n")),
        await session
            .query<{ source: string }>(functionPrivilegesDdl(versionNumber), [schemaName, functionName, args])
            .then((res) => res.rows.map((row) => row.source).join("\n")),
        await session
            .query<{ source: string }>(functionCommentDdl(versionNumber), [schemaName, functionName, args])
            .then((res) => res.rows.map((row) => row.source).join("\n")),
    ]
        .filter(Boolean)
        .join("\n\n") || "-- No DDL available";
}

export function functionBodyDdl(version: number): string {
    // pg_get_functiondef available since PG 8.4
    // PROCEDURE support since PG 11.0 (version 110000)
    const isProcedureSupported = version >= 110000;
    
    const procedureCase = isProcedureSupported
        ? `WHEN o.prokind = 'p' THEN 'PROCEDURE'`
        : '';

    const dropIfExists = version >= 80200 ? 'IF EXISTS ' : '';

    return `
WITH obj AS (
  SELECT
      p.oid,
      n.nspname AS function_schema,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS arguments,
      ${version >= 110000 ? 'p.prokind' : "'f'::char AS prokind"}
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = $1
    AND p.proname = $2
    AND pg_get_function_identity_arguments(p.oid) = $3
    ${version >= 110000 ? "AND p.prokind IN ('f', 'p', 'w')" : ""}
  LIMIT 1
)
SELECT
  '-- DROP ' ||
  CASE
    ${procedureCase}
    WHEN o.prokind = 'w' THEN 'FUNCTION'
    ELSE 'FUNCTION'
  END ||
  ' ${dropIfExists}' ||
  quote_ident(o.function_schema) || '.' || quote_ident(o.function_name) ||
  '(' || o.arguments || ');' ||
  E'\\n\\n' ||
  pg_get_functiondef(o.oid) || ';' AS source
FROM obj o;
`;
}

export function functionOwnerDdl(version: number): string {
    const isProcedureSupported = version >= 110000;
    
    const procedureCase = isProcedureSupported
        ? `WHEN o.prokind = 'p' THEN 'PROCEDURE'`
        : '';

    return `
WITH obj AS (
  SELECT
      p.oid,
      n.nspname AS function_schema,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS arguments,
      pg_get_userbyid(p.proowner) AS owner,
      ${version >= 110000 ? 'p.prokind' : "'f'::char AS prokind"}
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = $1
    AND p.proname = $2
    AND pg_get_function_identity_arguments(p.oid) = $3
  LIMIT 1
)
SELECT
  'ALTER ' ||
  CASE
    ${procedureCase}
    WHEN o.prokind = 'a' THEN 'AGGREGATE'
    WHEN o.prokind = 'w' THEN 'FUNCTION'
    ELSE 'FUNCTION'
  END ||
  ' ' || quote_ident(o.function_schema) || '.' || quote_ident(o.function_name) ||
  '(' || o.arguments || ')' ||
  ' OWNER TO ' || quote_ident(o.owner) || ';' AS source
FROM obj o;
`;
}

export function functionPrivilegesDdl(version: number): string {
    const isProcedureSupported = version >= 110000;
    
    const procedureCase = isProcedureSupported
        ? `WHEN g.prokind = 'p' THEN 'PROCEDURE'`
        : '';

    return `
WITH obj AS (
  SELECT
      p.oid,
      n.nspname AS function_schema,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS arguments,
      p.proacl,
      ${version >= 110000 ? 'p.prokind' : "'f'::char AS prokind"}
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = $1
    AND p.proname = $2
    AND pg_get_function_identity_arguments(p.oid) = $3
  LIMIT 1
),
grants AS (
  SELECT
    o.oid,
    o.function_schema,
    o.function_name,
    o.arguments,
    o.prokind,
    acl.grantor,
    acl.grantee,
    acl.privilege_type,
    acl.is_grantable
  FROM obj o,
  LATERAL aclexplode(COALESCE(o.proacl, acldefault('f'::"char", (SELECT relowner FROM pg_class WHERE oid = 'pg_proc'::regclass)))) AS acl
  WHERE acl.privilege_type = 'EXECUTE'
)
SELECT
  '-- REVOKE ' || g.privilege_type ||
  ' ON ' ||
  CASE
    ${procedureCase}
    WHEN g.prokind = 'a' THEN 'AGGREGATE'
    WHEN g.prokind = 'w' THEN 'FUNCTION'
    ELSE 'FUNCTION'
  END ||
  ' ' || quote_ident(g.function_schema) || '.' || quote_ident(g.function_name) ||
  '(' || g.arguments || ')' ||
  ' FROM ' ||
  CASE WHEN g.grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(g.grantee)) END ||
  ';' ||
  E'\\n' ||
  'GRANT ' || g.privilege_type ||
  ' ON ' ||
  CASE
    ${procedureCase}
    WHEN g.prokind = 'a' THEN 'AGGREGATE'
    WHEN g.prokind = 'w' THEN 'FUNCTION'
    ELSE 'FUNCTION'
  END ||
  ' ' || quote_ident(g.function_schema) || '.' || quote_ident(g.function_name) ||
  '(' || g.arguments || ')' ||
  ' TO ' ||
  CASE WHEN g.grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(g.grantee)) END ||
  CASE WHEN g.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END ||
  ';' AS source
FROM grants g
ORDER BY g.grantee, g.privilege_type;
`;
}

export function functionCommentDdl(version: number): string {
    const isProcedureSupported = version >= 110000;
    
    const procedureCase = isProcedureSupported
        ? `WHEN o.prokind = 'p' THEN 'PROCEDURE'`
        : '';

    return `
WITH obj AS (
  SELECT
      p.oid,
      n.nspname AS function_schema,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS arguments,
      ${version >= 110000 ? 'p.prokind' : "'f'::char AS prokind"}
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = $1
    AND p.proname = $2
    AND pg_get_function_identity_arguments(p.oid) = $3
  LIMIT 1
)
SELECT
  'COMMENT ON ' ||
  CASE
    ${procedureCase}
    WHEN o.prokind = 'a' THEN 'AGGREGATE'
    WHEN o.prokind = 'w' THEN 'FUNCTION'
    ELSE 'FUNCTION'
  END ||
  ' ' || quote_ident(o.function_schema) || '.' || quote_ident(o.function_name) ||
  '(' || o.arguments || ')' ||
  ' IS ' || quote_literal(obj_description(o.oid, 'pg_proc')) || ';' AS source
FROM obj o
WHERE obj_description(o.oid, 'pg_proc') IS NOT NULL;
`;
}