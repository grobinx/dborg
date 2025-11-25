import React from "react";
import { Box, Typography, styled, useThemeProps } from "@mui/material";
import { ITextSlot, resolveReactNodeFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";

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
    maxHeight: `calc(${maxLines ?? 3} * 1.4em)`,
    overflow: "auto",
    padding: 4,
}));

const TextSlot: React.FC<TextSlotOwnProps> = (props) => {
    const { slot, ref, className, ...other } = useThemeProps({ name: "TextSlot", props });
    const [text, setText] = React.useState<React.ReactNode | null>(null);
    const [refresh, setRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();

    React.useEffect(() => {
        slot?.onMount?.(refreshSlot);
        return () => {
            slot?.onUnmount?.();
        };
    }, [slot]);

    React.useEffect(() => {
        setText(resolveReactNodeFactory(slot.text, refreshSlot) ?? "");
    }, [slot.text, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

    const isSimpleText = ["string", "number", "boolean"].includes(typeof text);

    return (
        <StyledTextSlot
            ref={ref}
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