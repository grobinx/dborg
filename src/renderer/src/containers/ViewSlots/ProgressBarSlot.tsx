import React from "react";
import { Box, LinearProgress, Typography, useTheme } from "@mui/material";
import { styled, useThemeProps } from "@mui/material/styles";
import { IProgressBarSlot, resolveBooleanFactory, resolveNumberFactory, resolveStringFactory, SlotFactoryContext } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { ThemeColor } from "@renderer/types/colors";
import { resolveColor } from "@renderer/utils/colors";

interface ProgressBarSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface ProgressBarSlotOwnProps extends ProgressBarSlotProps {
    slot: IProgressBarSlot;
    ref?: React.Ref<HTMLDivElement>;
    absolute?: boolean;
}

const StyledProgressBarSlot = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: theme.spacing(0.5),
    padding: 0,
}));

const ProgressContainer = styled(Box)({
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: 8,
});

const ProgressBarSlot: React.FC<ProgressBarSlotOwnProps> = (props) => {
    const { slot, ref, className, absolute: absoluteInit, ...other } = useThemeProps({ name: "ProgressBarSlot", props });
    const theme = useTheme();
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [display, setDisplay] = React.useState<boolean>(false);
    const [showPercent, setShowPercent] = React.useState<boolean>(false);
    const [value, setValue] = React.useState<number | null>(null);
    const [bufferValue, setBufferValue] = React.useState<number | null>(null);
    const [label, setLabel] = React.useState<string | undefined>(undefined);
    const [color, setColor] = React.useState<string | undefined>(undefined);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const slotContext: SlotFactoryContext = React.useMemo(() => ({ theme, refresh: refreshSlot }), [theme, refreshSlot]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
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
        const resolvedValue = resolveNumberFactory(slot.value, slotContext);
        const resolvedBufferValue = resolveNumberFactory(slot.bufferValue, slotContext);
        const resolvedLabel = resolveStringFactory(slot.label, slotContext);
        const resolvedShowPercent = resolveBooleanFactory(slot.showPercent, slotContext) ?? false;
        const resolvedColor = slot.color ? slot.color : "primary";

        setColor(resolvedColor);
        setValue(resolvedValue ?? null);
        setBufferValue(resolvedBufferValue ?? null);
        setLabel(resolvedLabel);
        setShowPercent(resolvedShowPercent);

        // Resolve display logic
        const displayFactory = slot.display ?? "auto";
        if (displayFactory === "auto") {
            setDisplay(resolvedValue !== null && resolvedValue !== undefined);
        } else {
            const resolvedDisplay = resolveBooleanFactory(displayFactory, slotContext) ?? false;
            setDisplay(resolvedDisplay);
        }
    }, [slot.id, refresh]);

    const variant = value === null || value === undefined ? "indeterminate" : "determinate";
    const progressValue = value ?? 0;
    const progressBufferValue = bufferValue ?? undefined;
    const absolute = absoluteInit && !label && !showPercent;

    return (
        <StyledProgressBarSlot
            ref={rootRef}
            className={`ProgressBarSlot-root ${className ?? ""}`}
            sx={{ position: absolute ? "absolute" : "relative", top: absolute ? 0 : undefined, zIndex: absolute ? 1000 : undefined }}
            {...other}
        >
            {display && (
                <>
                    {label && (
                        <Typography variant="caption" color="text.secondary">
                            {label}
                        </Typography>
                    )}
                    <ProgressContainer>
                        <LinearProgress
                            variant={variant}
                            value={progressValue}
                            valueBuffer={progressBufferValue}
                            sx={{ flexGrow: 1, height: 3, borderRadius: 1 }}
                            color={color as any}
                        />
                        {showPercent && value !== null && (
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45, textAlign: "right" }}>
                                {`${Math.round(value)}%`}
                            </Typography>
                        )}
                    </ProgressContainer>
                </>
            )}
        </StyledProgressBarSlot>
    );
};

export default ProgressBarSlot;