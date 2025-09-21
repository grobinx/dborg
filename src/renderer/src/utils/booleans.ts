
export const isTrue = (value: string | undefined | null, defaultValue: boolean = false): boolean | null => {
    if (value === undefined) return defaultValue;
    if (value === null) return null;
    return ["true", "1", "yes", "on", "y"].includes(value.toLowerCase());
}
