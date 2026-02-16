import React from "react";
import { AppBar, Box } from "@mui/material";
import { styled, useTheme, useThemeProps } from "@mui/material/styles";
import { IContentSlot, IDialogSlot, resolveActionFactory, resolveActionGroupFactory, resolveDialogsSlotFactory, SlotRuntimeContext } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { createContentComponent, createProgressBarContent, createTextContent, createTitleContent } from "./helpers";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { ActionManager, IActionManager } from "@renderer/components/CommandPalette/ActionManager";
import { useRefSlot } from "./RefSlotContext";
import { isKeybindingMatch } from "@renderer/components/CommandPalette/KeyBinding";
import CommandPalette from "@renderer/components/CommandPalette/CommandPalette";
import DialogSlot from "./DialogSlot";
import { uuidv7 } from "uuidv7";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";

export interface ContentSlotContext {
    openCommandPalette: (prefix: string, query: string) => void;
    actionManager: () => IActionManager<ContentSlotContext> | null;
}

interface ContentSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface ContentSlotOwnProps extends ContentSlotProps {
    slot: IContentSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const StyledContentSlot = styled(Box)(() => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
}));

const ContentSlot: React.FC<ContentSlotOwnProps> = (props) => {
    const theme = useTheme();
    const { slot, ref, className, ...other } = useThemeProps({ name: "ContentSlot", props });
    const addToast = useToast();
    const { confirm } = useDialogs();
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const [titleSlot, setTitleSlot] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [textSlot, setTextSlot] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [mainSlot, setMainSlot] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
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
    const { registerRefresh, refreshSlot, registerDialog, openDialog } = useViewSlot();
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const { registerRefSlot } = useRefSlot();
    const [openCommandPalette, setOpenCommandPalette] = React.useState<boolean>(false);
    const [commandPalettePrefix, setCommandPalettePrefix] = React.useState<string>("");
    const [commandPaletteQuery, setCommandPaletteQuery] = React.useState<string>("");
    const slotRef = React.useRef<ContentSlotContext>(null);
    const actionManager = React.useRef<IActionManager<ContentSlotContext>>(null);
    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({
        theme, refresh: refreshSlot, openDialog,
        showNotification: ({ message, severity = "info" }) => {
            addToast(severity, message);
        },
        showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
            return confirm(message, {title, severity, okText: confirmLabel, cancelText: cancelLabel});
        },
    }), [theme, refreshSlot, openDialog, addToast, confirm]);

    React.useImperativeHandle(slotRef, () => contentSlotContext);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        const unregisterRefSlot = registerRefSlot(slotId, "content", slotRef);
        slot?.onMount?.(runtimeContext);
        return () => {
            unregisterRefresh();
            unregisterRefSlot();
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
        let unregisterDialogs: (() => void) | null = null;

        if ((slot.actionGroups || slot.actions) && !actionManager.current) {
            actionManager.current = new ActionManager<ContentSlotContext>();
            const actions = resolveActionFactory(slot.actions, runtimeContext);
            actionManager.current.registerAction(...(actions ?? []));
            const groups = resolveActionGroupFactory(slot.actionGroups, runtimeContext);
            actionManager.current.registerActionGroup(...(groups ?? []));
        }

        if (slot.title) {
            setTitleSlot(prev => ({
                ...prev,
                node: createTitleContent(slot.title!, runtimeContext, prev.ref)
            }));
        }
        if (slot.text) {
            setTextSlot(prev => ({
                ...prev,
                node: createTextContent(slot.text!, runtimeContext, prev.ref)
            }));
        }
        if (slot.progress) {
            setProgressBar(prev => ({
                ...prev,
                node: createProgressBarContent(slot.progress!, runtimeContext, prev.ref, true)
            }));
        }
        setMainSlot(prev => ({
            ...prev,
            node: createContentComponent(slot.main, runtimeContext, prev.ref)
        }));
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
        return () => {
            if (unregisterDialogs) {
                unregisterDialogs();
            }
        };
    }, [slot.title, slot.main, slot.text, slot.dialogs, refresh]);

    const contentSlotContext: ContentSlotContext = {
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
        const context: ContentSlotContext = contentSlotContext;
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
        <StyledContentSlot
            ref={rootRef}
            className={`ContentSlot-root ${className ?? ""}`}
            sx={{ position: "relative", }}
            onKeyDown={handleKeyDown}
            {...other}
        >
            {(actionManager.current !== null) && (
                <CommandPalette
                    manager={actionManager.current!}
                    open={openCommandPalette}
                    onClose={() => setOpenCommandPalette(false)}
                    getContext={() => contentSlotContext}
                    parentRef={ref as React.RefObject<HTMLElement | null>}
                    prefix={commandPalettePrefix}
                    searchText={commandPaletteQuery}
                />
            )}
            {progressBar.node}
            {(titleSlot.node != null) && (
                <AppBar position="static" sx={{ flexDirection: "row", zIndex: 10 }}>
                    {titleSlot.node}
                </AppBar>
            )}
            <Box
                key={slotId + "-" + "inner-box"}
                sx={{
                    width: "100%",
                    flex: 1,
                    minHeight: 0,
                    height: "100%",
                }}
                className={"ContentSlot-main-root"}
                ref={ref}
            >
                {mainSlot.node}
            </Box>
            {(textSlot.node != null) && textSlot.node}
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
        </StyledContentSlot>
    );
};

export default ContentSlot;