import { SxProps, useTheme } from "@mui/material";
import React from "react";
import TabPanelButtons from "./TabsPanel/TabPanelButtons";
import { useTranslation } from "react-i18next";
import { Option } from "./inputs/DescribedList";
import { SelectField } from "./inputs/SelectField";
import { ToolButton } from "./buttons/ToolButton";
import Tooltip from "./Tooltip";
import { InputDecorator } from "./inputs/decorators/InputDecorator";
import ButtonGroup from "./buttons/ButtonGroup";

export type AutoRefreshInterval = 1 | 2 | 5 | 10 | 15 | 30 | 60 | 120 | 300 | 600;
export type AutoRefreshIntervals = AutoRefreshInterval[];
export type AutoRefreshState = "running" | "paused" | "stopped";

export interface AutoRefreshBarProps {
    /**
     * Domyślny interwał odświeżania
     * @default 5 seconds
     */
    defaultInterval?: AutoRefreshInterval;
    /**
     * Dostępne opcje interwałów odświeżania (w sekundach)
     * @default [1, 2, 5, 10, 30, 60]
     */
    intervals?: AutoRefreshIntervals;

    /**
     * Aktualny interwał odświeżania
     */
    interval?: AutoRefreshInterval;
    /**
     * Zdarzenie zmiany interwału odświeżania
     * @param interval 
     * @returns 
     */
    onIntervalChange?: (interval: AutoRefreshInterval) => void;

    /**
     * Czy przycisk "Clear" ma być dostępny.
     * @default false
     */
    canClear?: boolean;
    /**
     * Czy przycisk "Pause" ma być dostępny.
     * @default true
     */
    canPause?: boolean;
    /**
     * Czy można zmieniać interwał odświeżania.
     * @default true
     */
    canChangeInterval?: boolean;
    /**
     * Czy przycisk "Refresh" ma być dostępny.
     * @default false
     */
    canRefresh?: boolean;

    /**
     * Aktualny stan automatycznego odświeżania
     */
    state?: AutoRefreshState;
    /**
     * Zdarzenie zmiany stanu automatycznego odświeżania
     * @param state 
     * @returns 
     */
    onStateChange?: (state: AutoRefreshState) => void;

    onStart?: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onClear?: () => void;
    onStop?: () => void;

    /**
     * Zdarzenie wywoływane przy każdym "ticku" odświeżania
     * @returns 
     */
    onTick?: () => void;
    /**
     * Czy automatyczne odświeżanie jest w trakcie wykonywania.
     * Stan musi być zarządzany z zewnątrz z tego powodu, że odświeżanie może być asynchroniczne.
     * Ustaw tą wartość by na przycisku "Refresh" pokazać spinner.
     * Ustawiony na true spowoduje również, że kolejny tick nie zostanie wywołany dopóki nie zakończy się obecne odświeżanie.
     */
    executing?: boolean;

    sx?: SxProps;
    style?: React.CSSProperties;

    ref?: React.Ref<HTMLDivElement>;
}

