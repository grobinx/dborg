import { IDialogBooleanField, IDialogEditorField, IDialogSlot } from "plugins/manager/renderer/CustomSlots";
import { t } from "i18next";
import textToLabel from "@renderer/utils/textToLabel";

export const defaultReindexStructure: Record<string, any> = {
    verbose: false,
    concurrently: false,
    sql: "-- no SQL preview available --",
};

export function reindexDialog(
    versionNumber: number,
    dialogId: string,
    getIdentifier: () => string | string[] | null,
    onConfirm: (values: Record<string, any>) => Promise<void>,
): IDialogSlot {

    const reindexSql = (structure: Record<string, any>) => {
        let identifier = getIdentifier();
        if (identifier === null) return "-- no table selected --";

        const identifiers = Array.isArray(identifier) ? identifier : [identifier];

        const options = [
            structure.verbose && "VERBOSE",
            (versionNumber >= 140000 && structure.concurrently) && "CONCURRENTLY",
        ].filter(Boolean).join(" ");

        return identifiers.map(identifier => `REINDEX TABLE ${options ? options + ' ' : ''}${identifier};`).join("\n");
    }

    return {
        id: dialogId,
        type: "dialog",
        title: () => t("reindex-relation-dialog-title", "Reindex Relation {{relation}}", { relation: textToLabel(getIdentifier()) }),
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
                                label: t("reindex-mode", "Mode"),
                                items: [
                                    {
                                        type: "boolean",
                                        key: "verbose",
                                        label: t("reindex-verbose", "Verbose"),
                                        helperText: t("reindex-verbose-tooltip", "Print progress messages"),
                                    } as IDialogBooleanField,
                                    ...(versionNumber >= 140000 ? [
                                        {
                                            type: "boolean",
                                            key: "concurrently",
                                            label: t("reindex-concurrently", "Concurrently"),
                                            helperText: t("reindex-concurrently-tooltip", "Rebuild indexes without blocking concurrent writes"),
                                        } as IDialogBooleanField,
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
        confirmLabel: () => t("reindex", "Reindex"),
        onOpen: (values) => {
            values.sql = reindexSql(values);
        },
        onConfirm: onConfirm,
        onChange(values) {
            values.sql = reindexSql(values);
        },
    } as IDialogSlot;
}