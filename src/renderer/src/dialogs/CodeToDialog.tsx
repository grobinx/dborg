import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    FormLabel,
    Paper,
    Box, // ← DODANE
} from "@mui/material";
import { codeTo, TargetLanguage, getAvailableLanguages, CodeToCodeOptions, LANGUAGE_CONFIGS } from "@renderer/utils/codeTo";
import { useToast } from "@renderer/contexts/ToastContext";
import { useTranslation } from "react-i18next";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { BooleanField } from "@renderer/components/inputs/BooleanField";
import { SelectField } from "@renderer/components/inputs/SelectField";
import { TextField } from "@renderer/components/inputs/TextField";
import { Button } from "@renderer/components/buttons/Button";
import MonacoEditor from "@renderer/components/editor/MonacoEditor";
import type { EditorLanguageId } from "@renderer/components/editor/MonacoEditor";

interface CodeToDialogProps {
    /** Whether dialog is open */
    open: boolean;
    /** Called when dialog should close */
    onClose: () => void;
    /** Text to convert to code */
    text: string | null;
    /** Show toast notification on copy (default: true) */
    showNotification?: boolean;
}

/** Mapowanie TargetLanguage na Monaco EditorLanguageId */
const languageToEditorId: Record<TargetLanguage, EditorLanguageId> = {
    'js': 'javascript',
    'ts': 'typescript',
    'java': 'java',
    'cpp': 'csharp',
    'pascal': 'plaintext',
    'php': 'php',
    'perl': 'plaintext',
    'python': 'python',
    'csharp': 'csharp',
    'go': 'go',
    'rust': 'plaintext',
    'kotlin': 'plaintext',
    'swift': 'plaintext',
    'ruby': 'ruby',
    'groovy': 'plaintext',
    'scala': 'plaintext',
    'sql': 'sql',
    'bash': 'shell',
    'powershell': 'powershell',

};

const LOCAL_STORAGE_KEY = "codeToDialog.options";

/**
 * Loads previously saved options from localStorage
 * @param language Target language
 * @returns Saved options or empty object
 */
function loadLanguageOptions(language: TargetLanguage): Record<string, any> {
    try {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "{}");
        return all[language] || {};
    } catch {
        return {};
    }
}

/**
 * Saves options to localStorage for given language
 * @param language Target language
 * @param options Options to save
 */
function saveLanguageOptions(language: TargetLanguage, options: Record<string, any>) {
    try {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "{}");
        all[language] = options;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    } catch {
        // ignore
    }
}

/**
 * Dialog for converting text to code in various programming languages
 * Allows selecting language, configuring options, and copying result to clipboard
 */
