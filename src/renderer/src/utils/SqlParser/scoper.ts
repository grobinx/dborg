import { Tokenizer, type Token, type TokenizerOptions } from "./tokenizer";

/**
 * class: token | scope
 * + token
 *   + type: identifier | string | number | operator | punctuator | comment | whitespace
 * + scope: root | statement | expression | cte 
 *   + statement
 *     + kind: dml | ddl | dcl | dql | tcl | utility
 *     + type: SELECT | INSERT | UPDATE | DELETE | MERGE | VALUES
 *   + expression
 *     + type: single | array
 *
 */

export type Scope = "root" | "statement" | "expression" | "cte";

export type StatementKind = "dml" | "ddl" | "dcl" | "dql" | "tcl" | "utility";

export type DmlStatementType = "INSERT" | "UPDATE" | "DELETE" | "MERGE";

export type DqlStatementType = "SELECT" | "VALUES";

export type DdlStatementType = "CREATE" | "ALTER" | "DROP" | "TRUNCATE" | "RENAME";

export type DclStatementType = "GRANT" | "REVOKE";

export type TclStatementType = "COMMIT" | "ROLLBACK" | "SAVEPOINT" | "SET TRANSACTION";

export type UtilityStatementType = "EXPLAIN" | "ANALYZE" | "VACUUM" | "CLUSTER" | "CHECKPOINT" | "DISCARD" | "LOAD" | "RESET" | "REINDEX" | "USE" | "SHOW" | "DESCRIBE" | "HELP" | "EXPLAIN";

export const StatementsMap: Record<StatementType, StatementKind> = {
    SELECT: "dql",
    VALUES: "dql",

    INSERT: "dml",
    UPDATE: "dml",
    DELETE: "dml",
    MERGE: "dml",
    CREATE: "ddl",
    ALTER: "ddl",
    DROP: "ddl",
    TRUNCATE: "ddl",
    RENAME: "ddl",

    GRANT: "dcl",
    REVOKE: "dcl",

    COMMIT: "tcl",
    ROLLBACK: "tcl",
    "SET TRANSACTION": "tcl",
    SAVEPOINT: "tcl",

    EXPLAIN: "utility",
    ANALYZE: "utility",
    VACUUM: "utility",
    CLUSTER: "utility",
    CHECKPOINT: "utility",
    DISCARD: "utility",
    LOAD: "utility",
    RESET: "utility",
    REINDEX: "utility",
    USE: "utility",
    SHOW: "utility",
    DESCRIBE: "utility",
    HELP: "utility",
};

export type StatementType =
    | DmlStatementType
    | DqlStatementType
    | DdlStatementType
    | DclStatementType
    | TclStatementType
    | UtilityStatementType;

export type ExpressionType = "single" | "array";

export type UnionKind =
    | "UNION"
    | "UNION ALL"
    | "INTERSECT"
    | "EXCEPT"
    | "MINUS";

export interface ScopeBase {
    class: "scope";
    scope: Scope;
    open: Token | null;
    close: Token | null;
    items: ScopeItem[];
    parent: ScopeNode | null;
}

export interface RootScope extends ScopeBase {
    scope: "root";
}

export interface StatementBaseScope extends ScopeBase {
    scope: "statement";
    kind: StatementKind;
    type: StatementType;
}

export interface ExpressionScope extends ScopeBase {
    scope: "expression";
    type: ExpressionType;
}

export interface CteScope extends ScopeBase {
    scope: "cte";
    options: Token[];
    name: Token | null;
}

export interface SelectStatement extends StatementBaseScope {
    type: "SELECT";
    union: UnionKind | null;
}

export interface DeleteStatement extends StatementBaseScope {
    type: "DELETE";
}

export interface InsertStatement extends StatementBaseScope {
    type: "INSERT";
}

export interface UpdateStatement extends StatementBaseScope {
    type: "UPDATE";
}

export interface MergeStatement extends StatementBaseScope {
    type: "MERGE";
}

