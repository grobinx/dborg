import React from "react";
import { Box, Typography, styled, useThemeProps } from "@mui/material";
import { TextConnectionViewSlot } from "plugins/manager/renderer/Plugin";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";

interface ConnectionTextViewSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface ConnectionTextViewSlotOwnProps extends ConnectionTextViewSlotProps {
    slot: TextConnectionViewSlot;
    session: IDatabaseSession;
    ref?: React.Ref<HTMLDivElement>;
}

// Stylowany Box
const StyledTextViewBox = styled(Box)({
    maxHeight: "calc(3 * 1.5em)",
    overflow: "auto",
});

const ConnectionTextViewSlot: React.FC<ConnectionTextViewSlotOwnProps> = (props) => {
    const { slot, session, ref, ...other } = useThemeProps({ name: "ConnectionTextViewSlot", props });
    const content = typeof slot.content === "function" ? slot.content() : slot.content;

    return (
        <StyledTextViewBox ref={ref} {...other}>
            <Typography variant="body2">{content}</Typography>
        </StyledTextViewBox>
    );
};

export default ConnectionTextViewSlot;