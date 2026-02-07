import { IDialogBooleanField, IDialogEditorField, IDialogNumberField, IDialogRow, IDialogSlot } from "plugins/manager/renderer/CustomSlots";
import { t } from "i18next";
import textToLabel from "@renderer/utils/textToLabel";

export const defaultAnalyzeStructure: Record<string, any> = {
    verbose: false,
    skip_locked: false,
    buffer_usage_limit: 0,
    sql: "-- no SQL preview available --",
};

export function analyzeDialog(
    versionNumber: number,
    dialogId: string,
    getIdentifier: () => string | string[] | null,
    onConfirm: (values: Record<string, any>) => Promise<void>,
): IDialogSlot {

    const analyzeSql = (structure: Record<string, any>) => {
        let identifier = getIdentifier();
        if (identifier === null) return "-- no table selected --";

        const identifiers = Array.isArray(identifier) ? identifier : [identifier];

        const options = [
            structure.verbose && "VERBOSE",
            (versionNumber >= 130000 && structure.skip_locked) && "SKIP_LOCKED",
            (versionNumber >= 160000 && structure.buffer_usage_limit > 0) && `BUFFER_USAGE_LIMIT '${structure.buffer_usage_limit}MB'`,
        ].filter(Boolean).join(", ");

        return identifiers.map(identifier => `ANALYZE${options ? ' (' + options + ')' : ''} ${identifier};`).join("\n");
    }

    return {
        id: dialogId,
        type: "dialog",
        title: () => t("analyze-relation-dialog-title", "Analyze Relation {{relation}}", { relation: textToLabel(getIdentifier()) }),
        height: "70%",
        items: [
            {
                type: "tabs",
                tabs: [
                    {
                        id: "options",
                        label: t("options", "Options"),
                        items: [
                            {
                                type: "column",
                                label: t("analyze-mode", "Mode"),
                                items: [
                                    {
                                        type: "boolean",
                                        key: "verbose",
                                        label: t("analyze-verbose", "Verbose"),
                                        helperText: t("analyze-verbose-tooltip", "Print progress messages"),
                                    } as IDialogBooleanField,
                                    ...(versionNumber >= 130000 ? [
                                        {
                                            type: "boolean",
                                            key: "skip_locked",
                                            label: t("analyze-skip-locked", "Skip Locked"),
                                            helperText: t("analyze-skip-locked-tooltip", "Skip tables and indexes that are locked by other transactions"),
                                        } as IDialogBooleanField,
                                    ] : []),
                                    ...(versionNumber >= 160000 ? [
                                        {
                                            type: "number",
                                            key: "buffer_usage_limit",
                                            label: t("analyze-buffer-usage-limit", "Buffer Usage Limit (MB)"),
                                            helperText: t("analyze-buffer-usage-limit-tooltip", "Set the maximum amount of buffer usage for the operation. 0 means no limit."),
                                            min: 0,
                                            width: "30%",
                                        } as IDialogNumberField,
                                    ] : []),
                                ],
                            }
                        ]
                    },
                    {
                        id: "editor",
                        label: t("sql", "SQL"),
                        items: [
                            {
                                type: "editor",
                                key: "sql",
                                height: "100%",
                                width: "100%",
                            } as IDialogEditorField
                        ],
                    }
                ]
            },
        ],
        confirmLabel: () => t("analyze", "Analyze"),
        onOpen: (values) => {
            values.sql = analyzeSql(values);
        },
        onConfirm: onConfirm,
        onChange(values) {
            values.sql = analyzeSql(values);
        },
    } as IDialogSlot;
}