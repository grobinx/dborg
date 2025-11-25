import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from ".";

const aclTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("table-acl-tab"),
        type: "tab",
        label: {
            id: cid("table-acl-tab-label"),
            type: "tablabel",
            label: t("permissions", "Permissions"),
        },
        content: {
            id: cid("table-acl-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-acl-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!selectedRow()) return [];

                    const { rows } = await session.query(
                        `
with obj as (
  select c.oid, n.nspname as nsp, c.relname as rel, c.relowner
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = $1 and c.relname = $2
),
owner_row as (
  select
    'owner'::text as scope,
    (select rolname from pg_roles r where r.oid = o.relowner) as owner,
    o.nsp, o.rel
  from obj o
),
grants as (
  select
    'object'::text as scope,
    o.nsp, o.rel,
    gr.rolname as grantor,
    gg.rolname as role,
    case when gg.rolname is null then 'PUBLIC' else quote_ident(gg.rolname) end as grantee_sql,
    x.privilege_type,
    x.is_grantable
  from obj o
  left join lateral aclexplode((select relacl from pg_class where oid = o.oid)) x on true
  left join pg_roles gr on gr.oid = x.grantor
  left join pg_roles gg on gg.oid = x.grantee
),
def as (
  select
    'default'::text as scope,
    o.nsp, o.rel,
    case d.defaclobjtype
      when 'r' then 'TABLES'
      when 'S' then 'SEQUENCES'
      when 'f' then 'FUNCTIONS'
      when 'T' then 'TYPES'
      when 'n' then 'SCHEMAS'
      else d.defaclobjtype::text
    end as objkind,
    rr.rolname as def_for_role,
    gr.rolname as grantor,
    gg.rolname as role,
    case when gg.rolname is null then 'PUBLIC' else quote_ident(gg.rolname) end as grantee_sql,
    x.privilege_type,
    x.is_grantable
  from obj o
  join pg_namespace ns on ns.nspname = o.nsp
  join pg_default_acl d on d.defaclnamespace = ns.oid
  left join lateral aclexplode(d.defaclacl) x on true
  left join pg_roles rr on rr.oid = d.defaclrole
  left join pg_roles gr on gr.oid = x.grantor
  left join pg_roles gg on gg.oid = x.grantee
)
select
  scope,
  owner,
  null::text    as grantor,
  null::text    as role,
  null::text    as privilege_type,
  null::boolean as is_grantable,
  null::text    as objkind,
  null::text    as def_for_role,
  null::text    as grant_sql
from owner_row
union all
select
  g.scope, null as owner, g.grantor, g.role, g.privilege_type, g.is_grantable,
  null as objkind, null as def_for_role,
  format('GRANT %s ON TABLE %I.%I TO %s%s;',
         g.privilege_type, g.nsp, g.rel, g.grantee_sql,
         case when g.is_grantable then ' WITH GRANT OPTION' else '' end) as grant_sql
from grants g
where g.privilege_type is not null
union all
select
  d.scope, null as owner, d.grantor, d.role, d.privilege_type, d.is_grantable,
  d.objkind, d.def_for_role,
  format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA %I GRANT %s ON %s TO %s%s;',
         d.def_for_role, d.nsp, d.privilege_type, d.objkind, d.grantee_sql,
         case when d.is_grantable then ' WITH GRANT OPTION' else '' end) as grant_sql
from def d
where d.privilege_type is not null and d.def_for_role is not null
order by scope, role nulls first, privilege_type;
                        `,
                        [selectedRow()!.schema_name, selectedRow()!.table_name]
                    );

                    return rows;
                },
                columns: [
                    { key: "scope", label: t("scope", "Scope"), dataType: "string", width: 110 },
                    { key: "owner", label: t("owner", "Owner"), dataType: "string", width: 180 },
                    { key: "grantor", label: t("grantor", "Grantor"), dataType: "string", width: 180 },
                    { key: "role", label: t("role", "Role"), dataType: "string", width: 180 },
                    { key: "privilege_type", label: t("privilege", "Privilege"), dataType: "string", width: 140 },
                    { key: "is_grantable", label: t("grantable", "Grantable"), dataType: "boolean", width: 110 },
                    { key: "objkind", label: t("objkind", "Default Objkind"), dataType: "string", width: 150 },
                    { key: "def_for_role", label: t("def-for-role", "Default For Role"), dataType: "string", width: 170 },
                    { key: "grant_sql", label: t("grant-sql", "Grant SQL"), dataType: "string", width: 600 },
                ] as ColumnDefinition[],
                autoSaveId: `table-acl-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default aclTab;