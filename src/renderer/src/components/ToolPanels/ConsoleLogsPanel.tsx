import React, { useEffect } from "react";
import { useTheme, useThemeProps } from "@mui/material/styles";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { getLogLevelColor, useConsole, LogLevel, DefaultLogLevels, LogEntry } from "@renderer/contexts/ConsoleContext";
import { useTranslation } from "react-i18next";
import TabPanelContent, { TabPanelContentOwnProps } from "../TabsPanel/TabPanelContent";
import { Typography } from "@mui/material";
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
import { appStatusBarButtons } from "@renderer/app/AppStatusBarRegistry";
import debounce from "@renderer/utils/debounce";
import { AnyOption, isOption, Option } from "../inputs/DescribedList";
import { SelectField } from "../inputs/SelectField";
import { ToolButton } from "../buttons/ToolButton";
import { BaseList } from "../inputs/base/BaseList";
import { FormattedText } from "../useful/FormattedText";
import { handleListNavigation } from "@renderer/hooks/useKeyboardNavigation";
import { useScrollIntoView } from "@renderer/hooks/useScrollIntoView";

interface ConsoleLogState {
    showTime: boolean;
    search: string;
    displayLogs: LogEntry[];
    selectedLogId: string | null;
    toggleShowTime: () => void;
    setShowTime: (show: boolean) => void;
    setSearch: (search: string) => void;
    setDisplayLogs: (logs: LogEntry[]) => void;
    setSelectedLogId: (id: string | null) => void;
}

export const useConsoleLogState = create<ConsoleLogState>((set, get) => ({
    showTime: false,
    search: "",
    displayLogs: [],
    selectedLogId: null,
    toggleShowTime: () => set({ showTime: !get().showTime }),
    setShowTime: (show: boolean) => set({ showTime: show }),
    setSearch: (search: string) => set({ search: search }),
    setDisplayLogs: (logs: LogEntry[]) => set({ displayLogs: logs }),
    setSelectedLogId: (id: string | null) => set({ selectedLogId: id }),
}));

