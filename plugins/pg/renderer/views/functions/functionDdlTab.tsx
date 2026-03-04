import i18next from "i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { IPinnableTabSlot } from "plugins/manager/renderer/CustomSlots";
import { FunctionRecord } from "./functionsView";

const functionDdlTab = (
    session: IDatabaseSession,
    selectedFunction: () => FunctionRecord | null,
    cid: (id: string) => string
): IPinnableTabSlot => {
    const t = i18next.t.bind(i18next);

    return {
        id: cid("function-ddl-tab"),
        type: "tab",
        label: {
            id: cid("function-ddl-tab-label"),
            type: "tablabel",
            label: t("ddl", "DDL"),
        },
        content: {
            id: cid("function-ddl-tab-content"),
            type: "tabcontent",
            content: {
                id: cid("function-ddl-editor"),
                type: "editor",
                readOnly: true,
                wordWrap: true,
                miniMap: false,
                content: async () => {
                    const f = selectedFunction();
                    if (!f) return "-- " + t("no-function-selected", "No function selected.");

                    const { rows } = await session.query<{ ddl: string }>(
                        `select pg_get_functiondef($1::oid) as ddl`,
                        [f.oid]
                    );

                    return rows[0]?.ddl ?? "-- " + t("ddl-not-available", "DDL not available.");
                },
            },
        },
    };
};

export default functionDdlTab;