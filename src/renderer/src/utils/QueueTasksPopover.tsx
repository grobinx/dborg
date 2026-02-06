import React from "react";
import { Popover, Typography, Box, Chip, Paper, alpha } from "@mui/material";
import { useTheme } from "@mui/material";
import { IQueueTask, QueueTaskInfo, QueueTaskSettings } from "@renderer/utils/QueueTask";
import { useTranslation } from "react-i18next";
import { Duration } from "luxon";
import { durationToHuman } from "@renderer/common";
import { IconButton } from "@renderer/components/buttons/IconButton";
import { BaseList } from "@renderer/components/inputs/base/BaseList";
import Tooltip from "@renderer/components/Tooltip";
import { useSetting } from "@renderer/contexts/SettingsContext";
import { LocalSettingsDialog } from "@renderer/components/settings/SettingsDialog";
import { SettingsCollection } from "@renderer/components/settings/SettingsTypes";

interface QueueTasksPopoverProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    queue: IQueueTask;
    onSaveSettings?: (settings: QueueTaskSettings) => void;
}

const QueueTasksPopover: React.FC<QueueTasksPopoverProps> = ({
    anchorEl,
    open,
    onClose,
    queue,
    onSaveSettings,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [, setRefresh] = React.useState(0n);
    const tasks = queue.getTasks();
    const [queueSettings, setQueueSettings] = React.useState(queue.getSettings());
    const [refreshInterval] = useSetting<number>("app", "queue.main.refresh_interval");
    const [visibleQueued] = useSetting<number>("app", "queue.main.visible_queued");
    const [visibleFinished] = useSetting<number>("app", "queue.main.visible_finished");
    const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);

    const queueSettingsDefinition: SettingsCollection = {
        key: "queue.settings",
        title: t("queue-settings", "Queue Settings"),
        settings: [
            {
                storageGroup: "-",
                storageKey: "maxConcurrency",
                type: "number",
                label: t("max-concurrency", "Max Concurrency"),
                description: t("max-concurrency-desc", "The maximum number of tasks that can run concurrently."),
                min: 1,
                max: 10,
            },
            {
                storageGroup: "-",
                storageKey: "maxQueueHistory",
                type: "number",
                label: t("max-queue-history", "Max Queue History"),
                description: t("max-queue-history-desc", "The maximum number of finished tasks to keep in history."),
                min: 10,
                max: 1000,
            },
        ]
    };

    React.useEffect(() => {
        if (!open) return;

        const interval = setInterval(() => {
            setRefresh((r) => r + 1n);
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [open, tasks.filter(t => t.status === "running").length]);

    const getStatusColor = (status: QueueTaskInfo["status"]) => {
        switch (status) {
            case "running":
                return "primary";
            case "queued":
                return "default";
            case "done":
                return "success";
            case "failed":
                return "error";
            case "canceled":
                return "warning";
            default:
                return "default";
        }
    };

    const formatTime = (timestamp?: number) => {
        if (!timestamp) return "-";
        return new Date(timestamp).toLocaleTimeString();
    };

    const formatDuration = (start?: number, end?: number) => {
        if (!start) return "-";
        const duration = Duration.fromMillis((end ?? Date.now()) - start);
        return durationToHuman(duration);
    };

    const runningTasks = tasks.filter(t => t.status === "running");
    const queuedTasks = tasks.filter(t => t.status === "queued");
    const finishedTasks = tasks.filter(t => t.status === "done" || t.status === "failed" || t.status === "canceled");
    const finishedLast = finishedTasks.slice(0, visibleFinished);
    const queuedLast = queuedTasks.slice(0, visibleQueued);

    const renderTaskRow = (task: QueueTaskInfo, secondary: string, opts?: { cancel?: boolean }) => (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                paddingX: 8,
            }}
        >
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography component={"div"} variant="body2" sx={{ overflowWrap: "anywhere" }}>
                    {task.label}
                </Typography>
                <Typography component={"div"} variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                    {secondary}
                </Typography>
            </Box>

            <Chip
                label={t(`queued-task.${task.status}`, task.status)}
                color={getStatusColor(task.status)}
                size="small"
                sx={{ fontSize: "0.75em", minHeight: "100%" }}
            />

            {opts?.cancel && (
                <Tooltip title={t("cancel", "Cancel")}>
                    <IconButton size="small" onClick={() => queue.cancelQueuedTask(task.id)}>
                        <theme.icons.Close />
                    </IconButton>
                </Tooltip>
            )}

            {task?.cancel && (
                <Tooltip title={t("cancel", "Cancel")}>
                    <IconButton size="small" onClick={() => task.cancel && task.cancel()}>
                        <theme.icons.Close />
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: "top",
                horizontal: "right",
            }}
            transformOrigin={{
                vertical: "bottom",
                horizontal: "right",
            }}
            slotProps={{
                paper: {
                    sx: {
                        maxHeight: "75%",
                        minWidth: 300,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        padding: 4,
                    }
                }
            }}
        >
            <Box sx={{ padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">
                    {t("queue-tasks", "Queue Tasks")}
                </Typography>
                <Tooltip title={t("queue-settings", "Queue Settings")}>
                    <IconButton size="small" onClick={() => setSettingsDialogOpen(true)}>
                        <theme.icons.Settings />
                    </IconButton>
                </Tooltip>
            </Box>

            <Box sx={{ overflowY: "auto", maxHeight: "100%", flex: 1 }}>

                {runningTasks.length > 0 && (
                    <Box>
                        <Paper square sx={{ padding: "4px 8px", position: "sticky", top: 0, flexDirection: "row", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="subtitle2">
                                {t("running", "Running")} ({runningTasks.length})
                            </Typography>
                        </Paper>

                        <BaseList<QueueTaskInfo>
                            items={runningTasks}
                            getItemId={(task) => task.id}
                            size="default"
                            renderItem={(task) =>
                                renderTaskRow(
                                    task,
                                    t(
                                        "started-duration",
                                        "Started: {{started}} | Duration: {{duration}}",
                                        { started: formatTime(task.started), duration: formatDuration(task.started) }
                                    )
                                )
                            }
                        />
                    </Box>
                )}

                {queuedLast.length > 0 && (
                    <Box>
                        <Paper square sx={{ padding: "4px 8px", position: "sticky", top: 0, flexDirection: "row", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="subtitle2">
                                {t("queued", "Queued")} ({queuedTasks.length > queuedLast.length ? `${queuedLast.length}/${queuedTasks.length}` : queuedLast.length})
                            </Typography>
                            <Tooltip title={t("cancel-all-tasks", "Cancel All Tasks")}>
                                <IconButton size="small" onClick={() => queue.cancelAllQueued()}>
                                    <theme.icons.Close />
                                </IconButton>
                            </Tooltip>
                        </Paper>

                        <BaseList<QueueTaskInfo>
                            items={queuedLast}
                            getItemId={(task) => task.id}
                            size="default"
                            renderItem={(task) =>
                                renderTaskRow(
                                    task,
                                    t("enqueued", "Enqueued: {{time}}", { time: formatTime(task.enqueued) }),
                                    { cancel: true }
                                )
                            }
                            sx={{ maxHeight: 200, overflowY: "auto" }}
                        />
                    </Box>
                )}

                {finishedLast.length > 0 && (
                    <Box>
                        <Paper square sx={{ padding: "4px 8px", position: "sticky", top: 0, flexDirection: "row", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="subtitle2">
                                {t("finished", "Finished")} ({finishedTasks.length > finishedLast.length ? `${finishedLast.length}/${finishedTasks.length}` : finishedLast.length})
                            </Typography>
                            <Tooltip title={t("clear-tasks-history", "Clear Tasks History")}>
                                <IconButton size="small" onClick={() => queue.clearFinishedHistory()}>
                                    <theme.icons.Clear />
                                </IconButton>
                            </Tooltip>
                        </Paper>

                        <BaseList<QueueTaskInfo>
                            items={finishedLast}
                            getItemId={(task) => task.id}
                            size="default"
                            renderItem={(task) =>
                                renderTaskRow(
                                    task,
                                    task.error
                                        ? t("error", "Error: {{error}}", { error: task.error })
                                        : t("duration", "Duration: {{duration}}", {
                                            duration: formatDuration(task.started, task.finished),
                                        })
                                )
                            }
                            sx={{ maxHeight: 200, overflowY: "auto" }}
                        />
                    </Box>
                )}

                {tasks.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                        {t("no-tasks", "No tasks in queue")}
                    </Typography>
                )}
            </Box>

            <LocalSettingsDialog
                open={settingsDialogOpen}
                onClose={() => setSettingsDialogOpen(false)}
                settings={queueSettingsDefinition}
                defaultValues={queueSettings}
                onSave={(newValues) => {
                    queue.setConcurrency(newValues.maxConcurrency);
                    queue.setQueueHistory(newValues.maxQueueHistory);
                    setQueueSettings(newValues);
                    onSaveSettings?.(newValues);
                }}
            />
        </Popover>
    );
};

export default QueueTasksPopover;