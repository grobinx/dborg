import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { BaseInputField } from './base/BaseInputField';
import MonacoEditor, { EditorLanguageId, EditorEncoding, EditorEolMode } from '../editor/MonacoEditor';
import * as monaco from 'monaco-editor';
import { Monaco } from '@monaco-editor/react';
import { Box } from '@mui/material';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { IActionManager } from '../CommandPalette/ActionManager';

interface EditorFieldProps extends BaseInputProps<string> {
    language?: EditorLanguageId;
    encoding?: EditorEncoding;
    eol?: EditorEolMode;
    wordWrap?: boolean;
    lineNumbers?: boolean;
    statusBar?: boolean;
    miniMap?: boolean;
    insertSpaces?: boolean;
    tabSize?: number;
    readOnly?: boolean;
    inputProps?: React.ComponentProps<typeof MonacoEditor>;

    onLanguageChange?: (languageId: EditorLanguageId) => void;
    onEncodingChange?: (encoding: EditorEncoding) => void;
    onEolChange?: (eol: EditorEolMode) => void;
    onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monacoApi: Monaco, actionManager: IActionManager<monaco.editor.ICodeEditor>) => void;
}

export const EditorField: React.FC<EditorFieldProps> = (props) => {
    const {
        value,
        onChange,
        disabled,
        language,
        encoding,
        eol,
        wordWrap = false,
        lineNumbers = false,
        statusBar = true,
        miniMap = false,
        insertSpaces = true,
        tabSize = 4,
        readOnly = false,
        onLanguageChange,
        onEncodingChange,
        onEolChange,
        onMount,
        inputProps,
        ...other
    } = props;

    const decorator = useInputDecorator();
    const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const currentValue = value ?? '';
    const onChangeRef = React.useRef(onChange);

    onChangeRef.current = onChange;

    const handleEditorMount = React.useCallback((editor: monaco.editor.IStandaloneCodeEditor, monacoApi: Monaco, actionManager: IActionManager<monaco.editor.ICodeEditor>) => {
        editorRef.current = editor;

        // Nasłuchuj zmian w edytorze
        editor.onDidChangeModelContent(() => {
            const newValue = editor.getValue();
            onChangeRef.current?.(newValue);
        });

        onMount?.(editor, monacoApi, actionManager);
    }, [onMount]);
    
    React.useEffect(() => {
        // Aktualizuj wartość tylko jeśli różni się od wartości w edytorze
        if (editorRef.current) {
            const editorValue = editorRef.current.getValue();
            if (editorValue !== currentValue) {
                editorRef.current.setValue(currentValue);
            }
        }
    }, [currentValue]);

    return (
        <BaseInputField
            type="editor"
            value={currentValue}
            inputProps={{
                type: 'text',
            }}
            onConvertToValue={(value: string) => value}
            onConvertToInput={(value: string | undefined) => value ?? ''}
            input={
                <MonacoEditor
                    value={currentValue}
                    language={language}
                    encoding={encoding}
                    eol={eol}
                    wordWrap={wordWrap}
                    lineNumbers={lineNumbers}
                    statusBar={statusBar ? "simple" : false}
                    miniMap={miniMap}
                    insertSpaces={insertSpaces}
                    tabSize={tabSize}
                    readOnly={disabled || readOnly}
                    onLanguageChange={onLanguageChange}
                    onEncodingChange={onEncodingChange}
                    onEolChange={onEolChange}
                    onMount={handleEditorMount}
                    onFocus={() => decorator?.setFocused(true)}
                    onBlur={() => decorator?.setFocused(false)}
                    {...inputProps}
                />
            }
            {...other}
        />
    );
};

EditorField.displayName = 'EditorField';