import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import { styled, useThemeProps } from "@mui/material/styles";
import { ITitleSlot, resolveReactNodeFactory, resolveToolBarSlotKindFactory, SlotRuntimeContext } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import ToolBarSlot from "./ToolBarSlot";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { uuidv7 } from "uuidv7";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";

interface TitleSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface TitleSlotOwnProps extends TitleSlotProps {
    slot: ITitleSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const StyledTitleSlot = styled(Box)(() => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 4,
    paddingLeft: 4,
}));

const TitleSlot: React.FC<TitleSlotOwnProps> = (props) => {
    const { slot, ref, className, ...other } = useThemeProps({ name: "TitleSlot", props });
    const theme = useTheme();
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const [title, setTitle] = React.useState<React.ReactNode>(null);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [icon, setIcon] = React.useState<React.ReactNode>(null);
    const { registerRefresh, refreshSlot, openDialog } = useViewSlot();
    const [actionBar, setActionBar] = React.useState<React.ReactNode>(null);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const addToast = useToast();
    const { confirm } = useDialogs();
    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({
        theme, refresh: refreshSlot, openDialog,
        showNotification: ({ message, severity = "info" }) => {
            addToast(severity, message);
        },
        showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
            return confirm(message, { title, severity, okText: confirmLabel, cancelText: cancelLabel });
        },
    }), [theme, refreshSlot, openDialog, addToast, confirm]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        slot?.onMount?.(runtimeContext);
        return () => {
            unregisterRefresh();
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
        const resolvedToolBarSlot = resolveToolBarSlotKindFactory(slot.toolBar, runtimeContext);
        setTitle(resolveReactNodeFactory(slot.title, runtimeContext));
        setIcon(resolveIcon(theme, slot.icon));
        if (resolvedToolBarSlot) {
            setActionBar(<ToolBarSlot slot={resolvedToolBarSlot} ref={ref} />);
        } else {
            setActionBar(null);
        }
    }, [slot.title, slot.icon, slot.toolBar, refresh]);

    const isSimpleTitle = ["string", "number", "boolean"].includes(typeof title);

    return (
        <StyledTitleSlot
            ref={rootRef}
            className={`TitleSlot-root ${className ?? ""}`}
            {...other}
        >
            {icon}
            {title && (<>
                {
                    isSimpleTitle ? (
                        <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{
                                maxWidth: 320,
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {title}
                        </Typography>
                    ) : (
                        title
                    )
                }
                <div style={{ flexGrow: 1 }} />
            </>)}
            {actionBar}
        </StyledTitleSlot >
    );
};

export default TitleSlot;