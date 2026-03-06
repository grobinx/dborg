import React from "react";
import { useThemeProps } from "@mui/material/styles";
import { IBannerSlot, resolveBooleanFactory, resolveReactNodeFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { uuidv7 } from "uuidv7";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";
import Banner, { BannerSeverity } from "@renderer/components/Banner";
import { resolveIcon } from "@renderer/themes/icons";
import { Box, useTheme } from "@mui/material";

interface BannerSlotProps {
    slot: IBannerSlot;
}

interface BannerSlotOwnProps extends BannerSlotProps {
    ref?: React.Ref<HTMLDivElement>;
}

const BannerSlot: React.FC<BannerSlotOwnProps> = (props) => {
    const { slot, ref } = props;
    const theme = useTheme();
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh } = useViewSlot();
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const runtimeContext = useSlotRuntimeContext({});

    const [title, setTitle] = React.useState<React.ReactNode>(null);
    const [text, setText] = React.useState<React.ReactNode>(null);
    const [closeable, setCloseable] = React.useState<boolean>(true);
    const [severity, setSeverity] = React.useState<BannerSeverity>("info");
    const [icon, setIcon] = React.useState<React.ReactNode | false | undefined>(undefined);
    const [opened, setOpened] = React.useState<boolean | undefined>(undefined);

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
        setTitle(resolveReactNodeFactory(slot.title, runtimeContext));
        setText(resolveReactNodeFactory(slot.text, runtimeContext));
        setCloseable(resolveBooleanFactory(slot.closeable, runtimeContext) ?? true);
        setSeverity(slot.severity ?? "info");
        setOpened(resolveBooleanFactory(slot.opened, runtimeContext));
        setIcon(resolveIcon(theme, slot.icon));
    }, [slot.title, slot.text, slot.closeable, slot.severity, slot.icon, slot.opened, refresh]);

    const handleClose = React.useCallback((_event?: React.SyntheticEvent) => {
        slot?.onClose?.(runtimeContext);
    }, [slot, runtimeContext]);

    return (
        <Box ref={rootRef} sx={{ width: "100%" }}>
            <Banner
                title={title}
                severity={severity}
                closeable={closeable}
                onClose={handleClose}
                icon={icon}
                open={opened}
                ref={ref}
            >
                {text}
            </Banner>
        </Box>
    );
};

export default BannerSlot;