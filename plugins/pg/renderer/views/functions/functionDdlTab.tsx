import i18next from "i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { IPinnableTabSlot } from "plugins/manager/renderer/CustomSlots";
import { FunctionRecord } from "./functionsView";
import { functionDdl } from "../../../common/ddls/function";

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
            label: t("source", "Source"),
        },
        content: {
            id: cid("function-ddl-tab-content"),
            type: "tabcontent",
            content: {
                id: cid("function-ddl-editor"),
                type: "editor",
                content: async () => {
                    const f = selectedFunction();
                    if (!f) return "-- " + t("no-function-selected", "No function selected.");

                    return await functionDdl(
                        session,
                        f.schema_name,
                        f.function_name,
                        f.identity_args
                    );
                },
            },
        },
    };
};

export default functionDdlTab;