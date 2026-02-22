import * as monaco from "monaco-editor";
import { Action } from "@renderer/components/CommandPalette/ActionManager";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { SlotRuntimeContext } from "plugins/manager/renderer/CustomSlots";
import { t } from "i18next";

export function executeScriptAction(
    session: IDatabaseSession, 
    slotContext: SlotRuntimeContext,
    onSuccess?: () => void,
    onError?: (error: any) => void,
): Action<monaco.editor.ICodeEditor> {
    return {
        id: "execute-script",
        label: t("execute-script", "Execute Script"),
        icon: "Run",
        keySequence: ["Ctrl+Enter"],
        run: async (context) => {
            const sql = context.getValue();
            if (sql && await slotContext.showConfirmDialog({
                severity: "warning",
                title: t("confirm-script-execution", "Confirm Script Execution"),
                message: t("confirm-script-execution-message", "Are you sure you want to execute the script?"),
                confirmLabel: t("execute", "Execute"),
            })) {
                try {
                    await session.execute(sql)
                    slotContext.showNotification({
                        message: t("script-executed-successfully", "Script executed successfully"),
                        severity: "success",
                    });
                    if (onSuccess) {
                        onSuccess();
                    }
                } catch (err: any) {
                    slotContext.showNotification({
                        message: t("error-executing-script", "Error executing script: {{message}}", { message: err["message"] ?? String(err) }),
                        severity: "error",
                    });
                    if (onError) {
                        onError(err);
                    }
                }
            }
        }
    };
}