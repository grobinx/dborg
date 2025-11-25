import React from "react";
import { AppBar, Box, useTheme } from "@mui/material";
import { styled, useThemeProps } from "@mui/material/styles";
import {
    IContentSlot
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import TitleSlot from "./TitleSlot";
import TextSlot from "./TextSlot";
import GridSlot from "./GridSlot";
import RenderedSlot from "./RenderedSlot";
import { createContentComponent, createTextContent, createTitleContent } from "./helpers";
import { useMessages } from "@renderer/contexts/MessageContext";
import { TAB_PANEL_CHANGED, TabPanelChangedMessage } from "@renderer/app/Messages";

interface ContentSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface ContentSlotOwnProps extends ContentSlotProps {
    slot: IContentSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const StyledContentSlot = styled(Box)(() => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
}));

const ContentSlot: React.FC<ContentSlotOwnProps> = (props) => {
    const { slot, ref, className, ...other } = useThemeProps({ name: "ContentSlot", props });
    const [titleSlot, setTitleSlot] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [textSlot, setTextSlot] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [mainSlot, setMainSlot] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [refresh, setRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();

    React.useEffect(() => {
        slot?.onMount?.(refreshSlot);
        return () => {
            slot?.onUnmount?.();
        };
    }, [slot]);

    React.useEffect(() => {
        console.debug("ContentSlot updating content for slot:", slot.id);
        if (slot.title) {
            setTitleSlot(prev => ({
                ...prev,
                node: createTitleContent(slot.title!, refreshSlot, prev.ref)
            }));
        }
        if (slot.text) {
            setTextSlot(prev => ({
                ...prev,
                node: createTextContent(slot.text!, refreshSlot, prev.ref)
            }));
        }
        setMainSlot(prev => ({
            ...prev,
            node: createContentComponent(slot.main, refreshSlot, prev.ref)
        }));
    }, [slot.title, slot.main, slot.text, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

    console.debug("ContentSlot rendering slot:", slot.id);

    return (
        <StyledContentSlot
            ref={ref}
            className={`ContentSlot-root ${className ?? ""}`}
            {...other}
        >
            {(titleSlot.node != null) && (
                <AppBar position="static" sx={{ flexDirection: "row", zIndex: 10 }}>
                    {titleSlot.node}
                </AppBar>
            )}
            <Box
                key={slot.id + "-" + "inner-box"}
                sx={{
                    width: "100%",
                    flex: 1,
                    minHeight: 0,
                    height: "100%",
                }}
                className={"ContentSlot-main-root"}
            >
                {mainSlot.node}
            </Box>
            {(textSlot.node != null) && textSlot.node}
        </StyledContentSlot>
    );
};

export default ContentSlot;