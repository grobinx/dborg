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

export type ClauseType = "SELECT" | "FROM" | "WHERE" | "GROUP BY" | "HAVING" | "ORDER BY" | "VALUES" | "SET" | "RETURNING" | "ON";

export type ColumnType = "result" | "source" | "reference";

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

function isBlockNode(obj: any, blockType?: BlockType): obj is BlockNode {
    return (
        obj && typeof obj === "object" &&
        obj.class === "block" && "block" in obj &&
        "open" in obj &&
        "close" in obj &&
        "items" in obj &&
        (blockType ? obj.block === blockType : true)
    );
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

export interface OnClause extends ClauseBlock {
    clause: "ON";
}

export interface ColumnBlock extends BlockBase {
    block: "column";
    type: ColumnType;
}

export interface ResultColumn extends BlockBase {
    block: "column";
    type: "result";
    alias: Token | null;
}

export interface DefinitionColumn extends BlockBase {
    block: "column";
    type: "definition";
    name: Token | null;
}

export interface ReferenceColumn extends BlockBase {
    block: "column";
    type: "reference";
}

export interface SourceBlock extends BlockBase {
    block: "source";
    alias: Token | null;
    options: BlockItem[] | null;
    columns: BlockItem[] | null;
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
    | ResultColumn
    | DefinitionColumn
    | ReferenceColumn
    | SourceBlock;

export type BlockItem = BlockNode | Token;

const JOIN_KEYWORDS = new Set([
    "JOIN", "LEFT", "RIGHT", "FULL", "INNER", "OUTER", "CROSS",
    "NATURAL", "SEMI", "ANTI", "ASOF", "ANY", "STRAIGHT_JOIN",
    "GLOBAL", "APPLY",
]);

const STOP_KEYWORDS = new Set([
    "SELECT", "FROM", "WHERE", "GROUP", "ORDER",
    "UNION", "INTERSECT", "EXCEPT", "MINUS", "INTO", "LIMIT",
    "OFFSET", "FETCH", "RETURNING", "WINDOW", "QUALIFY",
    "HAVING", "WITH", "FOR",
]);

const ALIAS_FORBIDDEN = new Set([
    "END", "NULL", "TRUE", "FALSE", "UNKNOWN",
    "ASC", "DESC", "NULLS", "FIRST", "LAST", "ALL", "DISTINCT",
    "PRECEDING", "FOLLOWING", "UNBOUNDED", "CURRENT",
    "ROWS", "RANGE", "GROUPS", "WHERE", "GROUP", "ORDER", "HAVING", "LIMIT", "OFFSET",
    "FETCH", "RETURNING", "WINDOW", "QUALIFY",
]);

const NON_COLUMN_STARTERS = new Set([
    "PRIMARY", "CONSTRAINT", "FOREIGN", "UNIQUE", "CHECK",
    "EXCLUDE", "KEY",
]);

function isKeywordInSet(token: unknown, keywords: Set<string>): boolean {
    return isIdentifier(token) && !token.quote && keywords.has(token.value.toUpperCase());
}

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
        this.decomposeArrays(root);

        return root;
    }

    private findExpressions(node: BlockNode): ExpressionBlock[] {
        const expressions: ExpressionBlock[] = [];
        if (!node.items || node.items.length === 0) return expressions;

        for (const item of node.items) {
            if (isBlockNode(item, "expression")) {
                expressions.push(item as ExpressionBlock);
            }
            if (isBlockNode(item)) {
                expressions.push(...this.findExpressions(item));
            }
        }

        return expressions;
    }

    private decomposeArrays(node: BlockNode): void {
        if (!node.items || node.items.length === 0) return;

        const expressions = this.findExpressions(node);
        for (const expr of expressions) {
            if (expr.items && expr.items.length > 0) {
                const { collected } = this.decomposeList(expr.items, 0);
                expr.items = collected;
            }
        }
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
                if (statement.type === "SELECT" || statement.type === "VALUES") {
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
                if (pos < statement.items.length && isKeyword(item, "UNION") && isKeyword(statement.items[pos], "ALL")) {
                    operator = "UNION ALL";
                    pos++;
                }
                item = statement.items[pos];
            }
            if (isKeyword(item, "SELECT", "VALUES")) {
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
                        pos++;
                        const { collected, endPos } = this.decomposeResultColumns(statement.items, pos);
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
                    } else if (isKeyword(item, "FROM")) {
                        pos++;
                        const { collected, endPos } = this.decomposeSources(statement.items, pos);
                        const fromClause: FromClause = {
                            class: "block",
                            block: "clause",
                            clause: "FROM",
                            items: collected,
                            open: this.findFirstToken(item),
                            close: collected.length > 0 ? this.findLastToken(collected[collected.length - 1]) : this.findLastToken(item),
                        };
                        setBlock.items!.push(fromClause);
                        pos = endPos;
                    } else if (isKeyword(item, "WHERE")) {
                        pos++;
                        const { collected, endPos } = this.decomposeExpression(statement.items, pos);
                        const whereClause: WhereClause = {
                            class: "block",
                            block: "clause",
                            clause: "WHERE",
                            items: collected,
                            open: this.findFirstToken(item),
                            close: collected.length > 0 ? this.findLastToken(collected[collected.length - 1]) : this.findLastToken(item),
                        };
                        setBlock.items!.push(whereClause);
                        pos = endPos;
                    } else if (isKeyword(item, "ORDER")) {
                        pos++;
                        if (pos < items.length && isKeyword(items[pos], "BY")) pos++;
                        const { collected, endPos } = this.decomposeList(statement.items, pos);
                        const orderClause: OrderByClause = {
                            class: "block",
                            block: "clause",
                            clause: "ORDER BY",
                            items: collected,
                            open: this.findFirstToken(item),
                            close: collected.length > 0 ? this.findLastToken(collected[collected.length - 1]) : this.findLastToken(item),
                        };
                        setBlock.items!.push(orderClause);
                        pos = endPos;
                    } else if (isKeyword(item, "HAVING")) {
                        pos++;
                        const { collected, endPos } = this.decomposeExpression(statement.items, pos);
                        const havingClause: HavingClause = {
                            class: "block",
                            block: "clause",
                            clause: "HAVING",
                            items: collected,
                            open: this.findFirstToken(item),
                            close: collected.length > 0 ? this.findLastToken(collected[collected.length - 1]) : this.findLastToken(item),
                        };
                        setBlock.items!.push(havingClause);
                        pos = endPos;
                    } else if (isKeyword(item, "GROUP")) {
                        pos++;
                        if (pos < items.length && isKeyword(items[pos], "BY")) pos++;
                        const { collected, endPos } = this.decomposeList(statement.items, pos);
                        const groupClause: GroupByClause = {
                            class: "block",
                            block: "clause",
                            clause: "GROUP BY",
                            items: collected,
                            open: this.findFirstToken(item),
                            close: collected.length > 0 ? this.findLastToken(collected[collected.length - 1]) : this.findLastToken(item),
                        };
                        setBlock.items!.push(groupClause);
                        pos = endPos;
                    } else if (isKeyword(item, "VALUES")) {
                        pos++;
                        const { collected, endPos } = this.decomposeList(statement.items, pos);
                        const valuesClause: ValuesClause = {
                            class: "block",
                            block: "clause",
                            clause: "VALUES",
                            items: collected,
                            open: this.findFirstToken(item),
                            close: collected.length > 0 ? this.findLastToken(collected[collected.length - 1]) : this.findLastToken(item),
                        };
                        setBlock.items!.push(valuesClause);
                        pos = endPos;
                    } else {
                        if (isKeyword(item, "UNION", "INTERSECT", "EXCEPT", "MINUS")) {
                            break;
                        }
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

    private decomposeSources(items: BlockItem[], startPos: number): { collected: SourceBlock[]; endPos: number; separators?: Token[][] } {
        let pos = startPos;

        const { segments, endPos, separators } = this.segmentateItems(items, pos, true);
        const collected: SourceBlock[] = [];

        for (let iseg = 0; iseg < segments.length; iseg++) {
            const segment = segments[iseg];
            if (!segment || segment.length === 0) continue;

            // leading separator tokens (may be comma or join-prefix tokens)
            const sepEntry = separators && separators[iseg] ? separators[iseg] : undefined;
            let options: BlockItem[] | null = null;
            if (sepEntry && sepEntry.length > 0 && !isPunctuator(sepEntry[0] as Token, ",")) {
                options = (sepEntry.filter((t): t is Token => t !== null) as Token[]);
            }

            // Parse primary target (table, qualified name, function(...) or parenthesized subquery/expression)
            let idx = 0;
            let exprItems: BlockItem[] = [];
            let columns: BlockItem[] | null = null;
            let alias: Token | null = null;


            while (idx < segment.length && isKeyword(segment[idx], "LATERAL", "ONLY")) {
                if (!options) {
                    options = [];
                }
                options.push(segment[idx] as Token);
                idx++;
            }

            const first = segment[idx];
            if (isBlockNode(first, "statement")) {
                // subquery: (SELECT ...)
                exprItems = [first];
                idx = idx + 1;
            } else if (isIdentifier(first)) {
                // qualified name: id(.id)*
                let q = idx + 1;
                while (q + 1 < segment.length && isPunctuator(segment[q] as Token, ".") && isIdentifier(segment[q + 1])) {
                    q += 2;
                }
                const nameTokens = segment.slice(idx, q);
                // function call: identifier + ( ... )
                if (q < segment.length && isBlockNode(segment[q], "expression")) {
                    exprItems = [...nameTokens, segment[q]];
                    idx = q + 1;
                } else {
                    exprItems = nameTokens.slice();
                    idx = q;
                }
            } else {
                // fallback: take first item as expression
                exprItems = [first];
                idx += 1;
            }

            // alias detection: AS alias or implicit alias
            if (idx < segment.length && isKeyword(segment[idx], "AS")) {
                if (idx + 1 < segment.length && isIdentifier(segment[idx + 1])) {
                    alias = segment[idx + 1] as Token;
                    idx += 2;
                } else {
                    idx += 1;
                }
            } else if (idx < segment.length && isIdentifier(segment[idx])) {
                const prev = exprItems.length > 0 ? exprItems[exprItems.length - 1] : null;
                if (!prev || !isPunctuator(prev as Token, ".")) {
                    const candidate = segment[idx] as Token;
                    if (!isKeywordInSet(candidate, ALIAS_FORBIDDEN)) {
                        alias = candidate;
                        idx += 1;
                    }
                }
            }

            // columns after alias: alias (col1, col2)
            if (idx < segment.length && isBlockNode(segment[idx], "expression")) {
                columns = this.splitColumnDefinitions(segment[idx] as BlockNode);
                idx += 1;
            }

            // tail tokens -> options or ON/USING condition(s) which we group into ExpressionBlock(s) and append to items
            const tail = segment.slice(idx);
            const localOptions: BlockItem[] = [];
            for (let j = 0; j < tail.length;) {
                const t = tail[j];
                if (isKeyword(t, "ON", "USING")) {
                    // group remaining tokens starting from ON/USING as one expression (join condition)
                    const condTokens = tail.slice(j);
                    const condBlock: OnClause = {
                        class: "block",
                        block: "clause",
                        clause: "ON",
                        open: this.findFirstToken(condTokens[0]),
                        close: this.findLastToken(condTokens[condTokens.length - 1]),
                        items: condTokens.slice(1),
                    };
                    exprItems.push(condBlock);
                    break; // rest consumed by condition
                } else {
                    localOptions.push(t);
                    j++;
                }
            }

            if (localOptions.length > 0) {
                options = options ? [...options, ...localOptions] : localOptions.slice();
            }

            // determine open/close tokens
            const openToken = this.findFirstToken(exprItems[0] || segment[0]);
            let closeItem: BlockItem | null = null;
            if (exprItems.length > 0) {
                closeItem = exprItems[exprItems.length - 1];
            } else if (columns && columns.length > 0) {
                closeItem = columns[columns.length - 1];
            } else if (alias) {
                closeItem = alias;
            } else {
                closeItem = segment[segment.length - 1];
            }
            const closeToken = this.findLastToken(closeItem);

            const src: SourceBlock = {
                class: "block",
                block: "source",
                open: openToken,
                close: closeToken,
                items: exprItems.length > 0 ? exprItems : null,
                alias,
                options: options && options.length > 0 ? options : null,
                columns: columns && columns.length > 0 ? columns : null,
            };

            collected.push(src);
        }

        // segmentateItems.endPos points at first stop (or items.length)
        return { collected, endPos: endPos - 1, separators: separators ? separators.map(arr => arr.filter((t): t is Token => t !== null)) : undefined };
    }

    private decomposeExpression(items: BlockItem[], startPos: number): { collected: BlockItem[]; endPos: number } {
        const collected: BlockItem[] = [];
        let pos = startPos;

        // Collect all items until we hit a stop keyword
        while (pos < items.length) {
            if (this.isStopKeyword(items[pos])) {
                break;
            }

            collected.push(items[pos]);
            pos++;
        }

        if (collected.length === 1 && isBlockNode(collected[0], "expression")) {
            return { collected: (collected[0] as ExpressionBlock).items || [], endPos: pos - 1 };
        }

        return { collected, endPos: pos - 1 };
    }

    private decomposeList(items: BlockItem[], startPos: number): { collected: BlockItem[]; endPos: number } {
        const collected: BlockItem[] = [];
        let pos = startPos;

        const { segments, endPos } = this.segmentateItems(items, pos);

        for (const segment of segments) {
            if (segment.length === 0) continue;

            const expression: ExpressionBlock = {
                class: "block",
                block: "expression",
                open: this.findFirstToken(segment[0]),
                close: this.findLastToken(segment[segment.length - 1]),
                items: segment.length === 1 && isBlockNode(segment[0], "expression") ? (segment[0] as ExpressionBlock).items : segment,
            };

            collected.push(expression);
        }

        return { collected, endPos: endPos - 1 };
    }

    private decomposeResultColumns(items: BlockItem[], startPos: number): { collected: ResultColumn[]; endPos: number } {
        const collected: ResultColumn[] = [];
        let pos = startPos;

        const { segments, endPos } = this.segmentateItems(items, pos);

        for (const segment of segments) {
            if (segment.length === 0) continue;

            let alias: Token | null = null;
            let exprItems: BlockItem[] = segment.slice();
            const last = segment[segment.length - 1];

            if (segment.length >= 2 && isIdentifier(last)) {
                const secondLast = segment[segment.length - 2];
                if (isKeyword(secondLast, "AS")) {
                    // explicit: expr AS alias
                    alias = last as Token;
                    exprItems = segment.slice(0, -2);
                } else if (!isKeywordInSet(last as Token, ALIAS_FORBIDDEN) && !isPunctuator(secondLast, ".")) {
                    // implicit: expr alias
                    alias = last as Token;
                    exprItems = segment.slice(0, -1);
                }
            }

            if (!alias && exprItems.length > 0) {
                alias = this.findLastToken(exprItems[exprItems.length - 1], "identifier");
            }

            const colBlock: ResultColumn = {
                class: "block",
                block: "column",
                type: "result",
                open: exprItems.length > 0 ? this.findFirstToken(exprItems[0]) : this.findFirstToken(last),
                close: exprItems.length > 0 ? this.findLastToken(exprItems[exprItems.length - 1]) : this.findLastToken(last),
                items: exprItems.length > 0 ? exprItems : null,
                alias,
            };

            collected.push(colBlock);
        }

        // segmentateItems.endPos points at the first stop keyword (or items.length)
        // keep caller convention: return index of LAST consumed item
        return { collected, endPos: endPos - 1 };
    }

    private decomposeWithClasue(items: BlockItem[], startPos: number): { collected: CteBlock[]; endPos: number } {
        const collected: CteBlock[] = [];

        const { segments, endPos } = this.segmentateItems(items, startPos);

        for (const segment of segments) {
            if (segment.length === 0) continue;

            // collect identifier-like name tokens (stop at AS)
            const nameTokens: Token[] = [];
            let i = 0;
            while (i < segment.length && isIdentifier(segment[i]) && !isKeyword(segment[i], "AS")) {
                nameTokens.push(segment[i] as Token);
                i++;
            }

            // optional column-list expression: next item may be an expression block "(...)" 
            let columnsExpression: ExpressionBlock | null = null;
            if (i < segment.length) {
                const maybeCols = segment[i];
                if (isBlockNode(maybeCols, "expression")) {
                    columnsExpression = maybeCols as ExpressionBlock;
                    i++;
                }
            }

            // optional AS token
            if (i < segment.length && isKeyword(segment[i], "AS")) {
                i++;
            }

            // find a statement block anywhere in the remaining segment
            let cteStatement: StatementBlock | null = null;
            for (let j = i; j < segment.length; j++) {
                const maybe = segment[j];
                if (isBlockNode(maybe, "statement")) {
                    cteStatement = maybe as StatementBlock;
                    break;
                }
            }

            const cteName = nameTokens.length > 0 ? nameTokens[nameTokens.length - 1] : null;
            const options = nameTokens.length > 1 ? nameTokens.slice(0, -1) : null;

            if (cteStatement) {
                const cte: CteBlock = {
                    class: "block",
                    block: "cte",
                    open: cteName,
                    close: cteStatement.close,
                    items: [cteStatement],
                    name: cteName,
                    options,
                    columns: columnsExpression ? this.splitColumnDefinitions(columnsExpression) : null,
                };
                collected.push(cte);
            } else {
                // Fallback: no statement found — keep raw tokens of the segment
                const rawPart = segment.slice();
                const last = rawPart.length > 0 ? rawPart[rawPart.length - 1] : null;

                const cte: CteBlock = {
                    class: "block",
                    block: "cte",
                    open: cteName,
                    close: this.findLastToken(last),
                    items: rawPart.length > 0 ? rawPart.slice() : null,
                    name: cteName,
                    options,
                    columns: columnsExpression ? this.splitColumnDefinitions(columnsExpression) : null,
                };

                collected.push(cte);
            }
        }

        // segmentateItems.endPos points at the first stop keyword (or items.length)
        // return convention: index of LAST consumed item
        return { collected, endPos };
    }

    private segmentateItems(
        items: BlockItem[] | null,
        startPos: number,
        joins = false
    ): { segments: BlockItem[][], endPos: number, separators: (Token | null)[][] } {
        if (!items || items.length === 0) return { segments: [], endPos: startPos, separators: [] };

        const segments: BlockItem[][] = [];
        let current: BlockItem[] = [];
        const separators: (Token | null)[][] = [[null]]; // first segment has no leading separator

        while (startPos < items.length) {
            const item = items[startPos];
            if (this.isStopKeyword(item)) {
                break;
            }

            if (isPunctuator(item, ",")) {
                if (current.length > 0) {
                    segments.push(current);
                    current = [];
                }
                separators.push([item as Token]);
                startPos++;
                continue;
            }

            if (joins && isKeywordInSet(item, JOIN_KEYWORDS)) {
                if (current.length > 0) {
                    segments.push(current);
                    current = [];
                }
                const joinSeparators: Token[] = [];
                while (startPos < items.length && isKeywordInSet(items[startPos], JOIN_KEYWORDS)) {
                    joinSeparators.push(items[startPos] as Token);
                    startPos++;
                }
                separators.push(joinSeparators);
                continue;
            }

            current.push(item);
            startPos++;
        }
        if (current.length > 0) {
            segments.push(current);
        }
        return { segments, endPos: startPos, separators };
    }

    private splitColumnDefinitions(node: BlockNode): BlockNode[] {
        if (!node.items || node.items.length === 0) return [];

        const { segments } = this.segmentateItems(node.items, 0);

        // 2) Konwersja segmentów do DefinitionColumn albo ExpressionBlock
        const converted: BlockNode[] = [];

        for (const segment of segments) {
            if (segment.length === 0) continue;

            const firstItem = segment[0];

            const asExpression = (): ExpressionBlock => ({
                class: "block",
                block: "expression",
                open: this.findFirstToken(segment[0]),
                close: this.findLastToken(segment[segment.length - 1]),
                items: segment,
            });

            // Jeśli segment zaczyna się od constraint keyword (PRIMARY/CONSTRAINT/...)
            // i nie wygląda na nazwę kolumny, traktujemy cały segment jako expression
            if (isKeywordInSet(firstItem, NON_COLUMN_STARTERS)) {
                converted.push(asExpression());
                continue;
            }

            // Żeby sklasyfikować jako DefinitionColumn, pierwszy element musi być
            // bezpośrednio tokenem identifier (nazwa kolumny)
            if (!isIdentifier(firstItem)) {
                converted.push(isBlockNode(firstItem) ? firstItem : asExpression());
                continue;
            }

            const def: DefinitionColumn = {
                class: "block",
                block: "column",
                type: "definition",
                open: this.findFirstToken(segment[0]),
                close: this.findLastToken(segment[segment.length - 1]),
                name: firstItem as Token,
                items: segment.length > 1 ? segment.slice(1) : null,
            };

            converted.push(def);
        }

        return converted;
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

    private isStopKeyword(token: any): boolean {
        return isKeywordInSet(token, STOP_KEYWORDS);
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
                    items.push(node);

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

    private findLastToken(node: BlockItem | null, type: TokenType | null = null): Token | null {
        if (!node) return null;

        if (isToken(node)) {
            return !type || node.type === type ? node : null;
        }

        if (!isBlockNode(node)) return null;

        if (!type) {
            // Fast path: close jest ostatnim tokenem bloku
            if (node.close) return node.close;
            if (node.items) {
                for (let i = node.items.length - 1; i >= 0; i--) {
                    const found = this.findLastToken(node.items[i], null);
                    if (found) return found;
                }
            }
            return node.open;
        }

        // Z filtrem: szukamy od końca w kolejności close → items od końca → open
        if (node.close && node.close.type === type) return node.close;
        if (node.items) {
            for (let i = node.items.length - 1; i >= 0; i--) {
                const found = this.findLastToken(node.items[i], type);
                if (found) return found;
            }
        }
        if (node.open && node.open.type === type) return node.open;
        return null;
    }
}