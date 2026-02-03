import { IDialogBooleanField, IDialogEditorField, IDialogNumberField, IDialogRow, IDialogSlot } from "plugins/manager/renderer/CustomSlots";
import { t } from "i18next";
import identifiersLabel from "@renderer/utils/identifiersLabel";

export const defaultVacuumStructure: Record<string, any> = {
    full: false,
    analyze: true,
    freeze: false,
    disable_page_skipping: false,
    skip_locked: false,
    index_cleanup: true,
    truncate: true,
    parallel: 0,
    process_main: true,
    process_toast: false,
    buffer_usage_limit: 0,
    skip_database_stats: false,
    only_database_stats: false,
    sql: "-- no SQL preview available --",
};

export function vacuumDialog(
    versionNumber: number,
    dialogId: string,
    getIdentifier: () => string | string[] | null,
    onConfirm: (values: Record<string, any>) => Promise<void>,
): IDialogSlot {

    const vacuumSql = (structure: Record<string, any>) => {
        let identifier = getIdentifier();
        if (identifier === null) return "-- no table selected --";

        const identifiers = Array.isArray(identifier) ? identifier : [identifier];

        const options = [
            structure.full && !structure.freeze && "FULL",
            structure.analyze && !structure.freeze && "ANALYZE",
            structure.freeze && "FREEZE",
            structure.disable_page_skipping && "DISABLE_PAGE_SKIPPING",
            (versionNumber >= 130000 && structure.skip_locked) && "SKIP_LOCKED",
            (versionNumber >= 130000 && structure.index_cleanup === false) && "INDEX_CLEANUP FALSE",
            (versionNumber >= 130000 && structure.truncate === false) && "TRUNCATE FALSE",
            (versionNumber >= 140000 && structure.parallel > 0 && structure.index_cleanup) ? `PARALLEL ${structure.parallel}` : null,
            (versionNumber >= 160000 && structure.process_main === false) && "PROCESS_MAIN FALSE",
            (versionNumber >= 160000 && structure.process_toast === true) && "PROCESS_TOAST TRUE",
            (versionNumber >= 160000 && structure.buffer_usage_limit > 0) && `BUFFER_USAGE_LIMIT '${structure.buffer_usage_limit}MB'`,
            (versionNumber >= 160000 && structure.skip_database_stats && !structure.only_database_stats) && "SKIP_DATABASE_STATS",
            (versionNumber >= 160000 && structure.only_database_stats && !structure.skip_database_stats) && "ONLY_DATABASE_STATS",
        ].filter(Boolean).join(", ");

        if (versionNumber >= 140000) {
            return `VACUUM ${options ? '(' + options + ')' : ''} ${identifiers.join(", ")};`;
        }

        return identifiers.map(identifier => `VACUUM ${options ? '(' + options + ')' : ''} ${identifier};`).join("\n");
    }

    return {
        id: dialogId,
        type: "dialog",
        title: () => t("vacuum-relation-dialog-title", "Vacuum Relation {{relation}}", { relation: identifiersLabel(getIdentifier()) }),
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
                                items: [
                                    {
                                        type: "column",
                                        label: t("vacuum-mode", "Mode"),
                                        items: [{
                                            type: "row",
                                            items: [
                                                {
                                                    type: "boolean",
                                                    key: "full",
                                                    label: t("vacuum-full", "Full"),
                                                    helperText: t("vacuum-full-dialog-tooltip", "Reclaim disk space (slower, locks table)"),
                                                    disabled: (values) => values.freeze === true,
                                                } as IDialogBooleanField,
                                                {
                                                    type: "boolean",
                                                    key: "analyze",
                                                    label: t("vacuum-analyze", "Analyze"),
                                                    helperText: t("vacuum-analyze-dialog-tooltip", "Update table statistics after vacuum"),
                                                    disabled: (values) => values.freeze === true,
                                                } as IDialogBooleanField,
                                            ]
                                        } as IDialogRow,
                                        {
                                            type: "boolean",
                                            key: "freeze",
                                            label: t("vacuum-freeze", "Freeze"),
                                            helperText: t("vacuum-freeze-dialog-tooltip", "Freeze tuples (prevents transaction ID wraparound)"),
                                        } as IDialogBooleanField,
                                        ],
                                    },
                                    ...(versionNumber >= 160000 ? [
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "boolean",
                                                    key: "skip_database_stats",
                                                    label: t("vacuum-skip-database-stats", "Skip Database Stats"),
                                                    helperText: t("vacuum-skip-database-stats-tooltip", "Skip updating database-wide statistics"),
                                                    disabled: (values) => values.only_database_stats === true,
                                                } as IDialogBooleanField,
                                                {
                                                    type: "boolean",
                                                    key: "only_database_stats",
                                                    label: t("vacuum-only-database-stats", "Only Database Stats"),
                                                    helperText: t("vacuum-only-database-stats-tooltip", "Only update database-wide statistics"),
                                                    disabled: (values) => values.skip_database_stats === true,
                                                } as IDialogBooleanField
                                            ]
                                        }
                                    ] : []),
                                    {
                                        type: "boolean",
                                        key: "disable_page_skipping",
                                        label: t("vacuum-disable-page-skipping", "Disable Page Skipping"),
                                        helperText: t("vacuum-disable-page-skipping-tooltip", "Disable skipping of pages that are known to contain no dead tuples"),
                                        disabled: (values) => values.full === true,
                                    } as IDialogBooleanField,
                                    ...(versionNumber >= 130000 ? [
                                        {
                                            type: "boolean",
                                            key: "skip_locked",
                                            label: t("vacuum-skip-locked", "Skip Locked"),
                                            helperText: t("vacuum-skip-locked-tooltip", "Skip pages that are locked by other transactions"),
                                            disabled: (values) => values.full === true || values.freeze === true,
                                        } as IDialogBooleanField,
                                        {
                                            type: "boolean",
                                            key: "index_cleanup",
                                            label: t("vacuum-index-cleanup", "Index Cleanup"),
                                            helperText: t("vacuum-index-cleanup-tooltip", "Specifies whether to clean up indexes"),
                                            disabled: (values) => values.full === true,
                                        } as IDialogBooleanField,
                                        {
                                            type: "boolean",
                                            key: "truncate",
                                            label: t("vacuum-truncate", "Truncate"),
                                            helperText: t("vacuum-truncate-tooltip", "Specifies whether to truncate empty pages at the end of the table"),
                                            disabled: (values) => values.full === true,
                                        } as IDialogBooleanField,
                                    ] : []),
                                    ...(versionNumber >= 140000 ? [
                                        {
                                            type: "number",
                                            key: "parallel",
                                            label: t("vacuum-parallel", "Parallel"),
                                            helperText: t("vacuum-parallel-tooltip", "Use multiple worker processes to vacuum the table"),
                                            min: 0,
                                            max: 16,
                                            width: "30%",
                                            disabled: (values) => values.full === true || values.index_cleanup === false,
                                        } as IDialogNumberField,
                                    ] : []),
                                    ...(versionNumber >= 160000 ? [
                                        {
                                            type: "row",
                                            items: [{
                                                type: "boolean",
                                                key: "process_main",
                                                label: t("vacuum-process-main", "Process Main"),
                                                helperText: t("vacuum-process-main-tooltip", "Vacuum the main table (default). Disable to vacuum only the TOAST table."),
                                                disabled: (values) => values.process_main === true && values.process_toast !== true,
                                            } as IDialogBooleanField,
                                            {
                                                type: "boolean",
                                                key: "process_toast",
                                                label: t("vacuum-process-toast", "Process TOAST"),
                                                helperText: t("vacuum-process-toast-tooltip", "Vacuum the TOAST table. Disable to vacuum only the main table (default)."),
                                                disabled: (values) => values.process_toast === true && values.process_main !== true,
                                            } as IDialogBooleanField,
                                            ]
                                        } as IDialogRow,
                                        {
                                            type: "number",
                                            key: "buffer_usage_limit",
                                            label: t("vacuum-buffer-usage-limit", "Buffer Usage Limit (MB)"),
                                            helperText: t("vacuum-buffer-usage-limit-tooltip", "Sets the maximum number of shared buffers that can be used by the VACUUM operation"),
                                            disabled: (values) => values.full === true,
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
        confirmLabel: () => t("vacuum", "Vacuum"),
        onOpen: (values) => {
            values.sql = vacuumSql(values);
        },
        onConfirm: onConfirm,
        onChange(values) {
            values.sql = vacuumSql(values);
        },
    } as IDialogSlot;
}