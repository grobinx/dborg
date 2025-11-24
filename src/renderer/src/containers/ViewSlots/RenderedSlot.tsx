import React from "react";
import { Box, styled } from "@mui/material";
import { IRenderedSlot } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";

interface RenderedSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface RenderedSlotOwnProps extends RenderedSlotProps {
    slot: IRenderedSlot;
    ref?: React.Ref<HTMLDivElement>;
    tabsItemID?: string;
}

const StyledRenderedSlotBox = styled(Box)({
    width: "100%",
    height: "100%",
});

const RenderedSlot: React.FC<RenderedSlotOwnProps> = (props) => {
    const { slot, ref, className, tabsItemID, ...other } = props;
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
            <slot.render refresh={refreshSlot} />
        </StyledRenderedSlotBox>
    );
};

export default RenderedSlot;