export function viewDdl(version: string): string {
  const major = parseInt(version.split(".")[0], 10);

  return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS view_name, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('v','m')
)
SELECT
  '-- DROP VIEW IF EXISTS ' || quote_ident(o.schema_name) || '.' || quote_ident(o.view_name) || E';\\n\\n' ||
  CASE
    WHEN o.relkind = 'm' THEN
      'CREATE MATERIALIZED VIEW ' || quote_ident(o.schema_name) || '.' || quote_ident(o.view_name) || E' AS\\n' || pg_get_viewdef(o.oid, true) || ';'
    ELSE
      'CREATE VIEW ' || quote_ident(o.schema_name) || '.' || quote_ident(o.view_name) || E' AS\\n' || pg_get_viewdef(o.oid, true) || ';'
  END AS source
FROM obj o;
`;
}

export function viewOwnerDdl(_version: string): string {
  return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS view_name, r.rolname AS owner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles r ON r.oid = c.relowner
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('v','m')
)
SELECT
    format(
        'ALTER VIEW %I.%I OWNER TO %I;',
        o.schema_name,
        o.view_name,
        o.owner
    ) AS source
FROM obj o;
`;
}

export function viewPrivilegesDdl(_version: string): string {
  // same logic as table privileges but applied to views
  return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('v','m')
),
acl AS (
  SELECT
    o.schema_name,
    o.view_name,
    unnest(c.relacl) AS aclitem
  FROM obj o
  JOIN pg_class c ON c.oid = o.oid
),
parsed AS (
  SELECT
    schema_name,
    view_name,
    (split_part(aclitem::text, '=', 1))::text AS grantee_raw,
    split_part(split_part(aclitem::text, '=', 2), '/', 1) AS privs,
    split_part(split_part(aclitem::text, '=', 2), '/', 2) AS grantor
  FROM acl
),
grantees AS (
  SELECT
    schema_name,
    view_name,
    CASE
      WHEN grantee_raw = '' THEN 'public'
      ELSE grantee_raw
    END AS grantee,
    privs,
    grantor
  FROM parsed
),
expanded AS (
  SELECT
    schema_name,
    view_name,
    grantee,
    grantor,
    unnest(string_to_array(privs, '')) AS privchar
  FROM grantees
),
mapped AS (
  SELECT
    schema_name,
    view_name,
    grantee,
    grantor,
    CASE privchar
      WHEN 'a' THEN 'INSERT'
      WHEN 'r' THEN 'SELECT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      WHEN 'D' THEN 'TRUNCATE'
      WHEN 'x' THEN 'REFERENCES'
      WHEN 't' THEN 'TRIGGER'
      WHEN 'X' THEN 'EXECUTE'
      WHEN 'U' THEN 'USAGE'
      WHEN 'C' THEN 'CREATE'
      WHEN 'c' THEN 'CONNECT'
      WHEN 'T' THEN 'TEMPORARY'
      ELSE null
    END AS privilege
  FROM expanded
)
SELECT
  format(
    E'-- REVOKE %s ON VIEW %I.%I FROM %I;\\nGRANT %s ON VIEW %I.%I TO %I;',
    string_agg(privilege, ', ' ORDER BY privilege),
    schema_name,
    view_name,
    grantee,
    string_agg(privilege, ', ' ORDER BY privilege),
    schema_name,
    view_name,
    grantee
  ) AS source
FROM mapped
WHERE privilege IS NOT NULL
GROUP BY schema_name, view_name, grantee
ORDER BY grantee;
`;
}

export function viewCommentDdl(_version: string): string {
  return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('v','m')
)
SELECT
    format(
        'COMMENT ON VIEW %I.%I IS %L;',
        o.schema_name,
        o.view_name,
        d.description
    ) AS source
FROM obj o
LEFT JOIN pg_description d ON d.objoid = o.oid AND d.classoid = 'pg_class'::regclass AND d.objsubid = 0;
`;
}

export function viewColumnCommentsDdl(_version: string): string {
  return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('v','m')
)
SELECT
    format(
        'COMMENT ON COLUMN %I.%I.%I IS %L;',
        o.schema_name,
        o.view_name,
        a.attname,
        d.description
    ) AS source
FROM obj o
JOIN pg_attribute a ON a.attrelid = o.oid AND a.attnum > 0 AND NOT a.attisdropped
LEFT JOIN pg_description d ON d.objoid = o.oid AND d.classoid = 'pg_class'::regclass AND d.objsubid = a.attnum;
`;
}

export function viewTriggersDdl(version: string): string {
  const major = parseInt(version.split(".")[0], 10);

  return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('v','m')
)
SELECT
    pg_get_triggerdef(t.oid)||';' AS source
FROM pg_trigger t
JOIN obj o ON o.oid = t.tgrelid
WHERE t.tgrelid = o.oid AND NOT t.tgisinternal;
`;
}

export function viewTriggerCommentsDdl(_version: string): string {
  return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('v','m')
)
SELECT
    format(
        'COMMENT ON TRIGGER %I ON %I.%I IS %L;',
        t.tgname,
        o.schema_name,
        o.view_name,
        d.description
    ) AS source
FROM obj o
JOIN pg_trigger t ON t.tgrelid = o.oid AND NOT t.tgisinternal
LEFT JOIN pg_description d ON d.objoid = t.oid AND d.classoid = 'pg_trigger'::regclass AND d.objsubid = 0;
`;
}

export function viewRulesDdl(_version: string): string {
  return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('v','m')
)
SELECT
    pg_get_ruledef(r.oid)||';' AS source
FROM pg_rewrite r
JOIN obj o ON r.ev_class = o.oid
WHERE r.ev_class = o.oid AND r.rulename <> '_RETURN';
`;
}

export function viewRuleCommentsDdl(_version: string): string {
  return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('v','m')
)
SELECT
    format(
        'COMMENT ON RULE %I ON %I.%I IS %L;',
        r.rulename,
        o.schema_name,
        o.view_name,
        d.description
    ) AS source
FROM obj o
JOIN pg_rewrite r ON r.ev_class = o.oid AND r.rulename <> '_RETURN'
LEFT JOIN pg_description d ON d.objoid = r.oid AND d.classoid = 'pg_rewrite'::regclass AND d.objsubid = 0;
`;
}
