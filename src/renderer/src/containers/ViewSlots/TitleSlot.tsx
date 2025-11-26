import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import { styled, useThemeProps } from "@mui/material/styles";
import { ITitleSlot, resolveReactNodeFactory, resolveToolBarSlotFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import ToolBarSlot from "./ToolBarSlot";

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
    const [refresh, setRefresh] = React.useState(false);
    const [icon, setIcon] = React.useState<React.ReactNode>(null);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const [actionBar, setActionBar] = React.useState<React.ReactNode>(null);

    React.useEffect(() => {
        slot?.onMount?.(refreshSlot);
        return () => {
            slot?.onUnmount?.(refreshSlot);
        };
    }, [slot]);

    React.useEffect(() => {
        const resolvedToolBarSlot = resolveToolBarSlotFactory(slot.toolBar, refreshSlot);
        setTitle(resolveReactNodeFactory(slot.title, refreshSlot) ?? "");
        setIcon(resolveIcon(theme, slot.icon));
        if (resolvedToolBarSlot) {
            setActionBar(<ToolBarSlot slot={resolvedToolBarSlot} actionSlotId={slot.actionSlotId} handleRef={ref} />);
        } else {
            setActionBar(null);
        }
    }, [slot.title, slot.icon, slot.toolBar, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

    const isSimpleTitle = ["string", "number", "boolean"].includes(typeof title);

    return (
        <StyledTitleSlot
            ref={ref}
            className={`TitleSlot-root ${className ?? ""}`}
            {...other}
        >
            {icon}
            {isSimpleTitle ? (
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
            )}
            <div style={{ flexGrow: 1 }} />
            {actionBar}
        </StyledTitleSlot>
    );
};

export default TitleSlot;