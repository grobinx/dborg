import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const ToggleHideColumn = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.toggleHideColumn";

    return {
        id: id,
        keybindings: ["Ctrl+H"],
        label: t(id, "Toggle column visibility"),
        icon: "Visibility",
        contextMenuGroupId: "layout",
        contextMenuOrder: 3,
        run: (context) => {
            context.toggleHideColumn();
        },
    };
};