/**
 * Available target languages for code conversion
 */
export type TargetLanguage = 
    | 'js' | 'ts' | 'java' | 'cpp' | 'pascal' | 'php' | 'perl' 
    | 'python' | 'csharp' | 'go' | 'rust' | 'kotlin' | 'swift'
    | 'ruby' | 'groovy' | 'scala' | 'sql' | 'bash' | 'powershell';

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
    /** Whether to add newline character at end of each line in concatenation mode (default true) */
    addLineBreaks?: boolean;
}

/**
 * Programming language configuration
 */
interface LanguageConfig {
    // STRING DELIMITERS
    /** Basic delimiter for strings (" or ') */
    stringDelimiter: string;
    /** Delimiter for multiline strings (if supported) */
    multilineDelimiter?: string;
    /** Closing delimiter for multiline strings (if different from opening) */
    multilineClosingDelimiter?: string;
    /** Prefix before multiline delimiter (e.g. "@" in C#, "r#" in Rust) */
    multilinePrefix?: string;

    // ESCAPE RULES
    /** Escape character (usually \) */
    escapeChar: string;
    /** How to escape newline in standard string */
    newlineEscape: string;

    // CONCATENATION & LINE BREAKS
    /** String concatenation operator (+ or .) */
    concatenation: string;
    /** Representation of line break in concatenation mode */
    lineBreakLiteral?: string;
    /** Whether line break is outside delimiter (true: 'text'#13#10, false: "text\n") */
    lineBreakOutsideDelimiter?: boolean;

    // VARIABLE DECLARATION
    /** Variable declaration prefix (const, var, my, $, etc.) */
    declarationPrefix: string;
    /** Suffix after variable name (e.g. ": string" in TypeScript) */
    declarationSuffix?: string;
    /** Whether to add space after prefix */
    spaceAfterPrefix: boolean;

    // STATEMENT ENDING
    /** Whether language requires semicolon at end of statement */
    needsSemicolon: boolean;

    // MULTILINE SUPPORT
    /** Whether language supports multiline strings */
    supportsMultiline: boolean;
    /** Whether multiline requires \n at beginning/end */
    multilineNeedsNewlines: boolean;

    // ESCAPE RULES FOR MULTILINE
    multilineEscapeRules: {
        escapeBackslash?: boolean;
        escapeDelimiter?: boolean;
        delimiterEscapeSequence?: string;
        escapeInterpolation?: boolean;
        interpolationPattern?: string;
        interpolationEscape?: string;
    };

    // ESCAPE RULES FOR STANDARD STRINGS
    standardEscapeRules: {
        escapeBackslash: boolean;
        escapeNewline: boolean;
        escapeCarriageReturn: boolean;
        escapeTab: boolean;
        escapeQuotes: boolean;
        quoteEscapeSequence?: string;
    };
}

/**
 * Configurations for all supported languages
 */
