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

interface DialogSlotProps {
	slot: IDialogSlot;
	open?: boolean;
	onClose?: () => void;
}

const applyDefaults = (
	items: DialogLayoutItemKind[] | undefined,
	slotContext: SlotFactoryContext,
	target: Record<string, any>,
): boolean => {
	if (!items || items.length === 0) {
		return false;
	}

	let changed = false;
	items.forEach(item => {
		if (isDialogTextField(item) || isDialogNumberField(item) || isDialogBooleanField(item) || isDialogSelectField(item)) {
			if (target[item.key] === undefined && item.defaultValue !== undefined) {
				target[item.key] = item.defaultValue;
				changed = true;
			}
		} else if (isDialogRow(item) || isDialogColumn(item)) {
			const nested = resolveDialogLayoutItemsKindFactory(item.items, slotContext) ?? [];
			if (applyDefaults(nested, slotContext, target)) {
				changed = true;
			}
		}
	});
	return changed;
};

const DialogSlot: React.FC<DialogSlotProps> = (props) => {
	const {
		slot,
		open = true,
		onClose,
		...dialogProps
	} = props;

	const theme = useTheme();
	const { registerRefresh, refreshSlot } = useRefreshSlot();
	const slotContext: SlotFactoryContext = React.useMemo(() => ({ theme, refresh: refreshSlot }), [theme, refreshSlot]);

	const [refresh, setRefresh] = React.useState<bigint>(0n);
	const [pendingRefresh, setPendingRefresh] = React.useState(false);
	const [items, setItems] = React.useState<DialogLayoutItemKind[]>([]);
	const [error, setError] = React.useState<string | null>(null);
	const [submitting, setSubmitting] = React.useState(false);
	const structureRef = React.useRef<Record<string, any>>({});
	const [, forceRender] = React.useState(0);

	React.useEffect(() => {
		const unregister = registerRefresh(slot.id, (redraw) => {
			if (redraw === "only") {
				setRefresh(prev => prev + 1n);
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
		if (open) {
			slot?.onShow?.(slotContext);
			if (pendingRefresh) {
				setRefresh(prev => prev + 1n);
				setPendingRefresh(false);
			}
		} else {
			slot?.onHide?.(slotContext);
		}
	}, [open, pendingRefresh, slotContext, slot.id]);

	React.useEffect(() => {
		const resolved = resolveDialogLayoutItemsKindFactory(slot.items, slotContext) ?? [];
		setItems(resolved);

		const target = structureRef.current;
		const changed = applyDefaults(resolved, slotContext, target);
		if (changed) {
			forceRender(prev => prev + 1);
		}
	}, [slot.items, refresh, slotContext]);

	React.useEffect(() => {
		structureRef.current = {};
		setItems(resolveDialogLayoutItemsKindFactory(slot.items, slotContext) ?? []);
		forceRender(prev => prev + 1);
	}, [slot.id, slot.items, slotContext]);

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
	const confirmLabel = resolveStringFactory(slot.confirmLabel, slotContext) ?? "OK";
	const cancelLabel = resolveStringFactory(slot.cancelLabel, slotContext) ?? "Cancel";

	return (
		<Dialog
			open={open}
			onClose={handleCancel}
			fullWidth
			maxWidth="md"
			{...dialogProps}
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
