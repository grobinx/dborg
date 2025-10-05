import React, { useEffect } from "react";
import { styled, useTheme, useThemeProps } from "@mui/material/styles";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { getLogLevelColor, useConsole, LogLevel, DefaultLogLevels, LogEntry } from "@renderer/contexts/ConsoleContext";
import { useTranslation } from "react-i18next";
import TabPanelContent, { TabPanelContentOwnProps } from "../TabsPanel/TabPanelContent";
import { ListItem, ListItemText, ListItemIcon, MenuItem, Divider, Typography } from "@mui/material";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { List, RowComponentProps, useListRef } from "react-window";
import { SplitPanel, SplitPanelGroup, Splitter } from "../SplitPanel";
import { create } from "zustand";
import * as Messages from '../../app/Messages';
import { StatusBarButton } from "@renderer/app/StatusBar";
import { useMessages } from "@renderer/contexts/MessageContext";
import TabsPanel from "../TabsPanel/TabsPanel";
import TabPanel from "../TabsPanel/TabPanel";
import { ConsoleLogDetailsButtons, ConsoleLogDetailsContent, ConsoleLogDetailsLabel, ConsoleLogStackTraceButtons, ConsoleLogStackTraceContent, ConsoleLogStackTraceLabel, formatLogDetails, formatTime, StyledConsoleLogDetailsPanel } from "./ConsoleLogTabs";
import Tooltip from "../Tooltip";
import { useSetting } from "@renderer/contexts/SettingsContext";
import { SearchField } from "../inputs/SearchField";
import { InputDecorator } from "../inputs/decorators/InputDecorator";
import { IconButton } from "../buttons/IconButton";
import { SelectField } from "../inputs/SelectField";
import { appStatusBarButtons } from "@renderer/app/AppStatusBarRegistry";
import debounce from "@renderer/utils/debounce";

interface ConsoleLogState {
    showTime: boolean;
    search: string;
    toggleShowTime: () => void;
    setShowTime: (show: boolean) => void;
    setSearch: (search: string) => void;
}

export const useConsoleLogState = create<ConsoleLogState>((set) => ({
    showTime: false,
    search: "",
    toggleShowTime: () => set((state) => ({ showTime: !state.showTime })),
    setShowTime: (show: boolean) => set(() => ({ showTime: show })),
    setSearch: (search: string) => set(() => ({ search: search })),
}));

let searchTimeoutId: NodeJS.Timeout | undefined = undefined;

const StyledConsoleLogPanel = styled(List, {
    name: "ConsoleLogPanel",
    slot: "root",
    shouldForwardProp: (_prop) => true, // Przekazuj wszystkie właściwości do komponentu List
})(({ /*theme*/ }) => ({
    // Add styles for the list container if needed
}));

export interface ConsoleLogPanelProps extends TabPanelContentOwnProps {
    slotProps?: {
        list?: React.ComponentProps<typeof List>;
        item?: React.ComponentProps<typeof ListItem>;
        itemIcon?: React.ComponentProps<typeof ListItemIcon>;
        itemText?: React.ComponentProps<typeof ListItemText>;
        details?: React.ComponentProps<typeof StyledConsoleLogDetailsPanel>;
    };
    itemSize?: number; // Wysokość pojedynczego elementu listy
    overscanCount?: number; // Liczba dodatkowych elementów renderowanych poza widocznym obszarem
}

