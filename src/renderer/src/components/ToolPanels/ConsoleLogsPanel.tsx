import React, { useRef, useEffect } from "react";
import { styled, useTheme, useThemeProps } from "@mui/material/styles";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import Tooltip from "@mui/material/Tooltip";
import ToolButton from "../ToolButton";
import { getLogLevelColor, useConsole, LogLevel, DefaultLogLevels, LogEntry } from "@renderer/contexts/ConsoleContext";
import { useTranslation } from "react-i18next";
import TabPanelContent, { TabPanelContentOwnProps } from "../TabsPanel/TabPanelContent";
import { ListItem, ListItemText, ListItemIcon, MenuItem, SelectChangeEvent, Divider } from "@mui/material";
import { useIsVisible } from "@renderer/hooks/useIsVisible";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer"; // Optional for dynamic sizing
import ToolSelect from "../useful/ToolSelect";
import { SplitPanel, SplitPanelGroup, Splitter } from "../SplitPanel";
import { useMessages } from "@renderer/contexts/MessageContext";
import { create } from "zustand";

interface ConsoleLogState {
    showTime: boolean;
    toggleShowTime: () => void;
}

export const useConsoleLogStore = create<ConsoleLogState>((set) => ({
    showTime: false,
    toggleShowTime: () => set((state) => ({ showTime: !state.showTime })),
}));

function formatLogDetails(log: LogEntry | undefined): string | null {
    if (!log) return null;

    const formatValue = (value: any): string => {
        if (typeof value === "string") return value;
        if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack ?? ""}`;
        if (Array.isArray(value)) return value.map(formatValue).join("\n");
        if (typeof value === "object" && value !== null) {
            if (("stack" in value || "name" in value) && "message" in value) {
                return [
                    `name: ${value.name}`,
                    `message: ${value.message}`,
                    value.stack ? `stack: ${value.stack}` : null,
                    ...Object.entries(value)
                        .filter(([k]) => !["name", "message", "stack"].includes(k))
                        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)}`)
                ].filter(Boolean).join("\n");
            }
            try {
                return JSON.stringify(value, null, 2);
            } catch {
                return String(value);
            }
        }
        return String(value);
    };

    let result: string = "";
    if (Array.isArray(log.message)) {
        result = log.message.map(formatValue).join("\n");
    } else {
        result = formatValue(log.message);
    }

    return `level: ${log.level}\ntime: ${log.time ? new Date(log.time).toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 }) : ""}\n${result}`;
}

const StyledConsoleLogPanel = styled(FixedSizeList, {
    name: "ConsoleLogPanel",
    slot: "root",
})(({ /*theme*/ }) => ({
    // Add styles for the list container if needed
}));

const StyledConsoleLogDetailsPanel = styled('div', {
    name: "ConsoleLogPanel",
    slot: "details",
})(({ /*theme*/ }) => ({
    height: "100%",
    width: "100%",
    padding: 8, 
    fontFamily: "monospace", 
    fontSize: "0.8em", 
    overflow: "auto",
    whiteSpace: "pre-wrap", 
    wordBreak: "break-all"
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
    const [panelRef, panelVisible] = useIsVisible<HTMLDivElement>();
    const [selectedItem, setSelectedItem] = React.useState<string | null>(null);
    const listRef = useRef<FixedSizeList>(null);
    const showTime = useConsoleLogStore(state => state.showTime);

    const handleSelectItem = (id: string) => {
        setSelectedItem((prev) => (prev === id ? null : id)); // Toggle selection
    };

    // Przewijanie do ostatniego elementu po zmianie logów
    useEffect(() => {
        if (logs.length > 0) {
            setTimeout(() => {
                if (listRef.current && panelVisible) {
                    listRef.current.scrollToItem(logs.length - 1, "end");
                }
            }, 100);
        }
    }, [logs, panelVisible]);

    // Render pojedynczego elementu listy
    const renderRow = ({ index, style }: ListChildComponentProps) => {
        const log = logs[index];
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
                <ListItemText
                    slotProps={{ primary: { variant: "body2", sx: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } } }}
                    sx={{ color: getLogLevelColor(log.level, theme.palette), m: 0, px: 8 }}
                    primary={
                        <>
                            {showTime && log.time && (
                                <span style={{ color: theme.palette.primary.main, marginRight: 8 }}>
                                    {new Date(log.time).toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 })}
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
                        </>
                    }
                    {...slotProps?.itemText}
                />
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
                                    itemSize={itemSize ?? 20} // Wysokość pojedynczego elementu (dostosuj do potrzeb)
                                    itemCount={logs.length}
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
                        {selectedItem ? (
                            <StyledConsoleLogDetailsPanel className="ConsoleLogPanel-details" {...slotProps?.details}>
                                {formatLogDetails(logs.find(l => l.id === selectedItem))}
                            </StyledConsoleLogDetailsPanel>
                        ) : (
                            <StyledConsoleLogDetailsPanel className="ConsoleLogPanel-details no-selection" {...slotProps?.details}>
                                {t("consoleLogs-no-selection", "Select a log entry to view details")}
                            </StyledConsoleLogDetailsPanel>
                        )}
                    </SplitPanel>
                </SplitPanelGroup>
            )}
        </TabPanelContent>
    );
};

export const ConsoleLogsPanelLabel: React.FC = () => {
    return (
        <TabPanelLabel>
            <span>Console Logs</span>
        </TabPanelLabel>
    );
};

export const ConsoleLogsPanelButtons: React.FC = () => {
    const { logs, logLevels, setLogLevels } = useConsole();
    const theme = useTheme();
    const { t } = useTranslation();
    const { showTime, toggleShowTime } = useConsoleLogStore();
    const { emit } = useMessages();

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
            <Tooltip title={t("show-item-time", "Show item time")}>
                <span>
                    <ToolButton
                        selected={showTime}
                        onClick={() => {
                            toggleShowTime();
                        }}
                    >
                        <theme.icons.Clock />
                    </ToolButton>
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
                    <ToolButton
                        disabled={logs.length === 0}
                        onClick={() => console.clear()}
                    >
                        <theme.icons.Delete />
                    </ToolButton>
                </span>
            </Tooltip>
        </TabPanelButtons>
    );
};

export default ConsoleLogPanel;
