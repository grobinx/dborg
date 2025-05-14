
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

export default Version;