export interface ValuesStatement extends StatementBaseScope {
    type: "VALUES";
}

export type Statement =
    | SelectStatement
    | InsertStatement
    | UpdateStatement
    | DeleteStatement
    | MergeStatement
    | ValuesStatement;

export type ScopeNode =
    | RootScope
    | Statement
    | ExpressionScope
    | CteScope

export type ScopeItem = ScopeNode | Token;

export class Scoper {
    private readonly tokens: Token[];
    private position: number = 0;
    private openBrackets: string[] = ['(', '[', '{'];
    private closeBrackets: string[] = [')', ']', '}'];

    constructor(tokens: Token[]) {
        this.tokens = tokens.filter(t => t.type !== "comment" && t.type !== "whitespace");
    }

    public static fromTokens(tokens: Token[]): RootScope {
        return new Scoper(tokens).build();
    }

    public static fromSql(sql: string, tokenizerOptions: TokenizerOptions = {}): RootScope {
        const tokens = new Tokenizer(sql, tokenizerOptions).tokenize();
        return Scoper.fromTokens(tokens);
    }

    public build(): RootScope {
        const root: RootScope = {
            class: "scope",
            scope: "root",
            open: null,
            close: null,
            items: [],
            parent: null,
        };

        this.processTokens(root);
        return root;
    }

    private processTokens(parent: ScopeNode): void {
        while (this.position < this.tokens.length) {
            const token = this.tokens[this.position];

            if (token.type === "identifier" && !token.quote) {
                const identifier = token.value.toUpperCase();
                if (identifier === "WITH") {
                    const cteScopes = this.processCtes(parent);
                    parent.items.push(...cteScopes);
                } else {
                    parent.items.push(token);
                    this.position++;
                }
            } else {
                parent.items.push(token);
                this.position++;
            }
        }
    }

    private processCtes(parent: ScopeNode): CteScope[] {
        const cteScopes: CteScope[] = [];

        while (this.position < this.tokens.length) {
            cteScopes.push(this.processCte(parent));

            const token = this.tokens[this.position];
            if (token.type === "punctuator" && token.value === ",") {
                this.position++; // Skip comma
            } else {
                break; // No more CTEs
            }
        }

        return cteScopes;
    }

