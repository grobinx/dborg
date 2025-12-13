/**
 * Available target languages for code conversion
 */
export type TargetLanguage = 
    | 'js' | 'ts' | 'java' | 'cpp' | 'pascal' | 'php' | 'perl' 
    | 'python' | 'csharp' | 'go' | 'rust' | 'kotlin' | 'swift';

/**
 * Options for converting code to selected language
 */
export interface CodeToCodeOptions {
    /** Target language */
    language: TargetLanguage;
    /** Variable name (default 'query') */
    variableName?: string;
    /** Whether to use multiline strings when available (default true) */
    useMultiline?: boolean;
    /** Whether to add semicolon at the end (default depends on language) */
    addSemicolon?: boolean;
    /** Indentation for lines in case of concatenation (default 4 spaces) */
    indent?: string;
}

/**
 * Programming language configuration
 */
interface LanguageConfig {
    /** Basic delimiter for strings (" or ') */
    stringDelimiter: string;
    /** Delimiter for multiline strings (if supported) */
    multilineDelimiter?: string;
    /** Closing delimiter for multiline strings (if different from opening) */
    multilineClosingDelimiter?: string;
    /** Escape character (usually \) */
    escapeChar: string;
    /** How to escape newline character in standard string */
    newlineEscape: string;
    /** Whether language requires semicolon at end of statement */
    needsSemicolon: boolean;
    /** Variable declaration prefix (const, var, my, $, etc.) */
    declarationPrefix: string;
    /** Suffix after variable name (e.g. ": string" in TypeScript) */
    declarationSuffix?: string;
    /** Whether to add space after prefix (e.g. "const " vs "$") */
    spaceAfterPrefix: boolean;
    /** String concatenation operator */
    concatenation: string;
    /** Whether language supports multiline strings */
    supportsMultiline: boolean;
    /** Prefix before multiline delimiter (e.g. "@" in C#) */
    multilinePrefix?: string;
    /** Whether multiline requires \n at beginning/end */
    multilineNeedsNewlines: boolean;
    /** Escape rules for multiline strings */
    multilineEscapeRules: {
        /** Whether to escape backslash */
        escapeBackslash?: boolean;
        /** Whether to escape delimiter inside string */
        escapeDelimiter?: boolean;
        /** How to escape delimiter (e.g. "" for C#, \\"\\"\\" for Python) */
        delimiterEscapeSequence?: string;
        /** Whether to escape interpolation (${} in JS) */
        escapeInterpolation?: boolean;
        /** Pattern to match interpolation (e.g. "\$\{" for JS/TS) */
        interpolationPattern?: string;
        /** How to escape interpolation */
        interpolationEscape?: string;
    };
    /** Escape rules for standard strings */
    standardEscapeRules: {
        /** Whether to escape backslash */
        escapeBackslash: boolean;
        /** Whether to escape newline character */
        escapeNewline: boolean;
        /** Whether to escape carriage return character */
        escapeCarriageReturn: boolean;
        /** Whether to escape tab character */
        escapeTab: boolean;
        /** Whether to escape quotes */
        escapeQuotes: boolean;
        /** How to escape quotes (default \") */
        quoteEscapeSequence?: string;
    };
}

/**
 * Configurations for all supported languages
 */
