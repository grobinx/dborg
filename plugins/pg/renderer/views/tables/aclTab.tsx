import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, IPinnableTabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";
import { AclEntry, ALL_PRIVILEGES, mergeAclPrivileges } from "../../../common/acl";

const aclTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null,
    cid: (id: string) => string
): IPinnableTabSlot => {
    const t = i18next.t.bind(i18next);

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
                rows: async () => {
                    if (!selectedRow()) return [];

                    const { rows } = await session.query<AclEntry>(
                        `
with obj as (
  select c.oid, n.nspname as nsp, c.relname as rel, c.relowner
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = $1 and c.relname = $2
),
grants as (
  select
    gr.rolname as grantor,
    gg.rolname as grantee,
    x.privilege_type,
    x.is_grantable
  from obj o
  left join lateral aclexplode((select relacl from pg_class where oid = o.oid)) x on true
  left join pg_roles gr on gr.oid = x.grantor
  left join pg_roles gg on gg.oid = x.grantee
  where x.privilege_type is not null
)
select
  grantor, grantee, privilege_type, is_grantable
from grants
order by grantee nulls first, privilege_type;
                        `,
                        [selectedRow()!.schema_name, selectedRow()!.table_name]
                    );

                    return mergeAclPrivileges(rows, ALL_PRIVILEGES.TABLE);
                },
                columns: [
                    { key: "grantor", label: t("grantor", "Grantor"), dataType: "string", width: 180 },
                    { key: "grantee", label: t("grantee", "Grantee"), dataType: "string", width: 180 },
                    { key: "privilege_type", label: t("privilege", "Privilege"), dataType: "string", width: 140 },
                    { key: "is_grantable", label: t("grantable", "Grantable"), dataType: "boolean", width: 110 },
                ] as ColumnDefinition[],
                autoSaveId: `table-acl-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default aclTab;