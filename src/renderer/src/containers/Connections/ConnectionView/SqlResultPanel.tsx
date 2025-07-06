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
import { SqlAnalyzer, SqlAstBuilder, SqlTokenizer } from "sql-taaf";
import ToolTextField from "@renderer/components/ToolTextField";
import { ToolLabel } from "@renderer/components/ToolLabel";
import { useQueryHistory } from "../../../contexts/QueryHistoryContext";

export const SQL_RESULT_SQL_QUERY_EXECUTING = "sqlResult:sqlQueryExecuting";
const SQL_RESULT_SET_MAX_FETCH_SIZE = "sqlResult:setMaxFetchSize";
const SQL_RESULT_GET_MAX_FETCH_SIZE = "sqlResult:getMaxFetchSize";

interface SqlResultContentProps {
    session: IDatabaseSession;
    itemID?: string;
    tabsItemID?: string;
    hidden?: boolean;
}

export const SqlResultContent: React.FC<SqlResultContentProps> = (props) => {
    const { session, itemID, tabsItemID, hidden } = props;
    const theme = useTheme();
    const { t } = useTranslation();
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
    const [queryDuration, setQueryDuration] = useState<number | null>(null);
    const [fetchDuration, setFetchDuration] = useState<number | null>(null);
    const [updatedCount, setUpdatedCount] = useState<number | null>(null);
    const dataGridRef = useRef<DataGridActionContext<any> | null>(null);
    const cancelLoading = useRef(false);
    const cancelExecution = useRef<() => void>(null);
    const [maxFetchSize, setMaxFetchSize] = useState<string | undefined>(undefined);
    const { addQueryToHistory } = useQueryHistory();

    useEffect(() => {
        if (session.info.driver.maxFetchSizeProperty && session.info.driver.properties[session.info.driver.maxFetchSizeProperty]) {
            const maxFetchSize = session.info.driver.properties[session.info.driver.maxFetchSizeProperty];
            sendMessage(SQL_RESULT_SET_MAX_FETCH_SIZE, { to: itemID, maxFetchSize });
        }
    }, [session, itemID]);

    const onMountHandle = (context: DataGridContext<any>) => {
        context.addAction({
            id: "refresh-query",
            label: t("refresh-query", "Refresh query"),
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
            let cellPosition: TableCellPosition | null = null;
            if (query === lastQuery.current && dataGridRef.current && dataGridRef.current.isFocused()) {
                cellPosition = dataGridRef.current.getPosition();
            }
            let time = Date.now();
            cancelLoading.current = false;
            setUpdatedCount(null);
            setExecuting(true);
            setRowsFetched(null);
            setQueryDuration(null);
            setFetchDuration(null);
            const rows: QueryResultRow[] = [];
            let cursor: IDatabaseSessionCursor | undefined;
            try {
                const startTime = Date.now();
                cursor = await session.open(query!, undefined, maxFetchSize ? Number(maxFetchSize) : undefined);
                if (session.info.driver.implements.includes("cancel")) {
                    cancelExecution.current = () => {
                        if (cursor) {
                            cursor.cancel();
                        }
                    }
                }
                const fetchedRows = await cursor.fetch();
                let fetchTime = Date.now();
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
                fetchTime = Date.now() - fetchTime; 
                setFetchDuration(fetchTime);
                setColumns(queryToDataGridColumns(info.columns ?? []))
                setRows(rows);
                if (cellPosition) {
                    setTimeout(() => {
                        if (dataGridRef.current) {
                            dataGridRef.current.setPosition(cellPosition);
                            dataGridRef.current.focus();
                        }
                    }, 10);
                }
                addQueryToHistory({
                    query: query!,
                    schema: session.schema.sch_name,
                    executionTime: info.duration,
                    fetchTime: fetchTime,
                    rows: rows.length,
                    startTime: startTime,
                });
            } catch (error) {
                addNotification("error", "Error executing query", { reason: error, source: session.schema.sch_name });
                setColumns([]);
                setRows([]);
                addQueryToHistory({
                    query: query!,
                    schema: session.schema.sch_name,
                    error: (typeof error === "object" && error !== null && "message" in error)
                        ? (error as { message: string }).message
                        : String(error),
                    startTime: Date.now(),
                });
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
        };

        const executeCommand = async () => {
            try {
                cancelLoading.current = false;
                setUpdatedCount(null);
                setExecuting(true);
                setRowsFetched(null);
                setQueryDuration(null);
                const result = await session.execute(query!);
                if (result.rows) {
                    setRows(result.rows);
                    setColumns(queryToDataGridColumns(result.columns ?? []));
                }
                else {
                    setRows([]);
                    setColumns([]);
                }
                lastQuery.current = query;
                setQueryDuration(result.duration ?? null);
                setUpdatedCount(result.updateCount ?? null);
                addQueryToHistory({
                    query: query!,
                    schema: session.schema.sch_name,
                    executionTime: result.duration,
                    rows: result.updateCount ?? undefined,
                    startTime: Date.now(),
                });
            } catch (error) {
                addNotification("error", "Error executing command", { reason: error, source: session.schema.sch_name });
                addQueryToHistory({
                    query: query!,
                    schema: session.schema.sch_name,
                    error: (typeof error === "object" && error !== null && "message" in error)
                        ? (error as { message: string }).message
                        : String(error),
                    startTime: Date.now(),
                });
            }
            finally {
                setExecuting(false);
            }
        };

        const isSelect = () => {
            const tokens = new SqlTokenizer().parse(query!);
            const ast = new SqlAstBuilder().build(tokens);
            if (ast) {
                const detected = new SqlAnalyzer().detect(ast);
                if (detected && !detected.batch && detected.type === "SELECT") {
                    return true;
                }
            }
            return false;
        }

        if (query) {
            if (isSelect()) {
                fetchData();
            }
            else {
                executeCommand();
            }
        }
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

        const handleSetMaxFetchSize = (message: { to: string, maxFetchSize: string | undefined }) => {
            if (message.to !== itemID) {
                return;
            }
            setMaxFetchSize(message.maxFetchSize);
        };

        const handleGetMaxFetchSize = (message: { to: string }) => {
            if (message.to !== itemID) {
                return;
            }
            return maxFetchSize;
        };

        subscribe(SQL_EDITOR_EXECUTE_QUERY, handleSqlExecute);
        subscribe(SQL_EDITOR_SHOW_STRUCTURE, handleShowStructure);
        subscribe(Messages.TAB_PANEL_CLICK, handleTabPanelClick);
        subscribe(Messages.TAB_PANEL_CHANGED, handleSwitchTabMessage);
        subscribe(SQL_RESULT_SET_MAX_FETCH_SIZE, handleSetMaxFetchSize);
        subscribe(SQL_RESULT_GET_MAX_FETCH_SIZE, handleGetMaxFetchSize);
        return () => {
            unsubscribe(SQL_EDITOR_EXECUTE_QUERY, handleSqlExecute);
            unsubscribe(SQL_EDITOR_SHOW_STRUCTURE, handleShowStructure);
            unsubscribe(Messages.TAB_PANEL_CLICK, handleTabPanelClick);
            unsubscribe(Messages.TAB_PANEL_CHANGED, handleSwitchTabMessage);
            unsubscribe(SQL_RESULT_SET_MAX_FETCH_SIZE, handleSetMaxFetchSize);
            unsubscribe(SQL_RESULT_GET_MAX_FETCH_SIZE, handleGetMaxFetchSize);
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
                    mode="data"
                    columnsResizable={true}
                    loading={
                        rowsFetched ?? 0 > 0 ?
                            t("fetching-data---", `Fetching data... {{rowsFetched}} rows`, { rowsFetched })
                            : executing ?
                                t("executing---", "Executing...")
                                : undefined
                    }
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
                    autoSaveId={session.schema.sch_id}
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
                            {queryDuration !== null
                                ? t(
                                    "query-duration",
                                    "Duration {{duration}}, fetch {{fetch}}",
                                    {
                                        duration: Duration.fromMillis(queryDuration)
                                            .shiftTo("hour", "minutes", "seconds")
                                            .normalize()
                                            .toHuman({ unitDisplay: "narrow" }),
                                        fetch: Duration.fromMillis(fetchDuration ?? 0)
                                            .shiftTo("minutes", "seconds")
                                            .normalize()
                                            .toHuman({ unitDisplay: "narrow" })
                                    }
                                )
                                : executing ? t("executing---", "Executing...") : t("no-query", "No Query")}
                        </StatusBarButton>,
                        updatedCount !== null && (
                            <StatusBarButton key="command-updated">
                                {t("updated-rows", "Updated {{count}} row(s)", { count: updatedCount })}
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

    return (
        <TabPanelLabel>
            {executing ? (
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
    const { sendMessage } = useMessages();
    const [maxFetchSize, setMaxFetchSize] = React.useState<string>("");

    React.useEffect(() => {
        const fetchMaxFetchSize = async () => {
            const result = await sendMessage(SQL_RESULT_GET_MAX_FETCH_SIZE, { to: itemID });
            setMaxFetchSize(result ?? "");
        };

        fetchMaxFetchSize();
    }, [itemID]);

    return (
        <TabPanelButtons>
            <ToolLabel label={t("Fetch", "Fetch")} />
            <ToolTextField
                style={{ width: 6 * 10 }}
                value={maxFetchSize}
                onChange={(e) => {
                    const value = e.target.value;
                    setMaxFetchSize(value); // Aktualizuj lokalny stan
                    sendMessage(SQL_RESULT_SET_MAX_FETCH_SIZE, { to: itemID, maxFetchSize: value !== "" ? value : undefined });
                }}
                onKeyDown={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "Tab") {
                        e.preventDefault(); // Zablokuj wprowadzanie znaków innych niż cyfry
                    }
                }}
            />
        </TabPanelButtons>
    );
};