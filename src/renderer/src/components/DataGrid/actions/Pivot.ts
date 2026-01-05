import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next from "i18next";
import { DataGridActionContext } from "../DataGridTypes";
import { queueMessage } from "@renderer/contexts/MessageContext";
import { TOAST_ADD_MESSAGE, ToastAddMessage } from "@renderer/contexts/ToastContext";


export const Pivot = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.pivot";

    return {
        id: id,
        keySequence: ["Alt+Shift+P"],
        label: t(id, "Pivot data"),
        disabled: (context) => !context.canPivot(),
        run: (context) => {
            if (context.getRowCount(true) > 200) {
                queueMessage(TOAST_ADD_MESSAGE, {
                    type: "hint",
                    message: t("dataGrid.actions.pivot.tooManyRows", "Cannot pivot data with more than {{rows}} rows.", { rows: 200 }),
                } as ToastAddMessage);
                return;
            }
            context.togglePivot();
        },
    };
}