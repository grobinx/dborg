export function tableDdl(version: number): string {

    // IF [NOT] EXISTS support: CREATE TABLE IF NOT EXISTS - PG 9.1+, DROP TABLE IF EXISTS - PG 8.2+
    const dropIfExists = 'IF EXISTS ';
    const createIfNotExists = version >= 90000 ? 'IF NOT EXISTS ' : '';

    const identityFragment = version >= 100000
        ? `WHEN att.attidentity IN ('a','d')
              THEN format(' GENERATED %s AS IDENTITY',
                          CASE att.attidentity WHEN 'a' THEN 'ALWAYS' ELSE 'BY DEFAULT' END)`
        : "";

    const generatedFragment = version >= 120000
        ? `WHEN att.attgenerated = 's'
              THEN format(' GENERATED ALWAYS AS (%s) STORED', pg_get_expr(ad.adbin, ad.adrelid))`
        : "";

    const partitionFragment = version >= 100000
        ? `(SELECT CASE WHEN c.relkind = 'p' THEN E'\\nPARTITION BY ' || pg_get_partkeydef(o.oid) ELSE '' END FROM pg_class c WHERE c.oid = o.oid)`
        : "''";

    // Operational commands based on version
    const operationalCommands = version >= 120000
        ? `E'-- Operational commands:\\n' ||
           '-- REINDEX TABLE CONCURRENTLY ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E';\\n' ||
           '-- VACUUM (FULL, ANALYZE, VERBOSE) ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E';\\n' ||
           '-- VACUUM (ANALYZE) ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E';\\n' ||
           '-- ANALYZE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E';\\n' ||
           '-- CLUSTER ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E';\\n' ||
           '-- TRUNCATE TABLE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E' RESTART IDENTITY CASCADE;\\n\\n' ||`
        : version >= 90000
            ? `E'-- Operational commands:\\n' ||
           '-- REINDEX TABLE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E';\\n' ||
           '-- VACUUM (FULL, ANALYZE, VERBOSE) ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E';\\n' ||
           '-- VACUUM (ANALYZE) ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E';\\n' ||
           '-- ANALYZE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E';\\n' ||
           '-- CLUSTER ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E';\\n' ||
           '-- TRUNCATE TABLE ' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E' RESTART IDENTITY CASCADE;\\n\\n' ||`
            : `''`;

    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name, c.relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
  ${operationalCommands}
  '-- DROP TABLE ${dropIfExists}' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || E';\\n\\n' ||
  CASE
    WHEN o.relkind = 'f' THEN
      'CREATE FOREIGN TABLE ${createIfNotExists}' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || ' (\n' ||
      (
        SELECT string_agg(
          format(
            '  %s %s%s%s%s',
            quote_ident(att.attname),
            pg_catalog.format_type(att.atttypid, att.atttypmod),
            CASE
              WHEN coll.oid IS NOT NULL AND att.attcollation <> typ.typcollation
                THEN format(' COLLATE %I.%I', colln.nspname, coll.collname)
              ELSE ''
            END,
            CASE
              ${identityFragment}
              ${generatedFragment}
              WHEN ad.adbin IS NOT NULL
                THEN format(' DEFAULT %s', pg_get_expr(ad.adbin, ad.adrelid))
              ELSE ''
            END,
            CASE WHEN att.attnotnull THEN ' NOT NULL' ELSE '' END
          ),
          E',\n'
        )
        FROM pg_attribute att
        LEFT JOIN pg_attrdef ad ON ad.adrelid = att.attrelid AND ad.adnum = att.attnum
        LEFT JOIN pg_type typ ON typ.oid = att.atttypid
        LEFT JOIN pg_collation coll ON coll.oid = att.attcollation
        LEFT JOIN pg_namespace colln ON colln.oid = coll.collnamespace
        WHERE att.attrelid = o.oid AND att.attnum > 0 AND NOT att.attisdropped
      ) ||
      (
        SELECT
          CASE WHEN COUNT(*) > 0 THEN
            E',\n' || string_agg(
              format(
                '  CONSTRAINT %s %s',
                quote_ident(con.conname),
                pg_get_constraintdef(con.oid, true)
              ),
              E',\n'
            )
          ELSE '' END
        FROM pg_constraint con
        WHERE con.conrelid = o.oid AND con.contype IN ('p','u','c','f','x')
      ) ||
      E'\n)' ||
      COALESCE(
        (SELECT E'\nOPTIONS (' || array_to_string(ft.ftoptions, ', ') || ')'
         FROM pg_foreign_table ft WHERE ft.ftrelid = o.oid AND array_length(ft.ftoptions, 1) > 0),
        ''
      ) ||
      E'\nSERVER ' || (
        SELECT quote_ident(s.srvname)
        FROM pg_foreign_table ft
        JOIN pg_foreign_server s ON s.oid = ft.ftserver
        WHERE ft.ftrelid = o.oid
      ) || ';'
    ELSE
      'CREATE TABLE ${createIfNotExists}' || quote_ident(o.schema_name) || '.' || quote_ident(o.table_name) || ' (\n' ||
      (
        SELECT string_agg(
          format(
            '  %s %s%s%s%s',
            quote_ident(att.attname),
            pg_catalog.format_type(att.atttypid, att.atttypmod),
            CASE
              WHEN coll.oid IS NOT NULL AND att.attcollation <> typ.typcollation
                THEN format(' COLLATE %I.%I', colln.nspname, coll.collname)
              ELSE ''
            END,
            CASE
              ${identityFragment}
              ${generatedFragment}
              WHEN ad.adbin IS NOT NULL
                THEN format(' DEFAULT %s', pg_get_expr(ad.adbin, ad.adrelid))
              ELSE ''
            END,
            CASE WHEN att.attnotnull THEN ' NOT NULL' ELSE '' END
          ),
          E',\n'
        )
        FROM pg_attribute att
        LEFT JOIN pg_attrdef ad ON ad.adrelid = att.attrelid AND ad.adnum = att.attnum
        LEFT JOIN pg_type typ ON typ.oid = att.atttypid
        LEFT JOIN pg_collation coll ON coll.oid = att.attcollation
        LEFT JOIN pg_namespace colln ON colln.oid = coll.collnamespace
        WHERE att.attrelid = o.oid AND att.attnum > 0 AND NOT att.attisdropped
      ) ||
      (
        SELECT
          CASE WHEN COUNT(*) > 0 THEN
            E',\n' || string_agg(
              format(
                '  CONSTRAINT %s %s',
                quote_ident(con.conname),
                pg_get_constraintdef(con.oid, true)
              ),
              E',\n'
            )
          ELSE '' END
        FROM pg_constraint con
        WHERE con.conrelid = o.oid AND con.contype IN ('p','u','c','f','x')
      ) ||
      E'\n)' ||
      (
        SELECT
          CASE WHEN array_length(relopts, 1) > 0
            THEN E' WITH (' || array_to_string(relopts, ', ') || ')'
            ELSE '' END
        FROM (
          SELECT c.reloptions AS relopts
          FROM pg_class c WHERE c.oid = o.oid
        ) x
      ) ||
      ${partitionFragment} || ';'
  END AS source
FROM obj o;
`;
}

export function tableOwnerDdl(_version: number): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name, r.rolname AS owner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles r ON r.oid = c.relowner
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
    format(
        'ALTER TABLE %I.%I OWNER TO %I;',
        o.schema_name,
        o.table_name,
        o.owner
    ) AS source
FROM obj o;
`;
}