const LANGUAGE_CONFIGS: Record<TargetLanguage, LanguageConfig> = {
    js: {
        stringDelimiter: '"',
        multilineDelimiter: '`',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: true,
        declarationPrefix: 'const',
        spaceAfterPrefix: true,
        concatenation: ' + ',
        supportsMultiline: true,
        multilineNeedsNewlines: false,
        multilineEscapeRules: {
            escapeBackslash: true,
            escapeDelimiter: true,
            delimiterEscapeSequence: '\\`',
            escapeInterpolation: true,
            interpolationPattern: '\\$\\{',
            interpolationEscape: '\\${'
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    },
    ts: {
        stringDelimiter: '"',
        multilineDelimiter: '`',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: true,
        declarationPrefix: 'const',
        spaceAfterPrefix: true,
        concatenation: ' + ',
        supportsMultiline: true,
        multilineNeedsNewlines: false,
        multilineEscapeRules: {
            escapeBackslash: true,
            escapeDelimiter: true,
            delimiterEscapeSequence: '\\`',
            escapeInterpolation: true,
            interpolationPattern: '\\$\\{',
            interpolationEscape: '\\${'
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    },
    java: {
        stringDelimiter: '"',
        multilineDelimiter: '"""',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: true,
        declarationPrefix: 'String',
        spaceAfterPrefix: true,
        concatenation: ' + ',
        supportsMultiline: true,
        multilineNeedsNewlines: false,
        multilineEscapeRules: {
            escapeBackslash: false,
            escapeDelimiter: true,
            delimiterEscapeSequence: '\\"\\"\\"'
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    },
    cpp: {
        stringDelimiter: '"',
        multilineDelimiter: 'R"(',
        multilineClosingDelimiter: ')"',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: true,
        declarationPrefix: 'std::string',
        spaceAfterPrefix: true,
        concatenation: ' + ',
        supportsMultiline: true,
        multilineNeedsNewlines: true,
        multilineEscapeRules: {
            escapeBackslash: false,
            escapeDelimiter: false
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    },
    pascal: {
        stringDelimiter: "'",
        escapeChar: "'",
        newlineEscape: "' + #10 + '",
        needsSemicolon: true,
        declarationPrefix: 'var',
        spaceAfterPrefix: true,
        concatenation: " + ",
        supportsMultiline: false,
        multilineNeedsNewlines: false,
        multilineEscapeRules: {},
        standardEscapeRules: {
            escapeBackslash: false,
            escapeNewline: false,
            escapeCarriageReturn: false,
            escapeTab: false,
            escapeQuotes: true,
            quoteEscapeSequence: "''"
        }
    },
    php: {
        stringDelimiter: '"',
        multilineDelimiter: '<<<SQL',
        multilineClosingDelimiter: 'SQL',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: true,
        declarationPrefix: '$',
        spaceAfterPrefix: false,
        concatenation: ' . ',
        supportsMultiline: true,
        multilineNeedsNewlines: true,
        multilineEscapeRules: {
            escapeBackslash: false,
            escapeDelimiter: false
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    },
    perl: {
        stringDelimiter: '"',
        multilineDelimiter: "<<'SQL'",
        multilineClosingDelimiter: 'SQL',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: true,
        declarationPrefix: 'my $',
        spaceAfterPrefix: false,
        concatenation: ' . ',
        supportsMultiline: true,
        multilineNeedsNewlines: true,
        multilineEscapeRules: {
            escapeBackslash: false,
            escapeDelimiter: false
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    },
    python: {
        stringDelimiter: '"',
        multilineDelimiter: '"""',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: false,
        declarationPrefix: '',
        spaceAfterPrefix: false,
        concatenation: ' + ',
        supportsMultiline: true,
        multilineNeedsNewlines: false,
        multilineEscapeRules: {
            escapeBackslash: true,
            escapeDelimiter: true,
            delimiterEscapeSequence: '\\"\\"\\"'
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    },
    csharp: {
        stringDelimiter: '"',
        multilineDelimiter: '"',
        multilinePrefix: '@',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: true,
        declarationPrefix: 'string',
        spaceAfterPrefix: true,
        concatenation: ' + ',
        supportsMultiline: true,
        multilineNeedsNewlines: false,
        multilineEscapeRules: {
            escapeBackslash: false,
            escapeDelimiter: true,
            delimiterEscapeSequence: '""'
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    },
    go: {
        stringDelimiter: '"',
        multilineDelimiter: '`',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: false,
        declarationPrefix: 'var',
        spaceAfterPrefix: true,
        concatenation: ' + ',
        supportsMultiline: true,
        multilineNeedsNewlines: false,
        multilineEscapeRules: {
            escapeBackslash: false,
            escapeDelimiter: true,
            delimiterEscapeSequence: '\\`'
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    },
    rust: {
        stringDelimiter: '"',
        multilineDelimiter: 'r#"',
        multilineClosingDelimiter: '"#',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: true,
        declarationPrefix: 'let',
        spaceAfterPrefix: true,
        concatenation: '.to_owned() + ',
        supportsMultiline: true,
        multilineNeedsNewlines: true,
        multilineEscapeRules: {
            escapeBackslash: false,
            escapeDelimiter: false
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    },
    kotlin: {
        stringDelimiter: '"',
        multilineDelimiter: '"""',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: false,
        declarationPrefix: 'val',
        spaceAfterPrefix: true,
        concatenation: ' + ',
        supportsMultiline: true,
        multilineNeedsNewlines: false,
        multilineEscapeRules: {
            escapeBackslash: false,
            escapeDelimiter: true,
            delimiterEscapeSequence: '\\"\\"\\"'
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    },
    swift: {
        stringDelimiter: '"',
        multilineDelimiter: '"""',
        escapeChar: '\\',
        newlineEscape: '\\n',
        needsSemicolon: false,
        declarationPrefix: 'let',
        spaceAfterPrefix: true,
        concatenation: ' + ',
        supportsMultiline: true,
        multilineNeedsNewlines: false,
        multilineEscapeRules: {
            escapeBackslash: true,
            escapeDelimiter: true,
            delimiterEscapeSequence: '\\"\\"\\"'
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: true,
            escapeTab: true,
            escapeQuotes: true
        }
    }
};

/**
 * Escapes string for multiline strings according to language rules
 * @param text Text to escape
 * @param config Language configuration
 * @returns Escaped text
 */
function escapeMultilineString(text: string, config: LanguageConfig): string {
    let result = text;
    const rules = config.multilineEscapeRules;

    if (rules.escapeBackslash) {
        result = result.replace(/\\/g, '\\\\');
    }

    if (rules.escapeDelimiter && rules.delimiterEscapeSequence) {
        const delimiterRegex = new RegExp(config.multilineDelimiter!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        result = result.replace(delimiterRegex, rules.delimiterEscapeSequence);
    }

    if (rules.escapeInterpolation && rules.interpolationPattern && rules.interpolationEscape) {
        const interpolationRegex = new RegExp(rules.interpolationPattern, 'g');
        result = result.replace(interpolationRegex, rules.interpolationEscape);
    }

    return result;
}

/**
 * Escapes string for standard strings according to language rules
 * @param text Text to escape
 * @param config Language configuration
 * @returns Escaped text
 */
function escapeStandardString(text: string, config: LanguageConfig): string {
    let result = text;
    const rules = config.standardEscapeRules;

    if (rules.escapeBackslash) {
        result = result.replace(/\\/g, '\\\\');
    }

    if (rules.escapeNewline) {
        result = result.replace(/\n/g, config.newlineEscape);
    }

    if (rules.escapeCarriageReturn) {
        result = result.replace(/\r/g, '\\r');
    }

    if (rules.escapeTab) {
        result = result.replace(/\t/g, '\\t');
    }

    if (rules.escapeQuotes) {
        if (rules.quoteEscapeSequence) {
            const quoteRegex = new RegExp(config.stringDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            result = result.replace(quoteRegex, rules.quoteEscapeSequence);
        } else {
            const quoteRegex = new RegExp(config.stringDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            result = result.replace(quoteRegex, config.escapeChar + config.stringDelimiter);
        }
    }

    return result;
}

/**
 * Converts text to code in selected programming language
 * @param text Text to convert
 * @param options Conversion options
 * @returns Code ready to paste in source
 * @example
 * ```typescript
 * const sql = `SELECT * FROM users
 * WHERE id = 1
 * AND name = "John"`;
 * 
 * codeTo(sql, { language: 'js', variableName: 'query' });
 * // const query = `SELECT * FROM users
 * // WHERE id = 1
 * // AND name = "John"`;
 * 
 * codeTo(sql, { language: 'java', useMultiline: false });
 * // String query = "SELECT * FROM users\n" +
 * //     "WHERE id = 1\n" +
 * //     "AND name = \"John\"";
 * ```
 */
export function codeTo(text: string, options: CodeToCodeOptions): string {
    const config = LANGUAGE_CONFIGS[options.language];
    const varName = options.variableName || 'query';
    const useMultiline = options.useMultiline ?? true;
    const indent = options.indent || '    ';
    const addSemicolon = options.addSemicolon ?? config.needsSemicolon;

    const lines = text.split('\n');
    const isMultiLine = lines.length > 1;

    let result = '';

    // Variable declaration
    if (config.declarationPrefix) {
        result += config.declarationPrefix;
        if (config.spaceAfterPrefix) result += ' ';
        result += varName;
        if (config.declarationSuffix) result += config.declarationSuffix;
        result += ' = ';
    } else {
        result += `${varName} = `;
    }

    // If multiline and language supports multiline strings
    if (isMultiLine && useMultiline && config.supportsMultiline && config.multilineDelimiter) {
        const escaped = escapeMultilineString(text, config);

        if (config.multilinePrefix) {
            result += config.multilinePrefix;
        }

        result += config.multilineDelimiter;

        if (config.multilineNeedsNewlines) {
            result += '\n' + escaped + '\n';
        } else {
            result += escaped;
        }

        if (config.multilineClosingDelimiter) {
            result += config.multilineClosingDelimiter;
        } else {
            result += config.multilineDelimiter;
        }

        if (addSemicolon) result += ';';
        return result;
    }

    // Single line or concatenation
    if (lines.length === 1) {
        const escaped = escapeStandardString(lines[0], config);
        result += `${config.stringDelimiter}${escaped}${config.stringDelimiter}`;
    } else {
        // Multiple lines concatenation
        const escapedLines = lines.map(line => escapeStandardString(line, config));
        result += escapedLines
            .map((line, i) => {
                const prefix = i === 0 ? '' : indent;
                return `${prefix}${config.stringDelimiter}${line}${config.stringDelimiter}`;
            })
            .join(config.concatenation + '\n');
    }

    if (addSemicolon) result += ';';
    return result;
}

/**
 * Returns list of all available target languages
 * @returns Array of objects with language ID and name
 */
export function getAvailableLanguages(): Array<{ id: TargetLanguage; name: string }> {
    return [
        { id: 'js', name: 'JavaScript' },
        { id: 'ts', name: 'TypeScript' },
        { id: 'java', name: 'Java' },
        { id: 'cpp', name: 'C++' },
        { id: 'pascal', name: 'Pascal' },
        { id: 'php', name: 'PHP' },
        { id: 'perl', name: 'Perl' },
        { id: 'python', name: 'Python' },
        { id: 'csharp', name: 'C#' },
        { id: 'go', name: 'Go' },
        { id: 'rust', name: 'Rust' },
        { id: 'kotlin', name: 'Kotlin' },
        { id: 'swift', name: 'Swift' }
    ];
}

/**
 * Przykłady użycia:
 * 
 * const sql = `SELECT * FROM users
 * WHERE id = 1
 * AND name = "John"`;
 * 
 * codeToCode(sql, { language: 'js', variableName: 'query' });
 * // const query = `SELECT * FROM users
 * // WHERE id = 1
 * // AND name = "John"`;
 * 
 * codeToCode(sql, { language: 'java', useMultiline: false });
 * // String query = "SELECT * FROM users\n" +
 * //     "WHERE id = 1\n" +
 * //     "AND name = \"John\"";
 */