export const AutoRefreshBar: React.FC<AutoRefreshBarProps> = (props) => {
    const {
        defaultInterval = 5,
        intervals = [1, 2, 5, 10, 30, 60],
        interval,
        onIntervalChange,
        canClear = false,
        canPause = true,
        canChangeInterval = true,
        canRefresh = false,
        state,
        onStateChange,
        onStart,
        onPause,
        onResume,
        onClear,
        onStop,
        onTick,
        executing,
        sx,
        style,
        ref,
    } = props;

    const { t } = useTranslation();
    const theme = useTheme();
    const [currentInterval, setCurrentInterval] = React.useState<AutoRefreshInterval>(interval || defaultInterval);
    const [currentState, setCurrentState] = React.useState<AutoRefreshState>(state || "stopped");
    const intervalIdRef = React.useRef<NodeJS.Timeout | null>(null);
    const executingRef = React.useRef<boolean>(executing || false);

    React.useEffect(() => {
        executingRef.current = executing || false;
    }, [executing]);

    // Synchronizacja kontrolowana
    React.useEffect(() => {
        if (interval !== undefined) {
            setCurrentInterval(interval);
        }
    }, [interval]);

    React.useEffect(() => {
        if (state !== undefined) {
            setCurrentState(state);
        }
    }, [state]);

    const intervalOptions = React.useMemo(() => intervals.map(interval => {
        let label = interval === 1 ? t("1-sec", "1s", { n: interval }) : t("n-sec", "{{n}}s", { n: interval });
        if (interval >= 60) {
            const minutes = interval / 60;
            label = minutes === 1 ? t("1-min", "1m") : t("n-min", "{{n}}m", { n: minutes });
        }
        return { value: interval, label } as Option<number>;
    }), [intervals, t]);

    // Efekt zmiany interwału lub stanu
    React.useEffect(() => {
        if (currentState === "running") {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
            }
            intervalIdRef.current = setInterval(() => {
                if (!executingRef.current) {
                    onTick?.();
                }
            }, currentInterval * 1000);
        } else {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
                intervalIdRef.current = null;
            }
        }
    }, [currentInterval, currentState]);

    const handleIntervalChange = (newInterval: AutoRefreshInterval) => {
        if (interval === undefined) {
            setCurrentInterval(newInterval);
        }
        onIntervalChange?.(newInterval);
    };

    const handleStateChange = (newState: AutoRefreshState) => {
        if (state === undefined) {
            setCurrentState(newState);
        }
        onStateChange?.(newState);
    };

    const { pauseTooltip, resumeTooltip, startTooltip, stopTooltip, clearTooltip, selectIntervalTooltip } = React.useMemo(() => ({
        pauseTooltip: t("auto-refresh.pause-tooltip", "Pause auto refresh"),
        resumeTooltip: t("auto-refresh.resume-tooltip", "Resume auto refresh"),
        startTooltip: t("auto-refresh.start-tooltip", "Start auto refresh"),
        stopTooltip: t("auto-refresh.stop-tooltip", "Stop auto refresh"),
        clearTooltip: t("auto-refresh.clear-tooltip", "Clear data"),
        selectIntervalTooltip: t("auto-refresh.select-interval-tooltip", "Select refresh interval"),
    }), [t]);

    // Renderowanie komponentu (przykładowe przyciski)
    return (
        <TabPanelButtons ref={ref} style={style} sx={sx}>
            <InputDecorator indicator={false} disableBlink>
                <SelectField
                    value={currentInterval}
                    options={intervalOptions}
                    onChange={(value) => handleIntervalChange(value as AutoRefreshInterval)}
                    size="small"
                    disabled={canChangeInterval === false}
                    width={40}
                    tooltip={selectIntervalTooltip}
                />
            </InputDecorator>
            <ButtonGroup className="auto-refresh-button-group">
                {canPause && (currentState !== "paused" ? (
                    <Tooltip title={pauseTooltip}>
                        <ToolButton
                            className="auto-refresh-pause-button"
                            onClick={() => {
                                handleStateChange("paused");
                                onPause?.();
                            }}
                            disabled={currentState === "stopped"}
                            size="small"
                        >
                            <theme.icons.Pause color="secondary" />
                        </ToolButton>
                    </Tooltip>
                ) : (
                    <Tooltip title={resumeTooltip}>
                        <ToolButton
                            className="auto-refresh-resume-button"
                            onClick={() => {
                                handleStateChange("running");
                                onResume?.();
                            }}
                            size="small"
                        >
                            <theme.icons.Resume color="error" />
                        </ToolButton>
                    </Tooltip>
                ))}
                {currentState === "paused" && canPause === false ? (
                    <Tooltip title={resumeTooltip}>
                        <ToolButton
                            className="auto-refresh-resume-button"
                            disabled
                            size="small"
                        >
                            <theme.icons.Resume color="error" />
                        </ToolButton>
                    </Tooltip>
                ) : currentState === "stopped" ? (
                    <Tooltip title={startTooltip}>
                        <ToolButton
                            className="auto-refresh-start-button"
                            onClick={() => {
                                handleStateChange("running");
                                onStop?.();
                            }}
                            size="small"
                        >
                            <theme.icons.Start color="success" />
                        </ToolButton>
                    </Tooltip>
                ) : (
                    <Tooltip title={stopTooltip}>
                        <ToolButton
                            className="auto-refresh-stop-button"
                            onClick={() => {
                                handleStateChange("stopped");
                                onStart?.();
                            }}
                            size="small"
                        >
                            <theme.icons.Stop color="error" />
                        </ToolButton>
                    </Tooltip>
                )}
                {canRefresh && (
                    <Tooltip title={t("auto-refresh.refresh-tooltip", "Refresh now")}>
                        <ToolButton
                            onClick={() => {
                                onTick?.();
                            }}
                            size="small"
                            loading={executing}
                        >
                            <theme.icons.Refresh color={executing ? "main" : "primary"} />
                        </ToolButton>
                    </Tooltip>
                )}
                {canClear && (
                    <Tooltip title={clearTooltip}>
                        <ToolButton
                            onClick={() => {
                                onClear?.();
                            }}
                            size="small"
                        >
                            <theme.icons.Clear color="warning" />
                        </ToolButton>
                    </Tooltip>
                )}
            </ButtonGroup>
        </TabPanelButtons>
    );
};

AutoRefreshBar.displayName = "AutoRefreshBar";