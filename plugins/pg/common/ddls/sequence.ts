export function sequenceDdl(version: string): string {
    const major = parseInt(String(version).split(".")[0], 10) || 0;

    if (major >= 10) {
        // PostgreSQL 10+ : use pg_sequence
        return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS sequence_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind = 'S'
),
seq_info AS (
  SELECT
    o.oid,
    o.schema_name,
    o.sequence_name,
    s.seqtypid,
    s.seqstart,
    s.seqmin,
    s.seqmax,
    s.seqincrement,
    s.seqcycle,
    s.seqcache
  FROM obj o
  JOIN pg_sequence s ON s.seqrelid = o.oid
)
SELECT
  '-- DROP SEQUENCE IF EXISTS ' || quote_ident(si.schema_name) || '.' || quote_ident(si.sequence_name) || E';\\n' ||
  'CREATE SEQUENCE ' || quote_ident(si.schema_name) || '.' || quote_ident(si.sequence_name) ||
  ' AS ' || format_type(si.seqtypid, null) ||
  ' START WITH ' || si.seqstart ||
  ' INCREMENT BY ' || si.seqincrement ||
  ' MINVALUE ' || si.seqmin ||
  ' MAXVALUE ' || si.seqmax ||
  ' CACHE ' || si.seqcache ||
  (CASE WHEN si.seqcycle THEN ' CYCLE' ELSE ' NO CYCLE' END) || ';' AS source
FROM seq_info si;
`;
    }

    // Pre-10 : fall back to information_schema.sequences (less detailed than pg_sequence)
    return `
SELECT
  '-- DROP SEQUENCE IF EXISTS ' || quote_ident(sequence_schema) || '.' || quote_ident(sequence_name) || E';\\n' ||
  'CREATE SEQUENCE ' || quote_ident(sequence_schema) || '.' || quote_ident(sequence_name) ||
  ' START WITH ' || start_value::text ||
  ' INCREMENT BY ' || increment::text ||
  ' MINVALUE ' || minimum_value::text ||
  ' MAXVALUE ' || maximum_value::text ||
  (CASE WHEN cycle_option = 'YES' THEN ' CYCLE' ELSE ' NO CYCLE' END) ||
  ';' AS source
FROM information_schema.sequences
WHERE sequence_schema = $1 AND sequence_name = $2;
`;
}

export function sequenceOwnerDdl(_version: string): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS sequence_name, r.rolname AS owner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles r ON r.oid = c.relowner
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind = 'S'
)
SELECT
    format(
        'ALTER SEQUENCE %I.%I OWNER TO %I;',
        o.schema_name,
        o.sequence_name,
        o.owner
    ) AS source
FROM obj o;
`;
}

export function sequencePrivilegesDdl(_version: string): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS sequence_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind = 'S'
),
acl AS (
  SELECT
    o.schema_name,
    o.sequence_name,
    unnest(c.relacl) AS aclitem
  FROM obj o
  JOIN pg_class c ON c.oid = o.oid
),
parsed AS (
  SELECT
    schema_name,
    sequence_name,
    (split_part(aclitem::text, '=', 1))::text AS grantee_raw,
    split_part(split_part(aclitem::text, '=', 2), '/', 1) AS privs,
    split_part(split_part(aclitem::text, '=', 2), '/', 2) AS grantor
  FROM acl
),
grantees AS (
  SELECT
    schema_name,
    sequence_name,
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
    sequence_name,
    grantee,
    grantor,
    unnest(string_to_array(privs, '')) AS privchar
  FROM grantees
),
mapped AS (
  SELECT
    schema_name,
    sequence_name,
    grantee,
    grantor,
    CASE privchar
      WHEN 'r' THEN 'SELECT'
      WHEN 'U' THEN 'USAGE'
      WHEN 'u' THEN 'UPDATE'
      ELSE null
    END AS privilege
  FROM expanded
)
SELECT
  format(
    E'-- REVOKE %s ON SEQUENCE %I.%I FROM %I;\\nGRANT %s ON SEQUENCE %I.%I TO %I;',
    string_agg(privilege, ', ' ORDER BY privilege),
    schema_name,
    sequence_name,
    grantee,
    string_agg(privilege, ', ' ORDER BY privilege),
    schema_name,
    sequence_name,
    grantee
  ) AS source
FROM mapped
WHERE privilege IS NOT NULL
GROUP BY schema_name, sequence_name, grantee
ORDER BY grantee;
`;
}

export function sequenceCommentDdl(_version: string): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS sequence_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind = 'S'
)
SELECT
    format(
        'COMMENT ON SEQUENCE %I.%I IS %L;',
        o.schema_name,
        o.sequence_name,
        d.description
    ) AS source
FROM obj o
LEFT JOIN pg_description d ON d.objoid = o.oid AND d.classoid = 'pg_class'::regclass AND d.objsubid = 0;
`;
}

export function sequenceOperationalDdl(version: string): string {
    const major = parseInt(version.split(".")[0], 10);

    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS sequence_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind = 'S'
)
SELECT
  E'-- Operational commands:\\n' ||
  E'-- Reset sequence:\\n' ||
  '-- ALTER SEQUENCE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.sequence_name) || ' RESTART WITH 1;' || E'\\n' ||
  E'\\n-- Set next value:\\n' ||
  '-- SELECT setval(''' || quote_ident(o.schema_name) || '.' || quote_ident(o.sequence_name) || ''', 100);' || E'\\n' ||
  E'\\n-- Get current value:\\n' ||
  '-- SELECT currval(''' || quote_ident(o.schema_name) || '.' || quote_ident(o.sequence_name) || ''');' || E'\\n' ||
  E'\\n-- Get next value:\\n' ||
  '-- SELECT nextval(''' || quote_ident(o.schema_name) || '.' || quote_ident(o.sequence_name) || ''');' || E'\\n' ||
  E'\\n-- Cache control (use CACHE 1 to minimise caching):\\n' ||
  E'-- Set cache to 1 (minimal cache / effectively NO CACHE):\\n' ||
  '-- ALTER SEQUENCE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.sequence_name) || ' CACHE 1;' || E'\\n' ||
  E'-- Set cache to desired value:\\n' ||
  '-- ALTER SEQUENCE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.sequence_name) || ' CACHE 100;' || E'\\n' ||
  E'\\n-- Change increment / min / max / cycle:\\n' ||
  '-- ALTER SEQUENCE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.sequence_name) || ' INCREMENT BY 10;' || E'\\n' ||
  '-- ALTER SEQUENCE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.sequence_name) || ' MINVALUE 1 MAXVALUE 1000;' || E'\\n' ||
  '-- ALTER SEQUENCE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.sequence_name) || ' CYCLE;' || E'\\n' ||
  E'\\n-- Change ownership / drop ownership:\\n' ||
  '-- ALTER SEQUENCE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.sequence_name) || ' OWNER TO other_role;' || E'\\n' ||
  '-- ALTER SEQUENCE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.sequence_name) || ' OWNED BY NONE; -- detach from table'
  AS source
FROM obj o;
`;
}