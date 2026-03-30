import { isIdentifier, isKeyword, isPunctuator, isToken, Tokenizer, TokenType, type Token, type TokenizerOptions } from "./tokenizer";

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

export type BlockType = "root" | "statement" | "expression" | "cte" | "set" | "clause" | "column" | "source";

export type StatementKind = "dml" | "ddl" | "dcl" | "dql" | "tcl" | "utility";

export type DmlStatementType = "INSERT" | "UPDATE" | "DELETE" | "MERGE";

export type DqlStatementType = "SELECT" | "VALUES";

export type DdlStatementType = "CREATE" | "ALTER" | "DROP" | "TRUNCATE" | "RENAME";

export type DclStatementType = "GRANT" | "REVOKE";

export type TclStatementType = "COMMIT" | "ROLLBACK" | "SAVEPOINT" | "SET TRANSACTION";

export type UtilityStatementType = "EXPLAIN" | "ANALYZE" | "VACUUM" | "CLUSTER" | "CHECKPOINT" | "DISCARD" | "LOAD" | "RESET" | "REINDEX" | "USE" | "SHOW" | "DESCRIBE" | "HELP";

export type ClauseType = "SELECT" | "FROM" | "WHERE" | "GROUP BY" | "HAVING" | "ORDER BY" | "VALUES" | "SET" | "RETURNING";

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

export interface SetBlock extends BlockBase {
    block: "set";
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

export interface ClauseBlock extends BlockBase {
    block: "clause";
    clause: ClauseType;
}

export interface SelectClause extends ClauseBlock {
    clause: "SELECT";
}

export interface FromClause extends ClauseBlock {
    clause: "FROM";
}

export interface WhereClause extends ClauseBlock {
    clause: "WHERE";
}

export interface GroupByClause extends ClauseBlock {
    clause: "GROUP BY";
}

export interface HavingClause extends ClauseBlock {
    clause: "HAVING";
}

export interface OrderByClause extends ClauseBlock {
    clause: "ORDER BY";
}

export interface ValuesClause extends ClauseBlock {
    clause: "VALUES";
}

export interface SetClause extends ClauseBlock {
    clause: "SET";
}

export interface ReturningClause extends ClauseBlock {
    clause: "RETURNING";
}

export interface ColumnBlock extends BlockBase {
    block: "column";
    alias: Token | null;
}

export interface SourceBlock extends BlockBase {
    block: "source";
    alias: Token | null;
}

export type Statement =
    | StatementBlock
    | SelectStatement
    | InsertStatement
    | UpdateStatement
    | DeleteStatement
    | MergeStatement
    | ValuesStatement;

export type Clause =
    | SelectClause
    | FromClause
    | WhereClause
    | GroupByClause
    | HavingClause
    | OrderByClause
    | ValuesClause
    | SetClause
    | ReturningClause;

export type BlockNode =
    | RootBlock
    | Statement
    | ClauseBlock
    | ExpressionBlock
    | CteBlock
    | SetBlock
    | ColumnBlock
    | SourceBlock;

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

    private findStatemets(node: BlockNode): StatementResolved[] {
        const statements: StatementResolved[] = [];
        if (!node.items || node.items.length === 0) return statements;

        for (const item of node.items) {
            if (isStatementResolved(item)) {
                statements.push(item);
            }
            if (isBlockNode(item)) {
                statements.push(...this.findStatemets(item));
            }
        }

        return statements;
    }

