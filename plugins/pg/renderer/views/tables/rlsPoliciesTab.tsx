import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";

const rlsPoliciesTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null,
    cid: (id: string) => string
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const major = parseInt((session.getVersion() ?? "0").split(".")[0], 10);

    return {
        id: cid("table-rls-policies-tab"),
        type: "tab",
        label: {
            id: cid("table-rls-policies-tab-label"),
            type: "tablabel",
            label: t("rls-policies", "RLS Policies"),
        },
        content: {
            id: cid("table-rls-policies-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-rls-policies-grid"),
                type: "grid",
                rows: async () => {
                    if (!selectedRow()) return [];
                    const selectPermissive = major >= 15 ? "permissive," : "";
                    const { rows } = await session.query(
                        `
select
  policyname,
  ${selectPermissive}
  cmd as command,
  array_to_string(roles, ', ') as roles,
  qual as using_expr,
  with_check as with_check_expr
from pg_policies
where schemaname = $1 and tablename = $2
order by policyname;
                        `,
                        [selectedRow()!.schema_name, selectedRow()!.table_name]
                    );
                    return rows;
                },
                columns: [
                    { key: "policyname", label: t("policy-name", "Policy Name"), dataType: "string", width: 220 },
                    ...(major >= 15 ? [
                        { key: "permissive", label: t("permissive", "Permissive"), dataType: "boolean", width: 110 }
                    ] : []),
                    { key: "command", label: t("command", "Command"), dataType: "string", width: 120 },
                    { key: "roles", label: t("roles", "Roles"), dataType: "string", width: 220 },
                    { key: "using_expr", label: t("using", "Using"), dataType: "string", width: 420 },
                    { key: "with_check_expr", label: t("with-check", "With Check"), dataType: "string", width: 420 },
                ] as ColumnDefinition[],
                autoSaveId: `table-rls-policies-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default rlsPoliciesTab;