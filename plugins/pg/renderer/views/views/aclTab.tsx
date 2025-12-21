import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { ViewRecord } from "./viewsView";

const aclTab = (
    session: IDatabaseSession,
    selectedRow: () => ViewRecord | null,
    cid: (id: string) => string,
): ITabSlot => {
    const t = i18next.t.bind(i18next);

    return {
        id: cid("view-acl-tab"),
        type: "tab",
        label: {
            id: cid("view-acl-tab-label"),
            type: "tablabel",
            label: t("permissions", "Permissions"),
        },
        content: {
            id: cid("view-acl-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("view-acl-grid"),
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
    (select rolname from pg_roles r where r.oid = o.relowner) as owner
  from obj o
),
grants as (
  select
    'grant'::text as scope,
    null::text as owner,
    gr.rolname as grantor,
    gg.rolname as role,
    x.privilege_type,
    x.is_grantable
  from obj o
  left join lateral aclexplode((select relacl from pg_class where oid = o.oid)) x on true
  left join pg_roles gr on gr.oid = x.grantor
  left join pg_roles gg on gg.oid = x.grantee
  where x.privilege_type is not null
)
select
  scope,
  owner,
  null::text    as grantor,
  null::text    as role,
  null::text    as privilege_type,
  null::boolean as is_grantable
from owner_row
union all
select
  scope, owner, grantor, role, privilege_type, is_grantable
from grants
order by scope, role nulls first, privilege_type;
                        `,
                        [selectedRow()!.schema_name, selectedRow()!.view_name]
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
                ] as ColumnDefinition[],
                autoSaveId: `view-acl-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default aclTab;