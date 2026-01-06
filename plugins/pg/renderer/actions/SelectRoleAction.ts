import { Action } from "@renderer/components/CommandPalette/ActionManager";
import { TabContentSlotContext } from "@renderer/containers/ViewSlots/TabContentSlot";
import i18next from "i18next";

export const SelectRoleAction_ID = "actions.pg.selectRole";

export const SelectRoleAction = (): Action<TabContentSlotContext> => {
    const t = i18next.t.bind(i18next);
    return {
        id: SelectRoleAction_ID,
        keySequence: ["Ctrl+M"],
        label: t(SelectRoleAction_ID, "Select role"),
        icon: "Users",
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 999,
        run: (context) => {
            context.openCommandPalette("ROLE:", "");
        },
    };
}