import React from "react";
import { useTheme } from "@mui/material";
import Editor, { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import MonacoEditor from "@renderer/components/editor/MonacoEditor";
import {
    IEditorContext,
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
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [content, setContent] = React.useState<string>("");
    const [actions, setActions] = React.useState<monaco.editor.IActionDescriptor[]>([]);
    const [readOnly, setReadOnly] = React.useState<boolean>(false);
    const [wordWrap, setWordWrap] = React.useState<boolean>(false);
    const [lineNumbers, setLineNumbers] = React.useState<boolean>(true);
    const [statusBar, setStatusBar] = React.useState<boolean>(true);
    const editorInstanceRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
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

    const editorContext: IEditorContext = {
    };

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (readOnly) => {
            if (readOnly) {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        slot?.onMount?.(runtimeContext);
        return () => {
            unregisterRefresh();
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
        setActions(resolveEditorActionsFactory(slot.actions, runtimeContext) ?? []);
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

    const handleOnMount = (editor: monaco.editor.IStandaloneCodeEditor, _monaco: Monaco) => {
        editorInstanceRef.current = editor;
        actions.forEach(action => {
            editor.addAction(action);
        });

        slot?.onMounted?.(runtimeContext);
        editor.onDidChangeCursorPosition(() => {
            slot?.onPositionChanged?.(runtimeContext, editorContext);
        });
        editor.onDidChangeCursorSelection(() => {
            slot?.onSelectionChanged?.(runtimeContext, editorContext);
        });
        editor.onDidFocusEditorText(() => {
            slot?.onFocus?.(runtimeContext, editorContext);
        });
        editor.onDidBlurEditorText(() => {
            slot?.onBlur?.(runtimeContext, editorContext);
        });
        editor.onDidChangeModelContent(() => {
            slot?.onContentChanged?.(runtimeContext, editorContext);
        });
    }

    return (
        <MonacoEditor
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