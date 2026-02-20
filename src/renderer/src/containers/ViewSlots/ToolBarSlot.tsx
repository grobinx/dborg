import { SlotRuntimeContext, ToolBarSlotKind, ToolBarSlotsKind } from "../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";
import { useViewSlot } from "./ViewSlotContext";
import { useRefSlot } from "./RefSlotContext";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { IActionManager } from "@renderer/components/CommandPalette/ActionManager";
import { CommandManager } from "@renderer/components/CommandPalette/CommandManager";
import { createActionComponents } from "./helpers";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { useTheme } from "@mui/material";
import { uuidv7 } from "uuidv7";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";

export interface ToolBarsProps {
    slot: ToolBarSlotsKind;
    ref?: React.Ref<HTMLDivElement>;
}

export const ToolBarSlots: React.FC<ToolBarsProps> = ({
    slot,
    ref,
}) => {
    if (Array.isArray(slot)) {
        if (slot.length === 1) {
            return <ToolBarSlot slot={slot[0]} ref={ref} />;
        }
        return (
            <TabPanelButtons>
                {slot.map((s, index) => (
                    <ToolBarSlot key={s.id ?? index} slot={s} ref={ref} />
                ))}
            </TabPanelButtons>
        );
    }

    return <ToolBarSlot slot={slot} ref={ref} />;
};

interface ToolBarProps {
    slot: ToolBarSlotKind;
    ref?: React.Ref<HTMLDivElement>;
}

const ToolBarSlot: React.FC<ToolBarProps> = ({
    slot,
    ref,
}) => {
    const theme = useTheme();
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const { registerRefresh, refreshSlot, openDialog } = useViewSlot();
    const { getRefSlot, onRegisterRefSlot } = useRefSlot();
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [actionComponents, setActionComponents] = React.useState<{
        actionComponents: React.ReactNode[],
        actionManager: (() => IActionManager<any>) | null,
        commandManager: CommandManager<any> | null,
        actionContext: (() => any) | null
    } | null>(null);
    const [renderNode, setRenderNode] = React.useState<React.ReactNode>(null);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const addToast = useToast();
    const { confirm } = useDialogs();
    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({
        theme, refresh: refreshSlot, openDialog, showNotification: ({ message, severity = "info" }) => {
            addToast(severity, message);
        },
        showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
            return confirm(message, { title, severity, okText: confirmLabel, cancelText: cancelLabel });
        },
    }), [theme, refreshSlot, openDialog, addToast, confirm]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, () => {
            setPendingRefresh(true);
        });
        let offDataGrid: () => void = () => { };
        let offTabContent: () => void = () => { };
        let offContent: () => void = () => { };
        let offEditor: () => void = () => { };
        if (slot.type === "toolbar") {
            offDataGrid = onRegisterRefSlot(slotId, slot.actionSlotId, "datagrid", () => {
                setRefresh(prev => prev + 1n);
            });
            offTabContent = onRegisterRefSlot(slotId, slot.actionSlotId, "tabcontent", () => {
                setRefresh(prev => prev + 1n);
            });
            offContent = onRegisterRefSlot(slotId, slot.actionSlotId, "content", () => {
                setRefresh(prev => prev + 1n);
            });
            offEditor = onRegisterRefSlot(slotId, slot.actionSlotId, "editor", () => {
                setRefresh(prev => prev + 1n);
            });
        }
        slot?.onMount?.(runtimeContext);
        return () => {
            unregisterRefresh();
            offDataGrid();
            offTabContent();
            offContent();
            offEditor();
            slot?.onUnmount?.(runtimeContext);
        };
    }, [slotId]);

    React.useEffect(() => {
        if (rootVisible && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [rootVisible, pendingRefresh]);

    React.useEffect(() => {
        if (rootVisible) {
            slot?.onShow?.(runtimeContext);
        } else {
            slot?.onHide?.(runtimeContext);
        }
    }, [rootVisible]);

    React.useEffect(() => {
        if (slot.type === "rendered") {
            setRenderNode(<slot.render runtimeContext={runtimeContext} />);
            return;
        }
        setActionComponents(createActionComponents(slot.tools, slot.actionSlotId, getRefSlot, runtimeContext));
    }, [slotId, refresh]);

    // Handler onKeyDown
    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (actionComponents?.commandManager && actionComponents.commandManager.executeCommand(event, actionComponents.actionContext)) {
                event.preventDefault();
                return;
            }
            if (actionComponents?.actionManager && actionComponents.actionManager()?.executeActionByKeybinding(event, actionComponents.actionContext)) {
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

    return (
        <TabPanelButtons ref={rootRef}>
            {renderNode}
            {actionComponents?.actionComponents}
        </TabPanelButtons>
    );
};
