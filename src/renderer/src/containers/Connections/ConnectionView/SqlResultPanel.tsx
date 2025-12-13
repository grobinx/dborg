import React, { useState, useRef, useEffect } from "react";
import { ColumnDefinition, DataGridActionContext, DataGridContext, DataGridStatus, TableCellPosition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession, IDatabaseSessionCursor } from "@renderer/contexts/DatabaseSession";
import { useTranslation } from "react-i18next";
import { Box, Stack, useTheme } from "@mui/material";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import { queryToDataGridColumns } from "@renderer/components/DataGrid/DataGridUtils";
import { DataGrid } from "@renderer/components/DataGrid/DataGrid";
import { useMessages } from "@renderer/contexts/MessageContext";
import { useToast } from "@renderer/contexts/ToastContext";
import DataGridStatusBar from "@renderer/components/DataGrid/DataGridStatusBar";
import { StatusBarButton } from "@renderer/app/StatusBar";
import { Duration } from "luxon";
import { SQL_RESULT_CLOSE } from "./ResultsTabs";
import { SQL_EDITOR_EXECUTE_QUERY, SQL_EDITOR_FOCUS, SQL_EDITOR_SHOW_STRUCTURE, SqlEditorExecuteQueryMessage } from "./SqlEditorPanel";
import { QueryResultRow } from "src/api/db";
import { SqlAnalyzer, SqlAstBuilder, SqlTokenizer } from "sql-taaf";
import { useQueryHistory } from "../../../contexts/QueryHistoryContext";
import { create } from "zustand";
import { useTabs } from "@renderer/components/TabsPanel/useTabs";
import { durationToHuman } from "@renderer/common";
import { NumberField } from "@renderer/components/inputs/NumberField";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { AutoRefreshBar, AutoRefreshState } from "@renderer/components/AutoRefreshBar";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import SqlParametersDialog from "@renderer/dialogs/SqlParametersDialog";
import { extractSqlParameters, mapSqlParamsToValues, replaceNamedParamsWithPositional, SqlParameterInfo, SqlParametersValue, SqlParameterValue } from "../../../../../../src/api/db/SqlParameters";

export const SQL_RESULT_SQL_QUERY_EXECUTING = "sqlResult:sqlQueryExecuting";

export const SQL_RESULT_FOCUS = "sql-result:focus";
export interface SqlResultFocusMessage {
    sessionId: string;
}

interface SqlResultState {
    tabs: {
        [id: string]: {
            maxFetchSize: number | null | undefined;
            executing: boolean;
            refreshQuery: boolean;
            resultLabel: string | null;
        };
    };
    setMaxFetchSize: (id: string, maxFetchSize: number | null | undefined) => void;
    setExecuting: (id: string, executing: boolean) => void;
    setRefreshQuery: (id: string) => void;
    setResultLabel: (id: string, resultLabel: string | null) => void;
    removeState: (id: string) => void;
}

