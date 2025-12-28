import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IEditorSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";
import { getSetting } from "@renderer/contexts/SettingsContext";
import { PLUGIN_ID } from "../../PostgresPlugin";
import {
    tableCommentDdl, tableColumnCommentsDdl, tableDdl, tableIndexesDdl, tableOwnerDdl,
    tableTriggersDdl, tableIndexCommentsDdl, tableTriggerCommentsDdl, tableRulesDdl,
    tableRuleCommentsDdl, tablePrivilegesDdl, tableColumnPrivilegesDdl
} from "../../../common/ddls/table";
import { versionToNumber } from "../../../../../src/api/version";

const ddlTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null,
    cid: (id: string) => string
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    return {
        id: cid("table-ddl-tab"),
        type: "tab",
        label: {
            id: cid("table-ddl-tab-label"),
            type: "tablabel",
            label: t("ddl", "DDL"),
        },
        content: {
            id: cid("table-ddl-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-ddl-editor"),
                type: "editor",
                readOnly: true,
                content: async (_refresh) => {
                    const row = selectedRow();
                    if (!row) return "";

                    const properties = session.getProperties();
                    const user = properties.user as string;
                    const host = properties.host as string;
                    const port = properties.port as number;
                    const database = properties.database as string;
                    const password = properties.password as string;
                    const schema = row.schema_name;
                    const table = row.table_name;

                    const pgDumpPath = getSetting(PLUGIN_ID, "pg_dump.path") || "pg_dump";
                    const usePgDumpForDdl = getSetting(PLUGIN_ID, "pg_dump.use-for-ddl") ?? false;

                    if (usePgDumpForDdl) {
                        const encode = (v: string) => encodeURIComponent(v ?? "");
                        const uri = `postgresql://${encode(user)}:${encode(password)}@${host}:${port}/${encode(database)}`;

                        const args = ["--schema-only", "--table", `${schema}.${table}`, uri];

                        try {
                            const { stdout, stderr } = await window.electron.process.execFile(pgDumpPath, args);
                            if (stderr) {
                                console.warn("pg_dump stderr:", stderr);
                            }
                            return stdout;
                        } catch (e: any) {
                            return t(
                                "failed-to-execute-pg_dump",
                                '-- Failed to execute pg_dump: {{message}}\n' +
                                '-- Please ensure that pg_dump is installed and the path is correctly configured in the settings.',
                                { message: e.message || e.toString() }
                            );
                        }
                    }
                    else {
                        return [
                            await session.query<{ source: string }>(tableDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(tableOwnerDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(tablePrivilegesDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(tableColumnPrivilegesDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(tableCommentDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(tableColumnCommentsDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(tableIndexesDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(tableIndexCommentsDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(tableTriggersDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(tableTriggerCommentsDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(tableRulesDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(tableRuleCommentsDdl(versionNumber), [row.schema_name, row.table_name]).then(res => res.rows.map(row => row.source).join("\n")),
                        ].filter(Boolean).join("\n\n") ?? "-- No DDL available";
                    }
                },
            } as IEditorSlot),
        },
    };
};

export default ddlTab;