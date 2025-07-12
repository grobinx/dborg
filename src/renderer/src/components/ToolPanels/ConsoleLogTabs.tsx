import { LogEntry } from "@renderer/contexts/ConsoleContext"
import TabPanelContent, { TabPanelContentOwnProps } from "../TabsPanel/TabPanelContent";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { styled } from "@mui/material";
import TabPanelLabel from "../TabsPanel/TabPanelLabel";
import TabPanelButtons from "../TabsPanel/TabPanelButtons";

export function formatLogDetails(log: LogEntry | undefined): string | null {
    const t = i18next.t.bind(i18next);
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

    return t(
        "console-entry-details",
        'level: {{level}}, time: {{time}}\n{{details}}',
        {
            level: log.level,
            time: formatTime(log.time),
            details: result,
        }
    );
}

export function formatTime(time: number): string {
    return new Date(time).toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 });
}

export const StyledConsoleLogDetailsPanel = styled('div', {
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

export interface ConsoleLogDetailsContentProps
    extends Omit<TabPanelContentOwnProps, "color">,
        React.ComponentProps<typeof StyledConsoleLogDetailsPanel> {
    item?: LogEntry
}

export const ConsoleLogDetailsContent: React.FC<ConsoleLogDetailsContentProps> = (props) => {
    const { item, tabsItemID, itemID, ...other } = props;
    const { t } = useTranslation();

    return (
        <TabPanelContent>
            {(item !== undefined) ? (
                <StyledConsoleLogDetailsPanel className="ConsoleLogPanel-details" {...other}>
                    {formatLogDetails(item)}
                </StyledConsoleLogDetailsPanel>
            ) : (
                <StyledConsoleLogDetailsPanel className="ConsoleLogPanel-details no-selection" {...other}>
                    {t("consoleLogs-no-selection", "Select a log entry to view details")}
                </StyledConsoleLogDetailsPanel>
            )}
        </TabPanelContent>
    );
}

export const ConsoleLogDetailsLabel: React.FC = () => {
    const { t } = useTranslation();

    return (
        <TabPanelLabel>
            <span>{t("details", "Details")}</span>
        </TabPanelLabel>
    );
};

export const ConsoleLogDetailsButtons: React.FC = () => {
    return (
        <TabPanelButtons>
        </TabPanelButtons>
    );
};

export interface ConsoleLogStackTraceContentProps
    extends Omit<TabPanelContentOwnProps, "color">,
        React.ComponentProps<typeof StyledConsoleLogDetailsPanel> {
    stack?: string[]
}

export const ConsoleLogStackTraceContent: React.FC<ConsoleLogStackTraceContentProps> = (props) => {
    const { stack, tabsItemID, itemID, ...other } = props;
    const { t } = useTranslation();

    return (
        <TabPanelContent>
            {(stack !== undefined) ? (
                <StyledConsoleLogDetailsPanel className="ConsoleLogPanel-stacktrace" {...other}>
                    {stack.join("\n")}
                </StyledConsoleLogDetailsPanel>
            ) : (
                <StyledConsoleLogDetailsPanel className="ConsoleLogPanel-stacktrace no-selection" {...other}>
                    {t("consoleLogs-no-selection-stack-trace", "Select a log entry with stack trace to view details")}
                </StyledConsoleLogDetailsPanel>
            )}
        </TabPanelContent>
    );
}

export const ConsoleLogStackTraceLabel: React.FC = () => {
    const { t } = useTranslation();

    return (
        <TabPanelLabel>
            <span>{t("stack-trace", "Stack trace")}</span>
        </TabPanelLabel>
    );
};

export const ConsoleLogStackTraceButtons: React.FC = () => {
    return (
        <TabPanelButtons>
        </TabPanelButtons>
    );
};
