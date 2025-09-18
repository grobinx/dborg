import React from "react";
import { useTheme } from "@mui/material/styles";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { useQueryHistory } from "@renderer/contexts/QueryHistoryContext";
import { useTranslation } from "react-i18next";
import { ColumnDefinition } from "../DataGrid/DataGridTypes";
import TabPanelContent, { TabPanelContentProps } from "../TabsPanel/TabPanelContent";
import { DataGrid } from "../DataGrid/DataGrid";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import Tooltip from "../Tooltip";
import { ToolButton } from "../buttons/ToolButton";

export const QueryHistoryPanel: React.FC<TabPanelContentProps> = () => {
    const { queryHistory } = useQueryHistory();
    const { t } = useTranslation();
    const [panelRef, panelVisible] = useVisibleState<HTMLDivElement>();

    // Kolumny dla DataGrid
    const columns: ColumnDefinition[] = [
        { key: "schema", label: t("schema", "Schema"), dataType: "string", width: 200 },
        {
            key: "query", label: t("query", "Query"), dataType: "string", width: 300, formatter: (value) => {
                return String(value).replace(/\s+/g, " ").trim();
            }
        },
        { key: "executionTime", label: t("execution-time", "Execution Time"), dataType: "duration", width: 130 },
        { key: "fetchTime", label: t("fetch-time", "Fetch Time"), dataType: "duration", width: 130 },
        { key: "rows", label: t("rows", "Rows"), dataType: "number", width: 100 },
        { key: "error", label: t("error", "Error"), dataType: "string", width: 300 },
        { key: "startTime", label: t("start-time", "Start Time"), dataType: "datetime", width: 200 },
    ];

    return (
        <TabPanelContent className="QueryHistoryPanel-root" ref={panelRef}>
            {panelVisible && (
                <DataGrid
                    data={queryHistory.map((entry, index) => ({ id: index, ...entry }))}
                    columns={columns}
                    autoSaveId="query-history-grid"
                />
            )}
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