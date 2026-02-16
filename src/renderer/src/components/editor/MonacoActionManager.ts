import React from "react";
import * as monaco from "monaco-editor";
import {
    Action,
    ActionGroup,
    IActionManager,
} from "../CommandPalette/ActionManager";
import { KeyboardEvent, keyboardEventToKeybinding } from "../CommandPalette/KeyBinding";

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

    return raw
        .split(" ")
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
}

function toMonacoKeyCode(keyRaw: string): monaco.KeyCode | null {
    const key = keyRaw.trim().toLowerCase();

    if (key.length === 1 && key >= "a" && key <= "z") {
        const enumKey = `Key${key.toUpperCase()}` as keyof typeof monaco.KeyCode;
        return (monaco.KeyCode as any)[enumKey] ?? null;
    }

    if (key.length === 1 && key >= "0" && key <= "9") {
        const enumKey = `Digit${key}` as keyof typeof monaco.KeyCode;
        return (monaco.KeyCode as any)[enumKey] ?? null;
    }

    const map: Record<string, monaco.KeyCode> = {
        enter: monaco.KeyCode.Enter,
        tab: monaco.KeyCode.Tab,
        esc: monaco.KeyCode.Escape,
        escape: monaco.KeyCode.Escape,
        space: monaco.KeyCode.Space,
        backspace: monaco.KeyCode.Backspace,
        delete: monaco.KeyCode.Delete,
        del: monaco.KeyCode.Delete,
        insert: monaco.KeyCode.Insert,
        home: monaco.KeyCode.Home,
        end: monaco.KeyCode.End,
        pageup: monaco.KeyCode.PageUp,
        pagedown: monaco.KeyCode.PageDown,
        up: monaco.KeyCode.UpArrow,
        down: monaco.KeyCode.DownArrow,
        left: monaco.KeyCode.LeftArrow,
        right: monaco.KeyCode.RightArrow,
        ",": monaco.KeyCode.Comma,
        ".": monaco.KeyCode.Period,
        "/": monaco.KeyCode.Slash,
        ";": monaco.KeyCode.Semicolon,
        "'": monaco.KeyCode.Quote,
        "[": monaco.KeyCode.BracketLeft,
        "]": monaco.KeyCode.BracketRight,
        "\\": monaco.KeyCode.Backslash,
        "-": monaco.KeyCode.Minus,
        "=": monaco.KeyCode.Equal,
        "`": monaco.KeyCode.Backquote,
    };

    if (map[key]) return map[key];

    const f = key.match(/^f([1-9]|1[0-9]|2[0-4])$/);
    if (f) {
        return (monaco.KeyCode as any)[`F${f[1]}`] ?? null;
    }

    return null;
}

function toMonacoSingleKeybinding(step: string): number | null {
    const tokens = step.split("+").map(t => t.trim()).filter(Boolean);
    if (!tokens.length) return null;

    let mods = 0;
    let key: monaco.KeyCode | null = null;

    for (const t of tokens) {
        const token = t.toLowerCase();
        if (token === "ctrl" || token === "control" || token === "cmd" || token === "meta") {
            mods |= monaco.KeyMod.CtrlCmd;
            continue;
        }
        if (token === "shift") {
            mods |= monaco.KeyMod.Shift;
            continue;
        }
        if (token === "alt" || token === "option") {
            mods |= monaco.KeyMod.Alt;
            continue;
        }
        key = toMonacoKeyCode(token);
    }

    if (!key) return null;
    return mods | key;
}

function toMonacoKeybindings(keySequence?: string[]): number[] | undefined {
    if (!keySequence?.length) return undefined;

    const parts = keySequence
        .map(toMonacoSingleKeybinding)
        .filter((v): v is number => typeof v === "number");

    if (!parts.length) return undefined;

    // Monaco chord publicznie wspiera 2 kroki
    if (parts.length >= 2) {
        return [monaco.KeyMod.chord(parts[0], parts[1])];
    }

    return [parts[0]];
}

