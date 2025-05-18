import React, { useState, useRef, useEffect } from "react";
import { ColumnDefinition, DataGridActionContext, DataGridContext, DataGridStatus, TableCellPosition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession, IDatabaseSessionCursor } from "@renderer/contexts/DatabaseSession";
import { useTranslation } from "react-i18next";
import { Box, Stack, Tooltip, useTheme } from "@mui/material";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import ToolButton from "@renderer/components/ToolButton";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import { queryToDataGridColumns } from "@renderer/components/DataGrid/DataGridUtils";
import { DataGrid } from "@renderer/components/DataGrid/DataGrid";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { useNotification } from "@renderer/contexts/NotificationContext";
import DataGridStatusBar from "@renderer/components/DataGrid/DataGridStatusBar";
import { StatusBarButton } from "@renderer/app/StatusBar";
import { Duration } from "luxon";
import { TAB_PANEL_LENGTH, TabPanelChangedMessage, TabPanelClickMessage, TabPanelLengthMessage } from "@renderer/app/Messages";
import { SQL_RESULT_CLOSE } from "./ResultsTabs";
import { SQL_EDITOR_EXECUTE_QUERY, SQL_EDITOR_SHOW_STRUCTURE } from "./SqlEditorPanel";
import { QueryResultRow } from "src/api/db";
import { useFocus } from "@renderer/hooks/useFocus";

export const SQL_RESULT_SQL_QUERY_EXECUTING = "sqlResult:sqlQueryExecuting";

interface SqlResultContentProps {
    session: IDatabaseSession;
    itemID?: string;
    tabsItemID?: string;
    hidden?: boolean;
}

