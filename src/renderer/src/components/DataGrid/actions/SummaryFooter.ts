import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const SummaryFooter_ID = "dataGrid.actions.summaryFooter";

export const SummaryFooter = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);

    return {
        id: SummaryFooter_ID,
        keybindings: ["Ctrl+K", "Ctrl+S"],
        label: t(SummaryFooter_ID, "Summary footer"),
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 5,
        run: (context) => {
            context.openCommandPalette("&", "");
        },
    };
}