export const ConsoleLogPanel: React.FC<ConsoleLogPanelProps> = (props) => {
    const { slotProps, itemSize, overscanCount, ...other } = useThemeProps({ name: "ConsoleLogPanel", props: props });
    const { logs } = useConsole();
    const { t } = useTranslation();
    const theme = useTheme();
    const [panelRef, panelVisible] = useVisibleState<HTMLDivElement>();
    const [selectedItem, setSelectedItem] = React.useState<string | null>(null);
    const listRef = useListRef(null);
    const showTime = useConsoleLogState(state => state.showTime);
    const search = useConsoleLogState(state => state.search);
    const [displayLogs, setDisplayLogs] = React.useState<LogEntry[]>(logs);
    const [fontSize] = useSetting<number>("ui", "fontSize", 20);
    const [monospaceFontFamily] = useSetting("ui", "monospaceFontFamily");
    const [listItemSize, setListItemSize] = React.useState<number>(itemSize ?? (fontSize * 1.5));
    const [searchDelay] = useSetting<number>("app", "search.delay");

    const handleSelectItem = (id: string) => {
        setSelectedItem((prev) => (prev === id ? null : id)); // Toggle selection
    };

    useEffect(() => {
        const newHeight = itemSize ?? fontSize * 1.5;
        setListItemSize(newHeight);
    }, [fontSize, monospaceFontFamily, itemSize]);

    useEffect(() => {
        if ((search ?? "").trim() === "") {
            setDisplayLogs(logs);
        } else {
            const debounced = debounce(() => {
                const parts = search.toLowerCase().split(' ').map(v => v.trim()).filter(v => v !== '');
                setDisplayLogs(
                    logs.filter(entry => {
                        const logDetails = formatLogDetails(entry)?.toLowerCase();
                        return parts.every(value =>
                            logDetails?.includes(value)
                        )
                    })
                );
            }, searchDelay);
            debounced();
            return () => debounced.cancel();
        }
        return;
    }, [logs, search, searchDelay]);

    // Przewijanie do ostatniego elementu po zmianie logów
    useEffect(() => {
        if (displayLogs.length > 0) {
            setTimeout(() => {
                if (listRef.current && panelVisible) {
                    listRef.current.scrollToRow({
                        index: displayLogs.length - 1,
                        align: "end"
                    });
                }
            }, 100);
        }
    }, [displayLogs, panelVisible]);

    // Render pojedynczego elementu listy - używając react-window 2.x API
    const renderRow = ({ index, style, displayLogs, selectedItem, handleSelectItem, theme, showTime, getLogLevelColor, formatTime }: RowComponentProps<{
        displayLogs: LogEntry[],
        selectedItem: string | null,
        handleSelectItem: (id: string) => void,
        theme: any,
        showTime: boolean,
        getLogLevelColor: (level: LogLevel, palette: any) => string,
        formatTime: (time: number) => string
    }>) => {
        const log = displayLogs[index];
        if (!log) return <div style={style}>No log</div>;

        return (
            <div
                key={log.id}
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "flex-start",
                    padding: 0,
                    cursor: "pointer",
                    backgroundColor: selectedItem === log.id ? theme.palette.action.selected : "transparent"
                }}
                onClick={() => handleSelectItem(log.id)}
                className={`ConsoleLogPanel-item${selectedItem === log.id ? " Mui-selected" : ""}`}
            >
                <Typography
                    variant="monospace"
                    sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: getLogLevelColor(log.level, theme.palette),
                        m: 0,
                        px: 1,
                        width: "100%"
                    }}
                >
                    {showTime && log.time && (
                        <span style={{ color: theme.palette.primary.main, marginRight: 8 }}>
                            {formatTime(log.time)}
                        </span>
                    )}
                    {Array.isArray(log.message) ? log.message.map(value => {
                        if (typeof value === "object") {
                            if (value !== null && "name" in value && "message" in value) {
                                return `${value.name}: ${value.message}`;
                            }
                            else {
                                return JSON.stringify(value);
                            }
                        }
                        else {
                            return value;
                        }
                    }).join(" ") : String(log.message)}
                </Typography>
            </div>
        );
    };

    return (
        <TabPanelContent ref={panelRef} style={{ alignItems: "flex-start" }} {...other}>
            {panelVisible && (
                <SplitPanelGroup direction="horizontal" style={{ height: "100%", width: "100%" }}>
                    <SplitPanel>
                        <div style={{ height: '100%', width: '100%' }}>
                            <List
                                listRef={listRef}
                                className="ConsoleLogPanel-root"
                                rowComponent={renderRow}
                                rowCount={displayLogs.length}
                                rowHeight={listItemSize}
                                style={{ height: '100%', width: '100%' }}
                                rowProps={{
                                    displayLogs,
                                    selectedItem,
                                    handleSelectItem,
                                    theme,
                                    showTime,
                                    getLogLevelColor,
                                    formatTime
                                } as any}
                                {...slotProps?.list}
                            />
                        </div>
                    </SplitPanel>
                    <Splitter />
                    <SplitPanel defaultSize={25} >
                        <TabsPanel itemID='log-item-details-tabs'>
                            <TabPanel
                                itemID='log-details'
                                label={<ConsoleLogDetailsLabel />}
                                content={<ConsoleLogDetailsContent
                                    item={displayLogs.find(l => l.id === selectedItem)}
                                    {...slotProps?.details}
                                />}
                                buttons={<ConsoleLogDetailsButtons />}
                            />
                            <TabPanel
                                itemID='log-stacktrace'
                                label={<ConsoleLogStackTraceLabel />}
                                content={<ConsoleLogStackTraceContent
                                    stack={displayLogs.find(l => l.id === selectedItem)?.stack}
                                    {...slotProps?.details}
                                />}
                                buttons={<ConsoleLogStackTraceButtons />}
                            />
                        </TabsPanel>
                    </SplitPanel>
                </SplitPanelGroup>
            )}
        </TabPanelContent>
    );
};

export const ConsoleLogsPanelLabel: React.FC = () => {
    const { t } = useTranslation();

    return (
        <TabPanelLabel>
            <span>{t("console-logs", "Console Logs")}</span>
        </TabPanelLabel>
    );
};

