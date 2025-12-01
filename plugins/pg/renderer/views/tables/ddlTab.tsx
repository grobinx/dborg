import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IEditorSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from ".";

const ddlTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("table-ddl-tab"),
        type: "tab",
        label: {
            id: cid("table-ddl-tab-label"),
            type: "tablabel",
            label: "DDL",
        },
        content: {
            id: cid("table-ddl-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-ddl-editor"),
                type: "editor",
                readOnly: true,
                content: async (_refresh) => {
                    if (!selectedRow()) return "";

                    // Pobierz wersję serwera jako string, np. "12.16" lub "9.6.21"
                    const versionStr = session.getVersion?.() ?? "";
                    const major = parseInt(versionStr.split(".")[0], 10);

                    const identityFragment = major >= 10
                        ? `when att.attidentity in ('a','d')
                            then format(' generated %s as identity',
                                        case att.attidentity when 'a' then 'always' else 'by default' end)`
                        : "";
                    const generatedFragment = major >= 12
                        ? `when att.attgenerated = 's'
                            then format(' generated always as (%s) stored', pg_get_expr(ad.adbin, ad.adrelid))`
                        : "";

                    const sql = `
with obj as (
  select c.oid, c.relkind, n.nspname as nsp, c.relname as rel
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = $1 and c.relname = $2
),
comments as (
  select o.oid, string_agg(line, E'\n') as text
  from obj o
  left join lateral (
    select format(
             'comment on %s %I.%I is %L;',
             case o.relkind
               when 'p' then 'table' when 'r' then 'table'
               when 'f' then 'foreign table'
               when 'v' then 'view'
               when 'm' then 'materialized view'
             end,
             o.nsp, o.rel, obj_description(o.oid, 'pg_class')
           ) as line
    where obj_description(o.oid, 'pg_class') is not null

    union all
    select format(
             'comment on column %I.%I.%I is %L;',
             o.nsp, o.rel, att.attname, col_description(o.oid, att.attnum)
           )
    from pg_attribute att
    where att.attrelid = o.oid and att.attnum > 0 and not att.attisdropped
      and col_description(o.oid, att.attnum) is not null

    union all
    select format(
             'comment on constraint %I on %I.%I is %L;',
             con.conname, o.nsp, o.rel, obj_description(con.oid, 'pg_constraint')
           )
    from pg_constraint con
    where con.conrelid = o.oid
      and obj_description(con.oid, 'pg_constraint') is not null

    union all
    select format(
             'comment on index %I.%I is %L;',
             n.nspname, ic.relname, obj_description(ic.oid, 'pg_class')
           )
    from pg_index i
    join pg_class ic on ic.oid = i.indexrelid
    join pg_namespace n on n.oid = ic.relnamespace
    where i.indrelid = o.oid
      and obj_description(ic.oid, 'pg_class') is not null

    union all
    select format(
             'comment on trigger %I on %I.%I is %L;',
             t.tgname, o.nsp, o.rel, obj_description(t.oid, 'pg_trigger')
           )
    from pg_trigger t
    where t.tgrelid = o.oid and not t.tgisinternal
      and obj_description(t.oid, 'pg_trigger') is not null
  ) c on true
  group by o.oid
)
select
case
  when o.relkind in ('v','m') then
    format(
      'create %s %I.%I as%s;%s',
      case o.relkind when 'v' then 'view' else 'materialized view' end,
      o.nsp, o.rel,
      E'\n' || pg_get_viewdef(o.oid, true),
      coalesce((select E'\n\n' || c.text from comments c where c.oid = o.oid), '')
    )
  when o.relkind in ('r','p','f') then
    format(
      'create %s %I.%I (\n%s%s\n);\n\n%s%s%s%s',
      case o.relkind when 'p' then 'table' when 'r' then 'table' when 'f' then 'foreign table' end,
      o.nsp, o.rel,
      coalesce(
        (select string_agg(
          format('  %s %s%s%s%s',
            quote_ident(att.attname),
            pg_catalog.format_type(att.atttypid, att.atttypmod),
            case when coll.oid is not null and att.attcollation <> typ.typcollation
                 then format(' collate %I.%I', colln.nspname, coll.collname) else '' end,
            case
              ${identityFragment}
              ${generatedFragment}
              when ad.adbin is not null
                then format(' default %s', pg_get_expr(ad.adbin, ad.adrelid))
              else '' end,
            case when att.attnotnull then ' not null' else '' end
          ),
          E',\n'
        )
         from pg_attribute att
         left join pg_attrdef ad on ad.adrelid = att.attrelid and ad.adnum = att.attnum
         left join pg_type typ on typ.oid = att.atttypid
         left join pg_collation coll on coll.oid = att.attcollation
         left join pg_namespace colln on colln.oid = coll.collnamespace
         where att.attrelid = o.oid and att.attnum > 0 and not att.attisdropped),
      ''
      ),
      case when exists(select 1 from pg_constraint con where con.conrelid = o.oid and con.contype in ('p','u','c','f','x'))
        then E',\n' || (select string_agg(
                format('  constraint %s %s', quote_ident(con.conname), pg_get_constraintdef(con.oid, true)),
                E',\n'
              )
              from pg_constraint con where con.conrelid = o.oid and con.contype in ('p','u','c','f','x'))
        else '' end,
      coalesce((select string_agg(pg_get_indexdef(i.indexrelid) || ';', E'\n')
                from pg_index i
                where i.indrelid = o.oid
                  and i.indexrelid not in (select conindid from pg_constraint where conindid <> 0)), ''),
      case
        when exists(select 1 from pg_index i where i.indrelid = o.oid
                  and i.indexrelid not in (select conindid from pg_constraint where conindid <> 0))
         and exists(select 1 from pg_trigger t where t.tgrelid = o.oid and not t.tgisinternal)
        then E'\n' else '' end,
      coalesce((select string_agg(pg_get_triggerdef(t.oid, true) || ';', E'\n')
                from pg_trigger t
                where t.tgrelid = o.oid and not t.tgisinternal), ''),
      coalesce((select E'\n\n' || c.text from comments c where c.oid = o.oid), '')
    )
  else
    format('-- unsupported relkind: %s for %I.%I', o.relkind, o.nsp, o.rel)
end as ddl
from obj o;
                    `;

                    const { rows } = await session.query(
                        sql,
                        [selectedRow()!.schema_name, selectedRow()!.table_name]
                    );

                    if (rows.length === 0) {
                        return "";
                    }

                    return rows[0].ddl;
                },
            } as IEditorSlot),
        },
    };
};

export default ddlTab;