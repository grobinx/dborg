import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IEditorSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from ".";
import { getSetting } from "@renderer/contexts/SettingsContext";
import { PLUGIN_ID } from "../../PostgresPlugin";
import { tableCommentDdl, tableColumnCommentsDdl, tableDdl, tableIndexesDdl, tableOwnerDdl, tableTriggersDdl, tableIndexCommentsDdl, tableTriggerCommentsDdl } from "../../../common/ddl";

const ddlTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("table-ddl-tab"),
        type: "tab",
        label: {
            id: cid("table-ddl-tab-label"),
            type: "tablabel",
            label: "DDL",
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
                        let ddl = "";
                        const { rows } = await session.query(tableDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (rows.length > 0) {
                            ddl += rows[0].source;
                        }
                        const { rows: ownerRows } = await session.query(tableOwnerDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (ownerRows.length > 0) {
                            ddl += "\n\n" + ownerRows[0].source;
                        }
                        const { rows: commentRows } = await session.query(tableCommentDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (commentRows.length > 0) {
                            ddl += "\n\n" + commentRows[0].source;
                        }
                        const { rows: commentsRows } = await session.query(tableColumnCommentsDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (commentsRows.length > 0) {
                            ddl += "\n\n" + commentsRows.map(r => r.source).join("\n");
                        }
                        const { rows: indexRows } = await session.query(tableIndexesDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (indexRows.length > 0) {
                            ddl += "\n\n" + indexRows.map(r => r.source).join("\n");
                        }
                        const { rows: indexCommentRows } = await session.query(tableIndexCommentsDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (indexCommentRows.length > 0) {
                            ddl += "\n\n" + indexCommentRows.map(r => r.source).join("\n");
                        }
                        const { rows: triggerRows } = await session.query(tableTriggersDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (triggerRows.length > 0) {
                            ddl += "\n\n" + triggerRows.map(r => r.source).join("\n");
                        }
                        const { rows: triggerCommentRows } = await session.query(tableTriggerCommentsDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (triggerCommentRows.length > 0) {
                            ddl += "\n\n" + triggerCommentRows.map(r => r.source).join("\n");
                        }
                        return ddl;
                    }
                },
            } as IEditorSlot),
        },
    };
};

export default ddlTab;