    private decomposeStatements(root: BlockNode): void {
        if (!root.items || root.items.length === 0) return;

        const statements = this.findStatemets(root);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (isStatementResolved(statement)) {
                if (statement.type === "SELECT") {
                    this.decomposeSelectStatement(statement);
                } else if (statement.type === "INSERT") {
                    this.decomposeInsertStatement(statement);
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

        while (pos < statement.items.length) {
            item = statement.items[pos];
            let operator: SetOperator | null = null;
            if (isKeyword(item, "UNION", "INTERSECT", "EXCEPT", "MINUS")) {
                operator = item.value.toUpperCase() as SetOperator;
                pos++;
                if (pos < statement.items.length && operator === "UNION" && isKeyword(statement.items[pos], "ALL")) {
                    operator = "UNION ALL";
                    pos++;
                }
            }
            if (isKeyword(item, "SELECT")) {
                const setBlock: SetBlock = {
                    class: "block",
                    block: "set",
                    open: this.findFirstToken(item),
                    close: null,
                    items: [],
                    operator: operator,
                };

                while (pos < statement.items.length) {
                    item = statement.items[pos];
                    if (isKeyword(item, "SELECT")) {
                        const { collected, endPos } = this.decomposeColumns(statement.items, pos);
                        const selectClause: SelectClause = {
                            class: "block",
                            block: "clause",
                            clause: "SELECT",
                            items: collected,
                            open: this.findFirstToken(item),
                            close: collected.length > 0 ? this.findLastToken(collected[collected.length - 1]) : this.findLastToken(item),
                        };
                        setBlock.items!.push(selectClause);
                        pos = endPos;
                    } else {
                        setBlock.items!.push(item);
                    }
                    pos++;
                }

                if (setBlock.items && setBlock.items.length > 0) {
                    const lastItem = setBlock.items[setBlock.items.length - 1];
                    setBlock.close = this.findLastToken(lastItem);
                }

                items.push(setBlock);
            } else {
                for (; pos < statement.items.length; pos++) {
                    item = statement.items[pos];
                    items.push(item);
                }
            }
        }

        statement.items = items;
    }

    private decomposeColumns(items: BlockItem[], startPos: number): { collected: ColumnBlock[]; endPos: number } {
        const collected: ColumnBlock[] = [];
        let pos = startPos;

        // Skip SELECT keyword
        if (pos < items.length && isKeyword(items[pos], "SELECT")) pos++;

        // Skip optional DISTINCT / ALL quantifier
        if (pos < items.length && isKeyword(items[pos], "DISTINCT", "ALL")) {
            pos++;
            // PostgreSQL: DISTINCT ON (expr)
            if (pos < items.length && isKeyword(items[pos], "ON")) {
                pos++;
                if (pos < items.length && isBlockNode(items[pos]) && (items[pos] as BlockNode).block === "expression") {
                    pos++;
                }
            }
        }

        while (pos < items.length) {
            // Clause-starting keyword ends the column list
            if (isKeyword(items[pos], "FROM", "WHERE", "HAVING", "ORDER", "GROUP",
                "UNION", "INTERSECT", "EXCEPT", "MINUS", "INTO", "LIMIT", "OFFSET",
                "FETCH", "RETURNING", "WINDOW", "QUALIFY")) {
                break;
            }

            // Skip comma separating columns
            if (isPunctuator(items[pos], ",")) {
                pos++;
                continue;
            }

            // Collect all items belonging to one column expression
            const colItems: BlockItem[] = [];
            while (pos < items.length) {
                const cur = items[pos];

                if (isPunctuator(cur, ",")) break;
                if (isKeyword(cur, "FROM", "WHERE", "HAVING", "ORDER", "GROUP",
                    "UNION", "INTERSECT", "EXCEPT", "MINUS", "INTO", "LIMIT", "OFFSET",
                    "FETCH", "RETURNING", "WINDOW", "QUALIFY")) {
                    break;
                }

                colItems.push(cur);
                pos++;
            }

            if (colItems.length === 0) continue;

            // Detect alias: last identifier token, optionally preceded by AS.
            // Tokens that are expression-terminating keywords (END, NULL, TRUE, …)
            // are excluded from implicit alias detection.
            const NOT_ALIAS = ["END", "NULL", "TRUE", "FALSE", "UNKNOWN",
                "ASC", "DESC", "NULLS", "FIRST", "LAST", "ALL", "DISTINCT",
                "PRECEDING", "FOLLOWING", "UNBOUNDED", "CURRENT",
                "ROWS", "RANGE", "GROUPS"] as const;

            let alias: Token | null = null;
            let exprItems: BlockItem[] = colItems;
            const last = colItems[colItems.length - 1];

            if (colItems.length >= 2 && isIdentifier(last)) {
                const secondLast = colItems[colItems.length - 2];
                if (isKeyword(secondLast, "AS")) {
                    // Explicit: expr AS alias
                    alias = last as Token;
                    exprItems = colItems.slice(0, -2);
                } else if (!isKeyword(last as Token, ...NOT_ALIAS)
                    && !(isPunctuator(secondLast, "."))) {
                    // Implicit: expr alias  (not preceded by dot, not a terminal SQL keyword)
                    alias = last as Token;
                    exprItems = colItems.slice(0, -1);
                }
            }

            if (!alias && exprItems.length > 0) {
                alias = this.findLastToken(exprItems[exprItems.length - 1], "identifier");
            }

            const colBlock: ColumnBlock = {
                class: "block",
                block: "column",
                open: exprItems.length > 0 ? this.findFirstToken(exprItems[0]) : this.findFirstToken(last),
                close: exprItems.length > 0 ? this.findLastToken(exprItems[exprItems.length - 1]) : this.findLastToken(last),
                items: exprItems.length > 0 ? exprItems : null,
                alias,
            };

            collected.push(colBlock);
        }

        // endPos points at the LAST consumed item so that the calling loop's
        // `pos = endPos; pos++` lands on the clause keyword (e.g. FROM) rather
        // than skipping it.
        return { collected, endPos: pos - 1 };
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

            if (pos < items.length && isKeyword(items[pos], "AS")) {
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
            if (isBlockNode(item)) {
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

    private findTokens(node: BlockItem | null): Token[] {
        if (!node) return [];

        if (isToken(node)) return [node];

        if (isBlockNode(node)) {
            const tokens: Token[] = [];
            tokens.push(...(node.open ? [node.open] : []));
            for (const item of node.items || []) {
                tokens.push(...this.findTokens(item));
            }
            tokens.push(...(node.close ? [node.close] : []));
            return tokens;
        }

        return [];
    }

    private findLastToken(node: BlockItem | null, type: TokenType | null = null): Token | null {
        const tokens = this.findTokens(node);
        if (type) {
            for (let i = tokens.length - 1; i >= 0; i--) {
                if (tokens[i].type === type) {
                    return tokens[i];
                }
            }
            return null;
        }
        return tokens.length > 0 ? tokens[tokens.length - 1] : null;
    }
}