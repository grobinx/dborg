import React, { useRef, useEffect } from "react";
import { styled, useTheme, useThemeProps } from "@mui/material/styles";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import ToolButton from "../ToolButton";
import { getLogLevelColor, useConsole, LogLevel, DefaultLogLevels, LogEntry } from "@renderer/contexts/ConsoleContext";
import { useTranslation } from "react-i18next";
import TabPanelContent, { TabPanelContentOwnProps } from "../TabsPanel/TabPanelContent";
import { ListItem, ListItemText, ListItemIcon, MenuItem, SelectChangeEvent, Divider, Tab, Typography } from "@mui/material";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer"; // Optional for dynamic sizing
import ToolSelect from "../useful/ToolSelect";
import { SplitPanel, SplitPanelGroup, Splitter } from "../SplitPanel";
import { create } from "zustand";
import ToolTextField from "../ToolTextField";
import i18next from "i18next";
import * as Messages from '../../app/Messages';
import { StatusBarButton } from "@renderer/app/StatusBar";
import { useMessages } from "@renderer/contexts/MessageContext";
import { appStatusBarButtons } from "@renderer/app/App";
import TabsPanel from "../TabsPanel/TabsPanel";
import TabPanel from "../TabsPanel/TabPanel";
import { ConsoleLogDetailsButtons, ConsoleLogDetailsContent, ConsoleLogDetailsLabel, ConsoleLogStackTraceButtons, ConsoleLogStackTraceContent, ConsoleLogStackTraceLabel, formatLogDetails, formatTime, StyledConsoleLogDetailsPanel } from "./ConsoleLogTabs";
import Tooltip from "../Tooltip";
import { useSetting } from "@renderer/contexts/SettingsContext";
import { SearchField } from "../inputs/SearchField";
import { InputDecorator } from "../inputs/decorators/InputDecorator";
import { Button } from "../buttons/Button";
import { IconButton } from "../buttons/IconButton";

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

const StyledConsoleLogPanel = styled(FixedSizeList, {
    name: "ConsoleLogPanel",
    slot: "root",
})(({ /*theme*/ }) => ({
    // Add styles for the list container if needed
}));

