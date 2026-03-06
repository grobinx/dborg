import React from "react";
import { Box } from "@mui/material";
import { styled, useThemeProps } from "@mui/material/styles";
import { IContentSlot, resolveActionFactory, resolveActionGroupFactory, resolveDialogsSlotFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { createBannerContent, createContentComponent, createProgressBarContent, createTextContent, createTitleContent } from "./helpers";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { ActionManager, IActionManager } from "@renderer/components/CommandPalette/ActionManager";
import { useRefSlot } from "./RefSlotContext";
import { isKeybindingMatch } from "@renderer/components/CommandPalette/KeyBinding";
import CommandPalette from "@renderer/components/CommandPalette/CommandPalette";
import { uuidv7 } from "uuidv7";
import { useSlotDialogs } from "./hooks/useSlotDialogs";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";

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
    const { slot, ref, className, ...other } = useThemeProps({ name: "ContentSlot", props });
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
    const [banner, setBanner] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh } = useViewSlot();
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const { registerRefSlot } = useRefSlot();
    const [openCommandPalette, setOpenCommandPalette] = React.useState<boolean>(false);
    const [commandPalettePrefix, setCommandPalettePrefix] = React.useState<string>("");
    const [commandPaletteQuery, setCommandPaletteQuery] = React.useState<string>("");
    const slotRef = React.useRef<ContentSlotContext>(null);
    const actionManager = React.useRef<IActionManager<ContentSlotContext>>(null);
    const runtimeContext = useSlotRuntimeContext({});
    const dialogs = useSlotDialogs({ dialogSlots: React.useMemo(() => resolveDialogsSlotFactory(slot.dialogs, runtimeContext) ?? null, [slot.dialogs, runtimeContext, refresh]) });

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
        if (slot.banner) {
            setBanner(prev => ({
                ...prev,
                node: createBannerContent(slot.banner!, runtimeContext, prev.ref)
            }));
        }
        setMainSlot(prev => ({
            ...prev,
            node: createContentComponent(slot.main, runtimeContext, prev.ref)
        }));
    }, [slot.title, slot.main, slot.text, slot.dialogs, slot.banner, refresh]);

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
            {banner.node}
            {titleSlot.node}
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
            {dialogs}
        </StyledContentSlot>
    );
};

export default ContentSlot;