export function exportMonacoActionsToActionManager(
    editor: monaco.editor.IStandaloneCodeEditor,
    options?: MonacoActionExportOptions
): Action<monaco.editor.ICodeEditor>[] {
    const include = options?.include ?? (() => true);
    const groupId = options?.groupId ?? "default";
    const contextMenuGroupId = options?.contextMenuGroupId ?? "monaco";

    const monacoActions = editor.getSupportedActions();
    const exported: Action<monaco.editor.ICodeEditor>[] = [];

    for (const ma of monacoActions) {
        const id = ma.id;
        if (!include(id)) continue;

        const label = ma.label || ma.alias || id;
        const keySequence = getMonacoKeySequence(editor, id);
        const icon = options?.iconById?.[id] ?? options?.iconResolver?.(id);

        exported.push({
            id,
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

                const commandService = (editor as any)?._commandService;
                if (commandService?.executeCommand) {
                    await commandService.executeCommand(id);
                    return;
                }

                editor.trigger("toolbar", id, null);
            },
        });
    }

    return exported;
}

export class MonacoActionManager implements IActionManager<monaco.editor.ICodeEditor> {
    private readonly editor: monaco.editor.IStandaloneCodeEditor;

    private readonly actions = new Map<string, Action<monaco.editor.ICodeEditor>>();
    private readonly actionGroups = new Map<string, ActionGroup<monaco.editor.ICodeEditor>>();
    private readonly editorDisposables = new Map<string, monaco.IDisposable>();

    private currentSequence: string[] = [];
    private sequenceTimeout: ReturnType<typeof setTimeout> | null = null;
    private sequenceResetTime = 2000;

    constructor(
        editor: monaco.editor.IStandaloneCodeEditor,
    ) {
        this.editor = editor;

        this.registerActionGroup({
            id: "default",
            label: "> Search and run actions",
            prefix: ">",
            actions: async () => Array.from(this.actions.values()),
            mode: "actions",
        });

        // Import akcji już istniejących w Monaco -> tylko do managera (bez addAction)
        const exported = exportMonacoActionsToActionManager(editor);
        for (const action of exported) {
            if (!this.actions.has(action.id)) {
                this.actions.set(action.id, action);
            }
        }
    }

