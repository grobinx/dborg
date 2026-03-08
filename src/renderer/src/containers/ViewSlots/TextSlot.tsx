import React from "react";
import { Box, Typography, styled, useThemeProps } from "@mui/material";
import { ITextSlot, resolveValue } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { uuidv7 } from "uuidv7";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";

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
    const { slot, ref, className, ...other } = useThemeProps({ name: "TextSlot", props });
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const [text, setText] = React.useState<React.ReactNode | null>(null);
    const [style, setStyle] = React.useState<React.CSSProperties | undefined>(undefined);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh } = useViewSlot();
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const runtimeContext = useSlotRuntimeContext({});

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setRefresh(prev => prev + 1n);
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
        setText(resolveValue(slot.text, runtimeContext) ?? "");
        setStyle(resolveValue(slot.style, runtimeContext));
    }, [slot.text, slot.style, refresh]);

    const isSimpleText = ["string", "number", "boolean"].includes(typeof text);

    return (
        <StyledTextSlot
            ref={rootRef}
            maxLines={slot.maxLines}
            className={`TextSlot-root ${className ?? ""}`}
            style={style}
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