export const CodeToDialog: React.FC<CodeToDialogProps> = ({
    open,
    onClose,
    text,
    showNotification = true,
}) => {
    const addToast = useToast();
    const { t } = useTranslation();
    const languages = getAvailableLanguages();

    // Default language
    const defaultLanguage: TargetLanguage = 'js';

    // Initialize with saved language or default
    const [language, setLanguage] = useState<TargetLanguage>(() => {
        try {
            const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}.lastLanguage`);
            return (saved as TargetLanguage) || defaultLanguage;
        } catch {
            return defaultLanguage;
        }
    });

    // Initialize options
    const [options, setOptions] = useState<CodeToCodeOptions>(() => {
        const saved = loadLanguageOptions(language);
        return {
            language,
            variableName: saved.variableName || 'query',
            useMultiline: saved.useMultiline !== false,
            addSemicolon: saved.addSemicolon,
            indent: saved.indent || '    ',
            addLineBreaks: saved.addLineBreaks !== false,
        };
    });

    // Preview state
    const [preview, setPreview] = useState<string>("");
    const [languageId, setLanguageId] = useState<EditorLanguageId>(languageToEditorId[language]);

    // Update options when language changes
    const handleLanguageChange = (newLanguage: TargetLanguage) => {
        setLanguage(newLanguage);
        const saved = loadLanguageOptions(newLanguage);
        setOptions({
            language: newLanguage,
            variableName: saved.variableName || 'query',
            useMultiline: saved.useMultiline !== false,
            addSemicolon: saved.addSemicolon,
            indent: saved.indent || '    ',
            addLineBreaks: saved.addLineBreaks !== false,
        });
        // Save last selected language
        try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}.lastLanguage`, newLanguage);
        } catch {
            // ignore
        }
    };

    // Update preview whenever text, language, or options change
    React.useEffect(() => {
        if (text && text.length > 0) {
            try {
                const result = codeTo(text, options);
                setLanguageId(languageToEditorId[options.language]);
                setPreview(result);
            } catch (e) {
                setLanguageId('plaintext');
                setPreview(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
            }
        } else {
            setLanguageId('plaintext');
            setPreview("");
        }
    }, [text, options]);

    // Save options to localStorage when they change
    React.useEffect(() => {
        const optionsToSave = {
            variableName: options.variableName,
            useMultiline: options.useMultiline,
            addSemicolon: options.addSemicolon,
            indent: options.indent,
            addLineBreaks: options.addLineBreaks,
        };
        saveLanguageOptions(language, optionsToSave);
    }, [options, language]);

    if (!text) {
        return null;
    }

    const handleOptionChange = (key: keyof CodeToCodeOptions, value: any) => {
        setOptions(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(preview);
            if (showNotification) {
                addToast("success", t("code-copied", "Code copied to clipboard"));
            }
            onClose();
        } catch (error) {
            if (showNotification) {
                addToast("error", t("code-copy-failed", "Failed to copy code to clipboard"));
            }
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCopy();
    };

    const languageName = languages.find(l => l.id === language)?.name || language;
    const config = LANGUAGE_CONFIGS[language];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {t("code-to-dialog.title", "Convert to {{language}}", { language: languageName })}
            </DialogTitle>
            <form onSubmit={handleFormSubmit}>
                <DialogContent>
                    {/* Language selection */}
                    <InputDecorator
                        label={t("code-to-dialog.language", "Language")}
                        indicator={false}
                    >
                        <SelectField
                            value={language}
                            options={languages.map(l => ({ label: l.name, value: l.id }))}
                            onChange={(value) => handleLanguageChange(value as TargetLanguage)}
                        />
                    </InputDecorator>

                    {/* Variable name and Indentation in one row */}
                    <Box sx={{ display: 'flex', gap: 8 }}>
                        {/* Variable name */}
                        <InputDecorator
                            label={t("code-to-dialog.variable-name", "Variable name")}
                            indicator={false}
                            sx={{ flex: 1 }}
                        >
                            <TextField
                                value={options.variableName || 'query'}
                                onChange={(value) => handleOptionChange('variableName', value)}
                            />
                        </InputDecorator>

                        {/* Indentation */}
                        <InputDecorator
                            label={t("code-to-dialog.indent", "Indentation")}
                            indicator={false}
                            sx={{ flex: 1 }}
                        >
                            <SelectField
                                value={options.indent || '    '}
                                options={[
                                    { label: t("code-to-dialog.indent.spaces", "{{spaces}} spaces", { spaces: 2 }), value: '  ' },
                                    { label: t("code-to-dialog.indent.spaces", "{{spaces}} spaces", { spaces: 4 }), value: '    ' },
                                    { label: t("code-to-dialog.indent.spaces", "{{spaces}} spaces", { spaces: 8 }), value: '        ' },
                                    { label: t("code-to-dialog.indent.1-tab", "{{tabs}} tab", { tabs: 1 }), value: '\t' },
                                ]}
                                onChange={(value) => handleOptionChange('indent', value)}
                                disabled={options.useMultiline || !config.supportsMultiline}
                            />
                        </InputDecorator>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 8 }}>
                        {/* Use multiline strings */}
                        <InputDecorator indicator={false}>
                            <BooleanField
                                value={options.useMultiline !== false}
                                onChange={(value) => handleOptionChange('useMultiline', value)}
                                label={t("code-to-dialog.use-multiline", "Use multiline strings")}
                                disabled={!config.supportsMultiline}
                            />
                        </InputDecorator>

                        {/* Add line breaks (only visible when multiline is off and text has multiple lines) */}
                        <InputDecorator indicator={false}>
                            <BooleanField
                                value={options.addLineBreaks !== false}
                                onChange={(value) => handleOptionChange('addLineBreaks', value)}
                                label={t("code-to-dialog.add-line-breaks", "Add line breaks ({{lineBreak}})", { lineBreak: config.lineBreakLiteral })}
                                disabled={options.useMultiline && config.supportsMultiline}
                            />
                        </InputDecorator>

                        {/* Add semicolon */}
                        <InputDecorator indicator={false}>
                            <BooleanField
                                value={options.addSemicolon !== false}
                                onChange={(value) => handleOptionChange('addSemicolon', value)}
                                label={t("code-to-dialog.add-semicolon", "Add semicolon")}
                            />
                        </InputDecorator>
                    </Box>

                    {/* Preview */}
                    <FormControl fullWidth sx={{ marginTop: 2 }}>
                        <FormLabel>{t("preview", "Preview")}</FormLabel>
                        <Paper sx={{ height: 250, marginTop: 1 }}>
                            <MonacoEditor
                                key={languageId} 
                                value={preview}
                                language={languageId}
                                readOnly={true}
                                miniMap={false}
                            />
                        </Paper>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>
                        {t("cancel", "Cancel")}
                    </Button>
                    <Button type="submit" color="success">
                        {t("copy", "Copy")}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CodeToDialog;
