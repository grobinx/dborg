import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";

export async function aggregateDdl(
    session: IDatabaseSession,
    schemaName: string,
    aggregateName: string,
    args: string
): Promise<string> {
    return [
        await session
            .query<{ source: string }>(aggregateBodyDdl(), [schemaName, aggregateName, args])
            .then((res) => res.rows.map((row) => row.source).join("\n")),
        await session
            .query<{ source: string }>(aggregateCommentDdl(), [schemaName, aggregateName, args])
            .then((res) => res.rows.map((row) => row.source).join("\n")),
    ]
        .filter(Boolean)
        .join("\n\n") || "-- No DDL available";
}

export function aggregateBodyDdl(): string {
    return `
WITH agg AS (
  SELECT
      p.oid,
      n.nspname AS aggregate_schema,
      p.proname AS aggregate_name,
      pg_get_function_identity_arguments(p.oid) AS arguments,
      a.aggtransfn::regproc::text AS sfunc,
      format_type(a.aggtranstype, NULL) AS stype,
      a.aggfinalfn::regproc::text AS finalfunc,
      a.aggcombinefn::regproc::text AS combinefunc,
      a.aggserialfn::regproc::text AS serialfunc,
      a.aggdeserialfn::regproc::text AS deserialfunc,
      a.agginitval AS initcond
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_aggregate a ON a.aggfnoid = p.oid
  WHERE n.nspname = $1
    AND p.proname = $2
    AND pg_get_function_identity_arguments(p.oid) = $3
  LIMIT 1
)
SELECT
  '-- DROP AGGREGATE IF EXISTS '
  || quote_ident(aggregate_schema) || '.' || quote_ident(aggregate_name) || '(' || arguments || ');'
  || E'\\n'
  || 'CREATE AGGREGATE '
  || quote_ident(aggregate_schema) || '.' || quote_ident(aggregate_name) || ' (' || arguments || ')'
  || E'\\n(\\n'
  || '    SFUNC = ' || COALESCE(NULLIF(sfunc, '-'), '?') || E',\\n'
  || '    STYPE = ' || COALESCE(stype, '?')
  || CASE WHEN NULLIF(finalfunc, '-') IS NOT NULL THEN E',\\n    FINALFUNC = ' || finalfunc ELSE '' END
  || CASE WHEN NULLIF(combinefunc, '-') IS NOT NULL THEN E',\\n    COMBINEFUNC = ' || combinefunc ELSE '' END
  || CASE WHEN NULLIF(serialfunc, '-') IS NOT NULL THEN E',\\n    SERIALFUNC = ' || serialfunc ELSE '' END
  || CASE WHEN NULLIF(deserialfunc, '-') IS NOT NULL THEN E',\\n    DESERIALFUNC = ' || deserialfunc ELSE '' END
  || CASE WHEN initcond IS NOT NULL THEN E',\\n    INITCOND = ' || quote_literal(initcond) ELSE '' END
  || E'\\n);' AS source
FROM agg;
`;
}

export function aggregateCommentDdl(): string {
    return `
WITH obj AS (
  SELECT
      p.oid,
      n.nspname AS aggregate_schema,
      p.proname AS aggregate_name,
      pg_get_function_identity_arguments(p.oid) AS arguments
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_aggregate a ON a.aggfnoid = p.oid
  WHERE n.nspname = $1
    AND p.proname = $2
    AND pg_get_function_identity_arguments(p.oid) = $3
  LIMIT 1
)
SELECT
  format(
    'COMMENT ON AGGREGATE %I.%I (%s) IS %L;',
    o.aggregate_schema,
    o.aggregate_name,
    o.arguments,
    obj_description(o.oid, 'pg_proc')
  ) AS source
FROM obj o
WHERE obj_description(o.oid, 'pg_proc') IS NOT NULL;
`;
}

