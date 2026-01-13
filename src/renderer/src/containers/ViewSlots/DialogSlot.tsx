import React from "react";
import { Alert, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Button } from "@renderer/components/buttons/Button";
import {
	IDialogSlot,
	DialogLayoutItemKind,
	SlotFactoryContext,
	resolveDialogLayoutItemsKindFactory,
	resolveStringFactory,
	isDialogRow,
	isDialogColumn,
	isDialogTextField,
	isDialogNumberField,
	isDialogBooleanField,
	isDialogSelectField,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { DialogLayoutItem } from "./dialog/DialogLayoutItem";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { useTranslation } from "react-i18next";

interface DialogSlotProps {
	slot: IDialogSlot;
	open?: boolean;
	onClose?: () => void;
}

const applyDefaults = (
	items: DialogLayoutItemKind[] | undefined,
	slotContext: SlotFactoryContext,
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
			const nested = resolveDialogLayoutItemsKindFactory(item.items, slotContext) ?? [];
			applyDefaults(nested, slotContext, target);
		}
	});
	return target;
};

const DialogSlot: React.FC<DialogSlotProps> = (props) => {
	const {
		slot,
		open = true,
		onClose,
	} = props;

	const theme = useTheme();
	const { t } = useTranslation();
	const { registerRefresh, refreshSlot } = useRefreshSlot();
	const slotContext: SlotFactoryContext = React.useMemo(() => ({ theme, refresh: refreshSlot }), [theme, refreshSlot]);

	const [refresh, setRefresh] = React.useState<bigint>(0n);
	const [pendingRefresh, setPendingRefresh] = React.useState(false);
	const [items, setItems] = React.useState<DialogLayoutItemKind[]>(resolveDialogLayoutItemsKindFactory(slot.items, slotContext) ?? []);
	const [error, setError] = React.useState<string | null>(null);
	const [submitting, setSubmitting] = React.useState(false);
	const structureRef = React.useRef<Record<string, any>>(applyDefaults(items, slotContext, {}));
	const [, forceRender] = React.useState<bigint>(0n);
	const [dialogRef, dialogVisible] = useVisibleState<HTMLDivElement>();

	React.useEffect(() => {
		const unregister = registerRefresh(slot.id, (redraw) => {
            if (redraw === "only") {
                forceRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
		});
		slot?.onMount?.(slotContext);
		return () => {
			unregister();
			slot?.onUnmount?.(slotContext);
		};
	}, [slot.id, slotContext, registerRefresh]);

	React.useEffect(() => {
		const resolved = resolveDialogLayoutItemsKindFactory(slot.items, slotContext) ?? [];
		setItems(resolved);
	}, [slot.id, slot.items, refresh, slotContext]);

	React.useEffect(() => {
		if (dialogVisible && pendingRefresh) {
			setRefresh(prev => prev + 1n);
			setPendingRefresh(false);
		}
	}, [dialogVisible, pendingRefresh]);

	React.useEffect(() => {
		if (dialogVisible) {
			slot?.onShow?.(slotContext);
		} else {
			slot?.onHide?.(slotContext);
		}
	}, [dialogVisible]);

	const handleConfirm = async () => {
		const values = { ...structureRef.current };
		const validationError = slot.onValidate?.(values);
		if (validationError) {
			setError(validationError);
			return;
		}
		setError(null);
		setSubmitting(true);
		try {
			await slot.onConfirm(values);
			onClose?.();
		} catch (err: any) {
			setError(err?.message ?? String(err));
		} finally {
			setSubmitting(false);
		}
	};

	const handleCancel = () => {
		slot.onCancel?.();
		onClose?.();
	};

	const title = resolveStringFactory(slot.title, slotContext);
	const confirmLabel = resolveStringFactory(slot.confirmLabel, slotContext) ?? t("ok", "OK");
	const cancelLabel = resolveStringFactory(slot.cancelLabel, slotContext) ?? t("cancel", "Cancel");
	const size = slot.size ?? "medium";
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
				<Stack spacing={2} sx={{ mt: 1 }}>
					{error && (
						<Alert severity="error">{error}</Alert>
					)}
					{items.map((item, index) => (
						<DialogLayoutItem
							key={index}
							item={item}
							slotContext={slotContext}
							structure={structureRef.current}
						/>
					))}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button color="secondary" onClick={handleCancel} disabled={submitting}>
					{cancelLabel}
				</Button>
				<Button color="primary" onClick={handleConfirm} disabled={submitting}>
					{confirmLabel}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DialogSlot;
