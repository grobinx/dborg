
const scheduleMicrotask: (callback: () => void) => void =
    typeof queueMicrotask === "function"
        ? queueMicrotask
        : (callback) => { void Promise.resolve().then(callback); };

export default scheduleMicrotask;