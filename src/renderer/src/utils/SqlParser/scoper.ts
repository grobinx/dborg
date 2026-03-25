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
    items: ScopeNode[];
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
    name: Token;
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
    | Token;

const STATEMENT_KEYWORDS = new Set<StatementType>([
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "MERGE",
    "VALUES",
]);

export class Scoper {
    private readonly tokens: Token[];

    constructor(tokens: Token[]) {
        this.tokens = tokens;
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
            scope: "root",
            open: null,
            close: null,
            items: [...this.tokens],
            parent: null,
        };

        this.processScopeRecursive(root);
        return root;
    }

    private processScopeRecursive(scope: RootScope | Statement | ExpressionScope | CteScope): void {
        scope.items = this.transformParentheses(scope.items, scope);
        scope.items = this.transformItemsWithCtes(scope.items, scope);

        if (scope.scope === "root" || scope.scope === "cte") {
            scope.items = this.wrapTopLevelItemsAsScopes(scope.items, scope);
        }

        for (const item of scope.items) {
            if (this.isContainer(item)) {
                this.processScopeRecursive(item);
            }
        }
    }

    // Zachowane zgodnie z prośbą: dzieli top-level po średnikach.
    private splitBySemicolon(items: ScopeNode[]): ScopeNode[][] {
        const chunks: ScopeNode[][] = [];
        let current: ScopeNode[] = [];

        for (const item of items) {
            if (this.isToken(item) && item.type === "punctuator" && item.value === ";") {
                chunks.push(current);
                current = [];
            } else {
                current.push(item);
            }
        }

        chunks.push(current);
        return chunks;
    }

    private wrapTopLevelItemsAsScopes(
        items: ScopeNode[],
        parent: RootScope | CteScope,
    ): ScopeNode[] {
        const out: ScopeNode[] = [];
        const chunks = this.splitBySemicolon(items);

        for (const rawChunk of chunks) {
            const chunk = this.significantItems(rawChunk);
            if (chunk.length === 0) continue;

            // 1) leading CTE scopes jako osobne elementy
            let idx = 0;
            while (idx < chunk.length) {
                const current = chunk[idx];
                if (!this.isContainer(current) || current.scope !== "cte") break;

                current.parent = parent;
                out.push(current);
                idx++;
            }

            // 2) pozostałość segmentu jako osobny statement/expression
            const rest = chunk.slice(idx);
            if (rest.length === 0) continue;

            if (rest.length === 1) {
                const only = rest[0];
                if (
                    this.isContainer(only) &&
                    (only.scope === "statement" || only.scope === "expression")
                ) {
                    only.parent = parent;
                    this.reparentDescendants(only.items, only);
                    out.push(only);
                    continue;
                }
            }

            const type = this.findMainStatementType(rest);
            const node = type
                ? this.createStatementScope(type, null, null, rest, parent)
                : this.createExpressionScope(null, null, rest, parent);

            this.reparentDescendants(node.items, node);
            out.push(node);
        }

        return out;
    }

    private transformParentheses(items: ScopeNode[], parent: ScopeNode): ScopeNode[] {
        const out: ScopeNode[] = [];
        let i = 0;

        while (i < items.length) {
            const current = items[i];

            if (this.isOpenParenToken(current)) {
                const closeIndex = this.findMatchingParen(items, i);
                if (closeIndex < 0) {
                    out.push(current);
                    i++;
                    continue;
                }

                const openToken = current as Token;
                const closeToken = items[closeIndex] as Token;
                const innerRaw = items.slice(i + 1, closeIndex);
                const inner = this.transformParentheses(innerRaw, parent);

                const statementType = this.findMainStatementType(inner);
                const node = statementType
                    ? this.createStatementScope(statementType, openToken, closeToken, inner, parent)
                    : this.createExpressionScope(openToken, closeToken, inner, parent);

                this.reparentDescendants(node.items, node);

                out.push(node);
                i = closeIndex + 1;
                continue;
            }

            out.push(current);
            i++;
        }

        return out;
    }

    private transformItemsWithCtes(items: ScopeNode[], parent: ScopeNode): ScopeNode[] {
        const out: ScopeNode[] = [];
        let i = 0;

        while (i < items.length) {
            const item = items[i];

            if (this.isWithKeyword(item) && this.isWithStart(items, i)) {
                const parsed = this.parseCteList(items, i, parent);
                if (parsed) {
                    out.push(...parsed.ctes);
                    i = parsed.nextIndex;
                    continue;
                }
            }

            out.push(item);
            i++;
        }

        return out;
    }

    private parseCteList(
        items: ScopeNode[],
        withIndex: number,
        parent: ScopeNode,
    ): { ctes: CteScope[]; nextIndex: number } | null {
        const ctes: CteScope[] = [];
        let cursor = withIndex + 1;

        while (cursor < items.length) {
            const one = this.parseSingleCte(items, cursor, parent);
            if (!one) {
                return ctes.length > 0 ? { ctes, nextIndex: cursor } : null;
            }

            ctes.push(one.cte);
            cursor = one.nextIndex;

            if (one.hasComma) {
                cursor += 1;
                continue;
            }

            return { ctes, nextIndex: cursor };
        }

        return ctes.length > 0 ? { ctes, nextIndex: cursor } : null;
    }

    private parseSingleCte(
        items: ScopeNode[],
        start: number,
        parent: ScopeNode,
    ): { cte: CteScope; nextIndex: number; hasComma: boolean } | null {
        const asIndex = this.findAsToken(items, start);
        if (asIndex < 0) return null;

        const nameIndex = this.findLastIdentifierBefore(items, start, asIndex);
        if (nameIndex < 0) return null;

        const nameNode = items[nameIndex];
        if (!this.isToken(nameNode) || nameNode.type !== "identifier") return null;

        const options = this.collectTokenRange(items, start, nameIndex);

        const bodyIndex = this.findBodyScopeAfterAs(items, asIndex + 1);
        if (bodyIndex < 0) return null;

        const bodyNode = items[bodyIndex];
        if (!this.isContainer(bodyNode)) return null;

        const cte: CteScope = {
            scope: "cte",
            options,
            name: nameNode,
            open: bodyNode.open,
            close: bodyNode.close,
            items: bodyNode.items,
            parent,
        };

        this.reparentDescendants(cte.items, cte);

        const nextSignificant = this.nextSignificantIndex(items, bodyIndex + 1);
        const hasComma =
            nextSignificant >= 0 &&
            this.isToken(items[nextSignificant]) &&
            (items[nextSignificant] as Token).type === "punctuator" &&
            (items[nextSignificant] as Token).value === ",";

        return {
            cte,
            nextIndex: hasComma ? nextSignificant : bodyIndex + 1,
            hasComma,
        };
    }

    private createExpressionScope(
        open: Token | null,
        close: Token | null,
        items: ScopeNode[],
        parent: ScopeNode,
    ): ExpressionScope {
        return {
            scope: "expression",
            open,
            close,
            items,
            parent,
        };
    }

    private createStatementScope(
        type: StatementType,
        open: Token | null,
        close: Token | null,
        items: ScopeNode[],
        parent: ScopeNode,
    ): Statement {
        const base: StatementBaseScope = {
            scope: "statement",
            type: type,
            open,
            close,
            items,
            parent,
        };

        if (type === "SELECT") {
            return { ...base, type: "SELECT", union: null };
        }
        if (type === "INSERT") return { ...base, type: "INSERT" };
        if (type === "UPDATE") return { ...base, type: "UPDATE" };
        if (type === "DELETE") return { ...base, type: "DELETE" };
        if (type === "MERGE") return { ...base, type: "MERGE" };
        return { ...base, type: "VALUES" };
    }

    private findMainStatementType(items: ScopeNode[]): StatementType | null {
        const sig = this.significantItems(items);
        if (sig.length === 0) return null;

        const first = sig[0];
        if (this.isToken(first) && first.type === "identifier" && first.value.toUpperCase() === "WITH") {
            return this.findStatementAfterWith(sig);
        }

        return this.findFirstStatementKeyword(sig);
    }

    private findStatementAfterWith(items: ScopeNode[]): StatementType | null {
        let index = 1;

        while (index < items.length) {
            const asIndex = this.findAsToken(items, index);
            if (asIndex < 0) return null;

            const bodyIndex = this.findBodyScopeAfterAs(items, asIndex + 1);
            if (bodyIndex < 0) return null;

            const next = this.nextSignificantIndex(items, bodyIndex + 1);
            if (next < 0) return null;

            const nextItem = items[next];
            if (this.isToken(nextItem) && nextItem.type === "punctuator" && nextItem.value === ",") {
                index = next + 1;
                continue;
            }

            if (this.isToken(nextItem) && nextItem.type === "identifier") {
                const kw = nextItem.value.toUpperCase() as StatementType;
                return STATEMENT_KEYWORDS.has(kw) ? kw : null;
            }

            return null;
        }

        return null;
    }

    private findFirstStatementKeyword(items: ScopeNode[]): StatementType | null {
        for (const item of items) {
            if (!this.isToken(item)) continue;
            if (item.type !== "identifier") continue;

            const kw = item.value.toUpperCase() as StatementType;
            if (STATEMENT_KEYWORDS.has(kw)) return kw;
        }
        return null;
    }

    private findAsToken(items: ScopeNode[], start: number): number {
        for (let i = start; i < items.length; i++) {
            const item = items[i];
            if (!this.isToken(item)) continue;
            if (item.type === "identifier" && item.value.toUpperCase() === "AS") return i;
            if (item.type === "punctuator" && item.value === ";") break;
        }
        return -1;
    }

    private findBodyScopeAfterAs(items: ScopeNode[], start: number): number {
        for (let i = start; i < items.length; i++) {
            const item = items[i];
            if (this.isContainer(item)) return i;

            if (
                this.isToken(item) &&
                item.type === "punctuator" &&
                (item.value === "," || item.value === ";")
            ) {
                break;
            }
        }
        return -1;
    }

    private findLastIdentifierBefore(items: ScopeNode[], start: number, endExclusive: number): number {
        for (let i = endExclusive - 1; i >= start; i--) {
            const item = items[i];
            if (this.isToken(item) && item.type === "identifier") return i;
        }
        return -1;
    }

    private collectTokenRange(items: ScopeNode[], start: number, endExclusive: number): Token[] {
        const out: Token[] = [];
        for (let i = start; i < endExclusive; i++) {
            const item = items[i];
            if (this.isToken(item) && item.type !== "whitespace" && item.type !== "comment") {
                out.push(item);
            }
        }
        return out;
    }

    private significantItems(items: ScopeNode[]): ScopeNode[] {
        return items.filter((item) => {
            if (!this.isToken(item)) return true;
            return item.type !== "whitespace" && item.type !== "comment";
        });
    }

    private findMatchingParen(items: ScopeNode[], openIndex: number): number {
        let depth = 0;

        for (let i = openIndex; i < items.length; i++) {
            const item = items[i];
            if (!this.isToken(item) || item.type !== "punctuator") continue;

            if (item.value === "(") depth++;
            if (item.value === ")") depth--;

            if (depth === 0) return i;
        }

        return -1;
    }

    private nextSignificantIndex(items: ScopeNode[], start: number): number {
        for (let i = start; i < items.length; i++) {
            const item = items[i];
            if (!this.isToken(item)) return i;
            if (item.type === "whitespace" || item.type === "comment") continue;
            return i;
        }
        return -1;
    }

    private prevSignificantIndex(items: ScopeNode[], start: number): number {
        for (let i = start; i >= 0; i--) {
            const item = items[i];
            if (!this.isToken(item)) return i;
            if (item.type === "whitespace" || item.type === "comment") continue;
            return i;
        }
        return -1;
    }

    private isWithStart(items: ScopeNode[], index: number): boolean {
        const prev = this.prevSignificantIndex(items, index - 1);
        if (prev < 0) return true;

        const p = items[prev];
        if (!this.isToken(p)) return false;
        if (p.type !== "punctuator") return false;

        return p.value === "(" || p.value === ";";
    }

    private reparentDescendants(items: ScopeNode[], parent: ScopeNode): void {
        for (const item of items) {
            if (!this.isContainer(item)) continue;
            item.parent = parent;
            this.reparentDescendants(item.items, item);
        }
    }

    private isWithKeyword(node: ScopeNode): boolean {
        return this.isToken(node) && node.type === "identifier" && node.value.toUpperCase() === "WITH";
    }

    private isOpenParenToken(node: ScopeNode): boolean {
        return this.isToken(node) && node.type === "punctuator" && node.value === "(";
    }

    private isToken(node: ScopeNode): node is Token {
        return typeof node === "object" && node !== null && "type" in node && "value" in node;
    }

    private isContainer(node: ScopeNode): node is RootScope | Statement | ExpressionScope | CteScope {
        return typeof node === "object" && node !== null && "kind" in node;
    }
}