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
    isDialogEditorField,
    isDialogTabs,
    resolveDialogTabsFactory,
    resolveDialogConformLabelsFactory,
    DialogConformLabel,
    resolveBooleanFactory,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { DialogLayoutItem } from "./dialog/DialogLayoutItem";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { useTranslation } from "react-i18next";
import { uuidv7 } from "uuidv7";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";
import { resolve } from "path";
import { ThemeColor } from "@renderer/types/colors";

interface DialogSlotProps {
    slot: IDialogSlot;
    open?: boolean;
    params?: Record<string, any>;
    onClose?: (structure: Record<string, any> | null) => void;
}

const applyDefaults = (
    items: DialogLayoutItemKind[] | undefined,
    structure: Record<string, any>,
    target: Record<string, any>,
): Record<string, any> => {
    if (!items || items.length === 0) {
        return {};
    }

    items.forEach(item => {
        if (isDialogTextField(item) || isDialogNumberField(item) || isDialogBooleanField(item) ||
            isDialogSelectField(item) || isDialogEditorField(item)) {
            if (target[item.key] === undefined && item.defaultValue !== undefined) {
                target[item.key] = item.defaultValue;
            }
        } else if (isDialogRow(item) || isDialogColumn(item)) {
            const nested = resolveDialogLayoutItemsKindFactory(item.items, structure) ?? [];
            applyDefaults(nested, structure, target);
        } else if (isDialogTabs(item)) {
            const tabs = resolveDialogTabsFactory(item.tabs, structure) ?? [];
            tabs.forEach(tab => {
                const tabItems = resolveDialogLayoutItemsKindFactory(tab.items, structure) ?? [];
                applyDefaults(tabItems, structure, target);
            });
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
    const addToast = useToast();
    const { confirm } = useDialogs();
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const { registerRefresh, refreshSlot, openDialog } = useViewSlot();
    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({
        theme, refresh: refreshSlot, openDialog,
        showNotification: ({ message, severity = "info" }) => {
            addToast(severity, message);
        },
        showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
            return confirm(message, { title, severity, okText: confirmLabel, cancelText: cancelLabel });
        },
    }), [theme, refreshSlot, openDialog, addToast, confirm]);

    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [items, setItems] = React.useState<DialogLayoutItemKind[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [structure, setStructure] = React.useState<Record<string, any>>({});
    const [, forceRender] = React.useState<bigint>(0n);
    const [dialogRef, dialogVisible] = useVisibleState<HTMLDivElement>();
    const invalidFields = React.useRef<Set<string>>(new Set());
    const [dialogValid, setDialogValid] = React.useState(false);

    const openSeq = React.useRef(0);
    const onOpenRanForSeq = React.useRef<number | null>(null);
    const [structureInitSeq, setStructureInitSeq] = React.useState(0);
    const [itemsResolvedSeq, setItemsResolvedSeq] = React.useState(0);

    React.useEffect(() => {
        if (open) {
            openSeq.current += 1;
            onOpenRanForSeq.current = null;
        } else {
            onOpenRanForSeq.current = null;
        }
    }, [open]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (redraw) => {
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
    }, [slotId, runtimeContext, registerRefresh]);

    React.useEffect(() => {
        if (!open) return;

        const next = params ?? applyDefaults(items, structure, {});
        setStructure(next);
        setStructureInitSeq(openSeq.current);
    }, [open, items, params]);

    React.useEffect(() => {
        const resolvedItems = resolveDialogLayoutItemsKindFactory(slot.items, structure) ?? [];
        setItems(resolvedItems);

        if (open) {
            setItemsResolvedSeq(openSeq.current);
        }
    }, [slotId, slot.items, refresh, structure, open]);

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

    React.useEffect(() => {
        if (!open) return;
        if (!slot.onOpen) return;

        const seq = openSeq.current;
        if (onOpenRanForSeq.current === seq) return;

        // Wait until both structure defaults/params AND items are resolved for this open cycle
        if (structureInitSeq !== seq) return;
        if (itemsResolvedSeq !== seq) return;

        // onOpen is allowed to mutate structure; pass a shallow copy to avoid in-place state mutation bugs
        const next = { ...structure };
        slot.onOpen(next);
        setStructure(next);

        onOpenRanForSeq.current = seq;
    }, [open, slot, structure, structureInitSeq, itemsResolvedSeq]);

    const handleConfirm = async (confirmId: string) => {
        const validationError = slot.onValidate?.(structure);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            await slot.onConfirm?.(structure, confirmId);
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

    const title = resolveStringFactory(slot.title, structure);
    const resolvedLabels: (DialogConformLabel & { handle?: () => void })[] = resolveDialogConformLabelsFactory(slot.labels, structure) ?? [];
    let labels: ({ id: string; label: string; color?: ThemeColor; disabled?: boolean; handle: () => void })[]; 

    if (!resolvedLabels || resolvedLabels.length === 0) {
        labels = [{
            id: "cancel",
            label: resolveStringFactory(slot.cancelLabel, structure) ?? t("cancel", "Cancel"),
            color: "secondary",
            disabled: submitting,
            handle: handleCancel,
        }, {
            id: "ok",
            label: resolveStringFactory(slot.confirmLabel, structure) ?? t("ok", "OK"),
            color: "primary",
            disabled: submitting || !dialogValid,
            handle: () => handleConfirm("ok"),
        }];
    } else {
        labels = resolvedLabels.map(label => {
            let handle: () => void;
            let disabled: boolean | undefined;
            const labelText = resolveStringFactory(label.label, structure)!;
            if (label.id === "cancel") {
                handle = handleCancel;
                disabled = submitting;
            } else {
                handle = () => handleConfirm(label.id);
                disabled = submitting || !dialogValid || resolveBooleanFactory(label.disabled, structure) === true;
            }
            return { id: label.id, handle: handle, disabled, label: labelText, color: label.color};
        });
    }

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
            slotProps={{
                paper: {
                    sx: {
                        ...(slot.height ? { height: slot.height } : {}),
                    }
                }
            }}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent dividers>
                <Stack gap={8} sx={{ height: "100%" }}>
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
                {labels.map(label => (
                    <Button
                        key={label.id}
                        color={label.color}
                        onClick={label.handle}
                        disabled={label.disabled}
                    >
                        {label.label}
                    </Button>
                ))}
            </DialogActions>
        </Dialog>
    );
};

export default DialogSlot;
