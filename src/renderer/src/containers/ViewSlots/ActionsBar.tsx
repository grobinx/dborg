import { ActionsFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import React, { useEffect } from "react";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useRefSlot } from "./RefSlotContext";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { ActionManager } from "@renderer/components/CommandPalette/ActionManager";
import { CommandManager } from "@renderer/components/CommandPalette/CommandManager";
import { createActionComponents } from "./helpers";

export interface ActionsBarProps {
    actions?: ActionsFactory;
    actionSlotId?: string;
}

const ActionsBar: React.FC<ActionsBarProps> = ({
    actions,
    actionSlotId,
}) => {
    const { refreshSlot } = useRefreshSlot();
    const { getRefSlot } = useRefSlot();
    const [actionComponents, setActionComponents] = React.useState<{
        actionComponents: React.ReactNode[],
        actionManager: ActionManager<any> | null,
        commandManager: CommandManager<any> | null
    } | null>(null);

    if (!actions) {
        return null;
    }

    React.useEffect(() => {
        setActionComponents(createActionComponents(actions, actionSlotId, getRefSlot, refreshSlot, {}));
    }, [actions, actionSlotId]);

    return (
        <TabPanelButtons>
            {actionComponents?.actionComponents}
        </TabPanelButtons>
    )
};

export default ActionsBar;