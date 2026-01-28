import { gzipSync, gunzipSync } from "zlib";

export interface InvokeResult {
    type: "result" | "error",
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
function handleResult<T>(callback: HandleResultCallback<T>): Promise<InvokeResult>;

/**
 * Change promise result with catch handle to result for send ipc message
 * @param promise result promise
 * @returns 
 * @example
 * ipcMain.handle(EVENT_INTERNAL_QUERY, ..., () => handleResult(internal!.query(sql, values)))
 */
function handleResult<T>(promise: Promise<T>): Promise<InvokeResult>;

async function handleResult<T>(arg: Promise<T> | HandleResultCallback<T>): Promise<InvokeResult> {
    const promise = (arg instanceof Promise) ? arg : (arg as HandleResultCallback<T>)();
    return await promise.then((result) => {
        return {
            type: "result",
            result: result
        } as ResolveResult;
    }).catch((error) => {
        return {
            type: "error",
            error: Object.assign({ message: error["message"], stack: error["stack"] }, error)
        } as RejectResult;
    })
}

export { handleResult };

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
