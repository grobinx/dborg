import scheduleMicrotask from "@renderer/utils/microtask";
import React from "react";
export * as Messages from "../app/Messages";

type MessageHandler<Args extends unknown[] = unknown[], R = unknown> = (...args: Args) => Promise<R> | R;
type AnyMessageHandler = (...args: unknown[]) => Promise<unknown> | unknown;

export interface MessageContextProps {
    subscribe: <Args extends unknown[], R = unknown>(message: string, handler: MessageHandler<Args, R>) => () => void;
    unsubscribe: <Args extends unknown[], R = unknown>(message: string, handler: MessageHandler<Args, R>) => void;
    sendMessage: <Args extends unknown[], R = unknown>(message: string, ...args: Args) => Promise<R | undefined>;
    queueMessage: (message: string, ...args: unknown[]) => void;
    emit: <Args extends unknown[], R = unknown>(message: string, ...args: Args) => Promise<R | undefined>;
}

const MessageContext = React.createContext<MessageContextProps | undefined>(undefined);

type PendingQueuedMessage = { message: string; args: unknown[] };
const pendingQueuedMessages: PendingQueuedMessage[] = [];

const defaultSendMessage: MessageContextProps["sendMessage"] = async () => undefined;
const defaultQueueMessage: MessageContextProps["queueMessage"] = (message, ...args) => {
    pendingQueuedMessages.push({ message, args });
};

export let sendMessage: MessageContextProps["sendMessage"] = defaultSendMessage;
export let queueMessage: MessageContextProps["queueMessage"] = defaultQueueMessage;

function setBusFunctions(
    send: MessageContextProps["sendMessage"],
    queue: MessageContextProps["queueMessage"]
) {
    sendMessage = send;
    queueMessage = queue;

    if (pendingQueuedMessages.length > 0) {
        const queued = pendingQueuedMessages.splice(0, pendingQueuedMessages.length);
        for (const item of queued) {
            queue(item.message, ...item.args);
        }
    }
}

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const listenersRef = React.useRef<Map<string, Set<AnyMessageHandler>>>(new Map());

    const unsubscribe = React.useCallback<MessageContextProps["unsubscribe"]>((message, handler) => {
        const handlers = listenersRef.current.get(message);
        if (!handlers) return;

        handlers.delete(handler as unknown as AnyMessageHandler);
        if (handlers.size === 0) {
            listenersRef.current.delete(message);
        }
    }, []);

    const subscribe = React.useCallback<MessageContextProps["subscribe"]>((message, handler) => {
        let handlers = listenersRef.current.get(message);
        if (!handlers) {
            handlers = new Set<AnyMessageHandler>();
            listenersRef.current.set(message, handlers);
        }

        handlers.add(handler as unknown as AnyMessageHandler);
        return () => unsubscribe(message, handler);
    }, [unsubscribe]);

    const sendMessageImpl = React.useCallback(
        async <Args extends unknown[], R = unknown>(message: string, ...args: Args): Promise<R | undefined> => {
            const handlers = listenersRef.current.get(message);
            if (!handlers || handlers.size === 0) return undefined;

            const snapshot = Array.from(handlers);
            let firstResult: R | undefined;

            for (const handler of snapshot) {
                try {
                    const result = await handler(...(args as unknown[]));
                    if (firstResult === undefined && result !== undefined) {
                        firstResult = result as R;
                    }
                } catch (error) {
                    console.error(`Message handler failed for "${message}"`, error);
                }
            }

            return firstResult;
        },
        []
    );

    const queueMessageImpl = React.useCallback<MessageContextProps["queueMessage"]>((message, ...args) => {
        scheduleMicrotask(() => {
            void sendMessageImpl(message, ...(args as any[]));
        });
    }, [sendMessageImpl]);

    React.useEffect(() => {
        setBusFunctions(sendMessageImpl, queueMessageImpl);
    }, [sendMessageImpl, queueMessageImpl]);

    const contextValue = React.useMemo<MessageContextProps>(() => ({
        subscribe,
        unsubscribe,
        sendMessage: sendMessageImpl,
        emit: sendMessageImpl,
        queueMessage: queueMessageImpl,
    }), [subscribe, unsubscribe, sendMessageImpl, queueMessageImpl]);

    return (
        <MessageContext.Provider value={contextValue}>
            {children}
        </MessageContext.Provider>
    );
};

export const useMessages = (): MessageContextProps => {
    const context = React.useContext(MessageContext);
    if (!context) {
        throw new Error("useMessages must be used within a MessageProvider");
    }
    return context;
};
