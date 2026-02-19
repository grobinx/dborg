import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";

export async function tablespaceDdl(session: IDatabaseSession, tablespaceName: string): Promise<string> {
    return [
        await session
            .query<{ source: string }>(tablespaceBodyDdl(), [tablespaceName])
            .then((res) => res.rows.map((row) => row.source).join("\n")),
        await session
            .query<{ source: string }>(tablespaceCommentDdl(), [tablespaceName])
            .then((res) => res.rows.map((row) => row.source).join("\n")),
    ]
        .filter(Boolean)
        .join("\n\n") || "-- No DDL available";
}

export function tablespaceBodyDdl(): string {
    return `
WITH ts AS (
  SELECT
      t.oid,
      t.spcname,
      pg_get_userbyid(t.spcowner) AS owner_name,
      pg_tablespace_location(t.oid) AS location,
      t.spcoptions,
      (t.spcname IN ('pg_default', 'pg_global')) AS is_system
  FROM pg_tablespace t
  WHERE t.spcname = $1
)
SELECT
  CASE
    WHEN is_system THEN
      '-- Tablespace: ' || quote_ident(spcname) || E'\\n' ||
      '-- System tablespace (cannot be created/dropped manually).' || E'\\n' ||
      '-- Owner: ' || quote_ident(owner_name)
    ELSE
      '-- DROP TABLESPACE IF EXISTS ' || quote_ident(spcname) || E';\\n' ||
      'CREATE TABLESPACE ' || quote_ident(spcname) ||
      ' OWNER ' || quote_ident(owner_name) ||
      ' LOCATION ' || quote_literal(COALESCE(location, '')) ||
      CASE
        WHEN spcoptions IS NOT NULL AND array_length(spcoptions, 1) > 0
          THEN ' WITH (' || array_to_string(spcoptions, ', ') || ')'
        ELSE ''
      END ||
      ';'
  END AS source
FROM ts;
`;
}

export function tablespaceCommentDdl(): string {
    return `
WITH ts AS (
  SELECT
      t.oid,
      t.spcname
  FROM pg_tablespace t
  WHERE t.spcname = $1
)
SELECT
  format(
    'COMMENT ON TABLESPACE %I IS %L;',
    ts.spcname,
    shobj_description(ts.oid, 'pg_tablespace')
  ) AS source
FROM ts
WHERE shobj_description(ts.oid, 'pg_tablespace') IS NOT NULL;
`;
}

