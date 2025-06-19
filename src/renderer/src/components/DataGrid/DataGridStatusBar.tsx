import React, { forwardRef } from "react";
import StatusBar, { StatusBarButton, StatusBarProps } from "@renderer/app/StatusBar";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { DataGridStatus } from "./DataGridTypes";

export type DataGridStatusPart =
    "position"
    | "data-range"
    | "data-rows"
    | "column-type"
    | "value-length"
    | "selected-rows";

interface DataGridStatusBarProps extends StatusBarProps {
    status?: DataGridStatus; // Optional status prop
    statuses?: DataGridStatusPart[];
    buttons?: {
        first?: React.ReactNode;
        last?: React.ReactNode;
    };
}

const DataGridStatusBar = forwardRef<HTMLDivElement, DataGridStatusBarProps>(({
    status,
    statuses,
    buttons,
    ...other
}, ref) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <StatusBar
            {...other}
            ref={ref}
            className="DataGrid-statusBar"
            buttons={{
                first: [
                    ...React.Children.toArray(buttons?.first),
                    (status?.columnCount ?? 0) > 0 && (statuses?.includes("position") || !statuses) && (
                        <StatusBarButton key="position">
                            {t("dataGrid-status-position", "Col {{column}}, Row {{row}}", {
                                column: status?.position?.column !== undefined ? status.position.column + 1 : "-",
                                row: status?.position?.row !== undefined ? status.position.row + 1 : "-",
                            })}
                        </StatusBarButton>),
                    (status?.columnCount ?? 0) > 0 && (statuses?.includes("data-range") || !statuses) && (
                        <StatusBarButton key="dataRange">
                            {t("dataGrid-status-dataRange", "Cols {{columns}}, Rows {{rows}} of {{allRows}}", {
                                columns: status?.columnCount,
                                rows: status?.rowCount,
                                allRows: status?.dataRowCount,
                            })}
                        </StatusBarButton>),
                    (status?.columnCount ?? 0) > 0 && statuses?.includes("data-rows") && (
                        <StatusBarButton key="dataRows">
                            {t("dataGrid-status-dataRows", "Rows {{rows}} of {{allRows}}", {
                                rows: status?.rowCount,
                                allRows: status?.dataRowCount,
                            })}
                        </StatusBarButton>),
                    status?.column?.info && (statuses?.includes("column-type") || !statuses) && (
                        <StatusBarButton key="column-type">
                            {t(
                                "dataGrid-status-columnType",
                                "Type {{typeName}} ({{dataType}}) ({{valueType}})",
                                {
                                    typeName: status.column.info.typeName,
                                    dataType: status.column.info.dbDataType,
                                    valueType: status.column.info.dataType,
                                }
                            )}
                        </StatusBarButton>),
                    status?.valueLength && (statuses?.includes("value-length") || !statuses) && (
                        <StatusBarButton key="value-length">
                            {t("dataGrid-status-valueLength", "Len {{length}}", {
                                length: status.valueLength,
                            })}
                        </StatusBarButton>),
                    (status?.selectedRowCount ?? 0) > 0 && (statuses?.includes("selected-rows") || !statuses) && (
                        <StatusBarButton key="selected">
                            {t("dataGrid-status-selectedRows", "{{count}} selected row(s)", {
                                count: status?.selectedRowCount ?? 0,
                            })}
                        </StatusBarButton>
                    ),
                    ...React.Children.toArray(buttons?.last),
                ].filter(Boolean),
            }}
        />
    );
});

export default DataGridStatusBar;