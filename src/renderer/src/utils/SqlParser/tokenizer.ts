export type TokenType =
    | "whitespace"
    | "identifier"
    | "string"
    | "number"
    | "operator"
    | "punctuator"
    | "comment";

export interface TokenPosition {
    line: number;
    column: number;
    offset: number;
}

export interface TokenBase {
    class: "token";
    type: TokenType;
    value: string;
    start: TokenPosition;
    end: TokenPosition;
}

export interface WhitespaceToken extends TokenBase {
    type: "whitespace";
}

export interface IdentifierToken extends TokenBase {
    type: "identifier";
    quote: false | [string, string];
    raw: string;
}

export interface StringToken extends TokenBase {
    type: "string";
    quote: string;
    raw: string;
}

export interface NumberToken extends TokenBase {
    type: "number";
}

export interface OperatorToken extends TokenBase {
    type: "operator";
}

export interface PunctuatorToken extends TokenBase {
    type: "punctuator";
}

export interface CommentToken extends TokenBase {
    type: "comment";
    multiline: boolean;
    raw: string;
}

export type Token =
    | WhitespaceToken
    | IdentifierToken
    | StringToken
    | NumberToken
    | OperatorToken
    | PunctuatorToken
    | CommentToken
    ;

export type SqlDialect =
    | "generic"
    | "postgres"
    | "mysql"
    | "mssql"
    | "oracle"
    | "sqlite"
    | "mariadb"
    | "redshift"
    | "snowflake"
    | "bigquery"
    | "db2"
    | "teradata"
    | "firebird"
    | "duckdb"
    | "clickhouse";

export interface TokenizerOptions {
    dialect?: SqlDialect;
    identifierStart?: RegExp;
    identifierPart?: RegExp;
    identifierQuotePairs?: Array<[string, string]>;
    stringQuotes?: (string | RegExp)[];
    stringEscapeChar?: string;
    punctuators?: string[];
    allowHexNumbers?: boolean;
    allowBinaryNumbers?: boolean;
    allowLeadingDotNumbers?: boolean;
    allowTrailingDotNumbers?: boolean;
}

export function isToken(obj: any): obj is Token {
    return obj && typeof obj === "object" && obj.class === "token" && "type" in obj && "value" in obj && "start" in obj && "end" in obj;
}

export function isIdentifier(token: any): token is IdentifierToken {
    return isToken(token) && token.type === "identifier";
}

export function isKeyword(token: any, ...keywords: string[]): boolean {
    return isIdentifier(token) && !token.quote && keywords.some(kw => kw.toLowerCase() === token.value.toLowerCase());
}

export function isPunctuator(token: any, punctuator: string): boolean {
    return isToken(token) && token.type === "punctuator" && token.value === punctuator;
}

export class Tokenizer {
    private input: string;
    private position: number;
    private line: number;
    private column: number;
    private options: TokenizerOptions;

    private static operatorChars = new Set<string>([
        "+", "-", "*", "/", "%", "=", "<", ">", "!", "&", "|", "^", "~", ":", "?"
    ]);

    private static defaultPunctuators = [".", ",", ";", "(", ")", "{", "}", "[", "]"];

