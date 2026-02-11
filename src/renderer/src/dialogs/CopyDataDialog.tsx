import React from "react";
import { arrayTo, Column, ExportFormat, exportFormats, exportToClipboard } from "@renderer/utils/arrayTo";
import { useToast } from "@renderer/contexts/ToastContext";
import { useTranslation } from "react-i18next";
import type { EditorLanguageId } from "@renderer/components/editor/MonacoEditor";
import { DialogLayoutItemKind, IDialogStandalone } from "../../../../plugins/manager/renderer/CustomSlots";
import { DialogStandalone } from "@renderer/containers/ViewSlots/DialogStandalone";

type DataType = Record<string, any>;

interface CopyDataDialogProps {
    open: boolean;
    onClose: () => void;
    data: DataType[] | null;
    columns?: Column[];
    showNotification?: boolean;
    format: ExportFormat;
}

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
        const { columns, ...rest } = options;
        return rest;
    } catch {
        return {};
    }
}

function saveFormatOptions(format: ExportFormat, options: Record<string, any>) {
    try {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "{}");
        const { columns, ...optionsToSave } = options;
        all[format] = optionsToSave;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    } catch {
        // ignore
    }
}

// Definicja struktury opcji dla każdego formatu
const formatOptionsMap: Record<ExportFormat, DialogLayoutItemKind[]> = {
    json: [
        {
            type: "row",
            items: [
                { type: "boolean", key: "pretty", label: "Pretty print", defaultValue: false },
            ],
        },
        { type: "text", key: "nullValue", label: "Null value", defaultValue: "null", width: "30%" },
    ],
    csv: [
        {
            type: "row",
            items: [
                { type: "text", key: "delimiter", label: "Delimiter", defaultValue: ",", size: 2 },
                { type: "text", key: "quote", label: "Quote character", defaultValue: '"', size: 3 },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
        {
            type: "row",
            items: [
                { type: "boolean", key: "quoteStrings", label: "Quote strings", defaultValue: true },
                { type: "boolean", key: "quoteAll", label: "Quote all values", defaultValue: false },
                { type: "boolean", key: "includeHeaders", label: "Include headers", defaultValue: true },
            ],
        },
    ],
    tsv: [
        { type: "boolean", key: "includeHeaders", label: "Include headers", defaultValue: true },
        {
            type: "row",
            items: [
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
    ],
    markdown: [
        { type: "boolean", key: "includeHeaders", label: "Include headers", defaultValue: true },
        {
            type: "row",
            items: [
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
    ],
    html: [
        { type: "boolean", key: "includeHeaders", label: "Include headers", defaultValue: true },
        {
            type: "row",
            items: [
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
    ],
    redmine: [
        { type: "boolean", key: "includeHeaders", label: "Include headers", defaultValue: true },
        {
            type: "row",
            items: [
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
    ],
    jira: [
        { type: "boolean", key: "includeHeaders", label: "Include headers", defaultValue: true },
        {
            type: "row",
            items: [
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
    ],
    bbcode: [
        { type: "boolean", key: "includeHeaders", label: "Include headers", defaultValue: true },
        {
            type: "row",
            items: [
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
    ],
    xml: [
        {
            type: "row",
            items: [
                { type: "text", key: "rootElement", label: "Root element", defaultValue: "root" },
                { type: "text", key: "itemElement", label: "Item element", defaultValue: "item" },
            ]
        },
        {
            type: "row",
            items: [
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ]
        },
    ],
    sql: [
        {
            type: "row",
            items: [
                { type: "text", key: "tableName", label: "Table name", defaultValue: "table_name" },
                { type: "text", key: "identifierQuote", label: "Identifier quote", defaultValue: `"` },
            ],
        },
        {
            type: "row",
            items: [
                { type: "number", key: "batchSize", label: "Batch size", defaultValue: 100, min: 1 },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "NULL" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
        { type: "boolean", key: "includeCreateTable", label: "Include CREATE TABLE", defaultValue: false },
    ],
    yaml: [
        {
            type: "row",
            items: [
                { type: "number", key: "indent", label: "Indent", defaultValue: 2, min: 1, max: 8 },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "null" },
            ],
        },
    ],
    latex: [
        { type: "boolean", key: "includeHeaders", label: "Include headers", defaultValue: true },
        {
            type: "row",
            items: [
                {
                    type: "select",
                    key: "tableStyle",
                    label: "Table style",
                    defaultValue: "basic",
                    options: [
                        { label: "basic", value: "basic" },
                        { label: "booktabs", value: "booktabs" },
                        { label: "longtable", value: "longtable" },
                    ],
                },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
    ],
    ascii: [
        { type: "boolean", key: "includeHeaders", label: "Include headers", defaultValue: true },
        {
            type: "row",
            items: [
                {
                    type: "select",
                    key: "borderStyle",
                    label: "Border style",
                    defaultValue: "single",
                    options: [
                        { label: "single", value: "single" },
                        { label: "double", value: "double" },
                        { label: "rounded", value: "rounded" },
                        { label: "minimal", value: "minimal" },
                    ],
                },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
    ],
    datatext: [
        {
            type: "select",
            key: "booleanFormat",
            label: "Boolean format",
            defaultValue: "text",
            options: [
                { label: "text", value: "text" },
                { label: "number", value: "number" },
                { label: "yesno", value: "yesno" },
            ],
        },
    ],
    rst: [
        { type: "boolean", key: "includeHeaders", label: "Include headers", defaultValue: true },
        {
            type: "row",
            items: [
                {
                    type: "select",
                    key: "tableStyle",
                    label: "Table style",
                    defaultValue: "grid",
                    options: [
                        { label: "grid", value: "grid" },
                        { label: "simple", value: "simple" },
                    ],
                },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
    ],
    "excel-xml": [
        { type: "text", key: "sheetName", label: "Sheet name", defaultValue: "Sheet1" },
        { type: "boolean", key: "includeHeaders", label: "Include headers", defaultValue: true },
        {
            type: "row",
            items: [
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
                {
                    type: "select",
                    key: "booleanFormat",
                    label: "Boolean format",
                    defaultValue: "text",
                    options: [
                        { label: "text", value: "text" },
                        { label: "number", value: "number" },
                        { label: "yesno", value: "yesno" },
                    ],
                },
            ],
        },
    ],
    js: [
        {
            type: "row",
            items: [
                { type: "text", key: "variableName", label: "Variable name", defaultValue: "data" },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "null" },
            ]
        },
    ],
    ts: [
        {
            type: "row",
            items: [
                { type: "text", key: "variableName", label: "Variable name", defaultValue: "data" },
                { type: "text", key: "typeName", label: "Type name", defaultValue: "Row" },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "null" },
            ]
        },
    ],
    java: [
        {
            type: "row",
            items: [
                { type: "text", key: "variableName", label: "Variable name", defaultValue: "data" },
                { type: "text", key: "className", label: "Class name", defaultValue: "Row" },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "null" },
            ]
        },
    ],
    cpp: [
        {
            type: "row",
            items: [
                { type: "text", key: "variableName", label: "Variable name", defaultValue: "data" },
                { type: "text", key: "typeName", label: "Type name", defaultValue: "Row" },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "nullptr" },
            ]
        },
    ],
    php: [
        {
            type: "row",
            items: [
                { type: "text", key: "variableName", label: "Variable name", defaultValue: "data" },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "null" },
            ]
        },
    ],
    perl: [
        {
            type: "row",
            items: [
                { type: "text", key: "variableName", label: "Variable name", defaultValue: "data" },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "undef" },
            ]
        },
    ],
    pascal: [
        {
            type: "row",
            items: [
                { type: "text", key: "variableName", label: "Variable name", defaultValue: "Data" },
                { type: "text", key: "typeName", label: "Type name", defaultValue: "TRecord" },
                { type: "text", key: "nullValue", label: "Null value", defaultValue: "" },
            ]
        },
    ],
};

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
    const saved = loadFormatOptions(format);

    const dialogConfig = React.useMemo((): IDialogStandalone => {
        const items = [...formatOptionsMap[format]];

        // Dodaj pole edytora podglądu
        items.push({
            type: "editor",
            key: "preview",
            label: t("sample-preview", "Sample Preview"),
            defaultValue: "",
            language: formatToLanguageId[format],
            readOnly: true,
            height: 200,
        });

        return {
            title: t("copy-data-as-format", "Copy Data as {{format}}", { format: exportFormats[format].label }),
            items: items,
            confirmLabel: t("copy", "Copy"),
            cancelLabel: t("cancel", "Cancel"),
            onOpen: (values) => {
                // Usuń pole preview z opcji eksportu
                const { preview, ...exportOptions } = values;
                if (columns) {
                    exportOptions.columns = columns;
                }

                // Generuj podgląd
                if (data && data.length > 0) {
                    const sample = data.slice(0, 5);
                    try {
                        const result = arrayTo(sample, format as any, exportOptions);
                        values.preview = result.content ?? "";
                    } catch (e) {
                        values.preview = "Preview unavailable.";
                    }
                } else {
                    values.preview = "";
                }
            },
            onChange: (values) => {
                // Zapisz opcje do localStorage
                const { preview, ...exportOptions } = values;
                saveFormatOptions(format, exportOptions);

                // Aktualizuj podgląd
                if (columns) {
                    exportOptions.columns = columns;
                }

                if (data && data.length > 0) {
                    const sample = data.slice(0, 5);
                    try {
                        const result = arrayTo(sample, format as any, exportOptions);
                        values.preview = result.content ?? "";
                    } catch (e) {
                        values.preview = "Preview unavailable.";
                    }
                } else {
                    values.preview = "";
                }
            },
            onConfirm: async (values) => {
                if (!data) return;

                const { preview, ...exportOptions } = values;
                if (columns) {
                    exportOptions.columns = columns;
                }

                const result = await exportToClipboard(data, format as any, exportOptions);
                if (showNotification) {
                    if (result) {
                        addToast("success", t("data-copied", "Data copied to clipboard in {{format}} format.", { format: exportFormats[format].label }));
                    } else {
                        addToast("error", t("data-copy-failed", "Failed to copy data to clipboard."));
                    }
                }
            },
        };
    }, [format, data, columns, showNotification, t, addToast]);

    if (!data) {
        return null;
    }

    return (
        <DialogStandalone
            dialog={dialogConfig}
            open={open}
            onClose={onClose}
            params={saved}
        />
    );
};
