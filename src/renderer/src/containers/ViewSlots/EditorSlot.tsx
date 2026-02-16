import React from "react";
import { useTheme } from "@mui/material";
import { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import MonacoEditor, { IEditorActionContext } from "@renderer/components/editor/MonacoEditor";
import {
    IEditorSlot,
    resolveBooleanFactory,
    resolveEditorActionsFactory,
    resolveStringAsyncFactory,
    SlotRuntimeContext
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { createProgressBarContent } from "./helpers";
import { uuidv7 } from "uuidv7";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";
import { useRefSlot } from "./RefSlotContext";
import { IActionManager } from "@renderer/components/CommandPalette/ActionManager";

interface EditorSlotProps {
    slot: IEditorSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const EditorSlot: React.FC<EditorSlotProps> = ({
    slot
}) => {
    const theme = useTheme();
    const addToast = useToast();
    const { confirm } = useDialogs();
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const { registerRefresh, refreshSlot, openDialog } = useViewSlot();
    const { registerRefSlot } = useRefSlot();
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [content, setContent] = React.useState<string>("");
    const [readOnly, setReadOnly] = React.useState<boolean>(false);
    const [wordWrap, setWordWrap] = React.useState<boolean>(false);
    const [lineNumbers, setLineNumbers] = React.useState<boolean>(true);
    const [statusBar, setStatusBar] = React.useState<boolean>(true);
    const editorInstanceRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorRef = React.useRef<IEditorActionContext | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const [progressBar, setProgressBar] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({
        theme, refresh: refreshSlot, openDialog,
        showNotification: ({ message, severity = "info" }) => {
            addToast(severity, message);
        },
        showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
            return confirm(message, { title, severity, okText: confirmLabel, cancelText: cancelLabel });
        },
    }), [theme, refreshSlot, openDialog, addToast, confirm]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (readOnly) => {
            if (readOnly) {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        const unregisterRefSlot = registerRefSlot(slotId, "editor", editorRef);
        slot?.onMount?.(runtimeContext);
        return () => {
            unregisterRefresh();
            unregisterRefSlot();
            slot?.onUnmount?.(runtimeContext);
        };
    }, [slotId]);

    React.useEffect(() => {
        if (rootVisible && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [rootVisible, pendingRefresh]);

    React.useEffect(() => {
        if (rootVisible) {
            slot?.onShow?.(runtimeContext);
        } else {
            slot?.onHide?.(runtimeContext);
        }
    }, [rootVisible]);

    React.useEffect(() => {
        let mounted = true;
        const fetchContent = async () => {
            setLoading(true);
            try {
                const result = await resolveStringAsyncFactory(slot.content, runtimeContext);
                if (mounted && typeof result === "string") {
                    setContent(result);
                    editorInstanceRef.current?.setValue(result);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
        setReadOnly(resolveBooleanFactory(slot.readOnly, runtimeContext) ?? false);
        setWordWrap(resolveBooleanFactory(slot.wordWrap, runtimeContext) ?? false);
        setLineNumbers(resolveBooleanFactory(slot.lineNumbers, runtimeContext) ?? true);
        setStatusBar(resolveBooleanFactory(slot.statusBar, runtimeContext) ?? true);
        if (slot.progress) {
            setProgressBar(prev => ({
                ...prev,
                node: createProgressBarContent(slot.progress!, runtimeContext, prev.ref)
            }));
        }
        return () => { mounted = false; };
    }, [slot.content, slot.actions, slot.readOnly, slot.wordWrap, slot.lineNumbers, slot.statusBar, refresh]);

    const handleOnMount = (editor: monaco.editor.IStandaloneCodeEditor, _monaco: Monaco, actionManager: IActionManager<IEditorActionContext>) => {
        editorInstanceRef.current = editor;

        const actions = resolveEditorActionsFactory(slot.actions, runtimeContext) ?? [];
        actions.forEach(action => {
            editor.addAction(action);
        });

        slot?.onMounted?.(runtimeContext);
        editor.onDidChangeCursorPosition(() => {
            slot?.onPositionChanged?.(runtimeContext, editorRef.current!);
        });
        editor.onDidChangeCursorSelection(() => {
            slot?.onSelectionChanged?.(runtimeContext, editorRef.current!);
        });
        editor.onDidFocusEditorText(() => {
            slot?.onFocus?.(runtimeContext, editorRef.current!);
        });
        editor.onDidBlurEditorText(() => {
            slot?.onBlur?.(runtimeContext, editorRef.current!);
        });
        editor.onDidChangeModelContent(() => {
            slot?.onContentChanged?.(runtimeContext, editorRef.current!);
        });
    }

    return (
        <MonacoEditor
            ref={editorRef}
            rootRef={rootRef}
            defaultValue={content}
            language={slot.language}
            onMount={handleOnMount}
            readOnly={readOnly}
            loading={loading}
            wordWrap={wordWrap}
            lineNumbers={lineNumbers}
            statusBar={statusBar}
            miniMap={slot.miniMap}
            overlayMode={slot.overlayMode ?? "small"}
            onCancel={slot.onCancel ? () => slot.onCancel!(runtimeContext) : undefined}
            topChildren={progressBar.node}
        />
    );
};

export default EditorSlot;