
export const isTrue = (value: string | undefined | null, defaultValue: boolean = false): boolean => {
    if (value === null || value === undefined) return defaultValue;
    return ["true", "1", "yes", "on", "y"].includes(value.toLowerCase());
}
