import React from "react";
import { Popover, Typography, Box, Chip, Paper, alpha } from "@mui/material";
import { useTheme } from "@mui/material";
import { IQueueTask, QueueTaskInfo } from "@renderer/utils/QueueTask";
import { useTranslation } from "react-i18next";
import { Duration } from "luxon";
import { durationToHuman } from "@renderer/common";
import { IconButton } from "@renderer/components/buttons/IconButton";
import { BaseList } from "@renderer/components/inputs/base/BaseList";
import Tooltip from "@renderer/components/Tooltip";

interface QueueTasksPopoverProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    queue: IQueueTask;
}

const QueueTasksPopover: React.FC<QueueTasksPopoverProps> = ({
    anchorEl,
    open,
    onClose,
    queue,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [, setRefresh] = React.useState(0n);
    const tasks = queue.getTasks();

    React.useEffect(() => {
        if (!open) return;

        const interval = setInterval(() => {
            setRefresh((r) => r + 1n);
        }, 1000);

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
    const finishedLast10 = finishedTasks.slice(0, 10);

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
            <Typography variant="h6" sx={{ px: 8 }}>
                {t("queue-tasks", "Queue Tasks")}
            </Typography>

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

                {queuedTasks.length > 0 && (
                    <Box>
                        <Paper square sx={{ padding: "4px 8px", position: "sticky", top: 0, flexDirection: "row", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="subtitle2">
                                {t("queued", "Queued")} ({queuedTasks.length})
                            </Typography>
                            <Tooltip title={t("cancel-all-tasks", "Cancel All Tasks")}>
                                <IconButton size="small" onClick={() => queue.cancelAllQueued()}>
                                    <theme.icons.Close />
                                </IconButton>
                            </Tooltip>
                        </Paper>

                        <BaseList<QueueTaskInfo>
                            items={queuedTasks}
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

                {finishedTasks.length > 0 && (
                    <Box>
                        <Paper square sx={{ padding: "4px 8px", position: "sticky", top: 0, flexDirection: "row", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="subtitle2">
                                {t("finished", "Finished")} ({finishedTasks.length})
                            </Typography>
                            <Tooltip title={t("clear-tasks-history", "Clear Tasks History")}>
                                <IconButton size="small" onClick={() => queue.clearFinishedHistory()}>
                                    <theme.icons.Clear />
                                </IconButton>
                            </Tooltip>
                        </Paper>

                        <BaseList<QueueTaskInfo>
                            items={finishedLast10}
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
        </Popover>
    );
};

export default QueueTasksPopover;