export function tableIndexesDdl(version: number): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
    format(
        E'-- DROP INDEX %s %I.%I;\\n-- REINDEX INDEX %s%I.%I;\\n%s',
        CASE WHEN i.indisunique OR i.indisprimary THEN 'CONCURRENTLY' ELSE '' END,
        n.nspname,
        idx.relname,
        ${version >= 120000 ? "'CONCURRENTLY '" : "''"},
        n.nspname,
        idx.relname,
        pg_get_indexdef(i.indexrelid)||';'
    ) AS source
FROM pg_index i
JOIN obj o ON o.oid = i.indrelid
JOIN pg_class idx ON idx.oid = i.indexrelid
JOIN pg_namespace n ON n.oid = idx.relnamespace
WHERE i.indrelid = o.oid;
`;
}

export function tableCommentDdl(_version: number): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
    format(
        'COMMENT ON TABLE %I.%I IS %L;',
        o.schema_name,
        o.table_name,
        d.description
    ) AS source
FROM obj o
LEFT JOIN pg_description d ON d.objoid = o.oid AND d.classoid = 'pg_class'::regclass AND d.objsubid = 0;
`;
}

export function tableColumnCommentsDdl(_version: number): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
    format(
        'COMMENT ON COLUMN %I.%I.%I IS %L;',
        o.schema_name,
        o.table_name,
        a.attname,
        d.description
    ) AS source
FROM obj o
JOIN pg_attribute a ON a.attrelid = o.oid AND a.attnum > 0 AND NOT a.attisdropped
LEFT JOIN pg_description d ON d.objoid = o.oid AND d.classoid = 'pg_class'::regclass AND d.objsubid = a.attnum;
`;
}

export function tableTriggersDdl(_version: number): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
    pg_get_triggerdef(t.oid)||';' AS source
FROM pg_trigger t
JOIN obj o ON o.oid = t.tgrelid
WHERE t.tgrelid = o.oid AND NOT t.tgisinternal;
`;
}

export function tableIndexCommentsDdl(_version: number): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
    format(
        'COMMENT ON INDEX %I.%I IS %L;',
        n.nspname,
        idx.relname,
        d.description
    ) AS source
FROM obj o
JOIN pg_index i ON i.indrelid = o.oid
JOIN pg_class idx ON idx.oid = i.indexrelid
JOIN pg_namespace n ON n.oid = idx.relnamespace
LEFT JOIN pg_description d ON d.objoid = idx.oid AND d.classoid = 'pg_class'::regclass AND d.objsubid = 0;
`;
}

export function tableTriggerCommentsDdl(_version: number): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
    format(
        'COMMENT ON TRIGGER %I ON %I.%I IS %L;',
        t.tgname,
        o.schema_name,
        o.table_name,
        d.description
    ) AS source
FROM obj o
JOIN pg_trigger t ON t.tgrelid = o.oid AND NOT t.tgisinternal
LEFT JOIN pg_description d ON d.objoid = t.oid AND d.classoid = 'pg_trigger'::regclass AND d.objsubid = 0;
`;
}

