import React from "react";
import { Popover, Typography, Box, Chip, Paper, alpha } from "@mui/material";
import { useTheme } from "@mui/material";
import { QueueTaskInfo } from "@renderer/utils/QueueTask";
import { useTranslation } from "react-i18next";
import { Duration } from "luxon";
import { durationToHuman } from "@renderer/common";
import { IconButton } from "@renderer/components/buttons/IconButton";
import { BaseList } from "@renderer/components/inputs/base/BaseList";

interface QueueTasksPopoverProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    tasks: QueueTaskInfo[];
    onCancelTask?: (taskId: string) => void;
}

const QueueTasksPopover: React.FC<QueueTasksPopoverProps> = ({
    anchorEl,
    open,
    onClose,
    tasks,
    onCancelTask,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [, setRefresh] = React.useState(0n);

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
                gap: 4,
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
            />

            {opts?.cancel && onCancelTask && (
                <IconButton size="small" onClick={() => onCancelTask(task.id)}>
                    <theme.icons.Close />
                </IconButton>
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
                        maxHeight: 500,
                        minWidth: 300,
                    }
                }
            }}
        >
            <Paper>
                <Typography variant="body1" sx={{ px: 8, backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                    {t("queue-tasks", "Queue Tasks")}
                </Typography>

                {runningTasks.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2" color="primary" sx={{ px: 8, backgroundColor: alpha(theme.palette.secondary.main, 0.1) }}>
                            {t("running", "Running")} ({runningTasks.length})
                        </Typography>

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
                        <Typography variant="subtitle2" color="text.secondary" sx={{ px: 8, backgroundColor: alpha(theme.palette.secondary.main, 0.1) }}>
                            {t("queued", "Queued")} ({queuedTasks.length})
                        </Typography>

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
                        />
                    </Box>
                )}

                {finishedTasks.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ px: 8, backgroundColor: alpha(theme.palette.secondary.main, 0.1) }}>
                            {t("finished", "Finished")} ({finishedTasks.length})
                        </Typography>

                        <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
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
                            />
                        </Box>
                    </Box>
                )}

                {tasks.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                        {t("no-tasks", "No tasks in queue")}
                    </Typography>
                )}
            </Paper>
        </Popover>
    );
};

export default QueueTasksPopover;