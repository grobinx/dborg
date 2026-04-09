import { ipcRenderer } from 'electron';

export interface InvokeResult {
    type: "result" | "error",
    timestamp: number,
}

export interface ResolveResult extends InvokeResult {
    result: unknown
}

export interface RejectResult extends InvokeResult {
    error: Error
}

function isResolveResult(result: any): result is ResolveResult {
    return typeof result === "object" && "type" in result && result.type === "result";
}

function isRejectResult(result: any): result is RejectResult {
    return typeof result === "object" && "type" in result && result.type === "error";
}

export type HandleResultCallback<T> = () => Promise<T>;

/**
 * Change result of callback function with/or error to result for send ipc message
 * @param callback callback function
 */
export function handleResult<T>(callback: HandleResultCallback<T>): Promise<InvokeResult>;

/**
 * Change promise result with catch handle to result for send ipc message
 * @param promise result promise
 * @returns 
 * @example
 * ipcMain.handle(EVENT_INTERNAL_QUERY, ..., () => handleResult(internal!.query(sql, values)))
 */
export function handleResult<T>(promise: Promise<T>): Promise<InvokeResult>;

export async function handleResult<T>(arg: Promise<T> | HandleResultCallback<T>): Promise<InvokeResult> {
    const promise = (arg instanceof Promise) ? arg : (arg as HandleResultCallback<T>)();
    return await promise.then((result) => {
        return {
            type: "result",
            result: result,
            timestamp: Date.now()
        } as ResolveResult;
    }).catch((error) => {
        return {
            type: "error",
            error: Object.assign({ message: error["message"], stack: error["stack"] }, error),
            timestamp: Date.now()
        } as RejectResult;
    })
}

// Krótka pauza, by oddać sterowanie pętli zdarzeń renderera
const YIELD_MS = 0;
export function yieldToRenderer(ms = YIELD_MS) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

/**
 * Change invoke result to promise with catch handle
 * @param promise invoke result
 * @returns 
 * @example
 * invokeResult(ipcRenderer.invoke(EVENT_INTERNAL_QUERY, sql, values))
 */
export async function invokeResult<T>(promise: Promise<unknown>): Promise<T> {
    return await promise.then(async (handled) => {
        if (isRejectResult(handled)) {
            throw handled.error
        }
        const result = handled as ResolveResult;

        return result.result as T;
    });
}

const PORT = process.env.DBORG_API_PORT;
const TOKEN = process.env.DBORG_API_TOKEN;
const BASE = `http://127.0.0.1:${PORT}`;

export async function invokeViaLocalResult(channel: string, ...args: any[]) {
    const id = await ipcRenderer.invoke(channel, ...args); // otrzymasz id zwrócone przez handleWithLocalResult
    const url = `${BASE}/rpc/result/${id}`;
    const headers: HeadersInit | undefined = TOKEN ? { 'x-dborg-token': TOKEN } : undefined;

    while (true) {
        try {
            const resp = await fetch(url, { headers });
            if (resp.status === 204) {
                // long-poll timeout — spróbuj ponownie
                await new Promise(r => setTimeout(r, 50));
                continue;
            }
            return await resp.json();
        } catch (err) {
            console.error('Error fetching local result:', err);
            return { type: 'error', error: { message: 'Failed to fetch result from local server' } };
        }
    }
}
