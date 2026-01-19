import React from "react";
import { Alert, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Button } from "@renderer/components/buttons/Button";
import {
    IDialogSlot,
    DialogLayoutItemKind,
    SlotRuntimeContext,
    resolveDialogLayoutItemsKindFactory,
    resolveStringFactory,
    isDialogRow,
    isDialogColumn,
    isDialogTextField,
    isDialogNumberField,
    isDialogBooleanField,
    isDialogSelectField,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { DialogLayoutItem } from "./dialog/DialogLayoutItem";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { useTranslation } from "react-i18next";

interface DialogSlotProps {
    slot: IDialogSlot;
    open?: boolean;
    params?: Record<string, any>;
    onClose?: (structure: Record<string, any> | null) => void;
}

const applyDefaults = (
    items: DialogLayoutItemKind[] | undefined,
    runtimeContext: SlotRuntimeContext,
    target: Record<string, any>,
): Record<string, any> => {
    if (!items || items.length === 0) {
        return {};
    }

    items.forEach(item => {
        if (isDialogTextField(item) || isDialogNumberField(item) || isDialogBooleanField(item) || isDialogSelectField(item)) {
            if (target[item.key] === undefined && item.defaultValue !== undefined) {
                target[item.key] = item.defaultValue;
            }
        } else if (isDialogRow(item) || isDialogColumn(item)) {
            const nested = resolveDialogLayoutItemsKindFactory(item.items, runtimeContext) ?? [];
            applyDefaults(nested, runtimeContext, target);
        }
    });
    return target;
};

const DialogSlot: React.FC<DialogSlotProps> = (props) => {
    const {
        slot,
        open = true,
        params,
        onClose,
    } = props;

    const theme = useTheme();
    const { t } = useTranslation();
    const { registerRefresh, refreshSlot, openDialog } = useViewSlot();
    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({ theme, refresh: refreshSlot, openDialog }), [theme, refreshSlot, openDialog]);

    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [items, setItems] = React.useState<DialogLayoutItemKind[]>(resolveDialogLayoutItemsKindFactory(slot.items, runtimeContext) ?? []);
    const [error, setError] = React.useState<string | null>(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [structure, setStructure] = React.useState<Record<string, any>>(params ?? applyDefaults(items, runtimeContext, {}));
    const [, forceRender] = React.useState<bigint>(0n);
    const [dialogRef, dialogVisible] = useVisibleState<HTMLDivElement>();
    const invalidFields = React.useRef<Set<string>>(new Set());
    const [dialogValid, setDialogValid] = React.useState(false);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (redraw) => {
            if (redraw === "only") {
                forceRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        slot?.onMount?.(runtimeContext);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(runtimeContext);
        };
    }, [slot.id, runtimeContext, registerRefresh]);

    React.useEffect(() => {
        const resolved = resolveDialogLayoutItemsKindFactory(slot.items, runtimeContext) ?? [];
        setItems(resolved);
    }, [slot.id, slot.items, refresh, runtimeContext]);

    React.useEffect(() => {
        if (dialogVisible && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [dialogVisible, pendingRefresh]);

    React.useEffect(() => {
        if (dialogVisible) {
            slot?.onShow?.(runtimeContext);
        } else {
            slot?.onHide?.(runtimeContext);
        }
    }, [dialogVisible]);

    const handleConfirm = async () => {
        const validationError = slot.onValidate?.(structure);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            await slot.onConfirm?.(structure);
            onClose?.(structure);
        } catch (err: any) {
            setError(err?.message ?? String(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        slot.onCancel?.();
        onClose?.(null);
    };

    const title = resolveStringFactory(slot.title, runtimeContext);
    const confirmLabel = resolveStringFactory(slot.confirmLabel, runtimeContext) ?? t("ok", "OK");
    const cancelLabel = resolveStringFactory(slot.cancelLabel, runtimeContext) ?? t("cancel", "Cancel");
    const size = slot.size ?? "small";
    const maxWidth: "xs" | "sm" | "md" | "lg" | "xl" =
        size === "small" ? "sm" :
            size === "large" ? "lg" :
                size === "full" ? "xl" :
                    "md";
    const fullScreen = size === "full";

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            fullWidth
            maxWidth={maxWidth}
            fullScreen={fullScreen}
            ref={dialogRef}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent dividers>
                <Stack gap={8}>
                    {error && (
                        <Alert severity="error">{error}</Alert>
                    )}
                    {items.map((item, index) => (
                        <DialogLayoutItem
                            key={index}
                            item={item}
                            runtimeContext={runtimeContext}
                            structure={structure}
                            onChange={(structure) => {
                                slot.onChange?.(structure);
                                setStructure(structure);
                                setError(null);
                            }}
                            invalidFields={invalidFields.current}
                            onValidityChange={() => {
                                const isValid = invalidFields.current.size === 0;
                                setDialogValid(isValid);
                            }}
                        />
                    ))}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button color="secondary" onClick={handleCancel} disabled={submitting}>
                    {cancelLabel}
                </Button>
                <Button color="primary" onClick={handleConfirm} disabled={submitting || !dialogValid}>
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DialogSlot;
