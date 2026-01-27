import React from "react";
import { Box, LinearProgress, Typography, useTheme } from "@mui/material";
import { styled, useThemeProps } from "@mui/material/styles";
import { IProgressBarSlot, resolveBooleanFactory, resolveNumberFactory, resolveStringFactory, SlotRuntimeContext } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { ThemeColor } from "@renderer/types/colors";
import { resolveColor } from "@renderer/utils/colors";
import { uuidv7 } from "uuidv7";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";

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
    const addToast = useToast();
    const { confirm } = useDialogs();
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [display, setDisplay] = React.useState<boolean>(false);
    const [showPercent, setShowPercent] = React.useState<boolean>(false);
    const [value, setValue] = React.useState<number | null>(null);
    const [bufferValue, setBufferValue] = React.useState<number | null>(null);
    const [label, setLabel] = React.useState<string | undefined>(undefined);
    const [color, setColor] = React.useState<string | undefined>(undefined);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot, openDialog } = useViewSlot();
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({
        theme, refresh: refreshSlot, openDialog,
        showNotification: ({ message, severity = "info" }) => {
            addToast(severity, message);
        },
        showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
            return confirm(message, { title, severity, okText: confirmLabel, cancelText: cancelLabel });
        },
    }), [theme, refreshSlot, openDialog, addToast, confirm]);

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
        const resolvedValue = resolveNumberFactory(slot.value, runtimeContext);
        const resolvedBufferValue = resolveNumberFactory(slot.bufferValue, runtimeContext);
        const resolvedLabel = resolveStringFactory(slot.label, runtimeContext);
        const resolvedShowPercent = resolveBooleanFactory(slot.showPercent, runtimeContext) ?? false;
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
            const resolvedDisplay = resolveBooleanFactory(displayFactory, runtimeContext) ?? false;
            setDisplay(resolvedDisplay);
        }
    }, [slotId, refresh]);

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