export interface ConsoleLogPanelProps extends TabPanelContentOwnProps {
    slotProps?: {
        list?: React.ComponentProps<typeof BaseList>;
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
    const listRef = React.useRef<HTMLUListElement>(null);
    const showTime = useConsoleLogState(state => state.showTime);
    const search = useConsoleLogState(state => state.search);
    const displayLogs = useConsoleLogState(state => state.displayLogs);
    const setDisplayLogs = useConsoleLogState(state => state.setDisplayLogs);
    const selectedLogId = useConsoleLogState(state => state.selectedLogId);
    const setSelectedLogId = useConsoleLogState(state => state.setSelectedLogId);
    const [fontSize] = useSetting<number>("ui", "fontSize", 20);
    const [monospaceFontFamily] = useSetting("ui", "monospaceFontFamily");
    const [listItemSize, setListItemSize] = React.useState<number>(itemSize ?? (fontSize * 1.5));
    const [searchDelay] = useSetting<number>("app", "search.delay");
    const [detailLogId, setDetailLogId] = React.useState<string | null>(null);

    useEffect(() => {
        const newHeight = itemSize ?? fontSize * 1.5;
        setListItemSize(newHeight);
    }, [fontSize, monospaceFontFamily, itemSize]);

    useEffect(() => {
        if ((search ?? "").trim() === "") {
            setDisplayLogs(logs);
            setSelectedLogId(logs.length > 0 ? logs[logs.length - 1].id : null);
        } else {
            const debounced = debounce(() => {
                const parts = search.toLowerCase().split(' ').map(v => v.trim()).filter(v => v !== '');
                const searchedLogs = logs.filter(entry => {
                    const logDetails = formatLogDetails(entry)?.toLowerCase();
                    return parts.every(value =>
                        logDetails?.includes(value)
                    )
                });
                setDisplayLogs(searchedLogs);
                setSelectedLogId(searchedLogs.length > 0 ? searchedLogs[searchedLogs.length - 1].id : null);
            }, searchDelay);
            debounced();
            return () => debounced.cancel();
        }
        return;
    }, [logs, search, searchDelay]);

    React.useEffect(() => {
        const debounced = debounce(() => {
            if (selectedLogId) {
                setDetailLogId(selectedLogId);
            }
        }, 250);
        debounced();
        return () => debounced.cancel();
    }, [selectedLogId]);

    useScrollIntoView({
        containerRef: listRef,
        targetIndex: displayLogs.findIndex(log => log.id === selectedLogId),
        itemSize: listItemSize,
        scrollOptions: { behavior: 'instant', block: 'nearest' },
        dependencies: [selectedLogId],
    });

    const renderRow = (item: LogEntry) => {
        return (
            <Typography
                variant="monospace"
                sx={{
                    padding: "2px 4px",
                    display: "block", // zamiast flex
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "100%",
                    minWidth: 0,
                    color: getLogLevelColor(item.level, theme.palette),
                }}
            >
                {showTime && item.time && (
                    <span style={{ color: theme.palette.primary.main, marginRight: 8 }}>
                        {formatTime(item.time)}
                    </span>
                )}
                {Array.isArray(item.message) ? item.message.map(value => {
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
                }).join(" ") : String(item.message)}
            </Typography>
        );
    };

    return (
        <TabPanelContent style={{ alignItems: "flex-start" }} {...other}>
            <SplitPanelGroup direction="horizontal" style={{ height: "100%", width: "100%" }}>
                <SplitPanel>
                    <BaseList
                        ref={listRef}
                        items={displayLogs}
                        virtual
                        itemHeight={listItemSize}
                        isSelected={(item) => item.id === selectedLogId}
                        isFocused={(item) => item.id === selectedLogId}
                        onItemClick={(item) => setSelectedLogId(item.id)}
                        getItemId={(item) => item.id}
                        renderEmpty={() => (
                            <div style={{ padding: 16, textAlign: "center", color: theme.palette.text.disabled }}>
                                <FormattedText text={t("no-logs", "No logs available")} />
                            </div>
                        )}
                        renderItem={renderRow}
                        color="default"
                        onKeyDown={(e) => handleListNavigation(
                            e,
                            displayLogs,
                            (item) => item.id,
                            selectedLogId,
                            setSelectedLogId
                        )}
                    />
                </SplitPanel>
                <Splitter />
                <SplitPanel defaultSize={25} >
                    <TabsPanel itemID='log-item-details-tabs'>
                        <TabPanel
                            itemID='log-details'
                            label={<ConsoleLogDetailsLabel />}
                            content={<ConsoleLogDetailsContent
                                item={displayLogs.find(l => l.id === detailLogId)}
                                {...slotProps?.details}
                            />}
                            buttons={<ConsoleLogDetailsButtons />}
                        />
                        <TabPanel
                            itemID='log-stacktrace'
                            label={<ConsoleLogStackTraceLabel />}
                            content={<ConsoleLogStackTraceContent
                                stack={displayLogs.find(l => l.id === detailLogId)?.stack}
                                {...slotProps?.details}
                            />}
                            buttons={<ConsoleLogStackTraceButtons />}
                        />
                    </TabsPanel>
                </SplitPanel>
            </SplitPanelGroup>
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
    const setShowTime = useConsoleLogState(state => state.setShowTime);
    const search = useConsoleLogState(state => state.search);
    const setSearch = useConsoleLogState(state => state.setSearch);
    const displayLogs = useConsoleLogState(state => state.displayLogs);
    const selectedLogId = useConsoleLogState(state => state.selectedLogId);
    const setSelectedLogId = useConsoleLogState(state => state.setSelectedLogId);

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

    const options = React.useMemo(() => {
        const result: AnyOption<LogLevel>[] = [
            { value: 'default', label: t("default-log-levels", "Default Log Levels") },
            { value: 'all', label: t("all-log-levels", "All Log Levels") },
        ];
        result.push({});
        result.push(...logLevels.map(level => ({
            value: level.level,
            label: level.level,
        })));
        return result;
    }, [logLevels, loggedLevels]);

    return (
        <TabPanelButtons>
            <InputDecorator indicator={false} width={200}>
                <SearchField
                    value={search}
                    onChange={setSearch}
                    placeholder={t("search---", "Search...")}
                    size="small"
                    color="main"
                    autoFocus
                    onKeyDown={(e) => handleListNavigation(
                        e,
                        displayLogs,
                        (item) => item.id,
                        selectedLogId,
                        setSelectedLogId
                    )}
                />
            </InputDecorator>
            <Tooltip title={t("show-item-time", "Show item time")}>
                <ToolButton
                    toggle={[null, 'on']}
                    onChange={(value) => {
                        setShowTime(value === 'on');
                    }}
                    size="small"
                    color="main"
                >
                    <theme.icons.Clock />
                </ToolButton>
            </Tooltip>
            <InputDecorator indicator={false} width={200}>
                <SelectField
                    size="small"
                    color="main"
                    options={options}
                    value={loggedLevels ?? []}
                    onChange={handleLogLevelChange}
                    renderItem={(option, { selected }) => {
                        if (isOption(option)) {
                            if (option.value === "default") {
                                return t("default-log-levels", "Default Log Levels");
                            }
                            if (option.value === "all") {
                                return t("all-log-levels", "All Log Levels");
                            }
                            return (<>
                                <span style={{ width: 24 }}>{selected && <theme.icons.Check />}</span>
                                <span style={{ color: getLogLevelColor(option.value as LogLevel, theme.palette) }}>{option.label}</span>
                            </>);
                        }
                        return null;
                    }}
                    renderValue={(option: Option<LogLevel> | Option<LogLevel>[]) => {
                        const values = Array.isArray(option) ? option : [option];
                        const defaultLogLevels = DefaultLogLevels.filter(entry => entry.logged).map(entry => entry.level) as LogLevel[];
                        const selectedLogLevels =
                            values.length === defaultLogLevels.length &&
                            values.every(lvl => defaultLogLevels.includes(lvl.value));
                        let label: React.ReactNode;
                        if (selectedLogLevels) {
                            label = t("default-log-levels", "Default log levels");
                        }
                        else if (values.length === DefaultLogLevels.length) {
                            label = t("all-log-levels", "All log levels");
                        }
                        else if (values.length === 0 || (values.length === 1 && !values[0])) {
                            label = t("select-log-levels", "Select log levels");
                        }
                        else {
                            label = values.map((v, i) =>
                                <span key={v.value}>
                                    {i > 0 && ', '}
                                    <span style={{ color: getLogLevelColor(v.value as LogLevel, theme.palette) }}>
                                        {v.label}
                                    </span>
                                </span>
                            );
                        }
                        return (
                            <div style={{ height: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {label}
                            </div>
                        );
                    }}
                />
            </InputDecorator>
            <Tooltip title={t("consoleLogs-clear-all", "Clear console logs")}>
                <ToolButton
                    size="small"
                    disabled={logs.length === 0}
                    onClick={() => console.clear()}
                    color="main"
                >
                    <theme.icons.Delete />
                </ToolButton>
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
                "Console Logs", "-",
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
