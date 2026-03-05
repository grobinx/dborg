import { uuidv7 } from "uuidv7";
import { IPinnableTabSlot } from "../../../../manager/renderer/CustomSlots";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { FunctionRecord } from "./functionsView";
import functionDetailsTab from "./functionDetailsTab";
import functionDdlTab from "./functionDdlTab";

export function functionView(
    session: IDatabaseSession,
    fn: (() => FunctionRecord | null) | FunctionRecord,
    pinned: boolean = false
): IPinnableTabSlot {
    const t = i18next.t.bind(i18next);
    const uniqueId = uuidv7();

    const cid = (id: string) => `${id}-${session.info.uniqueId}${pinned ? `-${uniqueId}` : ""}`;

    const getFunction = (f: (() => FunctionRecord | null) | FunctionRecord) => (typeof f === "function" ? f() : f);

    return {
        id: cid("function-editors-tab"),
        type: "tab",
        closable: pinned ? true : false,
        pinnable: () => !pinned && getFunction(fn) !== null,
        pin: () => functionView(session, getFunction(fn)!, true),
        label: {
            id: cid("function-tab-label"),
            type: "tablabel",
            label: () => {
                const f = getFunction(fn);
                return f ? `${f.schema_name}.${f.function_name}(${f.identity_args})` : t("not-selected", "Not selected");
            },
            icon: "Function",
        },
        content: {
            id: cid("function-tab-content"),
            type: "tabcontent",
            content: {
                id: cid("function-tabs"),
                type: "tabs",
                tabs: [
                    functionDetailsTab(session, () => getFunction(fn), cid),
                    functionDdlTab(session, () => getFunction(fn), cid),
                ],
            },
        },
    };
}