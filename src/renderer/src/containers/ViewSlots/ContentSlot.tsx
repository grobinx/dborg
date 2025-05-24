import React from "react";
import { Box, useTheme } from "@mui/material";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import { styled } from "@mui/material/styles";
import { 
    IContentSlot, 
    resolveContentSlotKindFactory, 
    resolveTextSlotKindFactory, 
    resolveTitleSlotKindFactory 
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import TitleSlot from "./TitleSlot";
import TextSlot from "./TextSlot";
import GridSlot from "./GridSlot";

const StyledContentSlot = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
}));

interface ContentSlotProps {
    slot: IContentSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const ContentSlot: React.FC<ContentSlotProps> = ({
    slot, ref
}) => {
    const theme = useTheme();
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
        dataGridRef?: React.RefObject<DataGridActionContext<any> | null>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null, dataGridRef: React.createRef<DataGridActionContext<any> | null>() });
    const [refresh, setRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const [minusHeight, setMinusHeight] = React.useState<number | null>(null);

    React.useEffect(() => {
        const resolvedTitleSlot = resolveTitleSlotKindFactory(slot.title, refreshSlot);
        if (resolvedTitleSlot) {
            if (resolvedTitleSlot.type === "title") {
                setTitleSlot(prev => ({
                    ...prev,
                    node: <TitleSlot slot={resolvedTitleSlot} ref={prev.ref} dataGridRef={mainSlot.dataGridRef} />
                }));
            } else {
                setTitleSlot(prev => ({ ...prev, node: null }));
            }
        } else {
            setTitleSlot(prev => ({ ...prev, node: null }));
        }
        const resolvedTextSlot = resolveTextSlotKindFactory(slot.text, refreshSlot) ?? null;
        if (resolvedTextSlot) {
            if (resolvedTextSlot.type === "text") {
                setTextSlot(prev => ({
                    ...prev,
                    node: <TextSlot slot={resolvedTextSlot} ref={prev.ref} />
                }));
            } else {
                setTextSlot(prev => ({ ...prev, node: null }));
            }
        } else {
            setTextSlot(prev => ({ ...prev, node: null }));
        }
        const resolvedMainSlot = resolveContentSlotKindFactory(slot.main, refreshSlot);
        if (resolvedMainSlot) {
            if (resolvedMainSlot.type === "grid") {
                setMainSlot(prev => ({
                    ...prev,
                    node: <GridSlot slot={resolvedMainSlot} ref={prev.ref} dataGridRef={prev.dataGridRef} />
                }));
            } else {
                setMainSlot(prev => ({ ...prev, node: null }));
            }
        } else {
            setMainSlot(prev => ({ ...prev, node: null }));
        }
    }, [slot.title, slot.main, slot.text, refresh]);

    React.useEffect(() => {
        const unregister = registerRefresh(slot.id, () => {
            setTimeout(() => {
                setRefresh(prev => !prev);
            }, 0);
        });
        return unregister;
    }, [slot.id]);

    React.useEffect(() => {
        // Funkcja pomocnicza do pobrania wysokości elementu po ref
        const getHeight = (ref: React.Ref<HTMLDivElement>) => {
            if (ref && typeof ref === "object" && "current" in ref && ref.current) {
                return ref.current.offsetHeight || 0;
            }
            return 0;
        };

        // Oblicz wysokość titleSlot i textSlot
        const titleHeight = getHeight(titleSlot.ref);
        const textHeight = getHeight(textSlot.ref);

        setMinusHeight(titleHeight + textHeight);
    }, [titleSlot.node, textSlot.node]);

    return (
        <StyledContentSlot ref={ref} key={slot.id}>
            {titleSlot.node}
            <Box
                sx={{
                    width: "100%",
                    flex: 1,
                    minHeight: 0,
                    height: `calc(100% - ${minusHeight}px)`,
                }}
            >
                {mainSlot.node}
            </Box>
            {textSlot.node}
        </StyledContentSlot>
    );
};

export default ContentSlot;