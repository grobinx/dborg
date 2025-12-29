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
    resolveStringAsyncFactory
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { createProgressBarContent } from "./helpers";

interface EditorSlotProps {
    slot: IEditorSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const EditorSlot: React.FC<EditorSlotProps> = ({
    slot
}) => {
    const theme = useTheme();
    const { registerRefresh, refreshSlot } = useRefreshSlot();
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

    const context: IEditorContext = {
    };

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (readOnly) => {
            if (readOnly) {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        slot?.onMount?.(refreshSlot);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(refreshSlot);
        };
    }, [slot.id]);

    React.useEffect(() => {
        if (rootVisible && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [rootVisible, pendingRefresh]);

    React.useEffect(() => {
        if (rootVisible) {
            slot?.onShow?.(refreshSlot);
        } else {
            slot?.onHide?.(refreshSlot);
        }
    }, [rootVisible]);

    React.useEffect(() => {
        let mounted = true;
        const fetchContent = async () => {
            setLoading(true);
            try {
                const result = await resolveStringAsyncFactory(slot.content, refreshSlot);
                if (mounted && typeof result === "string") {
                    setContent(result);
                    editorInstanceRef.current?.setValue(result);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
        setActions(resolveEditorActionsFactory(slot.actions, refreshSlot) ?? []);
        setReadOnly(resolveBooleanFactory(slot.readOnly, refreshSlot) ?? false);
        setWordWrap(resolveBooleanFactory(slot.wordWrap, refreshSlot) ?? false);
        setLineNumbers(resolveBooleanFactory(slot.lineNumbers, refreshSlot) ?? true);
        setStatusBar(resolveBooleanFactory(slot.statusBar, refreshSlot) ?? true);
        if (slot.progressBar) {
            setProgressBar(prev => ({
                ...prev,
                node: createProgressBarContent(slot.progressBar!, refreshSlot, prev.ref)
            }));
        }
        return () => { mounted = false; };
    }, [slot.content, slot.actions, slot.readOnly, slot.wordWrap, slot.lineNumbers, slot.statusBar, refresh]);

    const handleOnMount = (editor: monaco.editor.IStandaloneCodeEditor, _monaco: Monaco) => {
        editorInstanceRef.current = editor;
        actions.forEach(action => {
            editor.addAction(action);
        });

        slot?.onMounted?.(refreshSlot);
        editor.onDidChangeCursorPosition(() => {
            slot?.onPositionChanged?.(refreshSlot, context);
        });
        editor.onDidChangeCursorSelection(() => {
            slot?.onSelectionChanged?.(refreshSlot, context);
        });
        editor.onDidFocusEditorText(() => {
            slot?.onFocus?.(refreshSlot, context);
        });
        editor.onDidBlurEditorText(() => {
            slot?.onBlur?.(refreshSlot, context);
        });
        editor.onDidChangeModelContent(() => {
            slot?.onContentChanged?.(refreshSlot, context);
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
            onCancel={slot.onCancel ? () => slot.onCancel!(refreshSlot) : undefined}
            topChildren={progressBar.node}
        />
    );
};

export default EditorSlot;