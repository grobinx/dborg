
export interface PlanNode {
    'Node Type': string;
    'Startup Cost'?: number;
    'Total Cost'?: number;
    'Plan Rows'?: number;
    'Plan Width'?: number;
    'Actual Startup Time'?: number;
    'Actual Total Time'?: number;
    'Actual Rows'?: number;
    'Actual Loops'?: number;
    'Relation Name'?: string;
    'Schema'?: string;
    'Alias'?: string;
    'Join Type'?: string;
    'Hash Cond'?: string;
    'Sort Key'?: string[];
    'Filter'?: string;
    'Output'?: string[];
    'Plans'?: PlanNode[];
    [key: string]: any;
}

export interface ErrorResult {
    error: {
        message: string;
        stack?: string;
    }
}

export function isErrorResult(result: any): result is ErrorResult {
    return result && "error" in result && typeof result.error === 'object';
}

export interface ExplainResult {
    Plan: PlanNode;
    'Planning Time'?: number;
    'Execution Time'?: number;
    [key: string]: any;
}

export function isExplainResult(result: any): result is ExplainResult {
    return result && typeof result === 'object' && "Plan" in result;
}

export interface LoadingResult {
    loading: {
        message: string;
        cancel?: () => void;
    }
}

export function isLoadingResult(result: any): result is LoadingResult {
    return result && "loading" in result && typeof result.loading === 'object';
}

export type ExplainResultKind = ExplainResult | ErrorResult | LoadingResult;