    private resetSequence(): void {
        this.currentSequence = [];
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
            this.sequenceTimeout = null;
        }
    }

    private isSequenceMatch(full: string[], current: string[]): boolean {
        if (current.length > full.length) return false;
        for (let i = 0; i < current.length; i++) {
            if ((full[i] ?? "").toLowerCase() !== (current[i] ?? "").toLowerCase()) return false;
        }
        return true;
    }

    private registerActionInEditor(action: Action<monaco.editor.ICodeEditor>): void {
        if (this.editorDisposables.has(action.id)) return;
        if (this.editor.getAction(action.id)) return; // już istnieje (np. built-in Monaco)

        const label = typeof action.label === "string" ? action.label : action.id;

        const disposable = this.editor.addAction({
            id: action.id,
            label,
            keybindings: toMonacoKeybindings(action.keySequence),
            contextMenuGroupId: action.contextMenuGroupId,
            contextMenuOrder: action.contextMenuOrder,
            run: async (editor, ...args) => {
                await this.executeAction(action.id, editor, ...args);
            },
        });

        this.editorDisposables.set(action.id, disposable);
    }

    registerAction(...actions: Action<monaco.editor.ICodeEditor>[]): void {
        for (const action of actions) {
            if (this.actions.has(action.id)) continue;
            this.actions.set(action.id, action);

            // tylko dla nowych akcji: rejestracja także w Monaco Editor
            this.registerActionInEditor(action);
        }
    }

    unregisterAction(actionId: string): void {
        this.actions.delete(actionId);

        const d = this.editorDisposables.get(actionId);
        if (d) {
            d.dispose();
            this.editorDisposables.delete(actionId);
        }
    }

    getAction(actionId: string): Action<monaco.editor.ICodeEditor> | undefined {
        return this.actions.get(actionId);
    }

    registerActionGroup(...groups: ActionGroup<monaco.editor.ICodeEditor>[]): void {
        for (const group of groups) {
            if (!this.actionGroups.has(group.id)) {
                this.actionGroups.set(group.id, group);
            }
        }
    }

    getActionGroup(groupId: string): ActionGroup<monaco.editor.ICodeEditor> | undefined {
        return this.actionGroups.get(groupId);
    }

    getRegisteredActionGroups(): ActionGroup<monaco.editor.ICodeEditor>[] {
        return Array.from(this.actionGroups.values());
    }

    executeAction(actionId: string, context: monaco.editor.ICodeEditor, ...args: any[]): void | Promise<void>;
    executeAction(action: Action<monaco.editor.ICodeEditor>, context: monaco.editor.ICodeEditor, ...args: any[]): void | Promise<void>;
    executeAction(actionOrId: string | Action<monaco.editor.ICodeEditor>, context: monaco.editor.ICodeEditor, ...args: any[]): void | Promise<void> {
        const action = typeof actionOrId === "string" ? this.actions.get(actionOrId) : actionOrId;
        if (!action) return;

        const visible = typeof action.visible === "function" ? action.visible(context ?? this.editor, ...args) : (action.visible ?? true);
        const disabled = typeof action.disabled === "function" ? action.disabled(context ?? this.editor, ...args) : (action.disabled ?? false);
        if (!visible || disabled) return;

        if (action.contextMenuGroupId !== "commandPalette") {
            action._LastSelected = Date.now();
        }

        return action.run(context ?? this.editor, ...args);
    }

    executeActionByKeybinding(event: KeyboardEvent | string, context: monaco.editor.ICodeEditor, ...args: any[]): boolean {
        const pressed = (typeof event === "string" ? event : keyboardEventToKeybinding(event)).toLowerCase();
        this.currentSequence.push(pressed);

        if (this.sequenceTimeout) clearTimeout(this.sequenceTimeout);
        this.sequenceTimeout = setTimeout(() => this.resetSequence(), this.sequenceResetTime);

        const all = Array.from(this.actions.values());

        const exact = all.find((a) =>
            a.keySequence &&
            a.keySequence.length === this.currentSequence.length &&
            this.isSequenceMatch(a.keySequence.map((k) => k.toLowerCase()), this.currentSequence)
        );

        if (exact) {
            const disabled = typeof exact.disabled === "function" ? exact.disabled(context ?? this.editor, ...args) : (exact.disabled ?? false);
            if (!disabled) {
                void this.executeAction(exact, context ?? this.editor, ...args);
            }
            this.resetSequence();
            return true;
        }

        const isPrefix = all.some((a) =>
            a.keySequence && this.isSequenceMatch(a.keySequence.map((k) => k.toLowerCase()), this.currentSequence)
        );

        if (!isPrefix) this.resetSequence();
        return isPrefix;
    }

    async getRegisteredActions(
        prefix: string | null = ">",
        context?: monaco.editor.ICodeEditor,
        query?: string
    ): Promise<Action<monaco.editor.ICodeEditor>[]> {
        if (prefix === null || context === undefined) return [];

        const group = Array.from(this.actionGroups.values()).find((g) => g.prefix === prefix);
        if (!group) return [];

        const groupDisabled =
            typeof group.disabled === "function" ? group.disabled(context) : (group.disabled ?? false);
        if (groupDisabled) return [];

        const actions = await group.actions(context, query);
        if (!query) return actions;

        const q = query.toLowerCase();
        return actions.filter((a) => {
            const label = typeof a.label === "function" ? a.label(context) : a.label;
            return (label ?? "").toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
        });
    }

    dispose(): void {
        for (const d of this.editorDisposables.values()) d.dispose();
        this.editorDisposables.clear();
        this.resetSequence();
    }
}