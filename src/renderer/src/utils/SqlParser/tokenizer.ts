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
    // regex pairs for additional string quote styles (e.g. dollar-quoted, triple-quoted)
    // opening regex matched at current position; if matched token is $tag$ then same literal closes
    stringQuotePairs?: Array<[RegExp, RegExp]>;
    punctuators?: string[];
    allowHexNumbers?: boolean;
    allowBinaryNumbers?: boolean;
    allowLeadingDotNumbers?: boolean;
    allowTrailingDotNumbers?: boolean;
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
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_]/,
            identifierQuotePairs: [['"', '"'], ['`', '`']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: true,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        postgres: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_$]/,
            identifierQuotePairs: [['"', '"']],     // tylko cudzysłów
            stringQuotePairs: [[/^\$[A-Za-z0-9_]*\$/, /^\$[A-Za-z0-9_]*\$/]],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        mysql: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_$]/,
            identifierQuotePairs: [['`', '`'], ['"', '"']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: true,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        mssql: {
            identifierStart: /[a-zA-Z_@#]/,
            identifierPart: /[a-zA-Z0-9_@#$]/,
            identifierQuotePairs: [['[', ']'], ['"', '"']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        oracle: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_$_#]/,
            identifierQuotePairs: [['"', '"']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        sqlite: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_]/,
            identifierQuotePairs: [['"', '"'], ['`', '`'], ['[', ']']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        mariadb: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_$]/,
            identifierQuotePairs: [['`', '`'], ['"', '"']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: true,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        redshift: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_$]/,
            identifierQuotePairs: [['"', '"']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        snowflake: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_.$]/,
            identifierQuotePairs: [['"', '"'], ['`', '`']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        bigquery: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_.$]/,
            identifierQuotePairs: [['`', '`']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        db2: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_]/,
            identifierQuotePairs: [['"', '"']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        teradata: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_]/,
            identifierQuotePairs: [['"', '"']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        firebird: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_]/,
            identifierQuotePairs: [['"', '"']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: false,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        duckdb: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_.$]/,
            identifierQuotePairs: [['"', '"'], ['`', '`']],
            punctuators: [".", ",", ";", "(", ")", "{", "}", "[", "]"],
            allowHexNumbers: true,
            allowBinaryNumbers: false,
            allowLeadingDotNumbers: true,
            allowTrailingDotNumbers: true,
        },
        clickhouse: {
            identifierStart: /[a-zA-Z_]/,
            identifierPart: /[a-zA-Z0-9_.$]/,
            identifierQuotePairs: [['"', '"'], ['`', '`']],
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
                tokens.push({ type: "whitespace", value: s, start, end } as WhitespaceToken);
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
                tokens.push({ type: "comment", value: value.trim(), start, end, multiline: false, raw } as CommentToken);
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
                tokens.push({ type: "comment", value: value.trim(), start, end, multiline: true, raw } as CommentToken);
                continue;
            }

            // Single-quoted strings
            if (ch === "'") {
                const start = this.makePos();
                let raw = ""; raw += this.peek(); this.advance();
                let value = "";
                while (this.position < this.input.length) {
                    const c = this.peek();
                    raw += c; this.advance();
                    if (c === "'") {
                        if (this.peek() === "'") { raw += this.peek(); this.advance(); value += "'"; continue; }
                        break;
                    } else {
                        value += c;
                    }
                }
                const end = this.makePos();
                tokens.push({ type: "string", value, start, end, quote: "'", raw } as StringToken);
                continue;
            }

            if (this.options.stringQuotePairs) {
                const stringPairs = this.options.stringQuotePairs;
                let stringHandled = false;
                for (const [openRe, closeRe] of stringPairs) {
                    const rest = this.input.slice(this.position);
                    const m = rest.match(openRe);
                    if (m && m.index === 0) {
                        const openStr = m[0];
                        const start = this.makePos();
                        this.advance(openStr.length);

                        let content: string;
                        let raw: string;

                        if (/^\$[A-Za-z0-9_]*\$$/.test(openStr)) {
                            // dollar-quoted: closing = same literal tag
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
                        } else {
                            // single-char style close (with doubled-char escaping)
                            const litMatch = closeRe.source.match(/^\\?(.)/);
                            const closeChar = litMatch ? litMatch[1] : openStr[0];
                            content = ""; raw = openStr;
                            while (this.position < this.input.length) {
                                const c = this.peek();
                                if (c === closeChar) {
                                    if (this.peek(1) === closeChar) {
                                        raw += c; this.advance(); raw += this.peek(); this.advance();
                                        content += closeChar; continue;
                                    }
                                    raw += c; this.advance(); break;
                                }
                                raw += c; this.advance(); content += c;
                            }
                        }

                        const end = this.makePos();
                        tokens.push({ type: "string", value: content, start, end, quote: openStr, raw } as StringToken);
                        stringHandled = true;
                        break;
                    }
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
                tokens.push({ type: "number", value: s, start, end } as NumberToken);
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
                    tokens.push({ type: "identifier", value, start, end, quote: [open, close], raw } as IdentifierToken);
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
                tokens.push({ type: "identifier", value, start, end, quote: false, raw } as IdentifierToken);
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
                tokens.push({ type: "operator", value: op, start, end } as OperatorToken);
                continue;
            }

            // Punctuators
            if (this.options.punctuators && this.options.punctuators.includes(ch)) {
                const start = this.makePos();
                this.advance();
                const end = this.makePos();
                tokens.push({ type: "punctuator", value: ch, start, end } as PunctuatorToken);
                continue;
            }

            // Fallback: single char operator
            const start = this.makePos();
            this.advance();
            const end = this.makePos();
            tokens.push({ type: "operator", value: ch, start, end } as OperatorToken);
        }

        return tokens;
    }
}