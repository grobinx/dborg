import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const OpenCommandPalette = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.openCommandPalette";

    return {
        id: id,
        keySequence: ["F1"],
        label: t("open-command-palette", "Open command palette"),
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 1,
        run: (context) => {
            context.openCommandPalette(">", "");
        },
    };
}