import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { versionToNumber } from "../../../../src/api/version";

export async function roleDdl(session: IDatabaseSession, roleName: string) {
  const versionNumber = versionToNumber(session.getVersion() || "0.0.0");

  return [
    await session.query<{ source: string }>(roleBodyDdl(versionNumber), [roleName]).then(res => res.rows.map(row => row.source).join("\n")),
    await session.query<{ source: string }>(roleMembershipDdl(versionNumber), [roleName]).then(res => res.rows.map(row => row.source).join("\n")),
    await session.query<{ source: string }>(roleConfigDdl(versionNumber), [roleName]).then(res => res.rows.map(row => row.source).join("\n")),
    //await session.query<{ source: string }>(roleGrantsDdl(versionNumber), [roleName]).then(res => res.rows.map(row => row.source).join("\n")),
  ].filter(Boolean).join("\n\n") ?? "-- No DDL available";
}

export function roleBodyDdl(_version: number): string {
  return `
SELECT
  '-- DROP ROLE IF EXISTS ' || quote_ident(rolname) || ';' || E'\\n' ||
  'CREATE ROLE ' || quote_ident(rolname) ||
  CASE WHEN rolsuper THEN ' SUPERUSER' ELSE ' NOSUPERUSER' END ||
  CASE WHEN rolinherit THEN ' INHERIT' ELSE ' NOINHERIT' END ||
  CASE WHEN rolcreaterole THEN ' CREATEROLE' ELSE ' NOCREATEROLE' END ||
  CASE WHEN rolcreatedb THEN ' CREATEDB' ELSE ' NOCREATEDB' END ||
  CASE WHEN rolcanlogin THEN ' LOGIN' ELSE ' NOLOGIN' END ||
  CASE WHEN rolreplication THEN ' REPLICATION' ELSE ' NOREPLICATION' END ||
  CASE WHEN rolbypassrls THEN ' BYPASSRLS' ELSE ' NOBYPASSRLS' END ||
  CASE WHEN rolconnlimit >= 0 THEN ' CONNECTION LIMIT ' || rolconnlimit::text ELSE '' END ||
  CASE WHEN rolvaliduntil IS NOT NULL THEN ' VALID UNTIL ' || quote_literal(rolvaliduntil::text) ELSE '' END ||
  ';' AS source
FROM pg_roles
WHERE rolname = $1;
`;
}

export function roleCommentDdl(_version: number): string {
  return `
SELECT
  '-- COMMENT ON ROLE ' || quote_ident(r.rolname) || ' IS NULL;' || E'\\n' ||
  'COMMENT ON ROLE ' || quote_ident(r.rolname) || ' IS ' || quote_literal(sd.description) || ';' AS source
FROM pg_roles r
JOIN pg_shdescription sd ON sd.objoid = r.oid AND sd.classoid = 'pg_authid'::regclass
WHERE r.rolname = $1;
`;
}

export function roleMembershipDdl(_version: number): string {
  return `
SELECT
  '-- REVOKE ' || quote_ident(g.rolname) || ' FROM ' || quote_ident(m.rolname) || ';' || E'\\n' ||
  'GRANT ' || quote_ident(g.rolname) || ' TO ' || quote_ident(m.rolname) ||
  CASE WHEN admin_option THEN ' WITH ADMIN OPTION' ELSE '' END || ';' AS source
FROM pg_auth_members am
JOIN pg_roles g ON g.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
WHERE g.rolname = $1
ORDER BY m.rolname;
`;
}

export function roleConfigDdl(_version: number): string {
  return `
SELECT
  '-- ALTER ROLE ' || quote_ident(r.rolname) || ' RESET ' || split_part(unnest(r.rolconfig), '=', 1) || ';' || E'\\n' ||
  'ALTER ROLE ' || quote_ident(r.rolname) || ' SET ' || unnest(r.rolconfig) || ';' AS source
FROM pg_roles r
WHERE r.rolname = $1
  AND r.rolconfig IS NOT NULL;
`;
}

