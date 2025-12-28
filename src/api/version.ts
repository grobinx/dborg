
export interface VersionBase {
    major?: number,
    minor?: number,
    release?: string |  number,
    build?: string | number,
    maintenance?: string | number,
    revision?: string | number,
    patch?: string | number,
    current?: string | number,
    age?: string | number,
    name?: string

    toString(): string;
    parse(version: string): void;
}

type Version<K extends keyof VersionBase = "major" | "minor" | "release" | "build" | "toString"> = Pick<VersionBase, K>;

/**
 * Converts version string to a number for easy comparison.
 * The number is calculated as (major * 10000 + minor * 100 + patch).
 * For example, "1.2.3" becomes 10203, "10.15.4" becomes 101504, "9.6" becomes 90600, "12.3.354" becomes 1203354.
 * 
 * @param version 
 * @returns 
 */
export function versionToNumber(version: string) : number {
    const parts = version.split('.').map(part => parseInt(part, 10));
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;

    return major * 10000 + minor * 100 + patch;
}

export default Version;
