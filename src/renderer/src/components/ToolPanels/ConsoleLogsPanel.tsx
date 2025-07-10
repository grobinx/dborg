import React, { useRef, useEffect } from "react";
import { styled, useTheme, useThemeProps } from "@mui/material/styles";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import Tooltip from "@mui/material/Tooltip";
import ToolButton from "../ToolButton";
import { getLogLevelColor, useConsole } from "@renderer/contexts/ConsoleContext";
import { useTranslation } from "react-i18next";
import TabPanelContent, { TabPanelContentOwnProps, TabPanelContentProps } from "../TabsPanel/TabPanelContent";
import { List, ListItem, ListItemText, ListItemIcon } from "@mui/material";
import { useIsVisible } from "@renderer/hooks/useIsVisible";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer"; // Optional for dynamic sizing
import { ColumnDataType, resolvePrimitiveType, valueToString } from "../../../../../src/api/db";

const StyledConsoleLogPanel = styled(FixedSizeList, {
    name: "ConsoleLogPanel",
    slot: "root",
})(({ /*theme*/ }) => ({
    // Add styles for the list container if needed
}));

export interface ConsoleLogProps extends TabPanelContentOwnProps {
    slotProps?: {
        list?: React.ComponentProps<typeof FixedSizeList>;
        item?: React.ComponentProps<typeof ListItem>;
        itemIcon?: React.ComponentProps<typeof ListItemIcon>;
        itemText?: React.ComponentProps<typeof ListItemText>;
    };
    itemSize?: number; // Wysokość pojedynczego elementu listy
    overscanCount?: number; // Liczba dodatkowych elementów renderowanych poza widocznym obszarem
}

export const ConsoleLogsPanel: React.FC<ConsoleLogProps> = (props) => {
    const { slotProps, itemSize, overscanCount, ...other } = useThemeProps({ name: "ConsoleLogsPanel", props: props });
    const { logs } = useConsole();
    const { t } = useTranslation();
    const theme = useTheme();
    const [panelRef, panelVisible] = useIsVisible<HTMLDivElement>();

    // Referencja do FixedSizeList
    const listRef = useRef<FixedSizeList>(null);

    // Przewijanie do ostatniego elementu po zmianie logów
    useEffect(() => {
        if (listRef.current && logs.length > 0) {
            listRef.current.scrollToItem(logs.length - 1, "end");
        }
    }, [logs, panelVisible]);

    // Render pojedynczego elementu listy
    const renderRow = ({ index, style }: ListChildComponentProps) => {
        const log = logs[index];
        return (
            <ListItem
                key={index}
                style={style} // Ważne: styl przekazywany przez react-window
                alignItems="flex-start"
                disablePadding
                disableGutters
                {...slotProps?.item}
            >
                <ListItemText
                    slotProps={{ primary: { variant: "body2", sx: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } } }}
                    sx={{ color: getLogLevelColor(log.level, theme.palette), m: 0, px: 8 }}
                    primary={Array.isArray(log.message) ? log.message.map(value => {
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
                    {...slotProps?.itemText}
                />
            </ListItem>
        );
    };

    return (
        <TabPanelContent ref={panelRef} style={{ alignItems: "flex-start" }} {...other}>
            {panelVisible && (
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
    const { logs } = useConsole();
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <TabPanelButtons>
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

export default ConsoleLogsPanel;