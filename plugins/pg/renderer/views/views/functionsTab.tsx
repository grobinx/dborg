import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { ViewRecord } from "./viewsView";

const functionsTab = (
    session: IDatabaseSession,
    selectedRow: () => ViewRecord | null,
    cid: (id: string) => string
): ITabSlot => {
    const t = i18next.t.bind(i18next);

    return {
        id: cid("view-functions-tab"),
        type: "tab",
        label: {
            id: cid("view-functions-tab-label"),
            type: "tablabel",
            label: t("functions", "Functions"),
        },
        content: {
            id: cid("view-functions-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("view-functions-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    const row = selectedRow();
                    if (!row) return [];
                    // find functions whose name appears in view definition (approximate)
                    const { rows: rowsDef } = await session.query<any>(
                        `with v as (
  select o.oid, pg_get_viewdef(o.oid, true) as def
  from pg_class o
  join pg_namespace n on n.oid = o.relnamespace
  where n.nspname = $1 and o.relname = $2
)
select distinct n.nspname as schema, p.proname as name, p.oid::regprocedure as signature
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join v on v.def ilike '%' || p.proname || '(%'
order by schema, name;`,
                        [row.schema_name, row.view_name]
                    );
                    return rowsDef;
                },
                columns: [
                    { key: "schema", label: t("schema", "Schema"), dataType: "string", width: 140 },
                    { key: "name", label: t("function-name", "Function"), dataType: "string", width: 220 },
                    { key: "signature", label: t("signature", "Signature"), dataType: "string", width: 360 },
                ] as ColumnDefinition[],
                autoSaveId: `view-functions-grid-${session.profile.sch_id}`,
            }),
        },
    };
};

export default functionsTab;