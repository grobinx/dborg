import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { ViewRecord } from "./viewsView";

const locksTab = (
    session: IDatabaseSession,
    selectedRow: () => ViewRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("view-locks-tab"),
        type: "tab",
        label: {
            id: cid("view-locks-tab-label"),
            type: "tablabel",
            label: t("locks", "Locks"),
        },
        content: {
            id: cid("view-locks-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("view-locks-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!selectedRow()) return [];
                    const { rows } = await session.query(
                        `
select
  l.locktype,
  l.mode,
  l.granted,
  l.pid,
  a.usename,
  a.application_name,
  a.client_addr,
  a.state,
  a.query,
  a.backend_start,
  a.state_change,
  age(now(), a.query_start) as query_duration
from pg_locks l
join pg_class c on c.oid = l.relation
join pg_namespace n on n.oid = c.relnamespace
left join pg_stat_activity a on a.pid = l.pid
where n.nspname = $1 and c.relname = $2
order by l.granted desc, l.pid;
            `,
                        [selectedRow()!.schema_name, selectedRow()!.view_name]
                    );
                    return rows;
                },
                columns: [
                    { key: "locktype", label: t("locktype", "Lock Type"), dataType: "string", width: 120 },
                    { key: "mode", label: t("mode", "Mode"), dataType: "string", width: 180 },
                    { key: "granted", label: t("granted", "Granted"), dataType: "boolean", width: 100 },
                    { key: "pid", label: t("pid", "PID"), dataType: "number", width: 90 },
                    { key: "usename", label: t("user", "User"), dataType: "string", width: 130 },
                    { key: "application_name", label: t("app", "Application"), dataType: "string", width: 180 },
                    { key: "client_addr", label: t("client", "Client"), dataType: "string", width: 140 },
                    { key: "state", label: t("state", "State"), dataType: "string", width: 110 },
                    { key: "query_duration", label: t("duration", "Duration"), dataType: "duration", width: 130 },
                    { key: "query", label: t("query", "Query"), dataType: "string", width: 500 },
                ] as ColumnDefinition[],
                autoSaveId: `view-locks-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default locksTab;