export function roleGrantsDdl(_version: number): string {
  return `
-- Database privileges
SELECT
  '-- REVOKE ' || privilege_type || ' ON DATABASE ' || quote_ident(d.datname) || ' FROM ' || quote_ident($1) || ';' || E'\\n' ||
  'GRANT ' || privilege_type || ' ON DATABASE ' || quote_ident(d.datname) || ' TO ' || quote_ident($1) ||
  CASE WHEN is_grantable THEN ' WITH GRANT OPTION' ELSE '' END || ';' AS source
FROM pg_database d
CROSS JOIN aclexplode(d.datacl) AS acl
JOIN pg_roles r ON r.oid = acl.grantee
WHERE r.rolname = $1

UNION ALL

-- Schema privileges
SELECT
  '-- REVOKE ' || privilege_type || ' ON SCHEMA ' || quote_ident(n.nspname) || ' FROM ' || quote_ident($1) || ';' || E'\\n' ||
  'GRANT ' || privilege_type || ' ON SCHEMA ' || quote_ident(n.nspname) || ' TO ' || quote_ident($1) ||
  CASE WHEN is_grantable THEN ' WITH GRANT OPTION' ELSE '' END || ';' AS source
FROM pg_namespace n
CROSS JOIN aclexplode(n.nspacl) AS acl
JOIN pg_roles r ON r.oid = acl.grantee
WHERE r.rolname = $1
  AND n.nspname NOT LIKE 'pg_%'
  AND n.nspname != 'information_schema'

UNION ALL

-- Table privileges
SELECT
  '-- REVOKE ' || privilege_type || ' ON TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' FROM ' || quote_ident($1) || ';' || E'\\n' ||
  'GRANT ' || privilege_type || ' ON TABLE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' TO ' || quote_ident($1) ||
  CASE WHEN is_grantable THEN ' WITH GRANT OPTION' ELSE '' END || ';' AS source
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN aclexplode(c.relacl) AS acl
JOIN pg_roles r ON r.oid = acl.grantee
WHERE r.rolname = $1
  AND c.relkind IN ('r', 'v', 'm', 'f', 'p')
  AND n.nspname NOT LIKE 'pg_%'
  AND n.nspname != 'information_schema'

UNION ALL

-- Sequence privileges
SELECT
  '-- REVOKE ' || privilege_type || ' ON SEQUENCE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' FROM ' || quote_ident($1) || ';' || E'\\n' ||
  'GRANT ' || privilege_type || ' ON SEQUENCE ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || ' TO ' || quote_ident($1) ||
  CASE WHEN is_grantable THEN ' WITH GRANT OPTION' ELSE '' END || ';' AS source
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN aclexplode(c.relacl) AS acl
JOIN pg_roles r ON r.oid = acl.grantee
WHERE r.rolname = $1
  AND c.relkind = 'S'
  AND n.nspname NOT LIKE 'pg_%'
  AND n.nspname != 'information_schema'

UNION ALL

-- Function privileges
SELECT
  '-- REVOKE EXECUTE ON FUNCTION ' || quote_ident(n.nspname) || '.' || quote_ident(p.proname) || 
    '(' || pg_get_function_identity_arguments(p.oid) || ') FROM ' || quote_ident($1) || ';' || E'\\n' ||
  'GRANT EXECUTE ON FUNCTION ' || quote_ident(n.nspname) || '.' || quote_ident(p.proname) || 
    '(' || pg_get_function_identity_arguments(p.oid) || ') TO ' || quote_ident($1) || ';' AS source
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
CROSS JOIN aclexplode(p.proacl) AS acl
JOIN pg_roles r ON r.oid = acl.grantee
WHERE r.rolname = $1
  AND n.nspname NOT LIKE 'pg_%'
  AND n.nspname != 'information_schema'

ORDER BY source;
`;
}