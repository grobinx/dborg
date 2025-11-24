import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";

const rlsPoliciesTab = (
    session: IDatabaseSession,
    schemaName: () => string | null,
    tableName: () => string | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

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
                mode: "defined",
                rows: async () => {
                    if (!schemaName() || !tableName()) return [];
                    const { rows } = await session.query(
                        `
select
  policyname,
  permissive,
  cmd as command,
  array_to_string(roles, ', ') as roles,
  qual as using_expr,
  with_check as with_check_expr
from pg_policies
where schemaname = $1 and tablename = $2
order by policyname;
                        `,
                        [schemaName(), tableName()]
                    );
                    return rows;
                },
                columns: [
                    { key: "policyname", label: t("policy-name", "Policy Name"), dataType: "string", width: 220 },
                    { key: "permissive", label: t("permissive", "Permissive"), dataType: "boolean", width: 110 },
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