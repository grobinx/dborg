import { ToolBarSlotKind } from "../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useRefSlot } from "./RefSlotContext";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { ActionManager } from "@renderer/components/CommandPalette/ActionManager";
import { CommandManager } from "@renderer/components/CommandPalette/CommandManager";
import { createActionComponents } from "./helpers";
import { useVisibleState } from "@renderer/hooks/useVisibleState";

export interface ToolBarProps {
    slot: ToolBarSlotKind;
    ref?: React.Ref<HTMLDivElement>;
}

const ToolBarSlot: React.FC<ToolBarProps> = ({
    slot,
    ref,
}) => {
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { getRefSlot } = useRefSlot();
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [actionComponents, setActionComponents] = React.useState<{
        actionComponents: React.ReactNode[],
        actionManager: ActionManager<any> | null,
        commandManager: CommandManager<any> | null,
        actionContext: any | null
    } | null>(null);
    const [renderNode, setRenderNode] = React.useState<React.ReactNode>(null);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setPendingRefresh(true);
        });
        slot?.onMount?.(refreshSlot);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(refreshSlot);
        };
    }, [slot]);

    React.useEffect(() => {
        if (rootVisible && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [rootVisible, pendingRefresh]);

    React.useEffect(() => {
        if (rootVisible) {
            slot?.onShow?.(refreshSlot);
        } else {
            slot?.onHide?.(refreshSlot);
        }
    }, [rootVisible]);

    React.useEffect(() => {
        if (slot.type === "rendered") {
            setRenderNode(<slot.render refresh={refreshSlot} />);
            return;
        }
        setActionComponents(createActionComponents(slot.tools, slot.actionSlotId, getRefSlot, refreshSlot, {}));
    }, [slot.id, refresh]);

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
        if (ref && typeof ref !== "function" && ref.current) {
            const node = ref.current;
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
        <TabPanelButtons ref={rootRef}>
            {renderNode}
            {actionComponents?.actionComponents}
        </TabPanelButtons>
    );
};

export default ToolBarSlot;