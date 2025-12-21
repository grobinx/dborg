import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";

const rulesTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null,
    cid: (id: string) => string
): ITabSlot => {
    const t = i18next.t.bind(i18next);

    return {
        id: cid("table-rules-tab"),
        type: "tab",
        label: {
            id: cid("table-rules-tab-label"),
            type: "tablabel",
            label: t("rules", "Rules"),
        },
        content: {
            id: cid("table-rules-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-rules-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!selectedRow()) return [];
                    const { rows } = await session.query(
                        `
select
  rulename as rule_name,
  upper(coalesce(substring(definition from 'ON[ ]+([a-zA-Z]+)'), '')) as event,
  position('DO INSTEAD' in definition) > 0 as instead,
  definition
from pg_rules
where schemaname = $1 and tablename = $2
order by rulename;
            `,
                        [selectedRow()!.schema_name, selectedRow()!.table_name]
                    );
                    return rows;
                },
                columns: [
                    { key: "rule_name", label: t("rule-name", "Rule Name"), dataType: "string", width: 220 },
                    { key: "event", label: t("event", "Event"), dataType: "string", width: 120 },
                    { key: "instead", label: t("instead", "DO INSTEAD"), dataType: "boolean", width: 120 },
                    { key: "definition", label: t("definition", "Definition"), dataType: "string", width: 800 },
                ] as ColumnDefinition[],
                autoSaveId: `table-rules-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default rulesTab;