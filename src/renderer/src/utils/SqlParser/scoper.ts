import { isIdentifier, isKeyword, isPunctuator, isToken, Tokenizer, type Token, type TokenizerOptions } from "./tokenizer";

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

export type BlockType = "root" | "statement" | "expression" | "cte" | "set_operator";

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
}

function isBlockNode(obj: any): obj is BlockNode {
    return obj && typeof obj === "object" && obj.class === "block" && "block" in obj && "open" in obj && "close" in obj && "items" in obj;
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

function isStatementResolved(obj: any): obj is StatementResolved {
    return isBlockNode(obj) && obj.block === "statement" && "kind" in obj && "type" in obj;
}

export interface ExpressionBlock extends BlockBase {
    block: "expression";
}

export interface CteBlock extends BlockBase {
    block: "cte";
    name: Token | null;
    options: BlockItem[] | null;
    columns: BlockItem[] | null;
}

export interface SetOperatorBlock extends BlockBase {
    block: "set_operator";
    operator: SetOperator | null;
}

export interface SelectStatement extends StatementBlock {
    type: "SELECT";
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
    | SetOperatorBlock;

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
        };

        if (tokens.length === 0) {
            return root;
        }

        root.open = tokens[0];
        root.close = tokens[tokens.length - 1];

        root.items = this.collectNestedItems(tokens);
        this.splitStatements(root);
        this.identifyBlocks(root);
        this.decomposeStatements(root);

        return root;
    }

    private decomposeStatements(node: BlockNode): void {
        if (!node.items) return;

        for (let i = 0; i < node.items.length; i++) {
            const item = node.items[i];
            if (isStatementResolved(item)) {
                if (item.type === "SELECT") {
                    this.decomposeSelectStatement(item);
                } else if (item.type === "INSERT") {
                    this.decomposeInsertStatement(item);
                }
            }
        }
    }

    private decomposeInsertStatement(statement: StatementResolved): void {
        if (!statement.items || statement.items.length === 0) return;

        const items: BlockItem[] = [];
        let pos = 0;

        let item = statement.items[pos];
        if (isKeyword(item, "WITH")) {
            const { collected, endPos } = this.decomposeWithClasue(statement.items, pos + 1);
            items.push(...collected);
            pos = endPos;
        }

        item = statement.items[pos];
        if (isKeyword(item, "INSERT")) {
            while (pos < statement.items.length) {
                item = statement.items[pos];
                items.push(item);
                pos++;
            }
        }

        statement.items = items;
    }

    private decomposeSelectStatement(statement: StatementResolved): void {
        if (!statement.items || statement.items.length === 0) return;

        const items: BlockItem[] = [];
        let pos = 0;

        let item = statement.items[pos];
        if (isKeyword(item, "WITH")) {
            const { collected, endPos } = this.decomposeWithClasue(statement.items, pos + 1);
            items.push(...collected);
            pos = endPos;
        }

        item = statement.items[pos];
        if (isKeyword(item, "SELECT")) {
            const setOperators: SetOperatorBlock = {
                class: "block",
                block: "set_operator",
                open: this.findFirstToken(item),
                close: null,
                items: [],
                operator: null,
            };

            while (pos < statement.items.length) {
                item = statement.items[pos];
                setOperators.items!.push(item);
                pos++;
            }

            if (setOperators.items && setOperators.items.length > 0) {
                const lastItem = setOperators.items[setOperators.items.length - 1];
                setOperators.close = this.findLastToken(lastItem);
            }

            items.push(setOperators);
        } else {
            items.push(...statement.items);
        }

        statement.items = items;
    }

    private decomposeWithClasue(items: BlockItem[], startPos: number): { collected: CteBlock[]; endPos: number } {
        const collected: CteBlock[] = [];
        let pos = startPos;

        while (pos < items.length) {
            // skip any leading commas
            while (pos < items.length && isPunctuator(items[pos], ",")) pos++;
            if (pos >= items.length) break;

            const segmentStart = pos;

            // collect identifier-like tokens (includes keywords but stop at AS)
            const nameTokens: Token[] = [];
            while (pos < items.length && isIdentifier(items[pos]) && !isKeyword(items[pos], "AS")) {
                nameTokens.push(items[pos] as Token);
                pos++;
            }

            // optional column-list expression: "(...)" -> expression block
            let columnsExpression: ExpressionBlock | null = null;
            if (pos < items.length) {
                const maybeCols = items[pos];
                if (isBlockNode(maybeCols) && maybeCols.block === "expression") {
                    columnsExpression = maybeCols as ExpressionBlock;
                    pos++;
                }
            }

            // optional AS
            let hasAS = false;
            if (pos < items.length && isKeyword(items[pos], "AS")) {
                hasAS = true;
                pos++;
            }

            // next should be a statement block "(SELECT ...)"
            let cteStatement: StatementBlock | null = null;
            if (pos < items.length) {
                const maybeStmt = items[pos];
                if (isBlockNode(maybeStmt) && maybeStmt.block === "statement") {
                    cteStatement = maybeStmt as StatementBlock;
                    pos++;
                }
            }

            // If we have no name tokens and no statement yet, try to look ahead for a statement up to next comma
            if (nameTokens.length === 0 && !cteStatement) {
                let look = pos;
                while (look < items.length && !isPunctuator(items[look], ",")) {
                    const maybe = items[look];
                    if (isBlockNode(maybe) && maybe.block === "statement") {
                        cteStatement = maybe as StatementBlock;
                        pos = look + 1;
                        break;
                    }
                    look++;
                }
            }

            // If still nothing meaningful parsed for this segment, bail out (leave caller to handle remaining tokens)
            if (nameTokens.length === 0 && !cteStatement) {
                break;
            }

            const cteName = nameTokens.length > 0 ? nameTokens[nameTokens.length - 1] : null;
            const options = nameTokens.length > 1 ? nameTokens.slice(0, -1) : null;

            if (cteStatement) {
                // Normal (or tolerant) CTE: we have a statement block (AS optional)
                const cte: CteBlock = {
                    class: "block",
                    block: "cte",
                    open: cteName,
                    close: cteStatement.close,
                    items: [cteStatement],
                    name: cteName,
                    options,
                    columns: columnsExpression && columnsExpression.items ? columnsExpression.items.filter(item => !isPunctuator(item, ",")) : null,
                };

                collected.push(cte);

                // recursively decompose inner statements
                this.decomposeStatements(cte);

                // if next token is a comma, consume it and continue to next CTE
                if (pos < items.length && isPunctuator(items[pos], ",")) {
                    pos++;
                    continue;
                } else {
                    break;
                }
            } else {
                // Fallback: we couldn't find a statement block; collect raw tokens up to next comma
                let scan = segmentStart;
                while (scan < items.length && !isPunctuator(items[scan], ",")) scan++;
                const rawPart = items.slice(segmentStart, scan);

                const last = rawPart.length > 0 ? rawPart[rawPart.length - 1] : null;

                const cte: CteBlock = {
                    class: "block",
                    block: "cte",
                    open: cteName,
                    close: this.findLastToken(last),
                    items: rawPart.length > 0 ? rawPart.slice() : null,
                    name: cteName,
                    options,
                    columns: columnsExpression && columnsExpression.items ? columnsExpression.items.filter(item => !isPunctuator(item, ",")) : null,
                };

                collected.push(cte);

                // advance pos to the token after the raw segment; skip comma if present
                pos = scan;
                if (pos < items.length && isPunctuator(items[pos], ",")) {
                    pos++;
                    continue;
                } else {
                    break;
                }
            }
        }

        return { collected, endPos: pos };
    }

    private splitStatements(root: RootBlock): void {
        if (!root.items) return;

        const statements: StatementBlock[] = [];
        let currentStatementTokens: Token[] = [];
        let currentStatement: StatementBlock = {
            class: "block",
            block: "statement",
            open: null,
            close: null,
            items: null,
        };

        for (const item of root.items) {
            if (isPunctuator(item, ";")) {
                if (currentStatementTokens.length > 0) {
                    currentStatement.open = this.findFirstToken(currentStatementTokens[0]);
                    currentStatement.close = this.findLastToken(currentStatementTokens[currentStatementTokens.length - 1]);
                    currentStatement.items = currentStatementTokens;
                    statements.push(currentStatement);
                    currentStatementTokens = [];
                    currentStatement = {
                        class: "block",
                        block: "statement",
                        open: null,
                        close: null,
                        items: null,
                    };
                }
            } else {
                currentStatementTokens.push(item as Token);
            }
        }

        if (currentStatementTokens.length > 0) {
            currentStatement.open = this.findFirstToken(currentStatementTokens[0]);
            currentStatement.close = this.findLastToken(currentStatementTokens[currentStatementTokens.length - 1]);
            currentStatement.items = currentStatementTokens;
            statements.push(currentStatement);
        }

        root.items = statements;
    }

    private identifyBlocks(node: BlockNode): void {
        if (!node.items) return;

        for (let i = 0; i < node.items.length; i++) {
            const item = node.items[i];

            // 1. Rekurencja: Najpierw naprawiamy dzieci
            if (typeof item === "object" && "block" in item) {
                this.identifyBlocks(item);

                // 2. Jeśli to surowy StatementBlock, spróbujmy go uszczegółowić
                if (item.block === "statement") {
                    node.items[i] = this.identifyStatement(item);
                }
            }
        }
    }

    private identifyStatement(block: StatementBlock): Statement {
        const identifiers = block.items?.filter(item => isIdentifier(item) && !item.quote) as Token[] || [];
        if (identifiers.length === 0) return block;

        // Pobierz pierwszy istotny token (pomijając np. WITH dla uproszczenia na tym etapie)
        let firstToken = identifiers[0];

        if (firstToken.value.toUpperCase() === "WITH") {
            const mainToken = identifiers.find(t => t.value.toUpperCase() in StatementKindByType);
            if (mainToken) firstToken = mainToken;
        }

        const keyword = firstToken.value.toUpperCase() as StatementType;
        const kind = StatementKindByType[keyword];

        if (kind) {
            return {
                ...block,
                kind: kind,
                type: keyword,
            } as StatementResolved;
        }

        return block;
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
        return tokens.some(t => isPunctuator(t, ","));
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
                        };
                    } else {
                        node = {
                            class: "block",
                            block: "expression",
                            open,
                            close,
                            items: null,
                        };
                    }

                    // Rekurencyjnie buduj drzewo tylko z zawartosci nawiasu
                    node.items = this.collectNestedItems(innerTokens);

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

    private findFirstToken(node: BlockItem | null): Token | null {
        if (!node) return null;
        if (isToken(node)) return node;

        if (isBlockNode(node)) {
            for (const item of node.items || []) {
                if (isToken(item)) {
                    return item;
                }
                const found = this.findFirstToken(item);
                if (found) {
                    return found;
                }
            }

            return node.open;
        }

        return null;
    }

    private findLastToken(node: BlockItem | null): Token | null {
        if (!node) return null;
        if (isToken(node)) return node;

        if (isBlockNode(node)) {
            if (node.close) {
                return node.close;
            }

            for (let i = (node.items || []).length - 1; i >= 0; i--) {
                const item = node.items![i];
                if (isToken(item)) {
                    return item;
                }
                const found = this.findLastToken(item);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    }
}