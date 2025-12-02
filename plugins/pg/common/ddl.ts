export function tableDdl(version: string): string {
    const major = parseInt(version.split(".")[0], 10);

    // Fragmenty dla identity/generate w zależności od wersji
    const identityFragment = major >= 10
        ? `WHEN att.attidentity IN ('a','d')
              THEN format(' GENERATED %s AS IDENTITY',
                          CASE att.attidentity WHEN 'a' THEN 'ALWAYS' ELSE 'BY DEFAULT' END)`
        : "";

    const generatedFragment = major >= 12
        ? `WHEN att.attgenerated = 's'
              THEN format(' GENERATED ALWAYS AS (%s) STORED', pg_get_expr(ad.adbin, ad.adrelid))`
        : "";

    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name, c.relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
  format(
    '-- DROP TABLE %I.%I;\n\n' ||
    'CREATE %s %I.%I (\n%s%s\n);',
    o.schema_name,
    o.table_name,
    CASE
      WHEN o.relkind = 'p' THEN 'TABLE'
      WHEN o.relkind = 'r' THEN 'TABLE'
      WHEN o.relkind = 'f' THEN 'FOREIGN TABLE'
      ELSE 'TABLE'
    END,
    o.schema_name,
    o.table_name,
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
    ),
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
    )
  ) AS source
FROM obj o;
`;
}

export function tableOwnerDdl(version: string): string {
    const major = parseInt(version.split(".")[0], 10);

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

export function tableIndexesDdl(version: string): string {
    const major = parseInt(version.split(".")[0], 10);

    return `
WITH obj AS (
  SELECT c.oid, n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','p','f')
)
SELECT
    pg_get_indexdef(i.indexrelid)||';' AS source
FROM pg_index i
JOIN obj o ON o.oid = i.indrelid
WHERE i.indrelid = o.oid;
`;
}

export function tableCommentDdl(version: string): string {
    const major = parseInt(version.split(".")[0], 10);

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

export function tableColumnCommentsDdl(version: string): string {
    const major = parseInt(version.split(".")[0], 10);

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

export function tableTriggersDdl(version: string): string {
    const major = parseInt(version.split(".")[0], 10);

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