export const SqlResultContent: React.FC<SqlResultContentProps> = (props) => {
    const { session, itemID, tabsItemID, hidden } = props;
    const theme = useTheme();
    const { subscribe, unsubscribe, sendMessage } = useMessages();
    const [columns, setColumns] = React.useState<ColumnDefinition[] | null>(null);
    const [rows, setRows] = React.useState<object[] | null>(null);
    const [active, setActive] = React.useState(false);
    const [query, setQuery] = React.useState<string | null>(null);
    const lastQuery = useRef<string | null>(null);
    const [executing, setExecuting] = React.useState<boolean | null>(null);
    const [rowsFetched, setRowsFetched] = React.useState<number | null>(null);
    const { addNotification } = useNotification();
    const [forceQueryExecution, setForceQueryExecution] = React.useState(false);
    const statusBarRef = useRef<HTMLDivElement>(null);
    const [boxHeight, setBoxHeight] = useState<string>("100%");
    const [dataGridStatus, setDataGridStatus] = useState<DataGridStatus | undefined>(undefined);
    const [queryDuration, setQueryDuration] = useState<number | null>(null); // Dodano queryDuration
    const dataGridRef = useRef<DataGridActionContext<any> | null>(null);
    const cancelLoading = useRef(false);
    const cancelExecution = useRef<() => void>(null);

    const onMountHandle = (context: DataGridContext<any>) => {
        context.addAction({
            id: "refresh-query",
            label: "Refresh query",
            icon: <theme.icons.Refresh />,
            keybindings: ["F5"],
            run: (_context) => {
                setForceQueryExecution((prev) => !prev);
            },
        });
    };

    useEffect(() => {
        const observer = new ResizeObserver(() => {
            if (statusBarRef.current) {
                const statusBarHeight = statusBarRef.current.offsetHeight;
                setBoxHeight(`calc(100% - ${statusBarHeight}px)`);
            }
        });

        if (statusBarRef.current) {
            observer.observe(statusBarRef.current);
        }

        return () => {
            if (statusBarRef.current) {
                observer.unobserve(statusBarRef.current);
            }
            observer.disconnect();
        };
    }, []);

    React.useEffect(() => {
        const fetchData = async () => {
            if (query) {
                let cellPosition: TableCellPosition | null = null;
                if (query === lastQuery.current && dataGridRef.current && dataGridRef.current.isFocused()) {
                    cellPosition = dataGridRef.current.getPosition();
                }
                let time = Date.now();
                cancelLoading.current = false;
                setExecuting(true);
                setRowsFetched(null);
                setQueryDuration(null);
                const rows: QueryResultRow[] = [];
                let cursor: IDatabaseSessionCursor | undefined;
                try {
                    cursor = await session.open(query);
                    if (session.info.driver.implements.includes("cancel")) {
                        cancelExecution.current = () => {
                            if (cursor) {
                                cursor.cancel();
                            }
                        }
                    }
                    const fetchedRows = await cursor.fetch();
                    cancelExecution.current = null;
                    const info = await cursor.getCursorInfo();
                    rows.push(...fetchedRows);
                    while (!cursor.isEnd() && !cancelLoading.current) {
                        const nextRows = await cursor.fetch();
                        rows.push(...nextRows);
                        if (Date.now() - time > 1000) {
                            setRowsFetched(rows.length);
                            time = Date.now();
                        }
                    }
                    lastQuery.current = query;
                    setQueryDuration(info.duration ?? null);
                    setColumns(queryToDataGridColumns(info.columns ?? [], fetchedRows))
                    setRows(rows);
                    if (cellPosition) {
                        setTimeout(() => {
                            if (dataGridRef.current) {
                                dataGridRef.current.setPosition(cellPosition);
                                dataGridRef.current.focus();
                            }
                        }, 10);
                    }
                } catch (error) {
                    addNotification("error", "Error executing query", { reason: error, source: session.schema.sch_name });
                    setColumns([]);
                    setRows([]);
                } finally {
                    setExecuting(false);
                    setRowsFetched(null);
                    if (cursor) {
                        try {
                            await cursor.close();
                        } catch (error) {
                            addNotification("error", "Error executing query", { reason: error, source: session.schema.sch_name });
                        }
                    }
                }
            }
        };

        fetchData();
    }, [session, query, forceQueryExecution]); // Dodano forceQueryExecution jako zależność

    React.useEffect(() => {
        if (executing === null) {
            return;
        }
        sendMessage(SQL_RESULT_SQL_QUERY_EXECUTING, { to: itemID, from: itemID, status: executing });
        sendMessage(SQL_RESULT_SQL_QUERY_EXECUTING, { to: session.info.uniqueId, from: itemID, status: executing });
    }, [executing, itemID, session.info.uniqueId]);

    React.useEffect(() => {
        const handleSwitchTabMessage = (message: TabPanelChangedMessage) => {
            if (tabsItemID === message.tabsItemID) {
                const newActive = message.itemID === itemID;
                if (newActive !== active) {
                    setActive(newActive);
                    if (active && dataGridRef.current) {
                        dataGridRef.current.focus(); // Ustaw fokus na DataGrid
                    }
                }
            }
        };
        const handleTabPanelClick = (message: TabPanelClickMessage) => {
            if (message.itemID === itemID && dataGridRef.current) {
                dataGridRef.current.focus();
            }
        }

        const handleSqlExecute = (message: { to: string, from: string, query: string }) => {
            if (message.to !== session.info.uniqueId || executing) {
                return;
            }
            if (active) {
                setQuery(message.query);
                setForceQueryExecution((prev) => !prev); // Wymuszenie odświeżenia
            }
        };

        const handleShowStructure = (message: { to: string, from: string, data: any[], columns: ColumnDefinition[] }) => {
            if (message.to !== session.info.uniqueId) {
                return;
            }
            if (active) {
                setQuery(null);
                setQueryDuration(null);
                setColumns(message.columns);
                setRows(message.data);
            }
        };

        subscribe(SQL_EDITOR_EXECUTE_QUERY, handleSqlExecute);
        subscribe(SQL_EDITOR_SHOW_STRUCTURE, handleShowStructure);
        subscribe(Messages.TAB_PANEL_CLICK, handleTabPanelClick);
        subscribe(Messages.TAB_PANEL_CHANGED, handleSwitchTabMessage);
        return () => {
            unsubscribe(SQL_EDITOR_EXECUTE_QUERY, handleSqlExecute);
            unsubscribe(SQL_EDITOR_SHOW_STRUCTURE, handleShowStructure);
            unsubscribe(Messages.TAB_PANEL_CLICK, handleTabPanelClick);
            unsubscribe(Messages.TAB_PANEL_CHANGED, handleSwitchTabMessage);
        };
    }, [tabsItemID, itemID, active, executing]);

    return (
        <Stack
            direction="column"
            sx={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    height: boxHeight, // Dynamiczna wysokość Box
                }}
            >
                <DataGrid
                    columns={columns ?? []}
                    data={rows ?? []}
                    dataTable={true}
                    columnsResizable={true}
                    loading={rowsFetched ?? 0 > 0 ? `Fetching data... ${rowsFetched} rows` : executing ? "Executing..." : undefined}
                    onCancelLoading={
                        (cancelExecution.current || rowsFetched !== undefined) ?
                            () => {
                                cancelLoading.current = true;
                                if (cancelExecution.current) {
                                    cancelExecution.current();
                                }
                            }
                            : undefined
                    }
                    active={active}
                    onChange={(status) => setDataGridStatus(status)}
                    onMount={onMountHandle}
                    ref={dataGridRef}
                />
            </Box>
            <DataGridStatusBar
                ref={statusBarRef}
                status={dataGridStatus}
                style={{
                    zIndex: 3,
                }}
                buttons={{
                    last: [
                        <StatusBarButton key="queryDuration">
                            {queryDuration !== null ?
                                `Duration ${Duration.fromMillis(queryDuration)
                                    .shiftTo("hour", "minutes", "seconds")
                                    .toHuman({ unitDisplay: 'narrow' })}`
                                : "No Query"}
                        </StatusBarButton>,
                        dataGridStatus?.column?.info && (
                            <StatusBarButton key="column-type">
                                {`Type ${dataGridStatus.column.info.typeName} (${dataGridStatus.column.info.dataType}) (${dataGridStatus.valueType})`}
                            </StatusBarButton>),
                        dataGridStatus?.valueLength && (
                            <StatusBarButton key="value-length">
                                {`Len ${dataGridStatus.valueLength}`}
                            </StatusBarButton>),
                    ],
                }}
            />
        </Stack>
    );
};

