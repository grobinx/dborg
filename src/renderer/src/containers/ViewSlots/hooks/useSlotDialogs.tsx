import React from "react";
import {
    IDialogSlot,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import DialogSlot from "../DialogSlot";
import { useViewSlot } from "../ViewSlotContext";

type DialogState = Record<string, {
    opened: boolean;
    params?: Record<string, any>;
    dialog: IDialogSlot;
    resolver: ((value: Record<string, any> | null) => void) | null;
}>;

interface UseSlotDialogsParams {
    dialogSlots: IDialogSlot[] | null;
}

export function useSlotDialogs({ dialogSlots }: UseSlotDialogsParams) {
    const [dialogsState, setDialogsState] = React.useState<DialogState>({});
    const { registerDialog } = useViewSlot();

    React.useEffect(() => {
        if (!dialogSlots || dialogSlots.length === 0) {
            setDialogsState({});
            return;
        }

        const initialState = dialogSlots.reduce((acc, dialog) => {
            acc[dialog.id] = {
                opened: false,
                dialog,
                resolver: null,
            };
            return acc;
        }, {} as DialogState);

        setDialogsState(initialState);

        const unregister = registerDialog(Object.keys(initialState), (id, params) => {
            return new Promise<Record<string, any> | null>((resolve) => {
                setDialogsState(prev => {
                    if (!prev[id]) {
                        resolve(null);
                        return prev;
                    }
                    return {
                        ...prev,
                        [id]: {
                            ...prev[id],
                            opened: true,
                            params,
                            resolver: resolve,
                        },
                    };
                });
            });
        });

        return () => unregister();
    }, [dialogSlots, registerDialog]);

    const closeDialog = React.useCallback((id: string, result: Record<string, any> | null, resolver: ((value: Record<string, any> | null) => void) | null) => {
        setDialogsState(prev => {
            const current = prev[id];
            if (!current) return prev;

            return {
                ...prev,
                [id]: {
                    ...current,
                    opened: false,
                    params: undefined,
                    resolver: null,
                },
            };
        });

        if (resolver) {
            resolver(result);
        }
    }, []);

    const dialogs = React.useMemo(
        () => Object.values(dialogsState).filter(dialog => dialog.opened).map(({ dialog, params, resolver }) => (
            <DialogSlot
                key={dialog.id}
                slot={dialog}
                open={true}
                onClose={(result) => closeDialog(dialog.id, result, resolver)}
                params={params}
            />
        )), [dialogsState, closeDialog]);

    return dialogs;
}