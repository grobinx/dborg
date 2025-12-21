import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { ViewRecord } from "./viewsView";

const triggersTab = (
    session: IDatabaseSession,
    selectedRow: () => ViewRecord | null,
    cid: (id: string) => string,
): ITabSlot => {
    const t = i18next.t.bind(i18next);

    return {
        id: cid("view-triggers-tab"),
        type: "tab",
        label: {
            id: cid("view-triggers-tab-label"),
            type: "tablabel",
            label: t("triggers", "Triggers"),
        },
        content: {
            id: cid("view-triggers-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("view-triggers-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!selectedRow()) return [];
                    const { rows } = await session.query(
                        `
select
  t.tgname as trigger_name,
  case
    when (t.tgtype & 2) <> 0 then 'before'
    when (t.tgtype & 64) <> 0 then 'instead of'
    else 'after'
  end as timing,
  case when (t.tgtype & 1) <> 0 then 'row' else 'statement' end as orientation,
  array_to_string(array_remove(array[
    case when (t.tgtype & 4)  <> 0 then 'insert' end,
    case when (t.tgtype & 8)  <> 0 then 'delete' end,
    case when (t.tgtype & 16) <> 0 then 'update' end,
    case when (t.tgtype & 32) <> 0 then 'truncate' end
  ], null), ', ') as events,
  case t.tgenabled
    when 'O' then 'enabled'
    when 'D' then 'disabled'
    when 'R' then 'replica'
    when 'A' then 'always'
    else t.tgenabled::text
  end as enabled,
  pn.nspname as function_schema,
  p.proname as function_name,
  coalesce(array_to_string(array(
    select a.attname
    from unnest(coalesce(t.tgattr, '{}'::smallint[])) as u(attnum)
    join pg_attribute a on a.attrelid = c.oid and a.attnum = u.attnum
    order by u.attnum
  ), ', '), '') as update_columns,
  pg_get_triggerdef(t.oid, true) as definition,
  pg_catalog.obj_description(t.oid, 'pg_trigger') as description
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
join pg_namespace pn on pn.oid = p.pronamespace
where n.nspname = $1
  and c.relname = $2
  and not t.tgisinternal
order by trigger_name;
                        `,
                        [selectedRow()!.schema_name, selectedRow()!.view_name]
                    );
                    return rows;
                },
                columns: [
                    { key: "trigger_name", label: t("trigger-name", "Trigger Name"), dataType: "string", width: 220 },
                    { key: "enabled", label: t("enabled", "Enabled"), dataType: "string", width: 100 },
                    { key: "timing", label: t("timing", "Timing"), dataType: "string", width: 120 },
                    { key: "orientation", label: t("orientation", "Orientation"), dataType: "string", width: 120 },
                    { key: "events", label: t("events", "Events"), dataType: "string", width: 180 },
                    { key: "function_schema", label: t("function-schema", "Function Schema"), dataType: "string", width: 150 },
                    { key: "function_name", label: t("function-name", "Function Name"), dataType: "string", width: 200 },
                    { key: "update_columns", label: t("update-columns", "Update Columns"), dataType: "string", width: 220 },
                    { key: "definition", label: t("definition", "Definition"), dataType: "string", width: 600 },
                    { key: "description", label: t("comment", "Comment"), dataType: "string", width: 300 },
                ] as ColumnDefinition[],
                autoSaveId: `view-triggers-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default triggersTab;