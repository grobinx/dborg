import express from 'express';
import crypto from 'crypto';
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { handleResult, InvokeResult } from './ipc-helpers';
import { uuidv7 } from 'uuidv7';

const results = new Map<string, InvokeResult>();
const waiters = new Map<string, (payload: InvokeResult) => void>();
const LONG_POLL_MS = 30_000;
const RESULT_TTL_MS = 5 * 60_000;

function genId(): string {
    return uuidv7();
}

export function startLocalResultServer(): void {
    const app = express();
    app.use(express.json());

    // --- CORS middleware for local result requests (allow local renderer origins) ---
    app.use((req, res, next) => {
        const origin = String(req.headers.origin || '');

        // Allow only local dev/origins — echo back origin when it looks local
        if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://[::1]')) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
        } else {
            // fallback during development; change to specific origin in production if needed
            res.setHeader('Access-Control-Allow-Origin', '*');
        }

        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-dborg-token');
        res.setHeader('Access-Control-Max-Age', '3600');

        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }
        next();
    });
    // --- end CORS middleware ---

    interface TokenHeaders {
        'x-dborg-token'?: string;
    }

    app.get('/rpc/result/:id', (req: express.Request<{ id: string }>, res: express.Response<InvokeResult>) => {
        const token = String((req.headers as TokenHeaders)['x-dborg-token'] || req.query.token || '');
        if (process.env.DBORG_API_TOKEN && token !== process.env.DBORG_API_TOKEN) {
            res.status(401).end();
            return;
        }

        const id = req.params.id;
        const r = results.get(id);
        if (r) {
            results.delete(id);
            res.json(r);
            return;
        }

        const timer = setTimeout(() => {
            waiters.delete(id);
            res.status(204).end();
        }, LONG_POLL_MS);

        waiters.set(id, (payload: InvokeResult) => {
            clearTimeout(timer);
            results.delete(id);
            res.json(payload);
        });
    });

    const server = app.listen(0, '127.0.0.1', () => {
        const port = (server.address() as any).port;
        process.env.DBORG_API_PORT = String(port);
        if (!process.env.DBORG_API_TOKEN) process.env.DBORG_API_TOKEN = crypto.randomBytes(12).toString('hex');
        console.log('[rpc-http] listening 127.0.0.1:' + port);
    });
}

export function fulfillResult(id: string, payload: InvokeResult) {
    results.set(id, payload);
    const waiter = waiters.get(id);
    if (waiter) {
        waiter(payload);
        waiters.delete(id);
    }
    setTimeout(() => results.delete(id), RESULT_TTL_MS);
}

/**
 * Rejestruje handler tak, aby wynik (InvokeResult) był publikowany na localhost.
 * Handler może zwracać:
 * - bezpośrednio `InvokeResult` (gdy używałeś `handleResult` wewnątrz handlera)
 * - dowolny zwykły wynik / Promise — zostanie opakowany przez `handleResult`
 */
export function handleWithLocalResult(channel: string, handler: (...args: any[]) => Promise<InvokeResult> | InvokeResult) {
    ipcMain.handle(channel, (_event: IpcMainInvokeEvent, ...args: any[]) => {
        const id = genId();
        (async () => {
            try {
                const out = await handler(_event, ...args);
                fulfillResult(id, out);
            } catch (err) {
                const wrapped = await handleResult(Promise.reject(err));
                fulfillResult(id, wrapped);
            }
        })();
        return id; // natychmiastowy zwrot id przez ipcRenderer.invoke
    });
}