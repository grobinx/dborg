export function schemaCreateDdl(_version: number): string {
    return `
SELECT
  '-- DROP SCHEMA IF EXISTS ' || quote_ident(nspname) || ' CASCADE;' || E'\\n' ||
  'CREATE SCHEMA ' || quote_ident(nspname) ||
  ' AUTHORIZATION ' || quote_ident(pg_get_userbyid(nspowner)) || ';' AS source
FROM pg_namespace
WHERE nspname = $1;
`;
}

export function schemaCommentDdl(_version: number): string {
    return `
SELECT
  '-- COMMENT ON SCHEMA ' || quote_ident(nspname) || ' IS NULL;' || E'\\n' ||
  'COMMENT ON SCHEMA ' || quote_ident(nspname) || ' IS ' || quote_literal(d.description) || ';' AS source
FROM pg_namespace n
JOIN pg_description d ON d.objoid = n.oid AND d.classoid = 'pg_namespace'::regclass
WHERE n.nspname = $1;
`;
}

export function schemaPrivilegesDdl(_version: number): string {
    return `
SELECT
  '-- REVOKE ' || privilege_type || ' ON SCHEMA ' || quote_ident($1) || ' FROM ' ||
    (CASE WHEN grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(grantee)) END) || ';' || E'\\n' ||
  (CASE WHEN is_grantable THEN '-- REVOKE GRANT OPTION FOR ' || privilege_type || ' ON SCHEMA ' || quote_ident($1) || ' FROM ' ||
        (CASE WHEN grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(grantee)) END) || ';' || E'\\n' ELSE '' END) ||
  'GRANT ' || privilege_type || ' ON SCHEMA ' || quote_ident($1) ||
  ' TO ' || (CASE WHEN grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(grantee)) END) ||
  (CASE WHEN is_grantable THEN ' WITH GRANT OPTION' ELSE '' END) || ';' AS source
FROM pg_namespace n
CROSS JOIN aclexplode(n.nspacl)
WHERE n.nspname = $1
  AND grantee != n.nspowner;
`;
}