const useSqlResultStore = create<SqlResultState>((set) => ({
    tabs: {},
    setMaxFetchSize: (id, maxFetchSize) => set((state) => ({
        tabs: {
            ...state.tabs,
            [id]: {
                ...state.tabs[id],
                maxFetchSize,
            },
        },
    })),
    setExecuting: (id, executing) => set((state) => ({
        tabs: {
            ...state.tabs,
            [id]: {
                ...state.tabs[id],
                executing,
            },
        },
    })),
    setRefreshQuery: (id) => set((state) => ({
        tabs: {
            ...state.tabs,
            [id]: {
                ...state.tabs[id],
                refreshQuery: !(state.tabs[id]?.refreshQuery ?? false),
            },
        },
    })),
    setResultLabel: (id, resultLabel) => set((state) => ({
        tabs: {
            ...state.tabs,
            [id]: {
                ...state.tabs[id],
                resultLabel,
            },
        },
    })),
    removeState: (id) => set((state) => {
        const newTabs = { ...state.tabs };
        delete newTabs[id];
        return { ...state, tabs: newTabs };
    }),
}));

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
    const { subscribe, queueMessage } = useMessages();
    const [columns, setColumns] = React.useState<ColumnDefinition[] | null>(null);
    const [rows, setRows] = React.useState<object[] | null>(null);
    const [query, setQuery] = React.useState<string | null>(null);
    const [oryginalQuery, setOryginalQuery] = React.useState<string | null>(null);
    const lastQuery = useRef<string | null>(null);
    const executingRef = useRef<boolean | null>(null);
    const [rowsFetched, setRowsFetched] = React.useState<number | null>(null);
    const addToast = useToast();
    const [dataGridStatus, setDataGridStatus] = useState<DataGridStatus | undefined>(undefined);
    const [queryDuration, setQueryDuration] = useState<number | null>(null);
    const [fetchDuration, setFetchDuration] = useState<number | null>(null);
    const [updatedCount, setUpdatedCount] = useState<number | null>(null);
    const dataGridRef = useRef<DataGridActionContext<any> | null>(null);
    const cancelLoading = useRef(false);
    const cancelExecution = useRef<() => void>(null);
    const maxFetchSize = useSqlResultStore((state) => state.tabs[itemID!]?.maxFetchSize);
    const setMaxFetchSize = useSqlResultStore((state) => state.setMaxFetchSize);
    const executing = useSqlResultStore((state) => state.tabs[itemID!]?.executing ?? false);
    const setExecuting = useSqlResultStore((state) => state.setExecuting);
    const refreshQuery = useSqlResultStore((state) => state.tabs[itemID!]?.refreshQuery ?? false);
    const setRefreshQuery = useSqlResultStore((state) => state.setRefreshQuery);
    const setResultLabel = useSqlResultStore((state) => state.setResultLabel);
    const removeTabState = useSqlResultStore((state) => state.removeState);
    const { addQueryToHistory } = useQueryHistory();
    const { tabIsActive, tabIsActiveRef } = useTabs(tabsItemID, itemID, () => {
        if (dataGridRef.current) {
            dataGridRef.current.focus();
        }
    });
    const [sqlParametersDialogOpen, setSqlParametersDialogOpen] = useState(false);
    const [sqlParameters, setSqlParameters] = useState<SqlParameterInfo[]>([]);
    // Resolver promisy dialogu parametrów
    const sqlParamsPromiseRef = useRef<{
        resolve: (v: Record<string, SqlParameterValue>) => void,
        reject: () => void
    } | null>(null);
    const [queryValues, setQueryValues] = useState<(any | null)[]>([]);

    // Funkcja otwierająca dialog i zwracająca Promise
    const askForSqlParams = (params: SqlParameterInfo[]): Promise<SqlParametersValue | null> => {
        setSqlParameters(params);
        setSqlParametersDialogOpen(true);
        return new Promise((resolve) => {
            sqlParamsPromiseRef.current = {
                resolve: (values) => resolve(values),
                reject: () => resolve(null)
            };
        });
    };

    useEffect(() => {
        executingRef.current = executing ?? false;
    }, [executing]);

    useEffect(() => {
        if (session.info.driver.maxFetchSizeProperty && session.info.driver.properties[session.info.driver.maxFetchSizeProperty]) {
            const maxFetchSize = session.info.driver.properties[session.info.driver.maxFetchSizeProperty];
            setMaxFetchSize(itemID!, maxFetchSize);
        }
        else {
            setMaxFetchSize(itemID!, null);
        }
        return () => removeTabState(itemID!);
    }, [session, itemID]);

    const onMountHandle = (context: DataGridContext<any>) => {
        context.addCommand("Ctrl+Tab", () => {
            queueMessage(SQL_EDITOR_FOCUS, { sessionId: session.info.uniqueId });
        });
        context.addAction({
            id: "refresh-query",
            label: t("refresh-query", "Refresh query"),
            icon: <theme.icons.Refresh />,
            keybindings: ["F5"],
            run: (_context) => {
                setRefreshQuery(itemID!);
            },
        });
    };

    React.useEffect(() => {
        const fetchData = async () => {
            let time = Date.now();
            cancelLoading.current = false;
            setUpdatedCount(null);
            setExecuting(itemID!, true);
            setRowsFetched(null);
            setQueryDuration(null);
            setFetchDuration(null);
            const rows: QueryResultRow[] = [];
            let cursor: IDatabaseSessionCursor | undefined;
            try {
                const startTime = Date.now();
                cursor = await session.open(query!, queryValues, maxFetchSize ? Number(maxFetchSize) : undefined);
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
                addQueryToHistory({
                    query: oryginalQuery!,
                    profileName: session.profile.sch_name,
                    executionTime: info.duration,
                    fetchTime: fetchTime,
                    rows: rows.length,
                    startTime: startTime,
                });
            } catch (error) {
                addToast("error", "Error executing query", { reason: error, source: session.profile.sch_name });
                setColumns([]);
                setRows([]);
                addQueryToHistory({
                    query: oryginalQuery!,
                    profileName: session.profile.sch_name,
                    error: (typeof error === "object" && error !== null && "message" in error)
                        ? (error as { message: string }).message
                        : String(error),
                    startTime: Date.now(),
                });
            } finally {
                setExecuting(itemID!, false);
                setRowsFetched(null);
                if (cursor) {
                    try {
                        await cursor.close();
                    } catch (error) {
                        addToast("error", "Error executing query", { reason: error, source: session.profile.sch_name });
                    }
                }
            }
        };

        const executeCommand = async () => {
            try {
                cancelLoading.current = false;
                setUpdatedCount(null);
                setExecuting(itemID!, true);
                setRowsFetched(null);
                setQueryDuration(null);
                const result = await session.execute(query!, queryValues);
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
                    query: oryginalQuery!,
                    profileName: session.profile.sch_name,
                    executionTime: result.duration,
                    rows: result.updateCount ?? undefined,
                    startTime: Date.now(),
                });
            } catch (error) {
                addToast("error", "Error executing command", { reason: error, source: session.profile.sch_name });
                addQueryToHistory({
                    query: oryginalQuery!,
                    profileName: session.profile.sch_name,
                    error: (typeof error === "object" && error !== null && "message" in error)
                        ? (error as { message: string }).message
                        : String(error),
                    startTime: Date.now(),
                });
            }
            finally {
                setExecuting(itemID!, false);
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
    }, [session, query, refreshQuery]);

    React.useEffect(() => {
        if (executing === null) {
            return;
        }
        queueMessage(SQL_RESULT_SQL_QUERY_EXECUTING, { to: itemID, from: itemID, status: executing });
        queueMessage(SQL_RESULT_SQL_QUERY_EXECUTING, { to: session.info.uniqueId, from: itemID, status: executing });
    }, [executing, itemID, session.info.uniqueId]);

    React.useEffect(() => {
        const extractFirstLineComment = (query: string): string | null => {
            const lines = query.trim().split('\n');
            if (lines.length === 0) return null;

            const firstLine = lines[0].trim();
            if (firstLine.startsWith('--')) {
                const comment = firstLine.substring(2).trim();
                return comment.length > 0 ? comment : null;
            }

            return null;
        };

        const handleSqlExecute = async (message: SqlEditorExecuteQueryMessage) => {
            if (message.to !== session.info.uniqueId || executingRef.current) {
                return;
            }
            const params = extractSqlParameters(message.query);

            let query = message.query;
            // Jeśli są parametry – poczekaj na wypełnienie/ANULUJ
            if (params.length) {
                const values = await askForSqlParams(params);
                if (values === null) {
                    // anulowano – nie ustawiaj query
                    return;
                }
                query = replaceNamedParamsWithPositional(query, params, session.info.driver.supports.parameterPlaceholder);
                setQueryValues(mapSqlParamsToValues(values, params));
            }
            else {
                setQueryValues([]);
            }

            if (tabIsActiveRef.current) {
                setQuery(query);
                setOryginalQuery(message.query);
                setResultLabel(itemID!, extractFirstLineComment(message.query));
                setRefreshQuery(itemID!);
            }
        };

        const handleShowStructure = (message: { to: string, from: string, data: any[], columns: ColumnDefinition[] }) => {
            if (message.to !== session.info.uniqueId) {
                return;
            }
            if (tabIsActiveRef.current) {
                setQuery(null);
                setResultLabel(itemID!, null);
                setQueryDuration(null);
                setColumns(message.columns);
                setRows(message.data);
            }
        };

        const unsubscribeExecuteQuery = subscribe(SQL_EDITOR_EXECUTE_QUERY, handleSqlExecute);
        const unsubscribeShowStructure = subscribe(SQL_EDITOR_SHOW_STRUCTURE, handleShowStructure);
        const unsubscribeResultFocus = subscribe(SQL_RESULT_FOCUS, (message: SqlResultFocusMessage) => {
            if (message.sessionId === session.info.uniqueId) {
                dataGridRef.current?.focus();
            }
        });
        return () => {
            unsubscribeExecuteQuery();
            unsubscribeShowStructure();
            unsubscribeResultFocus();
        };
    }, [tabsItemID, itemID]);

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
                    flex: 1, // Editor zajmuje pozostałą przestrzeń
                    overflow: "hidden",
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
                    active={tabIsActive}
                    onChange={(status) => setDataGridStatus(status)}
                    onMount={onMountHandle}
                    ref={dataGridRef}
                    autoSaveId={session.profile.sch_id}
                    canPivot={true}
                />
            </Box>
            <DataGridStatusBar
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
                                        duration: durationToHuman(Duration.fromMillis(queryDuration), { unitDisplay: "narrow" }),
                                        fetch: durationToHuman(Duration.fromMillis(fetchDuration ?? 0), { unitDisplay: "narrow" })
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
            <SqlParametersDialog
                profileId={session.profile.sch_id}
                open={sqlParametersDialogOpen}
                onClose={() => {
                    setSqlParametersDialogOpen(false);
                    sqlParamsPromiseRef.current?.reject();
                    sqlParamsPromiseRef.current = null;
                }}
                parameters={sqlParameters}
                onSubmit={(values: SqlParametersValue) => {
                    setSqlParametersDialogOpen(false);
                    sqlParamsPromiseRef.current?.resolve(values);
                    sqlParamsPromiseRef.current = null;
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
    const { subscribe, queueMessage } = useMessages();
    const { tabIsActive, tabIsActiveRef } = useTabs(tabsItemID, itemID);
    const [executing, setExecuting] = React.useState(false); // Dodano stan dla wykonywania zapytania
    const [highlight, setHighlight] = React.useState(false); // Stan dla zmiany koloru
    const resultLabel = useSqlResultStore((state) => state.tabs[itemID!]?.resultLabel ?? "Result");

    React.useEffect(() => {
        const handleQueryExecuting = (message: { to: string, status: boolean }) => {
            if (message.to !== itemID) {
                return; // Ignoruj wiadomości, które nie są skierowane do tego elementu
            }
            setExecuting(message.status); // Aktualizuj stan wykonywania zapytania
            if (!message.status && !tabIsActiveRef.current) {
                setHighlight(true); // Ustaw kolor, gdy zapytanie zakończy się i zakładka nie jest aktywna
            }
        };

        const unsubscribeQueryExecuting = subscribe(SQL_RESULT_SQL_QUERY_EXECUTING, handleQueryExecuting);
        return () => {
            unsubscribeQueryExecuting();
        };
    }, [tabsItemID, itemID]);

    React.useEffect(() => {
        if (highlight && tabIsActive) {
            setHighlight(false); // Usuń kolor, gdy zakładka stanie się aktywna
        }
    }, [tabIsActive, highlight]);

    return (
        <TabPanelLabel>
            {executing ? (
                <theme.icons.Loading /> // Wyświetl ikonę Loading po opóźnieniu
            ) : (
                <theme.icons.DatabaseTables /> // Wyświetl domyślną ikonę, gdy nie ma ładowania
            )}
            <span style={{ color: highlight ? theme.palette.success.light : undefined }}>{resultLabel}</span>
            <ToolButton
                component="div"
                color="main"
                onClick={() => queueMessage(SQL_RESULT_CLOSE, itemID)}
                size="small"
                disabled={!tabIsActive || /* (tabsLength ?? 0) <= 1 ||  */executing}
                dense
            >
                <theme.icons.Close color={!tabIsActive ? undefined : "error"} />
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
    const maxFetchSize = useSqlResultStore((state) => state.tabs[itemID!]?.maxFetchSize ?? null);
    const setMaxFetchSize = useSqlResultStore((state) => state.setMaxFetchSize);
    const executing = useSqlResultStore((state) => state.tabs[itemID!]?.executing ?? false);
    const setRefreshQuery = useSqlResultStore((state) => state.setRefreshQuery);
    const [barRef, isVisible] = useVisibleState<HTMLDivElement>();
    const [autorefreshState, setAutorefreshState] = React.useState<AutoRefreshState>("stopped");
    const lastActiveStateRef = React.useRef<AutoRefreshState>("stopped");

    React.useEffect(() => {
        if (autorefreshState !== "paused") {
            lastActiveStateRef.current = autorefreshState;
        }
    }, [autorefreshState]);

    React.useEffect(() => {
        if (isVisible === false) {
            if (autorefreshState !== "stopped") {
                setAutorefreshState("paused");
            }
        } else {
            if (autorefreshState === "paused") {
                setAutorefreshState(lastActiveStateRef.current);
            }
        }
    }, [isVisible, autorefreshState]);

    return (
        <TabPanelButtons ref={barRef}>
            <InputDecorator indicator={false}>
                <NumberField
                    placeholder={t("Fetch", "Fetch")}
                    width={6 * 12 + 8}
                    value={maxFetchSize}
                    onChange={(value) => {
                        if (maxFetchSize !== value) {
                            setMaxFetchSize(itemID!, value);
                        }
                    }}
                    size="small"
                    color="main"
                    min={0}
                    max={500000}
                    step={1000}
                />
            </InputDecorator>
            <AutoRefreshBar
                onTick={async () => {
                    setRefreshQuery(itemID!);
                }}
                canPause={false}
                executing={executing}
                state={autorefreshState}
                onStateChange={(newState) => {
                    setAutorefreshState(newState);
                }}
            />
        </TabPanelButtons>
    );
};