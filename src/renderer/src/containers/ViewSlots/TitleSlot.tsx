import React from "react";
import { Paper, Typography, useTheme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import { styled, useThemeProps } from "@mui/material/styles";
import { ITitleSlot, resolveValue } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { uuidv7 } from "uuidv7";
import { ToolBarSlots } from "./ToolBarSlot";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";

interface TitleSlotProps extends Omit<React.ComponentProps<typeof Paper>, "slot"> {
}

interface TitleSlotOwnProps extends TitleSlotProps {
    slot: ITitleSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const StyledTitleSlot = styled(Paper)(() => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 4,
    paddingLeft: 4,
}));

const TitleSlot: React.FC<TitleSlotOwnProps> = (props) => {
    const { slot, ref, className, sx, ...other } = useThemeProps({ name: "TitleSlot", props });
    const theme = useTheme();
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const [title, setTitle] = React.useState<React.ReactNode>(null);
    const [style, setStyle] = React.useState<React.CSSProperties | undefined>(undefined);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [icon, setIcon] = React.useState<React.ReactNode>(null);
    const { registerRefresh } = useViewSlot();
    const [actionBar, setActionBar] = React.useState<React.ReactNode>(null);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const runtimeContext = useSlotRuntimeContext({});

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
        const resolvedToolBarSlot = resolveValue(slot.toolBar, runtimeContext);
        setTitle(resolveValue(slot.title, runtimeContext));
        setIcon(resolveIcon(theme, resolveValue(slot.icon, runtimeContext)));
        if (resolvedToolBarSlot) {
            setActionBar(<ToolBarSlots slot={resolvedToolBarSlot} ref={ref} />);
        } else {
            setActionBar(null);
        }
        setStyle(resolveValue(slot.style, runtimeContext));
    }, [slot.title, slot.icon, slot.toolBar, slot.style, refresh]);

    const isSimpleTitle = ["string", "number", "boolean"].includes(typeof title);

    return (
        <StyledTitleSlot
            ref={rootRef}
            className={`TitleSlot-root ${className ?? ""}`}
            sx={{ flexDirection: "row", zIndex: 10, ...sx }}
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
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                            }}
                            style={style}
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