export const LANGUAGE_CONFIGS: Record<TargetLanguage, LanguageConfig> = {
    js: {
        stringDelimiter: '"',
        multilineDelimiter: '`',
        escapeChar: '\\',
        newlineEscape: '\\n',
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: true,
        declarationPrefix: 'const',
        spaceAfterPrefix: true,
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
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: true,
        declarationPrefix: 'const',
        spaceAfterPrefix: true,
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
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: true,
        declarationPrefix: 'String',
        spaceAfterPrefix: true,
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
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: true,
        declarationPrefix: 'std::string',
        spaceAfterPrefix: true,
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
        newlineEscape: '#13#10',
        lineBreakLiteral: '#13#10',
        lineBreakOutsideDelimiter: true,
        concatenation: ' + ',
        needsSemicolon: true,
        declarationPrefix: 'var',
        spaceAfterPrefix: true,
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
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' . ',
        needsSemicolon: true,
        declarationPrefix: '$',
        spaceAfterPrefix: false,
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
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' . ',
        needsSemicolon: true,
        declarationPrefix: 'my $',
        spaceAfterPrefix: false,
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
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: false,
        declarationPrefix: '',
        spaceAfterPrefix: false,
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
        lineBreakLiteral: '\\r\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: true,
        declarationPrefix: 'string',
        spaceAfterPrefix: true,
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
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: false,
        declarationPrefix: 'var',
        spaceAfterPrefix: true,
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
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: '.to_owned() + ',
        needsSemicolon: true,
        declarationPrefix: 'let',
        spaceAfterPrefix: true,
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
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: false,
        declarationPrefix: 'val',
        spaceAfterPrefix: true,
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
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: false,
        declarationPrefix: 'let',
        spaceAfterPrefix: true,
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

    ruby: {
        stringDelimiter: '"',
        multilineDelimiter: '<<~SQL',
        multilineClosingDelimiter: 'SQL',
        escapeChar: '\\',
        newlineEscape: '\\n',
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: false,
        declarationPrefix: '',
        spaceAfterPrefix: false,
        supportsMultiline: true,
        multilineNeedsNewlines: true,
        multilineEscapeRules: {
            escapeBackslash: true,
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

    groovy: {
        stringDelimiter: '"',
        multilineDelimiter: '"""',
        escapeChar: '\\',
        newlineEscape: '\\n',
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: true,
        declarationPrefix: 'def',
        spaceAfterPrefix: true,
        supportsMultiline: true,
        multilineNeedsNewlines: false,
        multilineEscapeRules: {
            escapeBackslash: true,
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

    scala: {
        stringDelimiter: '"',
        multilineDelimiter: '"""',
        escapeChar: '\\',
        newlineEscape: '\\n',
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: true,
        declarationPrefix: 'val',
        spaceAfterPrefix: true,
        supportsMultiline: true,
        multilineNeedsNewlines: false,
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

    sql: {
        stringDelimiter: "'",
        escapeChar: "'",
        newlineEscape: '\\n',
        lineBreakLiteral: 'CHR(10)',
        lineBreakOutsideDelimiter: true,
        concatenation: ' || ',
        needsSemicolon: true,
        declarationPrefix: '',
        spaceAfterPrefix: false,
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

    bash: {
        stringDelimiter: '"',
        multilineDelimiter: "<<'EOF'",
        multilineClosingDelimiter: 'EOF',
        escapeChar: '\\',
        newlineEscape: '\\n',
        lineBreakLiteral: '\\n',
        lineBreakOutsideDelimiter: false,
        concatenation: '',
        needsSemicolon: false,
        declarationPrefix: '',
        spaceAfterPrefix: false,
        supportsMultiline: true,
        multilineNeedsNewlines: true,
        multilineEscapeRules: {
            escapeBackslash: false,
            escapeDelimiter: false
        },
        standardEscapeRules: {
            escapeBackslash: true,
            escapeNewline: true,
            escapeCarriageReturn: false,
            escapeTab: true,
            escapeQuotes: true
        }
    },

    powershell: {
        stringDelimiter: '"',
        multilineDelimiter: '@"',
        multilineClosingDelimiter: '"@',
        escapeChar: '`',
        newlineEscape: '`n',
        lineBreakLiteral: '`n',
        lineBreakOutsideDelimiter: false,
        concatenation: ' + ',
        needsSemicolon: false,
        declarationPrefix: '$',
        spaceAfterPrefix: false,
        supportsMultiline: true,
        multilineNeedsNewlines: true,
        multilineEscapeRules: {
            escapeBackslash: false,
            escapeDelimiter: false
        },
        standardEscapeRules: {
            escapeBackslash: false,
            escapeNewline: true,
            escapeCarriageReturn: false,
            escapeTab: true,
            escapeQuotes: true,
            quoteEscapeSequence: '`"'
        }
    }
};

/**
 * Escapes string for multiline strings according to language rules
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
        const quoteRegex = new RegExp(config.stringDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (rules.quoteEscapeSequence) {
            result = result.replace(quoteRegex, rules.quoteEscapeSequence);
        } else {
            result = result.replace(quoteRegex, config.escapeChar + config.stringDelimiter);
        }
    }

    return result;
}

/**
 * Converts text to code in selected programming language
 */
export function codeTo(text: string, options: CodeToCodeOptions): string {
    const config = LANGUAGE_CONFIGS[options.language];
    const varName = options.variableName || 'query';
    const useMultiline = options.useMultiline ?? true;
    const indent = options.indent || '    ';
    const addSemicolon = options.addSemicolon ?? config.needsSemicolon;
    const addLineBreaks = options.addLineBreaks ?? true;
    const lineBreak = config.lineBreakLiteral || config.newlineEscape;

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
        
        const parts = escapedLines.map((line, i) => {
            const prefix = i === 0 ? '' : indent;
            const isLastLine = i === escapedLines.length - 1;
            
            if (config.lineBreakOutsideDelimiter && addLineBreaks && !isLastLine) {
                // Line break outside: 'text' || CHR(10) ||
                return `${prefix}${config.stringDelimiter}${line}${config.stringDelimiter} ${config.concatenation} ${lineBreak} ${config.concatenation}`;
            } else {
                // Line break inside: "text\n"
                const lineBreakStr = (addLineBreaks && !isLastLine) ? lineBreak : '';
                return `${prefix}${config.stringDelimiter}${line}${lineBreakStr}${config.stringDelimiter}`;
            }
        });

        // Join parts
        if (config.lineBreakOutsideDelimiter && addLineBreaks) {
            result += parts.join('\n');
        } else {
            result += parts.join(config.concatenation + '\n');
        }
    }

    if (addSemicolon) result += ';';
    return result;
}

/**
 * Returns list of all available target languages
 */
export function getAvailableLanguages(): Array<{ id: TargetLanguage; name: string }> {
    return [
        { id: 'js', name: 'JavaScript' },
        { id: 'ts', name: 'TypeScript' },
        { id: 'java', name: 'Java' },
        { id: 'groovy', name: 'Groovy' },
        { id: 'scala', name: 'Scala' },
        { id: 'kotlin', name: 'Kotlin' },
        { id: 'cpp', name: 'C++' },
        { id: 'csharp', name: 'C#' },
        { id: 'python', name: 'Python' },
        { id: 'ruby', name: 'Ruby' },
        { id: 'php', name: 'PHP' },
        { id: 'perl', name: 'Perl' },
        { id: 'bash', name: 'Bash' },
        { id: 'powershell', name: 'PowerShell' },
        { id: 'go', name: 'Go' },
        { id: 'rust', name: 'Rust' },
        { id: 'swift', name: 'Swift' },
        { id: 'pascal', name: 'Pascal' },
        { id: 'sql', name: 'SQL' }
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