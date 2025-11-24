import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";

const fdwTab = (
    session: IDatabaseSession,
    schemaName: () => string | null,
    tableName: () => string | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("table-fdw-tab"),
        type: "tab",
        label: {
            id: cid("table-fdw-tab-label"),
            type: "tablabel",
            label: t("fdw", "Foreign Data"),
        },
        content: {
            id: cid("table-fdw-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-fdw-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!schemaName() || !tableName()) return [];
                    const { rows } = await session.query(
                        `
select
  c.relname as foreign_table,
  n.nspname as schema_name,
  s.srvname as server_name,
  w.fdwname as fdw_name,
  array_to_string(ft.ftoptions, ', ') as table_options,
  array_to_string(s.srvoptions, ', ') as server_options
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_foreign_table ft on ft.ftrelid = c.oid
join pg_foreign_server s on s.oid = ft.ftserver
join pg_foreign_data_wrapper w on w.oid = s.srvfdw
where n.nspname = $1 and c.relname = $2 and c.relkind = 'f';
            `,
                        [schemaName(), tableName()]
                    );

                    if (rows.length === 0) {
                        return { info: "Table is not a foreign table" };
                    }

                    return rows;
                },
                columns: [
                    { key: "foreign_table", label: t("table", "Table"), dataType: "string", width: 200 },
                    { key: "schema_name", label: t("schema", "Schema"), dataType: "string", width: 150 },
                    { key: "server_name", label: t("server", "Server"), dataType: "string", width: 200 },
                    { key: "fdw_name", label: t("fdw", "FDW"), dataType: "string", width: 200 },
                    { key: "table_options", label: t("table-options", "Table Options"), dataType: "string", width: 300 },
                    { key: "server_options", label: t("server-options", "Server Options"), dataType: "string", width: 300 },
                ] as ColumnDefinition[],
                autoSaveId: `table-fdw-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default fdwTab;