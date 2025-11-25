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
    handleRef?: React.Ref<HTMLDivElement>;
}

const ActionsBar: React.FC<ActionsBarProps> = ({
    actions,
    actionSlotId,
    handleRef
}) => {
    const { refreshSlot } = useRefreshSlot();
    const { getRefSlot } = useRefSlot();
    const [actionComponents, setActionComponents] = React.useState<{
        actionComponents: React.ReactNode[],
        actionManager: ActionManager<any> | null,
        commandManager: CommandManager<any> | null,
        actionContext: any | null
    } | null>(null);

    React.useEffect(() => {
        setActionComponents(createActionComponents(actions, actionSlotId, getRefSlot, refreshSlot, {}));
    }, [actions, actionSlotId]);

    // Handler onKeyDown
    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (actionComponents?.commandManager && actionComponents.commandManager.executeCommand(event, actionComponents.actionContext)) {
                event.preventDefault();
                return;
            }
            if (actionComponents?.actionManager && actionComponents.actionManager.executeActionByKeybinding(event, actionComponents.actionContext)) {
                event.preventDefault();
                return;
            }
        },
        [actionComponents]
    );

    // Przypisz handler do ref jeśli podany
    React.useEffect(() => {
        // Only attach event if handleRef is an object ref (not a callback ref)
        if (handleRef && typeof handleRef !== "function" && handleRef.current) {
            const node = handleRef.current;
            node.addEventListener("keydown", handleKeyDown as any);
            return () => {
                node.removeEventListener("keydown", handleKeyDown as any);
            };
        }
        return;
    }, [handleKeyDown]);

    if (!actions) {
        return null;
    }

    return (
        <TabPanelButtons>
            {actionComponents?.actionComponents}
        </TabPanelButtons>
    );
};

export default ActionsBar;