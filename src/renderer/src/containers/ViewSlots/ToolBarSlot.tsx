import { IToolBarSlot, ToolBarSlotKind, ToolFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useRefSlot } from "./RefSlotContext";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { ActionManager } from "@renderer/components/CommandPalette/ActionManager";
import { CommandManager } from "@renderer/components/CommandPalette/CommandManager";
import { createActionComponents } from "./helpers";

export interface ToolBarProps {
    slot: ToolBarSlotKind;
    actionSlotId?: string;
    handleRef?: React.Ref<HTMLDivElement>;
}

const ToolBarSlot: React.FC<ToolBarProps> = ({
    slot,
    actionSlotId,
    handleRef
}) => {
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { getRefSlot } = useRefSlot();
    const [refresh, setRefresh] = React.useState(false);
    const [actionComponents, setActionComponents] = React.useState<{
        actionComponents: React.ReactNode[],
        actionManager: ActionManager<any> | null,
        commandManager: CommandManager<any> | null,
        actionContext: any | null
    } | null>(null);
    const [renderNode, setRenderNode] = React.useState<React.ReactNode>(null);

    React.useEffect(() => {
        slot?.onMount?.(refreshSlot);
        return () => {
            slot?.onUnmount?.(refreshSlot);
        };
    }, [slot]);

    React.useEffect(() => {
        if (slot.type === "rendered") {
            setRenderNode(<slot.render refresh={refreshSlot} />);
            return;
        }
        setActionComponents(createActionComponents(slot.tools, actionSlotId, getRefSlot, refreshSlot, {}));
    }, [slot, actionSlotId, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

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

    if (!actionComponents && !renderNode) {
        return null;
    }

    return (
        <TabPanelButtons>
            {renderNode}
            {actionComponents?.actionComponents}
        </TabPanelButtons>
    );
};

export default ToolBarSlot;