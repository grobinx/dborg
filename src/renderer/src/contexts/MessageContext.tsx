import { send } from "process";
import React from "react";
export * as Messages from "../app/Messages"; // Export all messages for easy access

// Generic MessageHandler type with rest parameters
type MessageHandler<Args extends any[] = any[], R = any> = (...args: Args) => Promise<R> | R;

// MessageContextProps with generic support
interface MessageContextProps {
    subscribe: <Args extends any[], R = any>(message: string, handler: MessageHandler<Args, R>) => () => void;
    unsubscribe: <Args extends any[], R = any>(message: string, handler: MessageHandler<Args, R>) => void;
    sendMessage: <Args extends any[], R = any>(message: string, ...args: Args) => Promise<R | undefined>;
    queueMessage: (message: string, ...args: any[]) => void;
    emit: <Args extends any[], R = any>(message: string, ...args: Args) => Promise<R | undefined>;
}

const MessageContext = React.createContext<MessageContextProps | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const listeners = React.useRef<Map<string, Set<MessageHandler>>>(new Map());

    const subscribe = <Args extends any[], R = any>(message: string, handler: MessageHandler<Args, R>) : () => void => {
        if (!listeners.current.has(message)) {
            listeners.current.set(message, new Set());
        }
        listeners.current.get(message)?.add(handler as MessageHandler);
        return () => {
            unsubscribe(message, handler);
        }
    };

    const unsubscribe = <Args extends any[], R = any>(message: string, handler: MessageHandler<Args, R>) => {
        const handlers = listeners.current.get(message);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                listeners.current.delete(message);
            }
        }
    };

    const sendMessage = async <Args extends any[], R = any>(message: string, ...args: Args): Promise<R | undefined> => {
        const handlers = listeners.current.get(message);
        if (!handlers || handlers.size === 0) return undefined;

        const handlersCopy = Array.from(handlers); // Stwórz kopię uchwytów bo może być modyfikowana w trakcie iteracji
        const results: R[] = [];
        for (const handler of handlersCopy) {
            const result = await handler(...args); // Spread the arguments to the handler
            if (result !== undefined) { // Check if the result is not undefined
                results.push(result); // Collect results
            }
        }
        return results[0];
    };

    const queueMessage = (message: string, ...args: any[]) => {
        setTimeout(() => {
            sendMessage(message, ...args);
        }, 10);
    };

    React.useEffect(() => {
        setBusFunctions(sendMessage, queueMessage);
    }, [sendMessage, queueMessage]);

    return (
        <MessageContext.Provider value={{ subscribe, unsubscribe, sendMessage, emit: sendMessage, queueMessage }}>
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

function setBusFunctions(
    send: MessageContextProps["sendMessage"],
    queue: MessageContextProps["queueMessage"]
) {
    sendMessage = send;
    queueMessage = queue;
}

export let sendMessage: MessageContextProps["sendMessage"];
export let queueMessage: MessageContextProps["queueMessage"];
