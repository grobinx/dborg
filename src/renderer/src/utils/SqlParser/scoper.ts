import { isIdentifier, Tokenizer, type Token, type TokenizerOptions } from "./tokenizer";

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

export type BlockType = "root" | "statement" | "expression" | "cte";

export type StatementKind = "dml" | "ddl" | "dcl" | "dql" | "tcl" | "utility";

export type DmlStatementType = "INSERT" | "UPDATE" | "DELETE" | "MERGE";

export type DqlStatementType = "SELECT" | "VALUES";

export type DdlStatementType = "CREATE" | "ALTER" | "DROP" | "TRUNCATE" | "RENAME";

export type DclStatementType = "GRANT" | "REVOKE";

export type TclStatementType = "COMMIT" | "ROLLBACK" | "SAVEPOINT" | "SET TRANSACTION";

export type UtilityStatementType = "EXPLAIN" | "ANALYZE" | "VACUUM" | "CLUSTER" | "CHECKPOINT" | "DISCARD" | "LOAD" | "RESET" | "REINDEX" | "USE" | "SHOW" | "DESCRIBE" | "HELP";

export const StatementKindByType: Record<StatementType, StatementKind> = {
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

export type ExpressionType = "single" | "array" | "statement";

export type SetOperator =
    | "UNION"
    | "UNION ALL"
    | "INTERSECT"
    | "EXCEPT"
    | "MINUS";

export interface BlockBase {
    class: "block";
    block: BlockType;
    open: Token | null;
    close: Token | null;
    items: BlockItem[] | null;
    parent: BlockNode | null;
}

export interface RootBlock extends BlockBase {
    block: "root";
}

export interface StatementBlock extends BlockBase {
    block: "statement";
}

export interface StatementResolved extends StatementBlock {
    kind: StatementKind | null;
    type: StatementType | null;
}

export interface ExpressionBlock extends BlockBase {
    block: "expression";
}

export interface CteBlock extends BlockBase {
    block: "cte";
    name: Token | null;
    options: Token[];
    columns: Token[] | null;
}

export interface SelectStatement extends StatementBlock {
    type: "SELECT";
    union: SetOperator | null;
}

export interface DeleteStatement extends StatementBlock {
    type: "DELETE";
}

export interface InsertStatement extends StatementBlock {
    type: "INSERT";
}

export interface UpdateStatement extends StatementBlock {
    type: "UPDATE";
}

export interface MergeStatement extends StatementBlock {
    type: "MERGE";
}

export interface ValuesStatement extends StatementBlock {
    type: "VALUES";
}

export type Statement =
    | StatementBlock
    | SelectStatement
    | InsertStatement
    | UpdateStatement
    | DeleteStatement
    | MergeStatement
    | ValuesStatement;

export type BlockNode =
    | RootBlock
    | Statement
    | ExpressionBlock
    | CteBlock

export type BlockItem = BlockNode | Token;

export class Scoper {
    private openBrackets: string[] = ['(', '[', '{'];
    private closeBrackets: string[] = [')', ']', '}'];

    constructor() {
    }

    public static fromTokens(tokens: Token[]): RootBlock {
        tokens = tokens.filter(t => t.type !== "comment" && t.type !== "whitespace");
        return new Scoper().build(tokens);
    }

    public static fromSql(sql: string, tokenizerOptions: TokenizerOptions = {}): RootBlock {
        const tokens = new Tokenizer(sql, tokenizerOptions).tokenize();
        return Scoper.fromTokens(tokens);
    }

    public build(tokens: Token[]): RootBlock {
        const root: RootBlock = {
            class: "block",
            block: "root",
            open: null,
            close: null,
            items: null,
            parent: null,
        };

        root.items = this.collectNestedItems(tokens, root);

        return root;
    }

    private collectBalanced(tokens: Token[], startPos: number): { collected: Token[]; endPos: number } {
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
        if (tokens.length === 0) return false;

        const stack: string[] = [];
        let commaCount = 0;

        for (let i = 0; i < tokens.length; i++) {
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
                } else if (t.value === "," && stack.length === 0) {
                    commaCount++;
                }
            }
        }

        return commaCount > 0;
    }

    private isStatement(tokens: Token[]): boolean {
        if (tokens.length === 0) return false;
        const token = tokens[0];
        if (token.type !== "identifier" || token.quote) return false;
        const keyword = token.value.toUpperCase();
        return keyword in StatementKindByType || (keyword === "WITH");
    }

    private collectNestedItems(
        tokens: Token[],
        parent: BlockNode | null = null,
    ): BlockItem[] {
        const items: BlockItem[] = [];
        let pos = 0;

        while (pos < tokens.length) {
            const token = tokens[pos];

            if (token.type === "punctuator") {
                const openIdx = this.openBrackets.indexOf(token.value);
                if (openIdx !== -1) {
                    // Wez caly zbalansowany blok: "( ... )", "[ ... ]", "{ ... }"
                    const balanced = this.collectBalanced(tokens, pos);
                    const block = balanced.collected;

                    const open = block.length > 0 ? block[0] : token;
                    const close = block.length > 1 ? block[block.length - 1] : null;
                    const innerTokens = block.length >= 2 ? block.slice(1, -1) : [];

                    const isStatement = this.isStatement(innerTokens);

                    let node: BlockNode | null = null;

                    if (isStatement) {
                        node = {
                            class: "block",
                            block: "statement",
                            open,
                            close,
                            items: null,
                            parent,
                        };
                    } else {
                        node = {
                            class: "block",
                            block: "expression",
                            open,
                            close,
                            items: null,
                            parent,
                        };
                    }

                    // Rekurencyjnie buduj drzewo tylko z zawartosci nawiasu
                    node.items = this.collectNestedItems(innerTokens, node);

                    // BlockBase nie jest bezposrednio w BlockNode, wiec rzutowanie do BlockItem
                    items.push(node!);

                    pos = balanced.endPos;
                    continue;
                }

                // Domkniecie obecnego poziomu (na wypadek parsowania fragmentu)
                if (this.closeBrackets.includes(token.value)) {
                    return items;
                }
            }

            // Token poza nawiasami
            items.push(token);
            pos++;
        }

        return items;
    }
}