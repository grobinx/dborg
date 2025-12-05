import React from "react";
import { useTheme } from "@mui/material/styles";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { useQueryHistory } from "@renderer/contexts/QueryHistoryContext";
import { useTranslation } from "react-i18next";
import { ColumnDefinition } from "../DataGrid/DataGridTypes";
import TabPanelContent, { TabPanelContentProps } from "../TabsPanel/TabPanelContent";
import { DataGrid } from "../DataGrid/DataGrid";
import Tooltip from "../Tooltip";
import { ToolButton } from "../buttons/ToolButton";

export const QueryHistoryPanel: React.FC<TabPanelContentProps> = () => {
    const { queryHistory } = useQueryHistory();
    const { t } = useTranslation();

    // Kolumny dla DataGrid
    const columns: ColumnDefinition[] = [
        { key: "qh_profile_name", label: t("profile", "Profile"), dataType: "string", width: 200 },
        {
            key: "qh_query", label: t("query", "Query"), dataType: "string", width: 300, formatter: (value) => {
                return String(value).replace(/\s+/g, " ").trim();
            }
        },
        { key: "qh_execution_time", label: t("execution-time", "Execution Time"), dataType: "duration", width: 130 },
        { key: "qh_fetch_time", label: t("fetch-time", "Fetch Time"), dataType: "duration", width: 130 },
        { key: "qh_rows", label: t("rows", "Rows"), dataType: "number", width: 100 },
        { key: "qh_error", label: t("error", "Error"), dataType: "string", width: 300 },
        { key: "qh_start_time", label: t("start-time", "Start Time"), dataType: "datetime", width: 200 },
    ];

    return (
        <TabPanelContent className="QueryHistoryPanel-root">
            <DataGrid
                data={queryHistory.map((entry, index) => ({ id: index, ...entry }))}
                columns={columns}
                autoSaveId="query-history-grid"
            />
        </TabPanelContent>
    );
};

export const QueryHistoryPanelLabel: React.FC = () => {
    return (
        <TabPanelLabel>
            <span>Query history</span>
        </TabPanelLabel>
    );
};

export const QueryHistoryPanelButtons: React.FC = () => {
    const { queryHistory, clearQueryHistory } = useQueryHistory();
    const theme = useTheme();
    const { t } = useTranslation();

    return <TabPanelButtons>
        <Tooltip title={t("queryHistory-clear-all", "Clear query history")}>
            <ToolButton
                size="small"
                disabled={queryHistory.length === 0}
                onClick={() => clearQueryHistory()}
            >
                <theme.icons.Delete />
            </ToolButton>
        </Tooltip>
    </TabPanelButtons>;
};

export default QueryHistoryPanel;