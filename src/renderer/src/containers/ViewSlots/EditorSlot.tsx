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
    SlotFactoryContext
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
    const slotContext: SlotFactoryContext = React.useMemo(() => ({ theme, refresh: refreshSlot }), [theme, refreshSlot]);

    const editorContext: IEditorContext = {
    };

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (readOnly) => {
            if (readOnly) {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        slot?.onMount?.(slotContext);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(slotContext);
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
            slot?.onShow?.(slotContext);
        } else {
            slot?.onHide?.(slotContext);
        }
    }, [rootVisible]);

    React.useEffect(() => {
        let mounted = true;
        const fetchContent = async () => {
            setLoading(true);
            try {
                const result = await resolveStringAsyncFactory(slot.content, slotContext);
                if (mounted && typeof result === "string") {
                    setContent(result);
                    editorInstanceRef.current?.setValue(result);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
        setActions(resolveEditorActionsFactory(slot.actions, slotContext) ?? []);
        setReadOnly(resolveBooleanFactory(slot.readOnly, slotContext) ?? false);
        setWordWrap(resolveBooleanFactory(slot.wordWrap, slotContext) ?? false);
        setLineNumbers(resolveBooleanFactory(slot.lineNumbers, slotContext) ?? true);
        setStatusBar(resolveBooleanFactory(slot.statusBar, slotContext) ?? true);
        if (slot.progress) {
            setProgressBar(prev => ({
                ...prev,
                node: createProgressBarContent(slot.progress!, slotContext, prev.ref)
            }));
        }
        return () => { mounted = false; };
    }, [slot.content, slot.actions, slot.readOnly, slot.wordWrap, slot.lineNumbers, slot.statusBar, refresh]);

    const handleOnMount = (editor: monaco.editor.IStandaloneCodeEditor, _monaco: Monaco) => {
        editorInstanceRef.current = editor;
        actions.forEach(action => {
            editor.addAction(action);
        });

        slot?.onMounted?.(slotContext);
        editor.onDidChangeCursorPosition(() => {
            slot?.onPositionChanged?.(slotContext, editorContext);
        });
        editor.onDidChangeCursorSelection(() => {
            slot?.onSelectionChanged?.(slotContext, editorContext);
        });
        editor.onDidFocusEditorText(() => {
            slot?.onFocus?.(slotContext, editorContext);
        });
        editor.onDidBlurEditorText(() => {
            slot?.onBlur?.(slotContext, editorContext);
        });
        editor.onDidChangeModelContent(() => {
            slot?.onContentChanged?.(slotContext, editorContext);
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
            onCancel={slot.onCancel ? () => slot.onCancel!(slotContext) : undefined}
            topChildren={progressBar.node}
        />
    );
};

export default EditorSlot;