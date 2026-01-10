import React from "react";
import { Box, Typography, styled, useTheme, useThemeProps } from "@mui/material";
import { ITextSlot, resolveReactNodeFactory, SlotFactoryContext } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";

interface TextSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface TextSlotOwnProps extends TextSlotProps {
    slot: ITextSlot;
    ref?: React.Ref<HTMLDivElement>;
}

// Stylowany Box
const StyledTextSlot = styled(Box, {
    shouldForwardProp: (prop) => prop !== "maxLines"
})<{ maxLines?: number }>(({ maxLines }) => ({
    maxHeight: maxLines && maxLines > 1 ? `calc(${maxLines} * 1.4em)` : undefined,
    overflow: maxLines && maxLines > 1 ? "auto" : "hidden",
    padding: 4,
}));

const TextSlot: React.FC<TextSlotOwnProps> = (props) => {
    const theme = useTheme();
    const { slot, ref, className, ...other } = useThemeProps({ name: "TextSlot", props });
    const [text, setText] = React.useState<React.ReactNode | null>(null);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const slotContext: SlotFactoryContext = React.useMemo(() => ({ theme, refresh: refreshSlot }), [theme, refreshSlot]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setRefresh(prev => prev + 1n);
            }
        });
        slot?.onMount?.(slotContext);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(slotContext);
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
            slot?.onShow?.(slotContext);
        } else {
            slot?.onHide?.(slotContext);
        }
    }, [rootVisible]);

    React.useEffect(() => {
        setText(resolveReactNodeFactory(slot.text, slotContext) ?? "");
    }, [slot.text, refresh]);

    const isSimpleText = ["string", "number", "boolean"].includes(typeof text);

    return (
        <StyledTextSlot
            ref={rootRef}
            maxLines={slot.maxLines}
            className={`TextSlot-root ${className ?? ""}`}
            {...other}
        >
            {isSimpleText ? (
                <Typography variant="body2">{text}</Typography>
            ) : (
                text
            )}
        </StyledTextSlot>
    );
};

export default TextSlot;