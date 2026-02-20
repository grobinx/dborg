import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const ToggleHideColumn = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.toggleHideColumn";

    return {
        id: id,
        keySequence: ["Ctrl+H"],
        label: t(id, "Toggle column visibility"),
        icon: "Visibility",
        run: (context) => {
            context.toggleHideColumn();
        },
    };
};