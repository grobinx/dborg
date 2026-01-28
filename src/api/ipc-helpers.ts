import { gzipSync, gunzipSync } from "zlib";

export interface InvokeResult {
    type: "result" | "error",
}

export interface CompressedResult {
    compressed?: boolean;
    originalSize?: number;
}

export interface ResolveResult extends InvokeResult, CompressedResult {
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


const COMPRESS_THRESHOLD = 1024 * 1024; // 1MB

function tryCompress(result: unknown): { compressedResult?: string, originalSize?: number } | undefined {
    try {
        const json = JSON.stringify(result);
        if (json.length > COMPRESS_THRESHOLD) {
            const compressed = gzipSync(json);
            return {
                compressedResult: compressed.toString("base64"),
                originalSize: json.length
            };
        }
    } catch { }
    return undefined;
}

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
        const compressed = tryCompress(result);
        return {
            type: "result",
            result: compressed ? compressed.compressedResult : result,
            compressed: !!compressed,
            originalSize: compressed?.originalSize
        } as ResolveResult & { compressed?: boolean };
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
function yieldToRenderer(ms = YIELD_MS) {
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

        // Jeśli duże dane – daj „oddech” przed kosztownymi operacjami
        const bigPayload = !!result.compressed && typeof result.originalSize === 'number' && result.originalSize > 256 * 1024;

        if (bigPayload) {
            await yieldToRenderer(); // oddaj sterowanie zanim zaczniemy dekompresję
        }

        if (result.compressed && result.originalSize != null) {
            const buffer = Buffer.from(result.result as string, "base64");

            if (buffer.byteLength > 256 * 1024) {
                await yieldToRenderer(); // przed gunzip
            }

            const json = gunzipSync(buffer).toString("utf8");

            if (json.length > 1024 * 1024) {
                await yieldToRenderer(); // przed JSON.parse
            }

            return JSON.parse(json) as T;
        }

        return result.result as T;
    });
}
