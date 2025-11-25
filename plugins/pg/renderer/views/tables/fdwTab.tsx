import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IContentSlot, IGridSlot, ISplitSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from ".";

interface FdwRecord {
    foreign_table: string;
    schema_name: string;
    server_name: string;
    fdw_name: string;
    table_options: string[] | null;
    server_options: string[] | null;
    [key: string]: unknown;
}

const fdwTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    let selectedFdwRow: FdwRecord | null = null;

    const optionsView = (id: string, title: string, field: "table_options" | "server_options"): IContentSlot => ({
        id: cid(`${id}-content`),
        type: "content",
        title: {
            id: cid(`${id}-title`),
            type: "title",
            title: title,
        },
        main: {
            id: cid(id),
            type: "grid",
            mode: "defined",
            pivot: false,
            rows: async () => {
                if (!selectedFdwRow) return [];

                const options: Array<{ option_name: string; option_value: string }> = [];

                // Parse table options
                if (selectedFdwRow[field]) {
                    const selectedOptions = selectedFdwRow[field] as string[];
                    selectedOptions.forEach((opt: string) => {
                        const [name, value] = opt.split('=');
                        if (name) {
                            options.push({
                                option_name: name,
                                option_value: value || ''
                            });
                        }
                    });
                }

                return options;
            },
            columns: [
                { key: "option_name", label: t("option-name", "Option"), dataType: "string", width: 120 },
                { key: "option_value", label: t("option-value", "Value"), dataType: "string", width: 200 },
            ] as ColumnDefinition[],
            autoSaveId: `${id}-${session.profile.sch_id}`,
        } as IGridSlot
    });

    return {
        id: cid("table-fdw-tab"),
        type: "tab",
        label: {
            id: cid("table-fdw-tab-label"),
            type: "tablabel",
            label: t("foreign", "Foreign"),
        },
        content: {
            id: cid("table-fdw-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-fdw-split"),
                type: "split",
                direction: "horizontal",
                first: () => ({
                    id: cid("table-fdw-grid"),
                    type: "grid",
                    mode: "defined",
                    pivot: true,
                    rows: async (refresh) => {
                        //selectedFdwRow = null;

                        if (!selectedRow()) {
                            refresh(cid("table-fdw-table-options-grid"));
                            refresh(cid("table-fdw-server-options-grid"));
                            return [];
                        }

                        if (selectedRow()!.table_type !== "foreign") {
                            selectedFdwRow = null;
                            refresh(cid("table-fdw-table-options-grid"));
                            refresh(cid("table-fdw-server-options-grid"));
                            return t("table-not-foreign", "Table is not a foreign table");
                        }

                        const { rows } = await session.query<FdwRecord>(
                            `
select
  c.relname as foreign_table,
  n.nspname as schema_name,
  s.srvname as server_name,
  w.fdwname as fdw_name,
  ft.ftoptions as table_options,
  s.srvoptions as server_options
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_foreign_table ft on ft.ftrelid = c.oid
join pg_foreign_server s on s.oid = ft.ftserver
join pg_foreign_data_wrapper w on w.oid = s.srvfdw
where n.nspname = $1 and c.relname = $2 and c.relkind = 'f';
            `,
                            [selectedRow()!.schema_name, selectedRow()!.table_name]
                        );

                        if (rows.length > 0) {
                            selectedFdwRow = rows[0];
                        } else {
                            selectedFdwRow = null;
                        }

                        refresh(cid("table-fdw-table-options-grid"));
                        refresh(cid("table-fdw-server-options-grid"));

                        return rows;
                    },
                    columns: [
                        { key: "foreign_table", label: t("table", "Table"), dataType: "string", width: 200 },
                        { key: "schema_name", label: t("schema", "Schema"), dataType: "string", width: 150 },
                        { key: "server_name", label: t("server", "Server"), dataType: "string", width: 200 },
                        { key: "fdw_name", label: t("fdw", "FDW"), dataType: "string", width: 200 },
                        { key: "table_options", label: t("table-options", "Table Options"), dataType: ["string"], width: 300 },
                        { key: "server_options", label: t("server-options", "Server Options"), dataType: ["string"], width: 300 },
                    ] as ColumnDefinition[],
                    autoSaveId: `table-fdw-grid-${session.profile.sch_id}`,
                } as IGridSlot),
                second: (): ISplitSlot => ({
                    id: cid("table-fdw-options-options"),
                    type: "split",
                    direction: "vertical",
                    first: () => optionsView("table-fdw-table-options-grid", t("table-options", "Table Options"), "table_options"),
                    second: () => optionsView("table-fdw-server-options-grid", t("server-options", "Server Options"), "server_options"),
                    secondSize: 50,
                }),
                autoSaveId: `table-fdw-split-${session.profile.sch_id}`,
                secondSize: 30,
            }),
        },
    };
};

export default fdwTab;