    private static dialectDefaults: Record<string, Partial<TokenizerOptions>> = {
        generic: {
            dialect: "generic",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_]/,
            identifierQuotePairs: [['"', '"'], ['`', '`']],
            stringQuotes: ["'"],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: true,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        postgres: {
            dialect: "postgres",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_$]/,
            identifierQuotePairs: [['"', '"']],     // tylko cudzysłów
            stringQuotes: ["'", /^\$[A-Za-z0-9_]*\$/],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        mysql: {
            dialect: "mysql",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_$]/,
            identifierQuotePairs: [['`', '`'], ['"', '"']],
            stringQuotes: ["'"],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: true,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        mssql: {
            dialect: "mssql",
            identifierStart: /[a-zA-Z_@#]/,
            identifierPart: /[a-zA-Z0-9_@#$]/,
            identifierQuotePairs: [['[', ']'], ['"', '"']],
            stringQuotes: ["'"],
            stringEscapeChar: "'",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        oracle: {
            dialect: "oracle",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_$_#]/,
            identifierQuotePairs: [['"', '"']],
            stringQuotes: ["'"],
            stringEscapeChar: "'",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        sqlite: {
            dialect: "sqlite",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_]/,
            identifierQuotePairs: [['"', '"'], ['`', '`'], ['[', ']']],
            stringQuotes: ["'"],
            stringEscapeChar: "'",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        mariadb: {
            dialect: "mariadb",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_$]/,
            identifierQuotePairs: [['`', '`'], ['"', '"']],
            stringQuotes: ["'"],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: true,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        redshift: {
            dialect: "redshift",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_$]/,
            identifierQuotePairs: [['"', '"']],
            stringQuotes: ["'"],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        snowflake: {
            dialect: "snowflake",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_.$]/,
            identifierQuotePairs: [['"', '"'], ['`', '`']],
            stringQuotes: ["'"],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        bigquery: {
            dialect: "bigquery",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_.$]/,
            identifierQuotePairs: [['`', '`']],
            stringQuotes: ["'"],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        db2: {
            dialect: "db2",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_]/,
            identifierQuotePairs: [['"', '"']],
            stringQuotes: ["'"],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        teradata: {
            dialect: "teradata",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_]/,
            identifierQuotePairs: [['"', '"']],
            stringQuotes: ["'"],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        firebird: {
            dialect: "firebird",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_]/,
            identifierQuotePairs: [['"', '"']],
            stringQuotes: ["'"],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        duckdb: {
            dialect: "duckdb",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_.$]/,
            identifierQuotePairs: [['"', '"'], ['`', '`']],
            stringQuotes: ["'"],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        clickhouse: {
            dialect: "clickhouse",
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_.$]/,
            identifierQuotePairs: [['"', '"'], ['`', '`']],
            stringQuotes: ["'"],
            stringEscapeChar: "\\",
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
    };

    constructor(input: string, options: TokenizerOptions = {}) {
        this.input = input;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        const dialect = options.dialect || "generic";
        this.options = {
            ...(Tokenizer.dialectDefaults["generic"] as TokenizerOptions),
            ...(Tokenizer.dialectDefaults[dialect] || {}),
            ...options,
        };
    }

    private peek(offset = 0): string {
        return this.input[this.position + offset] ?? "";
    }

    private advance(n = 1) {
        for (let i = 0; i < n; i++) {
            const ch = this.peek();
            this.position++;
            if (ch === "\n") { this.line++; this.column = 1; }
            else this.column++;
        }
    }

    private makePos() {
        return { line: this.line, column: this.column, offset: this.position };
    }

    private isDigit(ch: string) { return ch >= "0" && ch <= "9"; }
    private isIdentifierStart(ch: string) {
        return !!this.options.identifierStart && this.options.identifierStart.test(ch);
    }
    private isIdentifierPart(ch: string) {
        return !!this.options.identifierPart && this.options.identifierPart.test(ch);
    }

    tokenize(): Token[] {
        const tokens: Token[] = [];
        while (this.position < this.input.length) {
            const ch = this.peek();

            // Whitespace
            if (/\s/.test(ch)) {
                const start = this.makePos();
                let s = "";
                while (/\s/.test(this.peek())) { s += this.peek(); this.advance(); }
                const end = this.makePos();
                tokens.push({ class: "token", type: "whitespace", value: s, start, end } as WhitespaceToken);
                continue;
            }

            // Comments
            if (ch === "-" && this.peek(1) === "-") {
                const start = this.makePos();
                let raw = ""; let value = "";
                raw += this.peek(); this.advance();
                raw += this.peek(); this.advance();
                while (this.position < this.input.length && this.peek() !== "\n") {
                    const c = this.peek();
                    raw += c; value += c; this.advance();
                }
                const end = this.makePos();
                tokens.push({ class: "token", type: "comment", value: value.trim(), start, end, multiline: false, raw } as CommentToken);
                continue;
            }
            if (ch === "/" && this.peek(1) === "*") {
                const start = this.makePos();
                let raw = ""; let value = "";
                raw += this.peek(); this.advance();
                raw += this.peek(); this.advance();
                while (this.position < this.input.length) {
                    if (this.peek() === "*" && this.peek(1) === "/") {
                        raw += this.peek(); this.advance();
                        raw += this.peek(); this.advance();
                        break;
                    }
                    const c = this.peek();
                    raw += c; value += c; this.advance();
                }
                const end = this.makePos();
                tokens.push({ class: "token", type: "comment", value: value.trim(), start, end, multiline: true, raw } as CommentToken);
                continue;
            }

            if (this.options.stringQuotes) {
                const stringQuotes = this.options.stringQuotes;
                let stringHandled = false;

                for (const sq of stringQuotes) {
                    const rest = this.input.slice(this.position);
                    let match: RegExpMatchArray | null = null;
                    let openStr: string | null = null;
                    const isRegex = typeof sq !== "string";

                    if (!isRegex) {
                        if (!rest.startsWith(sq)) continue;
                        openStr = sq;
                    } else {
                        match = rest.match(sq);
                        if (!match || match.index !== 0) continue;
                        openStr = match[0];
                    }

                    // mamy dopasowany otwieracz
                    const start = this.makePos();
                    this.advance(openStr.length);

                    let content = "";
                    let raw = openStr;

                    // escape char only for string-type quotes (not for regex matches)
                    const escapeChar = !isRegex ? this.options.stringEscapeChar ?? "\\" : null;

                    // If the quote spec was a RegExp (e.g. dollar-quote pattern), treat closing as same literal
                    if (isRegex) {
                        const idx = this.input.indexOf(openStr, this.position);
                        if (idx >= 0) {
                            content = this.input.slice(this.position, idx);
                            raw = openStr + content + openStr;
                            this.advance(content.length + openStr.length);
                        } else {
                            // unterminated
                            content = this.input.slice(this.position);
                            raw = openStr + content;
                            this.advance(content.length);
                        }
                    } else if (openStr.length === 1) {
                        // single-char close with support for:
                        // - doubled-char escaping (always)
                        // - optional escape-char (only when escapeChar !== closeChar)
                        const closeChar = openStr;
                        while (this.position < this.input.length) {
                            const c = this.peek();

                            // handle escape char (only for string-type quotes, not regex)
                            if (escapeChar && escapeChar !== closeChar && c === escapeChar) {
                                raw += c; this.advance();
                                const next = this.peek();
                                if (this.position < this.input.length) { raw += next; this.advance(); content += next; }
                                continue;
                            }

                            if (c === closeChar) {
                                if (this.peek(1) === closeChar) {
                                    raw += c; this.advance();
                                    raw += this.peek(); this.advance();
                                    content += closeChar;
                                    continue;
                                }
                                raw += c; this.advance();
                                break;
                            }

                            raw += c; this.advance(); content += c;
                        }
                    } else {
                        // multi-char literal close (closing equals same sequence as opening)
                        const idx = this.input.indexOf(openStr, this.position);
                        if (idx >= 0) {
                            content = this.input.slice(this.position, idx);
                            raw = openStr + content + openStr;
                            this.advance(content.length + openStr.length);
                        } else {
                            content = this.input.slice(this.position);
                            raw = openStr + content;
                            this.advance(content.length);
                        }
                    }

                    const end = this.makePos();
                    tokens.push({ class: "token", type: "string", value: content, start, end, quote: openStr, raw } as StringToken);
                    stringHandled = true;
                    break;
                }

                if (stringHandled) continue;
            }

            // Numbers (including 0x/0b and leading-dot numbers)
            if (this.isDigit(ch) || (ch === "." && this.options.allowLeadingDotNumbers && this.isDigit(this.peek(1)))) {
                const start = this.makePos();
                let s = "";
                if (ch === "0" && (this.peek(1).toLowerCase() === "x") && this.options.allowHexNumbers) {
                    s += this.peek(); this.advance(); s += this.peek(); this.advance();
                    while (/[0-9a-fA-F]/.test(this.peek())) { s += this.peek(); this.advance(); }
                } else if (ch === "0" && (this.peek(1).toLowerCase() === "b") && this.options.allowBinaryNumbers) {
                    s += this.peek(); this.advance(); s += this.peek(); this.advance();
                    while (/[01]/.test(this.peek())) { s += this.peek(); this.advance(); }
                } else {
                    if (ch === ".") {
                        s += "."; this.advance();
                        while (this.isDigit(this.peek())) { s += this.peek(); this.advance(); }
                    } else {
                        while (this.isDigit(this.peek())) { s += this.peek(); this.advance(); }
                        if (this.peek() === "." && (this.options.allowTrailingDotNumbers || this.isDigit(this.peek(1)))) {
                            s += "."; this.advance();
                            while (this.isDigit(this.peek())) { s += this.peek(); this.advance(); }
                        }
                    }
                    if (/[eE]/.test(this.peek())) {
                        s += this.peek(); this.advance();
                        if (/[+-]/.test(this.peek())) { s += this.peek(); this.advance(); }
                        while (this.isDigit(this.peek())) { s += this.peek(); this.advance(); }
                    }
                }
                const end = this.makePos();
                tokens.push({ class: "token", type: "number", value: s, start, end } as NumberToken);
                continue;
            }

            // Quoted identifiers (pairs from options)
            const pairs = this.options.identifierQuotePairs || [];
            let handled = false;
            for (const [open, close] of pairs) {
                if (ch === open) {
                    const start = this.makePos();
                    let raw = ""; raw += this.peek(); this.advance();
                    let value = "";
                    while (this.position < this.input.length) {
                        const c = this.peek();
                        raw += c; this.advance();
                        if (c === close) {
                            if (this.peek() === close) { raw += this.peek(); this.advance(); value += close; continue; }
                            break;
                        } else {
                            value += c;
                        }
                    }
                    const end = this.makePos();
                    tokens.push({ class: "token", type: "identifier", value, start, end, quote: [open, close], raw } as IdentifierToken);
                    handled = true;
                    break;
                }
            }
            if (handled) continue;

            // Unquoted identifier
            if (this.isIdentifierStart(ch)) {
                const start = this.makePos();
                let raw = ""; let value = "";
                raw += this.peek(); value += this.peek(); this.advance();
                while (this.isIdentifierPart(this.peek())) { raw += this.peek(); value += this.peek(); this.advance(); }
                const end = this.makePos();
                tokens.push({ class: "token", type: "identifier", value, start, end, quote: false, raw } as IdentifierToken);
                continue;
            }

            // Operators: consume consecutive operator chars as single operator token
            if (Tokenizer.operatorChars.has(ch)) {
                const start = this.makePos();
                let op = "";
                while (this.position < this.input.length && Tokenizer.operatorChars.has(this.peek())) {
                    op += this.peek(); this.advance();
                }
                const end = this.makePos();
                tokens.push({ class: "token", type: "operator", value: op, start, end } as OperatorToken);
                continue;
            }

            // Punctuators
            if (this.options.punctuators && this.options.punctuators.includes(ch)) {
                const start = this.makePos();
                this.advance();
                const end = this.makePos();
                tokens.push({ class: "token", type: "punctuator", value: ch, start, end } as PunctuatorToken);
                continue;
            }

            // Fallback: single char operator
            const start = this.makePos();
            this.advance();
            const end = this.makePos();
            tokens.push({ class: "token", type: "operator", value: ch, start, end } as OperatorToken);
        }

        return tokens;
    }
}