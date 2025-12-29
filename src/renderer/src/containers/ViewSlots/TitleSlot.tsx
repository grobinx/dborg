import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import { styled, useThemeProps } from "@mui/material/styles";
import { ITitleSlot, resolveReactNodeFactory, resolveToolBarSlotKindFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import ToolBarSlot from "./ToolBarSlot";
import { useVisibleState } from "@renderer/hooks/useVisibleState";

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
    const [title, setTitle] = React.useState<React.ReactNode>(null);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [icon, setIcon] = React.useState<React.ReactNode>(null);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const [actionBar, setActionBar] = React.useState<React.ReactNode>(null);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (redrawOnly) => {
             if (redrawOnly) {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        slot?.onMount?.(refreshSlot);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(refreshSlot);
        };
    }, [slot.id]);

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
        const resolvedToolBarSlot = resolveToolBarSlotKindFactory(slot.toolBar, refreshSlot);
        setTitle(resolveReactNodeFactory(slot.title, refreshSlot));
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