import { queueMessage } from "@renderer/contexts/MessageContext";
import { TOAST_ADD_MESSAGE, ToastAddMessage } from "@renderer/contexts/ToastContext";
import { uuidv7 } from "uuidv7";
import { t } from "i18next";

export const QUEUE_TASK_MESSAGE = "queue-task-message";
export interface QueueTaskMessage {
    queueId: string;
    type: QueueTaskStatus | "trimmed";
    taskId?: string;
}

export type QueueTaskStatus = "queued" | "running" | "done" | "failed" | "canceled";

export interface QueueTaskInfo {
    id: string;
    label: string;
    status: QueueTaskStatus;
    enqueued: number;
    started?: number;
    finished?: number;
    error?: string;
}

export interface QueueTaskOptions {
    id?: string;
    maxConcurrency?: number;
    maxQueueHistory?: number;
}

export interface TaskOptions<T = any> {
    execute: (context: T) => Promise<unknown>;
    label: string;
}

interface PendingTask {
    id: string;
    execute: () => void;
}

/**
 * Simple in-memory FIFO queue with per-instance concurrency and task tracking.
 * Fire-and-forget: tasks are started automatically when capacity is available.
 */
export class QueueTask<T = any> {
    private readonly id: string;
    private readonly maxQueueHistory: number;

    private maxConcurrency = 1;
    private active = 0;
    private pending: PendingTask[] = [];

    private queueTasks: QueueTaskInfo[] = [];

    constructor(options: QueueTaskOptions) {
        this.id = options.id ?? "queue-task";
        this.maxConcurrency = Math.max(1, Math.floor(options.maxConcurrency ?? 1));
        this.maxQueueHistory = Math.max(0, Math.floor(options.maxQueueHistory ?? 200));
    }

    /**
     * max <= 1 => sequential FIFO
     */
    setConcurrency(max: number): void {
        this.maxConcurrency = Math.max(1, Math.floor(max));
        this.pumpQueue();
    }

    /**
     * Enqueue task (fire-and-forget).
     */
    enqueue(task: TaskOptions<T>, context: T): void {
        const id = this.nextQueueId();
        const info: QueueTaskInfo = {
            id,
            label: task.label,
            status: "queued",
            enqueued: Date.now(),
        };
        this.queueTasks.push(info);

        const execute = async () => {
            this.active++;
            info.status = "running";
            info.started = Date.now();
            queueMessage(QUEUE_TASK_MESSAGE, { queueId: this.id, type: "started", taskId: id });

            try {
                await task.execute(context);
                info.status = "done";
            } catch (err: any) {
                info.status = "failed";
                info.error = err?.message ?? String(err);
                console.error("Queue task failed:", info.label, err);
                queueMessage(QUEUE_TASK_MESSAGE, { queueId: this.id, type: "failed", taskId: id });
                queueMessage(TOAST_ADD_MESSAGE, { type: "error", message: t("queue-task-failed", "Queue task failed: {{label}}", { label: info.label }) } as ToastAddMessage);
            } finally {
                info.finished = Date.now();
                queueMessage(QUEUE_TASK_MESSAGE, { queueId: this.id, type: "finished", taskId: id });
                this.active--;
                this.pumpQueue();
                this.trimQueueHistory();
            }
        };

        this.pending.push({ id, execute });
        queueMessage(QUEUE_TASK_MESSAGE, { queueId: this.id, type: "queued", taskId: id } as QueueTaskMessage);
        this.pumpQueue();
        this.trimQueueHistory();
    }

    /**
     * Get current queue tasks (including running).
     */
    getTasks(): QueueTaskInfo[] {
        return this.queueTasks.map((t) => ({ ...t }));
    }

    /**
     * Cancel a queued task by id (only if not started).
     */
    cancelQueuedTask(id: string): boolean {
        const taskInfo = this.queueTasks.find((t) => t.id === id);
        if (!taskInfo || taskInfo.status !== "queued") {
            return false;
        }

        const index = this.pending.findIndex((p) => p.id === id);
        if (index >= 0) {
            this.pending.splice(index, 1);
            taskInfo.status = "canceled";
            taskInfo.finished = Date.now();
            queueMessage(QUEUE_TASK_MESSAGE, { queueId: this.id, type: "canceled", taskId: id });
            return true;
        }

        return false;
    }

    /**
     * Cancel all queued (not started) tasks. Running tasks are not interrupted.
     * Mirrors previous DatabaseSession.close() behavior.
     */
    cancelAllQueued(): void {
        if (this.pending.length <= 0) return;

        const canceledIds = new Set(this.pending.map((p) => p.id));
        this.pending = [];
        this.queueTasks.forEach((t) => {
            if (t.status === "queued" && canceledIds.has(t.id)) {
                t.status = "canceled";
                t.finished = Date.now();
                queueMessage(QUEUE_TASK_MESSAGE, { queueId: this.id, type: "canceled", taskId: t.id });
            }
        });
        this.trimQueueHistory(true);
    }

    private pumpQueue(): void {
        while (this.active < this.maxConcurrency && this.pending.length > 0) {
            const item = this.pending.shift();
            if (item) {
                item.execute();
            }
        }
    }

    private nextQueueId(): string {
        return uuidv7();
    }

    private trimQueueHistory(clearAllFinished: boolean = false): void {
        // Keep all queued/running + last N finished (or none if clearAllFinished)
        const active = this.queueTasks.filter((t) => t.status === "queued" || t.status === "running");
        if (clearAllFinished) {
            this.queueTasks = active;
            queueMessage(QUEUE_TASK_MESSAGE, { queueId: this.id, type: "trimmed" });
            return;
        }

        const finished = this.queueTasks.filter((t) => t.status !== "queued" && t.status !== "running");
        if (finished.length <= this.maxQueueHistory) {
            this.queueTasks = active.concat(finished);
            queueMessage(QUEUE_TASK_MESSAGE, { queueId: this.id, type: "trimmed" });
            return;
        }
        const tail = finished.slice(-this.maxQueueHistory);
        this.queueTasks = active.concat(tail);
        queueMessage(QUEUE_TASK_MESSAGE, { queueId: this.id, type: "trimmed" });
    }
}