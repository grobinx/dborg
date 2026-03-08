import React from "react";
import { Box, useThemeProps } from "@mui/material";
import { ITabContentSlot, resolveValue } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useMessages } from "@renderer/contexts/MessageContext";
import { TAB_PANEL_CHANGED, TabPanelChangedMessage } from "@renderer/app/Messages";
import { createBannerContent, createContentComponent, createProgressBarContent } from "./helpers";
import TabPanelContent from "@renderer/components/TabsPanel/TabPanelContent";
import { useRefSlot } from "./RefSlotContext";
import CommandPalette from "@renderer/components/CommandPalette/CommandPalette";
import { ActionManager, IActionManager } from "@renderer/components/CommandPalette/ActionManager";
import { isKeybindingMatch } from "@renderer/components/CommandPalette/KeyBinding";
import { uuidv7 } from "uuidv7";
import { useSlotDialogs } from "./hooks/useSlotDialogs";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";

export interface TabContentSlotContext {
    openCommandPalette: (prefix: string, query: string) => void;
    actionManager: () => IActionManager<TabContentSlotContext> | null;
}

interface TabContentSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface TabContentSlotOwnProps extends TabContentSlotProps {
    slot: ITabContentSlot;
    ref?: React.Ref<HTMLDivElement | null>;
    tabsItemID?: string;
    onClose?: () => void;
}

const TabContentSlot: React.FC<TabContentSlotOwnProps> = (props) => {
    const { slot, ref, tabsItemID, itemID, className, onClose, ...other } = useThemeProps({ name: "TabLabelSlot", props });
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const [content, setContent] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode,
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [progressBar, setProgressBar] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [banner, setBanner] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const { registerRefresh } = useViewSlot();
    const { subscribe, unsubscribe } = useMessages();
    const [active, setActive] = React.useState(false);
    const wasActiveRef = React.useRef(false);
    const previousRefreshRef = React.useRef(refresh);
    const [, reRender] = React.useState<bigint>(0n);
    const { registerRefSlot } = useRefSlot();
    const [openCommandPalette, setOpenCommandPalette] = React.useState<boolean>(false);
    const [commandPalettePrefix, setCommandPalettePrefix] = React.useState<string>("");
    const [commandPaletteQuery, setCommandPaletteQuery] = React.useState<string>("");
    const tabSlotRef = React.useRef<TabContentSlotContext>(null);
    const actionManager = React.useRef<IActionManager<TabContentSlotContext>>(null);
    const runtimeContext = useSlotRuntimeContext({});
    const dialogs = useSlotDialogs({ dialogSlots: React.useMemo(() => resolveValue(slot.dialogs, runtimeContext) ?? null, [slot.dialogs, runtimeContext, refresh]) });

    React.useImperativeHandle(tabSlotRef, () => tabSlotContext);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        const unregisterRefSlot = registerRefSlot(slotId, "tabcontent", tabSlotRef);
        return () => {
            unregisterRefresh();
            unregisterRefSlot();
        }
    }, [slotId]);

    React.useEffect(() => {
        slot?.onMount?.(runtimeContext);
        return () => {
            slot?.onUnmount?.(runtimeContext);
        };
    }, [slotId]);

    React.useEffect(() => {
        if (active && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [active, pendingRefresh]);

    React.useEffect(() => {
        if (active) {
            slot?.onActivate?.(runtimeContext);
        } else {
            slot?.onDeactivate?.(runtimeContext);
        }
    }, [active]);

    React.useEffect(() => {
        const isFirstActivation = active && !wasActiveRef.current;
        const refreshChanged = refresh !== previousRefreshRef.current;

        if ((slot.actionGroups || slot.actions) && (!actionManager.current || refreshChanged)) {
            actionManager.current = new ActionManager<TabContentSlotContext>();
            const actions = resolveValue(slot.actions, runtimeContext);
            actionManager.current.registerAction(...(actions ?? []));
            const groups = resolveValue(slot.actionGroups, runtimeContext);
            actionManager.current.registerActionGroup(...(groups ?? []));
        }

        if (isFirstActivation || (active && refreshChanged)) {
            setContent(prev => ({
                ...prev,
                node: createContentComponent(slot.content!, runtimeContext, prev.ref),
            }));
            if (slot.progress) {
                setProgressBar(prev => ({
                    ...prev,
                    node: createProgressBarContent(slot.progress!, runtimeContext, prev.ref, true),
                }));
            }
            if (slot.banner) {
                setBanner(prev => ({
                    ...prev,
                    node: createBannerContent(slot.banner!, runtimeContext, prev.ref),
                }));
            }
            previousRefreshRef.current = refresh;
        }
        if (active) {
            wasActiveRef.current = true;
        }
    }, [active, slot.content, slot.dialogs, slot.banner, refresh]);

    React.useEffect(() => {
        if (active && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [active, pendingRefresh]);

    React.useEffect(() => {
        const handleTabPanelChangedMessage = (message: TabPanelChangedMessage) => {
            if (tabsItemID === message.tabsItemID) {
                const newActive = message.itemID === itemID;
                if (newActive !== active) {
                    setActive(newActive);
                }
            }
        };

        subscribe(TAB_PANEL_CHANGED, handleTabPanelChangedMessage);
        return () => {
            unsubscribe(TAB_PANEL_CHANGED, handleTabPanelChangedMessage);
        };
    }, [tabsItemID, itemID, active]);

    const tabSlotContext: TabContentSlotContext = {
        openCommandPalette: (prefix: string, query: string) => {
            Promise.resolve().then(() => {
                setCommandPalettePrefix(prefix);
                setCommandPaletteQuery(query);
                setOpenCommandPalette(true);
            });
        },
        actionManager: () => actionManager.current,
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const context: TabContentSlotContext = tabSlotContext;
        if (actionManager.current?.executeActionByKeybinding(event, context)) {
            event.preventDefault();
            return;
        }
        if (isKeybindingMatch(slot.keybinding ?? "Ctrl+Shift+P", event)) {
            event.preventDefault();
            setCommandPalettePrefix(">");
            setCommandPaletteQuery("");
            setOpenCommandPalette(true);
        }
    };

    return (
        <TabPanelContent
            ref={ref}
            tabsItemID={tabsItemID}
            itemID={itemID}
            sx={{ position: "relative" }}
            onKeyDown={handleKeyDown}
        >
            {(actionManager.current !== null) && (
                <CommandPalette
                    manager={actionManager.current!}
                    open={openCommandPalette}
                    onClose={() => setOpenCommandPalette(false)}
                    getContext={() => tabSlotContext}
                    parentRef={ref as React.RefObject<HTMLElement | null>}
                    prefix={commandPalettePrefix}
                    searchText={commandPaletteQuery}
                />
            )}
            {progressBar.node}
            {banner.node}
            {content.node}
            {dialogs}
        </TabPanelContent>
    );
};

export default TabContentSlot;