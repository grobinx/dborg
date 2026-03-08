import React from "react";
import { Alert, Box, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { Button } from "@renderer/components/buttons/Button";
import {
    IDialogStandalone,
    DialogLayoutItemKind,
    isDialogRow,
    isDialogColumn,
    isDialogTextField,
    isDialogTextareaField,
    isDialogNumberField,
    isDialogBooleanField,
    isDialogSelectField,
    isDialogEditorField,
    isDialogTabs,
    isDialogStatic,
    isDialogList,
    DialogConformButton,
    IDialogTab,
    resolveValue,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import { DialogLayoutItem } from "./DialogLayoutItem";
import { useTranslation } from "react-i18next";
import { ThemeColor } from "@renderer/types/colors";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { SearchField } from "@renderer/components/inputs/SearchField";
import debounce from "@renderer/utils/debounce";
import { useSetting } from "@renderer/contexts/SettingsContext";

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
            const nested = resolveValue(item.items, structure) ?? [];
            applyDefaults(nested, structure, target);
        } else if (isDialogTabs(item)) {
            const tabs = resolveValue(item.tabs, structure) ?? [];
            tabs.forEach(tab => {
                const tabItems = resolveValue(tab.items, structure) ?? [];
                applyDefaults(tabItems, structure, target);
            });
        }
    });
    return target;
};

const toSearchTokens = (text: string): string[] =>
    text.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

const includesAllTokens = (parts: (string | undefined)[], tokens: string[]): boolean => {
    if (tokens.length === 0) return true;
    const haystack = parts.filter(Boolean).join(" ").toLocaleLowerCase();
    if (!haystack) return false;
    return tokens.every((token) => haystack.includes(token));
};

const collectItemSearchParts = (
    item: DialogLayoutItemKind,
    structure: Record<string, any>
): string[] => {
    if (
        isDialogTextField(item) ||
        isDialogTextareaField(item) ||
        isDialogNumberField(item) ||
        isDialogBooleanField(item) ||
        isDialogSelectField(item) ||
        isDialogEditorField(item)
    ) {
        return [
            item.key,
            resolveValue(item.label, structure),
            resolveValue(item.tooltip, structure),
            resolveValue(item.helperText, structure),
            ...(resolveValue(item.restrictions, structure) ?? []),
        ].filter((v): v is string => Boolean(v));
    }

    if (isDialogRow(item) || isDialogColumn(item)) {
        return [resolveValue(item.label, structure)].filter((v): v is string => Boolean(v));
    }

    if (isDialogStatic(item)) {
        return [resolveValue(item.text, structure)].filter((v): v is string => Boolean(v));
    }

    if (isDialogList(item)) {
        const columns = resolveValue(item.columns, structure) ?? [];
        return [
            item.key,
            resolveValue(item.label, structure),
            ...columns.flatMap((c) => [c.key, resolveValue(c.label, structure)]),
        ].filter((v): v is string => Boolean(v));
    }

    return [];
};

const filterDialogItemsByTokens = (
    items: DialogLayoutItemKind[],
    structure: Record<string, any>,
    tokens: string[]
): DialogLayoutItemKind[] => {
    if (tokens.length === 0) return items;

    const result: DialogLayoutItemKind[] = [];

    for (const item of items) {
        const selfMatch = includesAllTokens(collectItemSearchParts(item, structure), tokens);

        if (isDialogRow(item) || isDialogColumn(item)) {
            const nestedItems = resolveValue(item.items, structure) ?? [];
            const filteredNested = filterDialogItemsByTokens(nestedItems, structure, tokens);

            if (selfMatch || filteredNested.length > 0) {
                result.push({
                    ...item,
                    items: selfMatch ? nestedItems : filteredNested,
                });
            }
            continue;
        }

        if (isDialogTabs(item)) {
            const tabs = resolveValue(item.tabs, structure) ?? [];
            const filteredTabs = tabs
                .map<IDialogTab | null>((tab) => {
                    const tabItems = resolveValue(tab.items, structure) ?? [];
                    const filteredTabItems = filterDialogItemsByTokens(tabItems, structure, tokens);
                    const tabMatch = includesAllTokens(
                        [tab.id, resolveValue(tab.label, structure)],
                        tokens
                    );

                    if (!tabMatch && filteredTabItems.length === 0) return null;

                    return {
                        ...tab,
                        items: tabMatch ? tabItems : filteredTabItems,
                    };
                })
                .filter((tab): tab is IDialogTab => tab !== null);

            if (selfMatch || filteredTabs.length > 0) {
                result.push({
                    ...item,
                    tabs: filteredTabs,
                });
            }
            continue;
        }

        if (isDialogList(item)) {
            const nestedItems = resolveValue(item.items, structure) ?? [];
            const filteredNested = filterDialogItemsByTokens(nestedItems, structure, tokens);

            if (selfMatch || filteredNested.length > 0) {
                result.push({
                    ...item,
                    items: selfMatch ? nestedItems : filteredNested,
                });
            }
            continue;
        }

        if (selfMatch) {
            result.push(item);
        }
    }

    return result;
};

