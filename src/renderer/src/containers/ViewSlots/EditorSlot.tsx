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

interface EditorSlotProps {
    slot: IEditorSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const EditorSlot: React.FC<EditorSlotProps> = ({
    slot
}) => {
    const theme = useTheme();
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const [refresh, setRefresh] = React.useState(false);
    const [content, setContent] = React.useState<string>("");
    const [actions, setActions] = React.useState<monaco.editor.IActionDescriptor[]>([]);
    const [readOnly, setReadOnly] = React.useState<boolean>(false);
    const [wordWrap, setWordWrap] = React.useState<boolean>(false);
    const [lineNumbers, setLineNumbers] = React.useState<boolean>(true);
    const [statusBar, setStatusBar] = React.useState<boolean>(true);
    const editorInstanceRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false);

    const context: IEditorContext = {
    };

    React.useEffect(() => {
        slot?.onMount?.(refreshSlot);
        return () => {
            slot?.onUnmount?.(refreshSlot);
        };
    }, [slot]);

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
        return () => { mounted = false; };
    }, [slot.content, slot.actions, slot.readOnly, slot.wordWrap, slot.lineNumbers, slot.statusBar, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

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
            defaultValue={content}
            language={slot.language}
            onMount={handleOnMount}
            readOnly={readOnly}
            loading={loading}
            wordWrap={wordWrap}
            lineNumbers={lineNumbers}
            statusBar={statusBar}
            miniMap={slot.miniMap}
        />
    );
};

export default EditorSlot;