interface SqlResultLabelProps {
    session: IDatabaseSession;
    itemID?: string;
    tabsItemID?: string;
}

export const SqlResultLabel: React.FC<SqlResultLabelProps> = (props) => {
    const { session, itemID, tabsItemID } = props;
    const theme = useTheme();
    const { subscribe, unsubscribe, sendMessage } = useMessages();
    const [label, setLabel] = useState<string>("Result");
    const [tabsLength, setTabsLength] = React.useState<number | null>(null); // Domyślnie 1 zakładka
    const [active, setActive] = React.useState(false);
    const [executing, setExecuting] = React.useState(false); // Dodano stan dla wykonywania zapytania
    const [showLoading, setShowLoading] = React.useState(false); // Stan dla opóźnionego efektu ładowania
    const [highlight, setHighlight] = React.useState(false); // Stan dla zmiany koloru

    React.useEffect(() => {
        const handleTabPanelChangedMessage = (message: TabPanelChangedMessage) => {
            if (tabsItemID === message.tabsItemID) {
                const newActive = message.itemID === itemID;
                if (newActive !== active) {
                    setActive(newActive);
                    if (newActive) {
                        setHighlight(false); // Resetuj kolor, gdy zakładka staje się aktywna
                    }
                }
            }
        };

        const handleTabsLengthChange = (message: TabPanelLengthMessage) => {
            if (tabsItemID !== message.tabsItemID) {
                return; // Sprawdź, czy tabsItemID się zgadza
            }
            setTabsLength(message.length);
        };

        const handleQueryExecuting = (message: { to: string, status: boolean }) => {
            if (message.to !== itemID) {
                return; // Ignoruj wiadomości, które nie są skierowane do tego elementu
            }
            setExecuting(message.status); // Aktualizuj stan wykonywania zapytania
            if (!message.status && !active) {
                setHighlight(true); // Ustaw kolor, gdy zapytanie zakończy się i zakładka nie jest aktywna
            }
        };

        subscribe(Messages.TAB_PANEL_CHANGED, handleTabPanelChangedMessage);
        subscribe(TAB_PANEL_LENGTH, handleTabsLengthChange);
        subscribe(SQL_RESULT_SQL_QUERY_EXECUTING, handleQueryExecuting);
        return () => {
            unsubscribe(Messages.TAB_PANEL_CHANGED, handleTabPanelChangedMessage);
            unsubscribe(TAB_PANEL_LENGTH, handleTabsLengthChange);
            unsubscribe(SQL_RESULT_SQL_QUERY_EXECUTING, handleQueryExecuting);
        };
    }, [tabsItemID, itemID, active]);

    React.useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;

        if (executing) {
            timeout = setTimeout(() => {
                setShowLoading(true); // Pokaż efekt ładowania po 1000 ms
            }, 1000);
        } else {
            setShowLoading(false); // Ukryj efekt ładowania natychmiast, gdy zapytanie się zakończy
            if (timeout) {
                clearTimeout(timeout);
            }
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [executing]);

    return (
        <TabPanelLabel>
            {showLoading ? (
                <theme.icons.Loading /> // Wyświetl ikonę Loading po opóźnieniu
            ) : (
                <theme.icons.DatabaseTables /> // Wyświetl domyślną ikonę, gdy nie ma ładowania
            )}
            <span style={{ color: highlight ? theme.palette.success.light : undefined }}>{label}</span>
            <ToolButton
                color="error"
                onClick={() => sendMessage(SQL_RESULT_CLOSE, itemID)}
                size="small"
                disabled={!active || /* (tabsLength ?? 0) <= 1 ||  */executing}
            >
                <theme.icons.Close />
            </ToolButton>
        </TabPanelLabel>
    );
};

interface SqlResultButtonsProps {
    session: IDatabaseSession;
    itemID?: string;
    tabsItemID?: string;
}

export const SqlResultButtons: React.FC<SqlResultButtonsProps> = (props) => {
    const { session, itemID, tabsItemID } = props;
    const { t } = useTranslation();
    const theme = useTheme();

    return (
        <TabPanelButtons>
        </TabPanelButtons>
    );
};