export interface ConsoleLogPanelProps extends TabPanelContentOwnProps {
    slotProps?: {
        list?: React.ComponentProps<typeof FixedSizeList>;
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
    const listRef = useRef<FixedSizeList>(null);
    const showTime = useConsoleLogState(state => state.showTime);
    const search = useConsoleLogState(state => state.search);
    const [displayLogs, setDisplayLogs] = React.useState<LogEntry[]>(logs);
    const [fontSize] = useSetting<number>("ui", "fontSize", 20);
    const [monospaceFontFamily] = useSetting("ui", "monospaceFontFamily");
    const [listItemSize, setListItemSize] = React.useState<number>(itemSize ?? (fontSize * 1.5));

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
        }
        else {
            clearTimeout(searchTimeoutId);
            searchTimeoutId = setTimeout(() => {
                setDisplayLogs(logs.filter(entry => formatLogDetails(entry)?.toLowerCase().includes(search.toLowerCase())));
            }, 250);
        }
    }, [logs, search]);

    // Przewijanie do ostatniego elementu po zmianie logów
    useEffect(() => {
        if (displayLogs.length > 0) {
            setTimeout(() => {
                if (listRef.current && panelVisible) {
                    listRef.current.scrollToItem(displayLogs.length - 1, "end");
                }
            }, 100);
        }
    }, [displayLogs, panelVisible]);

    // Render pojedynczego elementu listy
    const renderRow = ({ index, style }: ListChildComponentProps) => {
        const log = displayLogs[index];
        return (
            <ListItem
                key={log.id}
                style={style} // Ważne: styl przekazywany przez react-window
                alignItems="flex-start"
                disablePadding
                disableGutters
                onClick={() => handleSelectItem(log.id)}
                className={`ConsoleLogPanel-item${selectedItem === log.id ? " Mui-selected" : ""}`}
                {...slotProps?.item}
            >
                <Typography
                    variant="monospace"
                    sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: getLogLevelColor(log.level, theme.palette),
                        m: 0,
                        px: 8
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
            </ListItem>
        );
    };

    return (
        <TabPanelContent ref={panelRef} style={{ alignItems: "flex-start" }} {...other}>
            {panelVisible && (
                <SplitPanelGroup direction="horizontal" style={{ height: "100%", width: "100%" }}>
                    <SplitPanel>
                        <AutoSizer>
                            {({ height, width }) => (
                                <StyledConsoleLogPanel
                                    className="ConsoleLogPanel-root"
                                    ref={listRef} // Przypisanie referencji
                                    height={height}
                                    width={width}
                                    itemSize={listItemSize} // Wysokość pojedynczego elementu (dostosuj do potrzeb)
                                    itemCount={displayLogs.length}
                                    overscanCount={overscanCount ?? 2} // Liczba dodatkowych elementów renderowanych poza widocznym obszarem
                                    {...slotProps?.list}
                                >
                                    {renderRow}
                                </StyledConsoleLogPanel>
                            )}
                        </AutoSizer>
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
    const { logs, logLevels, setLogLevels } = useConsole();
    const theme = useTheme();
    const { t } = useTranslation();
    const { showTime, setShowTime } = useConsoleLogState();
    const { search, setSearch } = useConsoleLogState();

    // Obsługa zmiany zaznaczenia
    const handleLogLevelChange = (event: SelectChangeEvent<LogLevel[]>) => {
        if (
            Array.isArray(event.target.value) &&
            (event.target.value.filter(entry => typeof entry === "string") as string[]).includes("default")
        ) {
            setLogLevels(DefaultLogLevels.filter(entry => entry.logged).map(entry => entry.level) as LogLevel[]);
        }
        else if (
            Array.isArray(event.target.value) &&
            (event.target.value.filter(entry => typeof entry === "string") as string[]).includes("all")
        ) {
            setLogLevels(DefaultLogLevels.map(entry => entry.level) as LogLevel[]);
        }
        else {
            if (Array.isArray(event.target.value)) {
                setLogLevels(event.target.value as LogLevel[]);
            } else {
                setLogLevels([event.target.value as LogLevel]);
            }
        }
    };

    return (
        <TabPanelButtons>
            <InputDecorator indicator={false}>
                <SearchField
                    value={search}
                    onChange={setSearch}
                    placeholder={t("search---", "Search...")}
                    size="small"
                    color="main"
                />
            </InputDecorator>
            <Tooltip title={t("show-item-time", "Show item time")}>
                <span>
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
                </span>
            </Tooltip>
            <ToolSelect
                multiple
                displayEmpty
                value={logLevels.filter(entry => entry.logged).map(entry => entry.level) as LogLevel[]}
                onChange={handleLogLevelChange}
                renderValue={(selected) => {
                    const defaultLogLevels = DefaultLogLevels.filter(entry => entry.logged).map(entry => entry.level) as LogLevel[];
                    const selectedLogLevels = selected.length && selected.every(lvl => defaultLogLevels.includes(lvl));
                    if (selectedLogLevels) {
                        return t("default-log-levels", "Default log levels");
                    }
                    else if (selected.length === DefaultLogLevels.length) {
                        return t("all-log-levels", "All log levels");
                    }
                    else if (selected.length === 0) {
                        return t("select-log-levels", "Select log levels");
                    }
                    return selected.join(", ");
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
            </ToolSelect>
            <Tooltip title={t("consoleLogs-clear-all", "Clear console logs")}>
                <span>
                    <IconButton
                        size="small"
                        disabled={logs.length === 0}
                        onClick={() => console.clear()}
                        color="main"
                    >
                        <theme.icons.Delete />
                    </IconButton>
                </span>
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
