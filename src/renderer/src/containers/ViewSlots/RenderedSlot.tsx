import React from "react";
import { Box, styled, useThemeProps } from "@mui/material";
import { IRenderedSlot } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";

interface RenderedSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface RenderedSlotOwnProps extends RenderedSlotProps {
    slot: IRenderedSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const StyledRenderedSlotBox = styled(Box)({
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
});

const RenderedSlot: React.FC<RenderedSlotOwnProps> = (props) => {
    const { slot, ref, className, ...other } = useThemeProps({ name: "RenderedSlot", props });
    const [refresh, setRefresh] = React.useState(0);
    const { registerRefresh, refreshSlot } = useRefreshSlot();

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => prev + 1);
        });
        return unregisterRefresh;
    }, [slot.id]);

    return (
        <StyledRenderedSlotBox
            ref={ref}
            key={`${slot.id}-${refresh}`}
            className={`RenderedSlot-root ${className ?? ""}`}
            {...other}
        >
            <slot.render />
        </StyledRenderedSlotBox>
    );
};

export default RenderedSlot;