import React from "react";
import { Alert, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { Button } from "@renderer/components/buttons/Button";
import {
    IDialogStandalone,
    DialogLayoutItemKind,
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
    resolveDialogConformButtonsFactory,
    DialogConformButton,
    resolveBooleanFactory,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import { DialogLayoutItem } from "./DialogLayoutItem";
import { useTranslation } from "react-i18next";
import { ThemeColor } from "@renderer/types/colors";

interface DialogBaseProps {
    dialog: IDialogStandalone;
    open?: boolean;
    params?: Record<string, any>;
    onClose?: (structure: Record<string, any> | null) => void;
    handleRefresh?: () => void;
    ref?: React.Ref<HTMLDivElement>;
    refresh?: bigint;
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

export const DialogBase: React.FC<DialogBaseProps> = (props) => {
    const {
        dialog,
        open = true,
        params,
        onClose,
        handleRefresh,
        ref,
        refresh,
    } = props;

    const { t } = useTranslation();
    const [items, setItems] = React.useState<DialogLayoutItemKind[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [structure, setStructure] = React.useState<Record<string, any>>({});
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
        if (!open) return;

        const next = params ?? applyDefaults(items, structure, {});
        setStructure(next);
        setStructureInitSeq(openSeq.current);
    }, [open, items, params]);

    React.useEffect(() => {
        const resolvedItems = resolveDialogLayoutItemsKindFactory(dialog.items, structure) ?? [];
        setItems(resolvedItems);

        if (open) {
            setItemsResolvedSeq(openSeq.current);
        }
    }, [dialog.items, refresh, open]);

    React.useEffect(() => {
        if (!open) return;
        if (!dialog.onOpen) return;

        const seq = openSeq.current;
        if (onOpenRanForSeq.current === seq) return;

        // Wait until both structure defaults/params AND items are resolved for this open cycle
        if (structureInitSeq !== seq) return;
        if (itemsResolvedSeq !== seq) return;

        // onOpen is allowed to mutate structure; pass a shallow copy to avoid in-place state mutation bugs
        const next = { ...structure };
        dialog.onOpen(next);
        setStructure(next);

        onOpenRanForSeq.current = seq;
    }, [open, dialog, structure, structureInitSeq, itemsResolvedSeq]);

    React.useEffect(() => {
        if (handleRefresh) {
            handleRefresh();
        }
    }, [handleRefresh]);

    const handleConfirm = async (confirmId: string) => {
        const validationError = dialog.onValidate?.(structure);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            await dialog.onConfirm?.(structure, confirmId);
            onClose?.(structure);
        } catch (err: any) {
            setError(err?.message ?? String(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        dialog.onCancel?.();
        onClose?.(null);
    };

    const title = resolveStringFactory(dialog.title, structure);
    const resolvedButtons: (DialogConformButton & { handle?: () => void })[] = resolveDialogConformButtonsFactory(dialog.buttons, structure) ?? [];
    let buttons: ({ id: string; label: string; color?: ThemeColor; disabled?: boolean; handle: () => void })[]; 

    if (!resolvedButtons || resolvedButtons.length === 0) {
        buttons = [{
            id: "cancel",
            label: resolveStringFactory(dialog.cancelLabel, structure) ?? t("cancel", "Cancel"),
            color: "secondary",
            disabled: submitting,
            handle: handleCancel,
        }, {
            id: "ok",
            label: resolveStringFactory(dialog.confirmLabel, structure) ?? t("ok", "OK"),
            color: "primary",
            disabled: submitting || !dialogValid,
            handle: () => handleConfirm("ok"),
        }];
    } else {
        buttons = resolvedButtons.map(button => {
            let handle: () => void;
            let disabled: boolean | undefined;
            const labelText = resolveStringFactory(button.label, structure)!;
            if (button.id === "cancel") {
                handle = handleCancel;
                disabled = submitting;
            } else {
                handle = () => handleConfirm(button.id);
                disabled = submitting || !dialogValid || resolveBooleanFactory(button.disabled, structure) === true;
            }
            return { id: button.id, handle: handle, disabled, label: labelText, color: button.color};
        });
    }

    const size = dialog.size ?? "small";
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
            ref={ref}
            slotProps={{
                paper: {
                    sx: {
                        ...(dialog.height ? { height: dialog.height } : {}),
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
                            structure={structure}
                            onChange={(structure) => {
                                console.log('DialogLayoutItem onChange', structure);
                                dialog.onChange?.(structure);
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
                {buttons.map(button => (
                    <Button
                        key={button.id}
                        color={button.color}
                        onClick={button.handle}
                        disabled={button.disabled}
                    >
                        {button.label}
                    </Button>
                ))}
            </DialogActions>
        </Dialog>
    );
};
