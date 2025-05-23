import React, { forwardRef } from "react";
import StatusBar, { StatusBarButton, StatusBarProps } from "@renderer/app/StatusBar";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { DataGridStatus } from "./DataGridTypes";

interface DataGridStatusBarProps extends StatusBarProps {
    status?: DataGridStatus; // Optional status prop
    buttons?: {
        first?: React.ReactNode;
        last?: React.ReactNode;
    };
}

const DataGridStatusBar = forwardRef<HTMLDivElement, DataGridStatusBarProps>(({ status, buttons, ...other }, ref) => {
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
                    (status?.columnCount ?? 0) > 0 && <StatusBarButton key="position">
                        {t("dataGrid-status-position", "Col {{column}}, Row {{row}}", {
                            column: status?.position?.column !== undefined ? status.position.column + 1 : "-",
                            row: status?.position?.row !== undefined ? status.position.row + 1 : "-",
                        })}
                    </StatusBarButton>,
                    (status?.columnCount ?? 0) > 0 && <StatusBarButton key="dataRange">
                        {t("dataGrid-status-dataRange", "Cols {{columns}}, Rows {{rows}} of {{allRows}}", {
                            columns: status?.columnCount,
                            rows: status?.rowCount,
                            allRows: status?.dataRowCount,
                        })}
                    </StatusBarButton>,
                    (status?.selectedRowCount ?? 0) > 0 && (
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