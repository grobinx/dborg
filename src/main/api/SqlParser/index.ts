import { IdentifierToken, isIdentifier, isPunctuator, Token } from "./tokenizer";

export * from "./tokenizer";
export * from "./interpreter";
export * from "./scoper";

export interface IdentifierExtractionOptions {
    excludeKeywords?: Set<string>;
}

function shouldSkipIdentifier(
    token: IdentifierToken,
    keywordsToExclude?: Set<string>
): boolean {
    if (!keywordsToExclude) return false;
    return !token.quote && keywordsToExclude.has(token.value);
}

/**
 * Returns identifiers from token list with optional normalization.
 */
export function getIdentifiers(
    tokens: Token[],
    options: IdentifierExtractionOptions = {}
): IdentifierToken[] {
    const result: IdentifierToken[] = [];

    for (const token of tokens) {
        if (!isIdentifier(token)) continue;
        if (shouldSkipIdentifier(token, options.excludeKeywords)) continue;

        result.push(token);
    }

    return result;
}

/**
 * Returns unique identifier values.
 */
export function getUniqueIdentifiers(
    tokens: Token[],
    options: IdentifierExtractionOptions = {}
): string[] {
    const identifiers = getIdentifiers(tokens, options);

    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const id of identifiers) {
        if (!seen.has(id.value)) {
            seen.add(id.value);
            ordered.push(id.value);
        }
    }
    return ordered;
}

/**
 * Returns unique identifier paths, merging dot-separated identifiers.
 */
export function getUniqueIdentifierPaths(
    tokens: Token[],
    options: IdentifierExtractionOptions = {}
): string[] {
    const keywordsToExclude = options.excludeKeywords;
    const seen = new Set<string>();
    const ordered: string[] = [];

    let index = 0;
    while (index < tokens.length) {
        const token = tokens[index];
        if (!isIdentifier(token)) {
            index++;
            continue;
        }

        if (shouldSkipIdentifier(token, keywordsToExclude)) {
            index++;
            continue;
        }

        let value = token.value;
        let nextIndex = index;

        while (nextIndex + 2 < tokens.length) {
            const dotToken = tokens[nextIndex + 1];
            const nextToken = tokens[nextIndex + 2];

            if (!isPunctuator(dotToken, ".")) break;
            if (!isIdentifier(nextToken)) break;

            value += "." + nextToken.value;
            nextIndex += 2;
        }

        if (!seen.has(value)) {
            seen.add(value);
            ordered.push(value);
        }

        index = nextIndex + 1;
    }

    return ordered;
}
