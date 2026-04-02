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

const SQL_JOIN_TREE: Record<string, any> = {
    // --- STANDARD & OUTER JOINS ---
    "JOIN": "INNER",
    "INNER": {
        "JOIN": "INNER",
        "LATERAL": { "JOIN": "LATERAL" }
    },
    "LEFT": {
        "JOIN": "LEFT",
        "OUTER": { "JOIN": "LEFT" },
        "SEMI": { "JOIN": "LEFT SEMI" },
        "ANTI": { "JOIN": "LEFT ANTI" },
        "ASOF": { "JOIN": "LEFT ASOF" },
        "LATERAL": { "JOIN": "LEFT LATERAL" }
    },
    "RIGHT": {
        "JOIN": "RIGHT",
        "OUTER": { "JOIN": "RIGHT" },
        "SEMI": { "JOIN": "RIGHT SEMI" },
        "ANTI": { "JOIN": "RIGHT ANTI" },
        "ASOF": { "JOIN": "RIGHT ASOF" },
        "LATERAL": { "JOIN": "RIGHT LATERAL" }
    },
    "FULL": {
        "JOIN": "FULL",
        "OUTER": { "JOIN": "FULL" }
    },

    // --- CROSS & APPLY (T-SQL / Oracle / Postgres) ---
    "CROSS": {
        "JOIN": { 
            "LATERAL": "CROSS LATERAL"
        },
        "APPLY": "CROSS APPLY"
    },
    "OUTER": {
        "APPLY": "OUTER APPLY"
    },

    // --- NATURAL JOINS ---
    "NATURAL": {
        "JOIN": "NATURAL INNER",
        "INNER": { "JOIN": "NATURAL INNER" },
        "LEFT": {
            "JOIN": "NATURAL LEFT",
            "OUTER": { "JOIN": "NATURAL LEFT" }
        },
        "RIGHT": {
            "JOIN": "NATURAL RIGHT",
            "OUTER": { "JOIN": "NATURAL RIGHT" }
        },
        "FULL": {
            "JOIN": "NATURAL FULL",
            "OUTER": { "JOIN": "NATURAL FULL" }
        }
    },

    // --- SPECIALIZED (ClickHouse / Spark / MySQL) ---
    "ASOF": { "JOIN": "ASOF" },
    "ANY": { "JOIN": "ANY" },
    "STRAIGHT_JOIN": "STRAIGHT_JOIN",
    "GLOBAL": {
        "INNER": { "JOIN": "GLOBAL INNER" },
        "LEFT": { "JOIN": "GLOBAL LEFT" }
    },
    "LATERAL": { "JOIN": "LATERAL" }
};

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
                if (pos < statement.items.length && isKeyword(item, "UNION") && isKeyword(statement.items[pos], "ALL")) {
                    operator = "UNION ALL";
                    pos++;
                }
                item = statement.items[pos];
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
                        const { collected, endPos } = this.decomposeWhere(statement.items, pos);
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

    private decomposeSources(items: BlockItem[], startPos: number): { collected: SourceBlock[]; endPos: number } {
        const collected: SourceBlock[] = [];
        let pos = startPos;

        if (pos < items.length && isKeyword(items[pos], "FROM")) pos++;

        const SPLIT_KEYWORDS = [
            "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "CROSS", "NATURAL",
            "ON", "USING", "LATERAL", "WITH"
        ];
        const NOT_ALIAS = [
            "END", "NULL", "TRUE", "FALSE", "UNKNOWN",
            "ASC", "DESC", "NULLS", "FIRST", "LAST", "ALL", "DISTINCT",
            "PRECEDING", "FOLLOWING", "UNBOUNDED", "CURRENT",
            "ROWS", "RANGE", "GROUPS",
            "ON", "USING", "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "CROSS", "NATURAL", "LATERAL",
            "WHERE", "GROUP", "ORDER", "HAVING", "LIMIT", "OFFSET", "FETCH", "RETURNING", "WINDOW", "QUALIFY"
        ];

        // helper: find top-level index matching predicate (skip nested block nodes)
        const findTopLevelIndex = (arr: BlockItem[], start: number, predicate: (it: BlockItem) => boolean): number => {
            for (let i = start; i < arr.length; i++) {
                const it = arr[i];
                if (isBlockNode(it)) continue;
                if (predicate(it)) return i;
            }
            return -1;
        };

        while (pos < items.length) {
            if (this.isStopKeyword(items[pos])) break;

            while (pos < items.length && isPunctuator(items[pos], ",")) pos++;
            if (pos >= items.length) break;
            if (this.isStopKeyword(items[pos])) break;

            const segmentStart = pos;
            const segment: BlockItem[] = [];
            while (pos < items.length) {
                if (this.isStopKeyword(items[pos])) break;
                if (isPunctuator(items[pos], ",")) break;
                segment.push(items[pos]);
                pos++;
            }
            if (segment.length === 0) continue;

            // find first top-level split keyword inside segment
            let splitIndex = -1;
            for (let i = 0; i < segment.length; i++) {
                if (isBlockNode(segment[i])) continue;
                if (isKeyword(segment[i], ...SPLIT_KEYWORDS)) {
                    splitIndex = i;
                    break;
                }
            }

            // alias-candidate scan restricted to tokens before the initial split
            let aliasCandidateIndex = -1;
            const aliasScanEnd = splitIndex === -1 ? segment.length - 1 : (splitIndex - 1);
            for (let i = aliasScanEnd; i >= 0; i--) {
                const it = segment[i];
                if (isBlockNode(it)) continue;
                if (isIdentifier(it)) {
                    const prev = i > 0 ? segment[i - 1] : null;
                    if (!prev || !isPunctuator(prev, ".")) {
                        aliasCandidateIndex = i;
                        break;
                    }
                }
            }

            // if split occurs before alias candidate, try to move split after alias
            if (splitIndex !== -1 && aliasCandidateIndex !== -1 && splitIndex <= aliasCandidateIndex) {
                let newSplit = -1;
                for (let j = aliasCandidateIndex + 1; j < segment.length; j++) {
                    if (isKeyword(segment[j], ...SPLIT_KEYWORDS)) {
                        newSplit = j;
                        break;
                    }
                }
                splitIndex = newSplit;
            }

            // If split is at 0, treat as continuation of previous source's options
            if (splitIndex === 0 && collected.length > 0) {
                const continuation = segment.slice(0);
                const last = collected[collected.length - 1];
                last.options = last.options ? [...last.options, ...continuation] : continuation;
                continue;
            }

            const mainPart = splitIndex === -1 ? segment.slice() : segment.slice(0, splitIndex);
            let optionsPart = splitIndex === -1 ? null : segment.slice(splitIndex);

            // analyse mainPart for alias / column-list
            let alias: Token | null = null;
            let columns: BlockItem[] | null = null;
            let exprItems: BlockItem[] = mainPart.slice();

            if (exprItems.length >= 2) {
                const lastItem = exprItems[exprItems.length - 1];
                const secondLast = exprItems[exprItems.length - 2];
                if (isBlockNode(lastItem) && (lastItem as BlockNode).block === "expression" && isIdentifier(secondLast)) {
                    alias = secondLast as Token;
                    columns = this.splitColumnDefinitions(lastItem);
                    exprItems = exprItems.slice(0, -2);
                }
            }

            if (!alias && exprItems.length >= 2) {
                for (let i = 0; i < exprItems.length - 1; i++) {
                    if (isKeyword(exprItems[i], "AS") && isIdentifier(exprItems[i + 1])) {
                        alias = exprItems[i + 1] as Token;
                        const extraOptions = exprItems.slice(i + 2);
                        exprItems = exprItems.slice(0, i);
                        if (extraOptions.length > 0) {
                            if (optionsPart && optionsPart.length > 0) {
                                optionsPart.unshift(...extraOptions);
                            } else {
                                optionsPart = extraOptions.slice();
                            }
                        }
                        break;
                    }
                }
            }

            if (!alias && exprItems.length >= 2) {
                const last = exprItems[exprItems.length - 1];
                const secondLast = exprItems[exprItems.length - 2];
                if (isIdentifier(last)
                    && !isPunctuator(secondLast, ".")
                    && !isKeyword(last as Token, ...NOT_ALIAS)
                    && !isKeyword(secondLast as Token, ...SPLIT_KEYWORDS)) {
                    alias = last as Token;
                    exprItems = exprItems.slice(0, -1);
                }
            }

            if (exprItems.length === 0 && segment.length > 0) {
                exprItems = [segment[0]];
            }

            const openToken = this.findFirstToken(exprItems[0] || segment[0]);
            let closeItem: BlockItem | null = null;
            if (alias) {
                closeItem = alias;
            } else if (columns && columns.length > 0) {
                closeItem = columns[columns.length - 1];
            } else if (exprItems.length > 0) {
                closeItem = exprItems[exprItems.length - 1];
            } else {
                closeItem = segment[segment.length - 1];
            }
            const closeToken = this.findLastToken(closeItem);

            const baseSrc: SourceBlock = {
                class: "block",
                block: "source",
                open: openToken,
                close: closeToken,
                items: exprItems.length > 0 ? exprItems : null,
                alias,
                options: null,
                columns: columns && columns.length > 0 ? columns : null,
            };

            // If no options (no joins etc), just push base source
            if (!optionsPart || optionsPart.length === 0) {
                collected.push(baseSrc);
                continue;
            }

            // If options exist, check whether they contain top-level JOIN clauses.
            const firstJoinIndex = findTopLevelIndex(optionsPart, 0, (it) => isKeyword(it, "JOIN"));
            if (firstJoinIndex === -1) {
                // no joins -> assign whole optionsPart to base source
                baseSrc.options = optionsPart;
                collected.push(baseSrc);
                continue;
            }

            // tokens before first JOIN remain as options of the base source
            if (firstJoinIndex > 0) {
                baseSrc.options = optionsPart.slice(0, firstJoinIndex);
            }
            collected.push(baseSrc);

            // parse successive top-level JOIN clauses and emit new SourceBlocks
            let off = firstJoinIndex;
            const JOIN_PREFIX = ["LEFT", "RIGHT", "FULL", "INNER", "OUTER", "CROSS", "NATURAL", "LATERAL"];

            while (off < optionsPart.length) {
                const joinIdx = findTopLevelIndex(optionsPart, off, (it) => isKeyword(it, "JOIN"));
                if (joinIdx === -1) break;

                // include preceding JOIN prefix tokens (LEFT, RIGHT, OUTER, ...)
                let jtStart = joinIdx;
                while (jtStart > off && !isBlockNode(optionsPart[jtStart - 1]) && isKeyword(optionsPart[jtStart - 1], ...JOIN_PREFIX)) {
                    jtStart--;
                }

                const joinPrefixTokens = optionsPart.slice(jtStart, joinIdx + 1); // includes 'JOIN'

                const joinTargetStart = joinIdx + 1;
                if (joinTargetStart >= optionsPart.length) break;

                // find ON/USING that belongs to this join and next JOIN
                const conditionIndex = findTopLevelIndex(optionsPart, joinTargetStart, (it) => isKeyword(it, "ON", "USING"));
                const nextJoinIndex = findTopLevelIndex(optionsPart, joinTargetStart, (it) => isKeyword(it, "JOIN"));

                const joinTargetEnd = conditionIndex !== -1 ? conditionIndex : (nextJoinIndex !== -1 ? nextJoinIndex : optionsPart.length);
                const joinTargetTokens = optionsPart.slice(joinTargetStart, joinTargetEnd);
                if (joinTargetTokens.length === 0) break;

                const conditionEnd = nextJoinIndex !== -1 ? nextJoinIndex : optionsPart.length;
                let joinConditionTokens: BlockItem[] = conditionIndex !== -1 ? optionsPart.slice(conditionIndex, conditionEnd) : [];

                // analyze joinTargetTokens for alias/columns (reuse heuristics)
                let jAlias: Token | null = null;
                let jColumns: BlockItem[] | null = null;
                let jExprItems: BlockItem[] = joinTargetTokens.slice();

                if (jExprItems.length >= 2) {
                    const lastItem = jExprItems[jExprItems.length - 1];
                    const secondLast = jExprItems[jExprItems.length - 2];
                    if (isBlockNode(lastItem) && (lastItem as BlockNode).block === "expression" && isIdentifier(secondLast)) {
                        jAlias = secondLast as Token;
                        jColumns = this.splitColumnDefinitions(lastItem);
                        jExprItems = jExprItems.slice(0, -2);
                    }
                }

                let jExtraOptions: BlockItem[] | null = null;

                if (!jAlias && jExprItems.length >= 2) {
                    for (let i = 0; i < jExprItems.length - 1; i++) {
                        if (isKeyword(jExprItems[i], "AS") && isIdentifier(jExprItems[i + 1])) {
                            jAlias = jExprItems[i + 1] as Token;
                            const extraOptions = jExprItems.slice(i + 2);
                            jExprItems = jExprItems.slice(0, i);
                            if (extraOptions.length > 0) {
                                if (joinConditionTokens.length > 0) {
                                    // these tokens belong before the ON/USING expression
                                    joinConditionTokens = [...extraOptions, ...joinConditionTokens];
                                } else {
                                    // no ON/USING -> treat them as join-level options
                                    jExtraOptions = extraOptions.slice();
                                }
                            }
                            break;
                        }
                    }
                }

                if (!jAlias && jExprItems.length >= 2) {
                    const last = jExprItems[jExprItems.length - 1];
                    const secondLast = jExprItems[jExprItems.length - 2];
                    if (isIdentifier(last)
                        && !isPunctuator(secondLast, ".")
                        && !isKeyword(last as Token, ...NOT_ALIAS)
                        && !isKeyword(secondLast as Token, ...SPLIT_KEYWORDS)) {
                        jAlias = last as Token;
                        jExprItems = jExprItems.slice(0, -1);
                    }
                }

                if (jExprItems.length === 0 && joinTargetTokens.length > 0) {
                    jExprItems = [joinTargetTokens[0]];
                }

                const jOpen = this.findFirstToken(jExprItems[0] || joinTargetTokens[0]);

                // Build items: target expression(s) + (if present) ON/USING as an expression block
                const jItems: BlockItem[] = jExprItems.length > 0 ? [...jExprItems] : [];

                if (joinConditionTokens.length > 0) {
                    const condBlock: ExpressionBlock = {
                        class: "block",
                        block: "expression",
                        open: this.findFirstToken(joinConditionTokens[0]),
                        close: this.findLastToken(joinConditionTokens[joinConditionTokens.length - 1]),
                        items: joinConditionTokens.slice(1),
                    };
                    jItems.push(condBlock);
                }

                // Prepare options: join prefix (e.g. LEFT) plus any extraOptions detected
                const joinedOptions: BlockItem[] = [];
                if (joinPrefixTokens.length > 0) joinedOptions.push(...joinPrefixTokens);
                if (jExtraOptions && jExtraOptions.length > 0) joinedOptions.push(...jExtraOptions);

                // determine close token now that we may have appended condition expression
                let jCloseItem: BlockItem | null = null;
                if (jColumns && jColumns.length > 0) {
                    jCloseItem = jColumns[jColumns.length - 1];
                } else if (jItems.length > 0) {
                    jCloseItem = jItems[jItems.length - 1];
                } else if (jAlias) {
                    jCloseItem = jAlias;
                } else {
                    jCloseItem = joinTargetTokens[joinTargetTokens.length - 1];
                }
                const jClose = this.findLastToken(jCloseItem);

                const joinSrc: SourceBlock = {
                    class: "block",
                    block: "source",
                    open: jOpen,
                    close: jClose,
                    items: jItems.length > 0 ? jItems : null,
                    alias: jAlias,
                    options: joinedOptions.length > 0 ? joinedOptions : null,
                    columns: jColumns && jColumns.length > 0 ? jColumns : null,
                };

                collected.push(joinSrc);

                // advance to the token after processed condition / join clause
                off = conditionEnd;
            }
        }

        return { collected, endPos: pos - 1 };
    }

    private decomposeWhere(items: BlockItem[], startPos: number): { collected: BlockItem[]; endPos: number } {
        const collected: BlockItem[] = [];
        let pos = startPos;

        // Skip WHERE keyword
        if (pos < items.length && isKeyword(items[pos], "WHERE")) {
            pos++;
        }

        // Collect all items until we hit a stop keyword
        while (pos < items.length) {
            if (this.isStopKeyword(items[pos])) {
                break;
            }

            collected.push(items[pos]);
            pos++;
        }

        return { collected, endPos: pos - 1 };
    }

    private decomposeResultColumns(items: BlockItem[], startPos: number): { collected: ResultColumn[]; endPos: number } {
        const collected: ResultColumn[] = [];
        let pos = startPos;

        // Skip SELECT keyword
        if (pos < items.length && isKeyword(items[pos], "SELECT")) pos++;

        const NOT_ALIAS = ["END", "NULL", "TRUE", "FALSE", "UNKNOWN",
            "ASC", "DESC", "NULLS", "FIRST", "LAST", "ALL", "DISTINCT",
            "PRECEDING", "FOLLOWING", "UNBOUNDED", "CURRENT",
            "ROWS", "RANGE", "GROUPS"] as const;

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
                } else if (!isKeyword(last as Token, ...NOT_ALIAS) && !isPunctuator(secondLast, ".")) {
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
                if (isBlockNode(maybeCols) && (maybeCols as BlockNode).block === "expression") {
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
                if (isBlockNode(maybe) && (maybe as BlockNode).block === "statement") {
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
        startPos: number
    ): { segments: BlockItem[][], endPos: number } {
        if (!items || items.length === 0) return { segments: [], endPos: startPos };

        const segments: BlockItem[][] = [];
        let current: BlockItem[] = [];

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
                startPos++;
                continue;
            }
            current.push(item);
            startPos++;
        }
        if (current.length > 0) {
            segments.push(current);
        }
        return { segments, endPos: startPos };
    }

    private splitColumnDefinitions(node: BlockNode): BlockNode[] {
        if (!node.items || node.items.length === 0) return [];

        // Słowa kluczowe typowe dla definicji ograniczeń tabeli (nie nazwa kolumny)
        const NON_COLUMN_STARTERS = [
            "PRIMARY",
            "CONSTRAINT",
            "FOREIGN",
            "UNIQUE",
            "CHECK",
            "EXCLUDE",
            "KEY",
        ] as const;

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
            if (isKeyword(firstItem, ...NON_COLUMN_STARTERS)) {
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
        return isKeyword(token,
            "SELECT", "FROM", "WHERE", "GROUP", "ORDER",
            "UNION", "INTERSECT", "EXCEPT", "MINUS", "INTO", "LIMIT", "OFFSET",
            "FETCH", "RETURNING", "WINDOW", "QUALIFY", "HAVING", "WITH",
            "FOR"
        );
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