const filterDialogItems = (
    items: DialogLayoutItemKind[],
    structure: Record<string, any>,
    searchText: string
): DialogLayoutItemKind[] => {
    const tokens = toSearchTokens(searchText);
    return filterDialogItemsByTokens(items, structure, tokens);
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
    const [searchText, setSearchText] = React.useState("");
    const [visibleItems, setVisibleItems] = React.useState<DialogLayoutItemKind[]>(items);
    const openSeq = React.useRef(0);
    const onOpenRanForSeq = React.useRef<number | null>(null);
    const [structureInitSeq, setStructureInitSeq] = React.useState(0);
    const [itemsResolvedSeq, setItemsResolvedSeq] = React.useState(0);
    const [searchDelay] = useSetting<number>("app", "search.delay");

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
        const resolvedItems = resolveValue(dialog.items, structure) ?? [];
        setItems(resolvedItems);
        setVisibleItems(resolvedItems);

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

    const title = resolveValue(dialog.title, structure);
    const resolvedButtons: (DialogConformButton & { handle?: () => void })[] = resolveValue(dialog.buttons, structure) ?? [];
    let buttons: ({ id: string; label: string; color?: ThemeColor; disabled?: boolean; handle: () => void })[];

    if (!resolvedButtons || resolvedButtons.length === 0) {
        buttons = [{
            id: "cancel",
            label: resolveValue(dialog.cancelLabel, structure) ?? t("cancel", "Cancel"),
            color: "secondary",
            disabled: submitting,
            handle: handleCancel,
        }, {
            id: "ok",
            label: resolveValue(dialog.confirmLabel, structure) ?? t("ok", "OK"),
            color: "primary",
            disabled: submitting || !dialogValid,
            handle: () => handleConfirm("ok"),
        }];
    } else {
        buttons = resolvedButtons.map(button => {
            let handle: () => void;
            let disabled: boolean | undefined;
            const labelText = resolveValue(button.label, structure)!;
            if (button.id === "cancel") {
                handle = handleCancel;
                disabled = submitting;
            } else {
                handle = () => handleConfirm(button.id);
                disabled = submitting || !dialogValid || resolveValue(button.disabled, structure) === true;
            }
            return { id: button.id, handle: handle, disabled, label: labelText, color: button.color };
        });
    }

    const size = dialog.size ?? "small";
    const maxWidth: "xs" | "sm" | "md" | "lg" | "xl" =
        size === "small" ? "sm" :
            size === "large" ? "lg" :
                size === "full" ? "xl" :
                    "md";
    const fullScreen = size === "full";

    const debouncedSetSearchText = React.useRef(debounce((items: DialogLayoutItemKind[], structure: any, text: string) => {
        setVisibleItems(filterDialogItems(items, structure, text));
    }, searchDelay));

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
            <DialogTitle sx={{ display: "flex", flexDirection: "row", gap: 8 }}>
                <Box>
                    {title}
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                {dialog.canSearch && (
                    <InputDecorator indicator={false} disableBlink width={200}>
                        <SearchField
                            placeholder={t("search---", "Search...")}
                            value={searchText}
                            onChange={(value) => {
                                setSearchText(value);
                                debouncedSetSearchText.current(items, structure, value);
                            }}
                        />
                    </InputDecorator>
                )}
            </DialogTitle>
            <DialogContent dividers>
                <Stack gap={8} sx={{ height: "100%" }}>
                    {error && (
                        <Alert severity="error">{error}</Alert>
                    )}

                    {visibleItems.length === 0 ? (
                        <Alert severity="info">
                            {t("no-matching-items", "No matching items.")}
                        </Alert>
                    ) : (
                        visibleItems.map((item, index) => (
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
                        ))
                    )}
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
