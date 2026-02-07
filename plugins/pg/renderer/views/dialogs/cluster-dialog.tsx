import { IDialogBooleanField, IDialogEditorField, IDialogSlot } from "plugins/manager/renderer/CustomSlots";
import { t } from "i18next";
import textToLabel from "@renderer/utils/textToLabel";

export const defaultClusterStructure: Record<string, any> = {
    verbose: false,
    sql: "-- no SQL preview available --",
};

export function clusterDialog(
    versionNumber: number,
    dialogId: string,
    getIdentifier: () => string | string[] | null,
    onConfirm: (values: Record<string, any>) => Promise<void>,
): IDialogSlot {

    const clusterSql = (structure: Record<string, any>) => {
        let identifier = getIdentifier();
        if (identifier === null) return "-- no table selected --";

        const identifiers = Array.isArray(identifier) ? identifier : [identifier];

        const options = [
            structure.verbose && "VERBOSE",
        ].filter(Boolean).join(" ");

        return identifiers.map(identifier => `CLUSTER ${options ? options + ' ' : ''}${identifier};`).join("\n");
    }

    return {
        id: dialogId,
        type: "dialog",
        title: () => t("cluster-relation-dialog-title", "Cluster Relation {{relation}}", { relation: textToLabel(getIdentifier()) }),
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
                                label: t("cluster-mode", "Mode"),
                                items: [
                                    {
                                        type: "boolean",
                                        key: "verbose",
                                        label: t("cluster-verbose", "Verbose"),
                                        helperText: t("cluster-verbose-tooltip", "Print progress messages"),
                                    } as IDialogBooleanField,
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
        confirmLabel: () => t("cluster", "Cluster"),
        onOpen: (values) => {
            values.sql = clusterSql(values);
        },
        onConfirm: onConfirm,
        onChange(values) {
            values.sql = clusterSql(values);
        },
    } as IDialogSlot;
}