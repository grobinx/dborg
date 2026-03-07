/**
 * Bazowy kontrakt opisu wersji aplikacji/biblioteki.
 *
 * Pola są opcjonalne, ponieważ różne schematy wersjonowania
 * (semver, buildy CI, wersjonowanie ABI) używają różnych segmentów.
 */
export interface VersionBase {
    /** Główna wersja (breaking changes). */
    major?: number,

    /** Wersja mniejsza (nowe funkcje kompatybilne wstecz). */
    minor?: number,

    /** Numer/oznaczenie wydania (niestandardowy segment projektu). */
    release?: string | number,

    /** Numer builda (np. numer CI lub artefaktu). */
    build?: string | number,

    /** Oznaczenie wydania utrzymaniowego/serwisowego. */
    maintenance?: string | number,

    /** Rewizja konkretnego wydania. */
    revision?: string | number,

    /** Numer poprawek błędów (patch). */
    patch?: string | number,

    /** Bieżąca wersja ABI/API (np. w stylu libtool). */
    current?: string | number,

    /** Zakres kompatybilności ABI/API wstecz (age). */
    age?: string | number,

    /** Określa wersję przedpremierową (alpha, beta, rc) lub niestandardową etykietę. */
    preRelease?: "dev" | "snapshot" | "nightly" | "alpha" | "beta" | "rc" | string;

    /** Opcjonalna nazwa kodowa lub etykieta wersji. */
    name?: string

    /** Zwraca wersję w postaci tekstowej. */
    toString(): string;

    /** Parsuje tekst wersji i uzupełnia pola interfejsu. */
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
