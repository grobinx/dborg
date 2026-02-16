import React from "react";
import * as monaco from "monaco-editor";
import { Action } from "../CommandPalette/ActionManager";

export interface MonacoActionExportOptions {
    groupId?: string;
    contextMenuGroupId?: string;
    include?: (actionId: string) => boolean;
    iconById?: Record<string, React.ReactNode>;
    iconResolver?: (actionId: string) => React.ReactNode | undefined;
}

function getMonacoKeySequence(
    editor: monaco.editor.IStandaloneCodeEditor,
    actionId: string
): string[] | undefined {
    const keybindingService = (editor as any)?._standaloneKeybindingService;
    const kb = keybindingService?.lookupKeybinding?.(actionId);

    const raw =
        kb?.getUserSettingsLabel?.() ??
        kb?.getLabel?.() ??
        kb?.getAriaLabel?.();

    if (!raw || typeof raw !== "string") return undefined;

    // np. "ctrl+k ctrl+c" -> ["ctrl+k", "ctrl+c"]
    return raw
        .split(" ")
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
}

export function exportMonacoActionsToActionManager<T>(
    editor: monaco.editor.IStandaloneCodeEditor,
    options?: MonacoActionExportOptions
): Action<T>[] {
    const include = options?.include ?? (() => true);
    const groupId = options?.groupId ?? "default";
    const contextMenuGroupId = options?.contextMenuGroupId ?? "monaco";

    const monacoActions = editor.getSupportedActions();
    const exported: Action<T>[] = [];

    for (const ma of monacoActions) {
        const id = ma.id;
        if (!include(id)) continue;

        const label = ma.label || ma.alias || id;
        const keySequence = getMonacoKeySequence(editor, id);
        const icon =
            options?.iconById?.[id] ??
            options?.iconResolver?.(id);

        const action: Action<T> = {
            id: id,
            groupId,
            contextMenuGroupId,
            label,
            keySequence,
            icon,
            visible: () => (typeof ma.isSupported === "function" ? ma.isSupported() : true),
            disabled: () => (typeof ma.isSupported === "function" ? !ma.isSupported() : false),
            run: async () => {
                const a = editor.getAction(id);
                if (a) {
                    await a.run();
                    return;
                }

                // fallback dla komend
                const commandService = (editor as any)?._commandService;
                if (commandService?.executeCommand) {
                    await commandService.executeCommand(id);
                    return;
                }

                editor.trigger("toolbar", id, null);
            },
        };

        exported.push(action);
    }

    return exported;
}