    private processCte(parent: ScopeNode): CteScope {
        const cteScope: CteScope = {
            class: "scope",
            scope: "cte",
            open: this.tokens[this.position],
            close: null,
            items: [],
            parent: parent,
            options: [],
            name: null,
        };
        this.position++; // Skip 'WITH'

        const tokens = this.tokens;
        // collect options (non-whitespace) between WITH and the CTE name
        const options: Token[] = [];
        let name: Token | null = null;

        // scan forward to find the boundary: 'AS' identifier or an opening '(' that indicates name precedes it
        let idx = this.position;
        let prevNonWhitespace: Token | null = null;

        while (idx < tokens.length) {
            const t = tokens[idx];

            if (t.type === "identifier" && !t.quote && t.value.toUpperCase() === "AS") {
                // name is the previous non-whitespace token
                name = prevNonWhitespace;
                break;
            }

            if (t.type === "punctuator" && t.value === "(") {
                // an opening parenthesis directly after the name (e.g. column list) or start of body
                name = prevNonWhitespace;
                break;
            }

            if (t.type !== "whitespace") {
                prevNonWhitespace = t;
            }

            idx++;
        }

        // collect options from current position up to (but not including) the name token, ignoring whitespace
        let optIdx = this.position;
        while (optIdx < tokens.length && tokens[optIdx] !== name) {
            if (tokens[optIdx].type !== "whitespace") {
                options.push(tokens[optIdx]);
            }
            optIdx++;
        }

        cteScope.options = options;
        cteScope.name = name;

        // advance this.position to where scanning stopped (idx)
        this.position = idx;

        // helper to skip balanced parentheses starting at pos (expects '(' at pos)
        const skipBalanced = (pos: number) => {
            let depth = 0;
            while (pos < tokens.length) {
                const tk = tokens[pos];
                if (tk.type === "punctuator") {
                    if (tk.value === "(") depth++;
                    else if (tk.value === ")") {
                        depth--;
                        if (depth === 0) {
                            return pos + 1; // position after matching ')'
                        }
                    }
                }
                pos++;
            }
            return pos;
        };

        // If we found a '(' right after the name, it might be a column list or the body. Skip it.
        if (this.position < tokens.length && tokens[this.position].type === "punctuator" && tokens[this.position].value === "(") {
            // skip column-list or immediate parenthesized part
            this.position = skipBalanced(this.position);
        }

        // skip whitespace
        while (this.position < tokens.length && tokens[this.position].type === "whitespace") this.position++;

        // if next token is AS, skip it and then skip the body (parenthesized subquery)
        if (this.position < tokens.length) {
            const tk = tokens[this.position];
            if (tk.type === "identifier" && !tk.quote && tk.value.toUpperCase() === "AS") {
                this.position++; // skip AS
                while (this.position < tokens.length && tokens[this.position].type === "whitespace") this.position++;
                if (this.position < tokens.length && tokens[this.position].type === "punctuator" && tokens[this.position].value === "(") {
                    const bodyStart = this.position;
                    const bodyEndPos = skipBalanced(this.position);
                    if (bodyEndPos > bodyStart) {
                        cteScope.close = tokens[bodyEndPos - 1];
                        this.position = bodyEndPos;
                    }
                }
            } else if (tk.type === "punctuator" && tk.value === "(") {
                // in case AS was omitted and a parenthesis starts the body
                const bodyEndPos = skipBalanced(this.position);
                if (bodyEndPos > this.position) {
                    cteScope.close = tokens[bodyEndPos - 1];
                    this.position = bodyEndPos;
                }
            }
        }

        return cteScope;
    }

    private collectUntilBalanced(tokens: Token[], startPos: number): { collected: Token[]; endPos: number } {
        const collected: Token[] = [];
        const bracketStack: string[] = [];
        let pos = startPos;

        while (pos < tokens.length) {
            const token = tokens[pos];
            if (token.type === "punctuator") {
                if (this.openBrackets.includes(token.value)) {
                    bracketStack.push(token.value);
                } else if (this.closeBrackets.includes(token.value)) {
                    const lastOpen = bracketStack.pop();
                    if (lastOpen && this.openBrackets.indexOf(lastOpen) !== this.closeBrackets.indexOf(token.value)) {
                        // mismatched brackets
                        return { collected, endPos: pos };
                    }
                    if (bracketStack.length === 0) {
                        collected.push(token);
                        pos++;
                        break;
                    }
                }
            }
            collected.push(token);
            pos++;
        }
        return { collected, endPos: pos };
    }

    private isArrayExpression(tokens: Token[]): boolean {
        if (tokens.length < 2) return false;

        const first = tokens[0];
        const last = tokens[tokens.length - 1];

        if (first.type !== "punctuator" || !this.openBrackets.includes(first.value)) return false;
        const expectedClose = this.closeBrackets[this.openBrackets.indexOf(first.value)];
        if (last.type !== "punctuator" || last.value !== expectedClose) return false;

        const stack: string[] = [first.value];
        let commaCount = 0;

        for (let i = 1; i < tokens.length - 1; i++) {
            const t = tokens[i];
            if (t.type === "punctuator") {
                if (this.openBrackets.includes(t.value)) {
                    stack.push(t.value);
                } else if (this.closeBrackets.includes(t.value)) {
                    const top = stack.pop();
                    if (!top) return false; // closing without opening
                    if (this.openBrackets.indexOf(top) !== this.closeBrackets.indexOf(t.value)) {
                        return false; // mismatched pair
                    }
                    if (stack.length === 0) {
                        return false; // outermost closed before end
                    }
                } else if (t.value === "," && stack.length === 1) {
                    commaCount++;
                }
            }
        }

        return commaCount > 0;
    }
}