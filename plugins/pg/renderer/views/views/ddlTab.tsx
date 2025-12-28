import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IEditorSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { getSetting } from "@renderer/contexts/SettingsContext";
import { ViewRecord } from "./viewsView";
import { PLUGIN_ID } from "../../PostgresPlugin";
import {
    viewColumnCommentsDdl, viewCommentDdl, viewDdl, viewOwnerDdl, viewPrivilegesDdl,
    viewRuleCommentsDdl, viewRulesDdl, viewTriggerCommentsDdl, viewTriggersDdl
} from "../../../common/ddls/view";
import { versionToNumber } from "../../../../../src/api/version";

const ddlTab = (
    session: IDatabaseSession,
    selectedRow: () => ViewRecord | null,
    cid: (id: string) => string,
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const versionNumber = versionToNumber(session.getVersion() || "0.0.0");

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
                        return [
                            await session.query<{ source: string }>(viewDdl(versionNumber), [row.schema_name, row.view_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(viewOwnerDdl(versionNumber), [row.schema_name, row.view_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(viewPrivilegesDdl(versionNumber), [row.schema_name, row.view_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(viewCommentDdl(versionNumber), [row.schema_name, row.view_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(viewColumnCommentsDdl(versionNumber), [row.schema_name, row.view_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(viewTriggersDdl(versionNumber), [row.schema_name, row.view_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(viewTriggerCommentsDdl(versionNumber), [row.schema_name, row.view_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(viewRulesDdl(versionNumber), [row.schema_name, row.view_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(viewRuleCommentsDdl(versionNumber), [row.schema_name, row.view_name]).then(res => res.rows.map(row => row.source).join("\n")),
                        ].filter(Boolean).join("\n\n") ?? "-- No DDL available";
                    }
                },
            } as IEditorSlot),
        },
    };
};

export default ddlTab;