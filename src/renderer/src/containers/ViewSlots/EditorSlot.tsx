import React from "react";
import { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import MonacoEditor, { IEditorActionContext } from "@renderer/components/editor/MonacoEditor";
import {
    IEditorSlot,
    resolveActionFactory,
    resolveBooleanFactory,
    resolveStringAsyncFactory,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { createBannerContent, createProgressBarContent } from "./helpers";
import { uuidv7 } from "uuidv7";
import { useRefSlot } from "./RefSlotContext";
import { IActionManager } from "@renderer/components/CommandPalette/ActionManager";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";
import { useTranslation } from "react-i18next";
import { useToast } from "@renderer/contexts/ToastContext";

interface EditorSlotProps {
    slot: IEditorSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const EditorSlot: React.FC<EditorSlotProps> = ({
    slot
}) => {
    const { t } = useTranslation();
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const { registerRefresh } = useViewSlot();
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
    const [banner, setBanner] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const runtimeContext = useSlotRuntimeContext({});
    const unregisterRefSlotRef = React.useRef<(() => void) | null>(null);
    const addToast = useToast();
    const gettingContentRef = React.useRef(false);

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
            unregisterRefSlotRef.current?.();
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
        gettingContentRef.current = true;
        const fetchContent = async () => {
            setLoading(true);
            try {
                const result = await resolveStringAsyncFactory(slot.content, runtimeContext);
                if (gettingContentRef.current && typeof result === "string") {
                    setContent(result);
                    editorInstanceRef.current?.setValue(result);
                    slot?.onContentSuccess?.(runtimeContext, editorRef.current!);
                }
            } catch (error) {
                if (gettingContentRef.current) {
                    const content = "-- " + t("failed-to-load-content", "Failed to load content");
                    setContent(content);
                    editorInstanceRef.current?.setValue(content);
                    addToast("error", t("failed-to-load-content", "Failed to load content"), {
                        reason: error,
                    });
                }
            } finally {
                setLoading(false);
                gettingContentRef.current = false;
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
        if (slot.banner) {
            setBanner(prev => ({
                ...prev,
                node: createBannerContent(slot.banner!, runtimeContext, prev.ref)
            }));
        }
    }, [slot.content, slot.actions, slot.readOnly, slot.wordWrap, slot.lineNumbers, slot.statusBar, refresh]);

    const handleOnMount = (editor: monaco.editor.IStandaloneCodeEditor, _monaco: Monaco, actionManager: IActionManager<monaco.editor.ICodeEditor>) => {
        editorInstanceRef.current = editor;

        const actions = resolveActionFactory(slot.actions, runtimeContext) ?? [];
        actionManager.registerAction(...actions);

        slot?.onMounted?.(runtimeContext);
        editor.onDidChangeCursorPosition(() => {
            if (!gettingContentRef.current) {
                slot?.onPositionChanged?.(runtimeContext, editorRef.current!);
            }
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
            if (!gettingContentRef.current) {
                slot?.onContentChanged?.(runtimeContext, editorRef.current!);
            }
        });

        unregisterRefSlotRef.current = registerRefSlot(slotId, "editor", editorRef);
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
            topChildren={<>{progressBar.node}{banner.node}</>}
        />
    );
};

export default EditorSlot;