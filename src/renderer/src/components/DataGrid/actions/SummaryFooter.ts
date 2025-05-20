import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const SummaryFooter = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.summaryFooter";

    return {
        id: id,
        keybindings: ["Ctrl+K", "Ctrl+S"],
        label: t(id, "Summary footer"),
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 999,
        run: (context) => {
            context.openCommandPalette("&", "");
        },
    };
}