import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, FormLabel, FormControl, Paper } from "@mui/material";
import { arrayTo, Column, ExportFormat, exportFormats, exportToClipboard } from "@renderer/utils/arrayTo";
import { useToast } from "@renderer/contexts/ToastContext";
import { useTranslation } from "react-i18next";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { BooleanField } from "@renderer/components/inputs/BooleanField";
import { SelectField } from "@renderer/components/inputs/SelectField";
import { NumberField } from "@renderer/components/inputs/NumberField";
import { TextField } from "@renderer/components/inputs/TextField";
import { Button } from "@renderer/components/buttons/Button";
import MonacoEditor from "@renderer/components/editor/MonacoEditor";
import type { EditorLanguageId } from "@renderer/components/editor/MonacoEditor";
import { createRoot } from "react-dom/client";

type DataType = Record<string, any>;

interface CopyDataDialogProps {
    open: boolean;
    onClose: () => void;
    data: DataType[] | null;
    columns?: Column[];
    showNotification?: boolean;
    format: ExportFormat;
}

const formatOptionsMap = {
    json: [
        { key: "pretty", label: "Pretty print", type: "checkbox" },
        { key: "nullValue", label: "Null value", type: "text", default: "null" },
    ],
    csv: [
        { key: "delimiter", label: "Delimiter", type: "text", default: "," },
        { key: "quote", label: "Quote character", type: "text", default: '"' },
        { key: "quoteStrings", label: "Quote strings", type: "checkbox", default: true },
        { key: "quoteAll", label: "Quote all values", type: "checkbox", default: false },
        { key: "includeHeaders", label: "Include headers", type: "checkbox", default: true },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    tsv: [
        { key: "includeHeaders", label: "Include headers", type: "checkbox", default: true },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    markdown: [
        { key: "includeHeaders", label: "Include headers", type: "checkbox", default: true },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    html: [
        { key: "includeHeaders", label: "Include headers", type: "checkbox", default: true },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    redmine: [
        { key: "includeHeaders", label: "Include headers", type: "checkbox", default: true },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    jira: [
        { key: "includeHeaders", label: "Include headers", type: "checkbox", default: true },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    bbcode: [
        { key: "includeHeaders", label: "Include headers", type: "checkbox", default: true },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    xml: [
        { key: "rootElement", label: "Root element", type: "text", default: "root" },
        { key: "itemElement", label: "Item element", type: "text", default: "item" },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    sql: [
        { key: "tableName", label: "Table name", type: "text", default: "table_name" },
        { key: "identifierQuote", label: "Identifier quote", type: "text", default: `"` },
        { key: "includeCreateTable", label: "Include CREATE TABLE", type: "checkbox", default: false },
        { key: "batchSize", label: "Batch size", type: "number", default: 100 },
        { key: "nullValue", label: "Null value", type: "text", default: "NULL" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    yaml: [
        { key: "indent", label: "Indent", type: "number", default: 2 },
        { key: "nullValue", label: "Null value", type: "text", default: "null" },
    ],
    latex: [
        { key: "includeHeaders", label: "Include headers", type: "checkbox", default: true },
        { key: "tableStyle", label: "Table style", type: "select", options: ["basic", "booktabs", "longtable"], default: "basic" },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    ascii: [
        { key: "includeHeaders", label: "Include headers", type: "checkbox", default: true },
        { key: "borderStyle", label: "Border style", type: "select", options: ["single", "double", "rounded", "minimal"], default: "single" },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    datatext: [
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    rst: [
        { key: "includeHeaders", label: "Include headers", type: "checkbox", default: true },
        { key: "tableStyle", label: "Table style", type: "select", options: ["grid", "simple"], default: "grid" },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    "excel-xml": [
        { key: "sheetName", label: "Sheet name", type: "text", default: "Sheet1" },
        { key: "includeHeaders", label: "Include headers", type: "checkbox", default: true },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
        { key: "booleanFormat", label: "Boolean format", type: "select", options: ["text", "number", "yesno"], default: "text" }
    ],
    js: [
        { key: "variableName", label: "Variable name", type: "text", default: "data" },
        { key: "nullValue", label: "Null value", type: "text", default: "null" },
    ],
    ts: [
        { key: "variableName", label: "Variable name", type: "text", default: "data" },
        { key: "typeName", label: "Type name", type: "text", default: "Row" },
        { key: "nullValue", label: "Null value", type: "text", default: "null" },
    ],
    java: [
        { key: "variableName", label: "Variable name", type: "text", default: "data" },
        { key: "className", label: "Class name", type: "text", default: "Row" },
        { key: "nullValue", label: "Null value", type: "text", default: "null" },
    ],
    cpp: [
        { key: "variableName", label: "Variable name", type: "text", default: "data" },
        { key: "typeName", label: "Type name", type: "text", default: "Row" },
        { key: "nullValue", label: "Null value", type: "text", default: "nullptr" },
    ],
    php: [
        { key: "variableName", label: "Variable name", type: "text", default: "data" },
        { key: "nullValue", label: "Null value", type: "text", default: "null" },
    ],
    perl: [
        { key: "variableName", label: "Variable name", type: "text", default: "data" },
        { key: "nullValue", label: "Null value", type: "text", default: "undef" },
    ],
    pascal: [
        { key: "variableName", label: "Variable name", type: "text", default: "Data" },
        { key: "typeName", label: "Type name", type: "text", default: "TRecord" },
        { key: "nullValue", label: "Null value", type: "text", default: "" },
    ],
};

// Mapowanie ExportFormat na Monaco EditorLanguageId
const formatToLanguageId: Record<ExportFormat, EditorLanguageId> = {
    json: "json",
    csv: "plaintext",
    tsv: "plaintext",
    markdown: "markdown",
    html: "html",
    redmine: "plaintext",
    xml: "xml",
    sql: "sql",
    yaml: "yaml",
    latex: "plaintext",
    jira: "plaintext",
    ascii: "plaintext",
    datatext: "plaintext",
    rst: "plaintext",
    bbcode: "plaintext",
    "excel-xml": "xml",
    js: "javascript",
    ts: "typescript",
    java: "java",
    cpp: "plaintext",
    php: "php",
    perl: "plaintext",
    pascal: "plaintext",
};

const LOCAL_STORAGE_KEY = "copyDataDialog.options";

function loadFormatOptions(format: ExportFormat): Record<string, any> {
    try {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "{}");
        const options = all[format] || {};
        // Usuń columns z załadowanych opcji
        const { columns, ...rest } = options;
        return rest;
    } catch {
        return {};
    }
}

function saveFormatOptions(format: ExportFormat, options: Record<string, any>) {
    try {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "{}");
        // Usuń columns przed zapisem
        const { columns, ...optionsToSave } = options;
        all[format] = optionsToSave;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    } catch {
        // ignore
    }
}

export const CopyDataDialog: React.FC<CopyDataDialogProps> = ({
    open,
    onClose,
    data,
    columns,
    showNotification = true,
    format,
}) => {
    const addToast = useToast();
    const { t } = useTranslation();

    // Inicjalizacja tylko przy zmianie formatu
    const [options, setOptions] = React.useState<Record<string, any>>(() => {
        const opts: Record<string, any> = {};
        const saved = loadFormatOptions(format);
        for (const opt of formatOptionsMap[format] ?? []) {
            if ("default" in opt) {
                opts[opt.key] = saved[opt.key] !== undefined ? saved[opt.key] : opt.default;
            }
            else {
                opts[opt.key] = saved[opt.key] !== undefined ? saved[opt.key] : undefined;
            }
        }
        if (columns) opts.columns = columns;
        return opts;
    });

    // Stan podglądu
    const [preview, setPreview] = React.useState<string>("");

    // Resetuj opcje tylko przy zmianie formatu
    React.useEffect(() => {
        const opts: Record<string, any> = {};
        const saved = loadFormatOptions(format);
        for (const opt of formatOptionsMap[format] ?? []) {
            if ("default" in opt) {
                opts[opt.key] = saved[opt.key] !== undefined ? saved[opt.key] : opt.default;
            }
            else {
                opts[opt.key] = saved[opt.key] !== undefined ? saved[opt.key] : undefined;
            }
        }
        if (columns) opts.columns = columns;
        setOptions(opts);
    }, [format]);

    // Aktualizuj columns w opcjach, jeśli się zmienią
    React.useEffect(() => {
        if (columns) {
            setOptions(prev => ({ ...prev, columns }));
        }
    }, [columns]);

    // Zapisuj opcje do localStorage przy każdej zmianie
    React.useEffect(() => {
        if (Object.keys(options).length > 0) {
            saveFormatOptions(format, options);
        }
    }, [options, format]);

    // Generuj podgląd po każdej zmianie danych, formatu lub opcji
    React.useEffect(() => {
        if (data && data.length > 0) {
            const sample = data.slice(0, 5);
            try {
                const result = arrayTo(sample, format as any, options);
                setPreview(result.content ?? "");
            } catch (e) {
                setPreview("Preview unavailable.");
            }
        } else {
            setPreview("");
        }
    }, [data, format, options]);

    if (!data) {
        return null;
    }

    const handleOptionChange = (key: string, value: any) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const handleCopy = async () => {
        const result = await exportToClipboard(data, format as any, options);
        if (showNotification) {
            if (result) {
                addToast("success", t("data-copied", "Data copied to clipboard in {{format}} format.", { format: exportFormats[format].label }));
                onClose();
            }
            else {
                addToast("error", t("data-copy-failed", "Failed to copy data to clipboard."));
            }
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleCopy();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{t("copy-data-as-format", "Copy Data as {{format}}", { format: exportFormats[format].label })}</DialogTitle>
            <form onSubmit={handleFormSubmit}>
                <DialogContent>
                    {(formatOptionsMap[format] ?? []).map((opt, index) => {
                        if (opt.type === "checkbox") {
                            return (
                                <InputDecorator key={opt.key} indicator={false}>
                                    <BooleanField
                                        value={!!options[opt.key]}
                                        onChange={value => handleOptionChange(opt.key, value)}
                                        label={t(`copy-data-dialog.${opt.key}`, opt.label as string)}
                                        autoFocus={index === 0}
                                    />
                                </InputDecorator>
                            );
                        }
                        if (opt.type === "select") {
                            return (
                                <InputDecorator label={t(`copy-data-dialog.${opt.key}`, opt.label as string)} key={opt.key} indicator={false}>
                                    <SelectField
                                        value={options[opt.key] ?? opt.default}
                                        options={opt.options.map((v: string) => ({ label: v, value: v }))}
                                        onChange={value => handleOptionChange(opt.key, value)}
                                        autoFocus={index === 0}
                                    />
                                </InputDecorator>
                            );
                        }
                        if (opt.type === "number") {
                            return (
                                <InputDecorator label={t(`copy-data-dialog.${opt.key}`, opt.label as string)} key={opt.key} indicator={false}>
                                    <NumberField
                                        value={options[opt.key] ?? opt.default}
                                        onChange={value => handleOptionChange(opt.key, value)}
                                        autoFocus={index === 0}
                                    />
                                </InputDecorator>
                            );
                        }
                        if (opt.type === "text") {
                            return (
                                <InputDecorator label={t(`copy-data-dialog.${opt.key}`, opt.label as string)} key={opt.key} indicator={false}>
                                    <TextField
                                        value={options[opt.key] ?? opt.default}
                                        onChange={value => handleOptionChange(opt.key, value)}
                                        autoFocus={index === 0}
                                    />
                                </InputDecorator>
                            );
                        }
                        return null;
                    })}
                    <FormControl fullWidth>
                        <FormLabel>{t("preview", "Preview")}</FormLabel>
                        <Paper sx={{ height: 170 }}>
                            <MonacoEditor
                                value={preview}
                                language={formatToLanguageId[format]}
                                readOnly={true}
                                miniMap={false}
                                lineNumbers={false}
                                wordWrap={false}
                            />
                        </Paper>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>{t("cancel", "Cancel")}</Button>
                    <Button type="submit" color="success">{t("copy", "Copy")}</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