export function tableRulesDdl(_version: number): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
    pg_get_ruledef(r.oid) || ';' AS source
FROM pg_rewrite r
JOIN obj o ON r.ev_class = o.oid
WHERE r.ev_class = o.oid AND r.rulename <> '_RETURN'
ORDER BY r.rulename;
`;
}

export function tableRuleCommentsDdl(_version: number): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
    format(
        'COMMENT ON RULE %I ON %I.%I IS %L;',
        r.rulename,
        o.schema_name,
        o.table_name,
        d.description
    ) AS source
FROM obj o
JOIN pg_rewrite r ON r.ev_class = o.oid AND r.rulename <> '_RETURN'
LEFT JOIN pg_description d ON d.objoid = r.oid AND d.classoid = 'pg_rewrite'::regclass AND d.objsubid = 0
ORDER BY r.rulename;
`;
}

export function tablePrivilegesDdl(_version: number): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
),
acl AS (
  SELECT
    o.schema_name,
    o.table_name,
    unnest(c.relacl) AS aclitem
  FROM obj o
  JOIN pg_class c ON c.oid = o.oid
),
parsed AS (
  SELECT
    schema_name,
    table_name,
    (split_part(aclitem::text, '=', 1))::text AS grantee_raw,
    split_part(split_part(aclitem::text, '=', 2), '/', 1) AS privs,
    split_part(split_part(aclitem::text, '=', 2), '/', 2) AS grantor
  FROM acl
),
grantees AS (
  SELECT
    schema_name,
    table_name,
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
    table_name,
    grantee,
    grantor,
    unnest(string_to_array(privs, '')) AS privchar
  FROM grantees
),
mapped AS (
  SELECT
    schema_name,
    table_name,
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
      WHEN 'X' THEN 'EXECUTE'      -- not for tables, safe ignore
      WHEN 'U' THEN 'USAGE'        -- not for tables, safe ignore
      WHEN 'C' THEN 'CREATE'       -- schema-level, safe ignore
      WHEN 'c' THEN 'CONNECT'      -- db-level, safe ignore
      WHEN 'T' THEN 'TEMPORARY'    -- db-level, safe ignore
      ELSE null
    END AS privilege
  FROM expanded
)
SELECT
  format(
    E'-- REVOKE %s ON TABLE %I.%I FROM %I;\\nGRANT %s ON TABLE %I.%I TO %I;',
    string_agg(privilege, ', ' ORDER BY privilege),
    schema_name,
    table_name,
    grantee,
    string_agg(privilege, ', ' ORDER BY privilege),
    schema_name,
    table_name,
    grantee
  ) AS source
FROM mapped
WHERE privilege IS NOT NULL
GROUP BY schema_name, table_name, grantee
ORDER BY grantee;
`;
}

export function tableColumnPrivilegesDdl(_version: number): string {
    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
),
acl AS (
  SELECT
    o.schema_name,
    o.table_name,
    a.attname,
    unnest(a.attacl) AS aclitem
  FROM obj o
  JOIN pg_attribute a ON a.attrelid = o.oid
  WHERE a.attnum > 0 AND NOT a.attisdropped AND a.attacl IS NOT NULL
),
parsed AS (
  SELECT
    schema_name,
    table_name,
    attname,
    (split_part(aclitem::text, '=', 1))::text AS grantee_raw,
    split_part(split_part(aclitem::text, '=', 2), '/', 1) AS privs,
    split_part(split_part(aclitem::text, '=', 2), '/', 2) AS grantor
  FROM acl
),
grantees AS (
  SELECT
    schema_name,
    table_name,
    attname,
    CASE WHEN grantee_raw = '' THEN 'public' ELSE grantee_raw END AS grantee,
    privs,
    grantor
  FROM parsed
),
expanded AS (
  SELECT
    schema_name,
    table_name,
    attname,
    grantee,
    grantor,
    unnest(string_to_array(privs, '')) AS privchar
  FROM grantees
),
mapped AS (
  SELECT
    schema_name,
    table_name,
    attname,
    grantee,
    grantor,
    CASE privchar
      WHEN 'r' THEN 'SELECT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'x' THEN 'REFERENCES'
      ELSE null
    END AS privilege
  FROM expanded
)
SELECT
  format(
    E'-- REVOKE %s (%I) ON TABLE %I.%I FROM %I;\\nGRANT %s (%I) ON TABLE %I.%I TO %I;',
    string_agg(privilege, ', ' ORDER BY privilege),
    attname,
    schema_name,
    table_name,
    grantee,
    string_agg(privilege, ', ' ORDER BY privilege),
    attname,
    schema_name,
    table_name,
    grantee
  ) AS source
FROM mapped
WHERE privilege IS NOT NULL
GROUP BY schema_name, table_name, attname, grantee
ORDER BY grantee, attname;
`;
}
