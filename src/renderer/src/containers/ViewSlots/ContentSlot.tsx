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
import { createContentComponent, createProgressBarContent, createTextContent, createTitleContent } from "./helpers";
import { useMessages } from "@renderer/contexts/MessageContext";
import { TAB_PANEL_CHANGED, TabPanelChangedMessage } from "@renderer/app/Messages";
import { useVisibleState } from "@renderer/hooks/useVisibleState";

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
    const [progressBar, setProgressBar] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (redraw) => {
            if (redraw === "only") {
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
        if (slot.progress) {
            setProgressBar(prev => ({
                ...prev,
                node: createProgressBarContent(slot.progress!, refreshSlot, prev.ref, true)
            }));
        }
        setMainSlot(prev => ({
            ...prev,
            node: createContentComponent(slot.main, refreshSlot, prev.ref)
        }));
    }, [slot.title, slot.main, slot.text, refresh]);

    console.debug("ContentSlot rendering slot:", slot.id);

    return (
        <StyledContentSlot
            ref={rootRef}
            className={`ContentSlot-root ${className ?? ""}`}
            sx={{ position: "relative", }}
            {...other}
        >
            {progressBar.node}
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
                ref={ref}
            >
                {mainSlot.node}
            </Box>
            {(textSlot.node != null) && textSlot.node}
        </StyledContentSlot>
    );
};

export default ContentSlot;