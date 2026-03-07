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
    const editorPositions = new Map<string, { lineNumber: number; column: number; top: number }>();

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
                language: () => {
                    const f = selectedFunction();
                    if (!f) return "sql";
                    if (f.language_name === "c") return "c";
                    if (f.language_name === "internal") return "sql";
                    if (f.language_name === "plpgsql") return "pgsql";
                    if (f.language_name === "plperlu") return "perl";
                    if (f.language_name === "plperl") return "perl";
                    if (f.language_name === "plpythonu") return "python";
                    if (f.language_name === "plpython3u") return "python";
                    return "sql";
                },
                onPositionChanged: (_, editorContext) => {
                    const f = selectedFunction();
                    if (!f) return;

                    const position = editorContext.editor()?.getPosition();
                    const top = editorContext.editor()?.getScrollTop() ?? 0;
                    if (!position) return;

                    const key = `${f.schema_name}.${f.function_name}(${f.identity_args})`;
                    editorPositions.set(key, { lineNumber: position.lineNumber, column: position.column, top });
                },
                onContentSuccess: (_, editorContext) => {
                    const f = selectedFunction();
                    if (!f) return;

                    const key = `${f.schema_name}.${f.function_name}(${f.identity_args})`;
                    const position = editorPositions.get(key);

                    if (position) {
                        editorContext.editor()?.setPosition(position);
                        editorContext.editor()?.setScrollTop(position.top);
                    } else {
                        editorContext.editor()?.setScrollTop(0);
                    }
                },
            },
        },
    };
};

export default functionDdlTab;