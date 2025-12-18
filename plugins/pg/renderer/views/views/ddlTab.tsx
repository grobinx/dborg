import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IEditorSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { getSetting } from "@renderer/contexts/SettingsContext";
import { ViewRecord } from "./viewsView";
import { PLUGIN_ID } from "../../PostgresPlugin";
import { viewColumnCommentsDdl, viewCommentDdl, viewDdl, viewOwnerDdl, viewPrivilegesDdl, viewRuleCommentsDdl, viewRulesDdl, viewTriggerCommentsDdl, viewTriggersDdl } from "../../../common/ddl";

const ddlTab = (
    session: IDatabaseSession,
    selectedRow: () => ViewRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("view-ddl-tab"),
        type: "tab",
        label: {
            id: cid("view-ddl-tab-label"),
            type: "tablabel",
            label: t("ddl", "DDL"),
        },
        content: {
            id: cid("view-ddl-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("view-ddl-editor"),
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
                    const viewName = row.view_name;

                    const pgDumpPath = getSetting(PLUGIN_ID, "pg_dump.path") || "pg_dump";
                    const usePgDumpForDdl = getSetting(PLUGIN_ID, "pg_dump.use-for-ddl") ?? false;

                    if (usePgDumpForDdl) {
                        const encode = (v: string) => encodeURIComponent(v ?? "");
                        const uri = `postgresql://${encode(user)}:${encode(password)}@${host}:${port}/${encode(database)}`;

                        const args = ["--schema-only", "--table", `${schema}.${viewName}`, uri];

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
                    } else {
                        let ddl = "";
                        const { rows } = await session.query(viewDdl(session.getVersion()!), [schema, viewName]);
                        if (rows.length > 0) {
                            ddl += rows[0].source;
                        }
                        const { rows: ownerRows } = await session.query(viewOwnerDdl(session.getVersion()!), [schema, viewName]);
                        if (ownerRows.length > 0) {
                            ddl += "\n\n" + ownerRows[0].source;
                        }
                        const { rows: privRows } = await session.query(viewPrivilegesDdl(session.getVersion()!), [schema, viewName]);
                        if (privRows.length > 0) {
                            ddl += "\n\n" + privRows.map((r: any) => r.source).join("\n");
                        }
                        const { rows: commentRows } = await session.query(viewCommentDdl(session.getVersion()!), [schema, viewName]);
                        if (commentRows.length > 0) {
                            ddl += "\n\n" + commentRows[0].source;
                        }
                        const { rows: colComments } = await session.query(viewColumnCommentsDdl(session.getVersion()!), [schema, viewName]);
                        if (colComments.length > 0) {
                            ddl += "\n\n" + colComments.map((r: any) => r.source).join("\n");
                        }
                        const { rows: triggerRows } = await session.query(viewTriggersDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (triggerRows.length > 0) {
                            ddl += "\n\n" + triggerRows.map(r => r.source).join("\n");
                        }
                        const { rows: triggerCommentRows } = await session.query(viewTriggerCommentsDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (triggerCommentRows.length > 0) {
                            ddl += "\n\n" + triggerCommentRows.map(r => r.source).join("\n");
                        }
                        const { rows: ruleRows } = await session.query(viewRulesDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (ruleRows.length > 0) {
                            ddl += "\n\n" + ruleRows.map(r => r.source).join("\n");
                        }
                        const { rows: ruleCommentRows } = await session.query(viewRuleCommentsDdl(session.getVersion()!), [row.schema_name, row.table_name]);
                        if (ruleCommentRows.length > 0) {
                            ddl += "\n\n" + ruleCommentRows.map(r => r.source).join("\n");
                        }
                        return ddl;
                    }
                },
            } as IEditorSlot),
        },
    };
};

export default ddlTab;