export const ConsoleLogsPanelButtons: React.FC = () => {
    const { logs, logLevels, loggedLevels, setLogLevels } = useConsole();
    const theme = useTheme();
    const { t } = useTranslation();
    const { setShowTime } = useConsoleLogState();
    const { search, setSearch } = useConsoleLogState();

    // Obsługa zmiany zaznaczenia
    const handleLogLevelChange = (value: LogLevel) => {
        if (value as string === "default") {
            setLogLevels(DefaultLogLevels.filter(entry => entry.logged).map(entry => entry.level) as LogLevel[]);
        }
        else if (value as string === "all") {
            setLogLevels(DefaultLogLevels.map(entry => entry.level) as LogLevel[]);
        }
        else {
            // toggle: jeśli level był aktywny, usuń go; jeśli nie, dodaj
            const prev = logLevels.filter(entry => entry.logged).map(entry => entry.level) as LogLevel[];
            if (prev.includes(value as LogLevel)) {
                setLogLevels(prev.filter(lvl => lvl !== value) as LogLevel[]);
            } else {
                setLogLevels([...prev, value] as LogLevel[]);
            }
        }
    };

    return (
        <TabPanelButtons>
            <InputDecorator indicator={false} width={200}>
                <SearchField
                    value={search}
                    onChange={setSearch}
                    placeholder={t("search---", "Search...")}
                    size="small"
                    color="main"
                />
            </InputDecorator>
            <Tooltip title={t("show-item-time", "Show item time")}>
                <IconButton
                    toggle={[null, 'on']}
                    onChange={(value) => {
                        setShowTime(value === 'on');
                    }}
                    size="small"
                    color="main"
                >
                    <theme.icons.Clock />
                </IconButton>
            </Tooltip>
            <InputDecorator indicator={false} width={200}>
                <SelectField
                    size="small"
                    value={loggedLevels ?? []}
                    onChange={handleLogLevelChange}
                    renderValue={(values) => {
                        const defaultLogLevels = DefaultLogLevels.filter(entry => entry.logged).map(entry => entry.level) as LogLevel[];
                        const selectedLogLevels = values.length && values.every(lvl => defaultLogLevels.includes(lvl));
                        if (selectedLogLevels) {
                            return t("default-log-levels", "Default log levels");
                        }
                        else if (values.length === DefaultLogLevels.length) {
                            return t("all-log-levels", "All log levels");
                        }
                        else if (values.length === 0) {
                            return t("select-log-levels", "Select log levels");
                        }
                        return values.join(", ");
                    }}
                >
                    <MenuItem key="default" value="default">
                        {t("default-log-levels", "Default log levels")}
                    </MenuItem>
                    <MenuItem key="all" value="all">
                        {t("all-log-levels", "All log levels")}
                    </MenuItem>
                    <Divider />
                    {logLevels.map((level) => (
                        <MenuItem key={level.level} value={level.level}>
                            <ListItemIcon>
                                {level.logged ? <theme.icons.Check /> : null}
                            </ListItemIcon>
                            {level.level}
                        </MenuItem>
                    ))}
                </SelectField>
            </InputDecorator>
            <Tooltip title={t("consoleLogs-clear-all", "Clear console logs")}>
                <IconButton
                    size="small"
                    disabled={logs.length === 0}
                    onClick={() => console.clear()}
                    color="main"
                >
                    <theme.icons.Delete />
                </IconButton>
            </Tooltip>
        </TabPanelButtons>
    );
};

export const ConsoleLogsStatusBarButtons: React.FC = () => {
    const theme = useTheme();
    const { emit } = useMessages();
    const { logs } = useConsole();
    const [notificationCounts, setNotificationCounts] = React.useState({
        error: logs.filter(log => log.level === 'error').length,
        warning: logs.filter(log => log.level === 'warn').length,
        info: logs.filter(log => log.level === 'info').length,
    });

    React.useEffect(() => {
        setNotificationCounts(prev => {
            const counts = {
                error: logs.filter(log => log.level === 'error').length,
                warning: logs.filter(log => log.level === 'warn').length,
                info: logs.filter(log => log.level === 'info').length,
            };
            if (prev.error !== counts.error || prev.warning !== counts.warning || prev.info !== counts.info) {
                return counts;
            }
            return prev;
        });
    }, [logs]);

    return (
        <Tooltip
            //open={true}
            title={[
                "Console Logs",
                ["![error](Error) Errors", String(notificationCounts.error)],
                ["![warning](Warning) Warnings", String(notificationCounts.warning)],
            ]}
        >
            <StatusBarButton
                key="notifications"
                onClick={() => {
                    emit(Messages.TOGGLE_TOOLS_TABS_PANEL, "tools-tabs-panel", "logs");
                }}
            >
                <theme.icons.Error />
                <span key="error">{notificationCounts.error}</span>
                <theme.icons.Warning />
                <span key="warning">{notificationCounts.warning}</span>
                <theme.icons.Hint />
                <span key="info">{notificationCounts.info}</span>
            </StatusBarButton>
        </Tooltip>
    )
}

Promise.resolve().then(() => {
    if (!appStatusBarButtons.static.has("ConsoleLogsStatusBarButtons")) {
        const newMap = new Map<string, React.FC>([
            ["ConsoleLogsStatusBarButtons", ConsoleLogsStatusBarButtons],
            ...appStatusBarButtons.static,
        ]);
        appStatusBarButtons.static = newMap;
    }
});
