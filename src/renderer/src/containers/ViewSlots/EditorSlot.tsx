import React from "react";
import { useTheme } from "@mui/material";
import Editor, { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import MonacoEditor from "@renderer/components/editor/MonacoEditor";
import {
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
    slot, ref
}) => {
    const theme = useTheme();
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const [refresh, setRefresh] = React.useState(false);
    const [content, setContent] = React.useState<string>("");
    const [actions, setActions] = React.useState<monaco.editor.IActionDescriptor[]>([]);
    const [readOnly, setReadOnly] = React.useState<boolean>(false);
    const editorInstanceRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [loading, setLoading] = React.useState<boolean>(false);

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
        return () => { mounted = false; };
    }, [slot.content, slot.actions, slot.readOnly, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

    const handleOnMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
        editorInstanceRef.current = editor;
        actions.forEach(action => {
            editor.addAction(action);
        });

        slot?.onEditorMount?.(editor, monaco, refreshSlot);
    }

    return (
        <MonacoEditor
            defaultValue={content}
            language={slot.language || "sql"}
            onMount={handleOnMount}
            readOnly={readOnly}
            loading={loading}
        />
    );
};

export default EditorSlot;