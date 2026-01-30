import React from "react";
import { Box, useTheme, useThemeProps } from "@mui/material";
import { IDialogSlot, ITabContentSlot, resolveActionFactory, resolveActionGroupFactory, resolveDialogsSlotFactory, SlotRuntimeContext } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useMessages } from "@renderer/contexts/MessageContext";
import { TAB_PANEL_CHANGED, TabPanelChangedMessage } from "@renderer/app/Messages";
import { createContentComponent, createProgressBarContent } from "./helpers";
import TabPanelContent from "@renderer/components/TabsPanel/TabPanelContent";
import { useRefSlot } from "./RefSlotContext";
import CommandPalette from "@renderer/components/CommandPalette/CommandPalette";
import { ActionManager } from "@renderer/components/CommandPalette/ActionManager";
import { isKeyBinding } from "@renderer/hooks/useKeyboardNavigation";
import { isKeybindingMatch } from "@renderer/components/CommandPalette/KeyBinding";
import DialogSlot from "./DialogSlot";
import { uuidv7 } from "uuidv7";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";

export interface TabContentSlotContext {
    openCommandPalette: (prefix: string, query: string) => void;
    actionManager: () => ActionManager<TabContentSlotContext> | null;
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
    const theme = useTheme();
    const { slot, ref, tabsItemID, itemID, className, onClose, ...other } = useThemeProps({ name: "TabLabelSlot", props });
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const addToast = useToast();
    const { confirm } = useDialogs();
    const [content, setContent] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode,
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [progressBar, setProgressBar] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [dialogs, setDialogs] = React.useState<Record<string, {
        opened: boolean;
        params?: Record<string, any>;
        dialog: IDialogSlot;
        resolver: ((value: Record<string, any> | null) => void) | null;
    }>>({});
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot, registerDialog, openDialog } = useViewSlot();
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
    const actionManager = React.useRef<ActionManager<TabContentSlotContext>>(null);
    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({
        theme, refresh: refreshSlot, openDialog, showNotification: ({ message, severity = "info" }) => {
            addToast(severity, message);
        },
        showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
            return confirm(message, { title, severity, okText: confirmLabel, cancelText: cancelLabel });
        },
    }), [theme, refreshSlot, openDialog, addToast, confirm]);

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
        let unregisterDialogs: (() => void) | null = null;

        if ((slot.actionGroups || slot.actions) && (!actionManager.current || refreshChanged)) {
            actionManager.current = new ActionManager<TabContentSlotContext>();
            const actions = resolveActionFactory(slot.actions, runtimeContext);
            actionManager.current.registerAction(...(actions ?? []));
            const groups = resolveActionGroupFactory(slot.actionGroups, runtimeContext);
            actionManager.current.registerActionGroup(...(groups ?? []));
        }

        const resolvedDialogs = resolveDialogsSlotFactory(slot.dialogs, runtimeContext);
        if (resolvedDialogs && Object.keys(resolvedDialogs).length > 0) {
            const dialogs = resolvedDialogs.reduce((acc, dialog) => ({
                ...acc,
                [dialog.id]: {
                    opened: false,
                    dialog: dialog,
                    resolver: null as ((value: Record<string, any> | null) => void) | null,
                }
            }), {} as Record<string, {
                opened: boolean;
                dialog: IDialogSlot;
                resolver: ((value: Record<string, any> | null) => void) | null;
            }>);
            setDialogs(dialogs);
            unregisterDialogs = registerDialog(Object.keys(dialogs), (id: string, params?: Record<string, any>) => {
                return new Promise<Record<string, any> | null>((resolve) => {
                    setDialogs(prev => ({
                        ...prev,
                        [id]: {
                            opened: true,
                            dialog: prev[id].dialog,
                            params,
                            resolver: resolve,
                        }
                    }));
                });
            });
        }

        if (isFirstActivation || (active && refreshChanged)) {
            setContent(prev => ({
                ...prev,
                node: createContentComponent(slot.content!, runtimeContext, prev.ref),
            }));
            setProgressBar(prev => ({
                ...prev,
                node: slot.progress ? createProgressBarContent(slot.progress, runtimeContext, prev.ref, true) : null,
            }));
            previousRefreshRef.current = refresh;
        }
        if (active) {
            wasActiveRef.current = true;
        }
        return () => {
            if (unregisterDialogs) {
                unregisterDialogs();
            }
        };
    }, [active, slot.content, slot.dialogs, refresh]);

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
            {content.node}
            {Object.values(dialogs).map(({ opened, dialog, params, resolver }) => (
                opened ? (
                    <DialogSlot
                        key={dialog.id}
                        slot={dialog}
                        open={true}
                        onClose={(result) => {
                            setDialogs(prev => ({
                                ...prev,
                                [dialog.id]: {
                                    ...prev[dialog.id],
                                    opened: false,
                                    resolver: null,
                                }
                            }));
                            resolver?.(result);
                        }}
                        params={params}
                    />
                ) : null
            ))}
        </TabPanelContent>
    );
};

export default TabContentSlot;