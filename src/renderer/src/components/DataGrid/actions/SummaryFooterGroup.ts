import { Action, ActionGroup } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext, SummaryOperation, typeToOperationMap } from "../DataGridTypes";
import { toBaseType } from "../../../../../../src/api/db";

export const SummaryFooterGroup = (): ActionGroup<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.groups.summaryFooterGroup";

    return {
        id: id,
        prefix: "&",
        label: t(id, "& Summary footer"),
        actions: (context: DataGridActionContext<any>) => {
            let actions: (Action<any> & { operation: SummaryOperation })[] = [];
            const summaryFooterOperation = context.getSummaryOperation();
            const column = context.getColumn();
            const baseType = toBaseType(column?.dataType ?? "string");

            const isOperationSupported = (operation: string): boolean => {
                return baseType && typeToOperationMap[operation]?.includes(baseType);
            };

            // Dodaj pozostałe akcje
            actions.push(
                {
                    operation: "sum",
                    id: "dataGrid.actions.summaryFooter.sum",
                    label: t("dataGrid.actions.summaryFooter.sum", "Sum"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.sumDescription",
                        "Calculates the total sum of all numeric values in the column or string lenght."
                    ),
                    selected: () => summaryFooterOperation === "sum",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("sum"),
                },
                {
                    operation: "avg",
                    id: "dataGrid.actions.summaryFooter.avg",
                    label: t("dataGrid.actions.summaryFooter.avg", "Average"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.avgDescription",
                        "Calculates the average (mean) of all numeric values in the column."
                    ),
                    selected: () => summaryFooterOperation === "avg",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("avg"),
                },
                {
                    operation: "min",
                    id: "dataGrid.actions.summaryFooter.min",
                    label: t("dataGrid.actions.summaryFooter.min", "Minimum"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.minDescription",
                        "Finds the smallest value in the column."
                    ),
                    selected: () => summaryFooterOperation === "min",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("min"),
                },
                {
                    operation: "max",
                    id: "dataGrid.actions.summaryFooter.max",
                    label: t("dataGrid.actions.summaryFooter.max", "Maximum"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.maxDescription",
                        "Finds the largest value in the column."
                    ),
                    selected: () => summaryFooterOperation === "max",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("max"),
                },
                {
                    operation: "median",
                    id: "dataGrid.actions.summaryFooter.median",
                    label: t("dataGrid.actions.summaryFooter.median", "Median"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.medianDescription",
                        "Finds the median value in the column."
                    ),
                    selected: () => summaryFooterOperation === "median",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("median"),
                },
                {
                    operation: "count",
                    id: "dataGrid.actions.summaryFooter.count",
                    label: t("dataGrid.actions.summaryFooter.count", "Count (not empty)"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.countDescription",
                        "Counts the total number of values in the column."
                    ),
                    selected: () => summaryFooterOperation === "count",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("count"),
                },
                {
                    operation: "unique",
                    id: "dataGrid.actions.summaryFooter.unique",
                    label: t("dataGrid.actions.summaryFooter.unique", "Distinct count (Unique)"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.uniqueDescription",
                        "Counts the number of unique values in the column."
                    ),
                    selected: () => summaryFooterOperation === "unique",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("unique"),
                },
                {
                    operation: "mode",
                    id: "dataGrid.actions.summaryFooter.mode",
                    label: t("dataGrid.actions.summaryFooter.mode", "Mode"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.modeDescription",
                        "Finds the most frequently occurring value in the column."
                    ),
                    selected: () => summaryFooterOperation === "mode",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("mode"),
                },
                {
                    operation: "stdDev",
                    id: "dataGrid.actions.summaryFooter.stdDev",
                    label: t("dataGrid.actions.summaryFooter.stdDev", "Standard Deviation"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.stdDevDescription",
                        "Calculates the standard deviation of numeric values in the column."
                    ),
                    selected: () => summaryFooterOperation === "stdDev",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("stdDev"),
                },
                {
                    operation: "range",
                    id: "dataGrid.actions.summaryFooter.range",
                    label: t("dataGrid.actions.summaryFooter.range", "Range"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.rangeDescription",
                        "Calculates the difference between the maximum and minimum values in the column."
                    ),
                    selected: () => summaryFooterOperation === "range",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("range"),
                },
                {
                    operation: "truePercentage",
                    id: "dataGrid.actions.summaryFooter.truePercentage",
                    label: t("dataGrid.actions.summaryFooter.truePercentage", "True Percentage"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.truePercentageDescription",
                        "Calculates the percentage of 'true' values in the column."
                    ),
                    selected: () => summaryFooterOperation === "truePercentage",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("truePercentage"),
                },
                {
                    operation: "minLength",
                    id: "dataGrid.actions.summaryFooter.minLength",
                    label: t("dataGrid.actions.summaryFooter.minLength", "Minimum Length"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.minLengthDescription",
                        "Finds the shortest string length in the column."
                    ),
                    selected: () => summaryFooterOperation === "minLength",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("minLength"),
                },
                {
                    operation: "maxLength",
                    id: "dataGrid.actions.summaryFooter.maxLength",
                    label: t("dataGrid.actions.summaryFooter.maxLength", "Maximum Length"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.maxLengthDescription",
                        "Finds the longest string length in the column."
                    ),
                    selected: () => summaryFooterOperation === "maxLength",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("maxLength"),
                },
                {
                    operation: "sumOfSquares",
                    id: "dataGrid.actions.summaryFooter.sumOfSquares",
                    label: t("dataGrid.actions.summaryFooter.sumOfSquares", "Sum of Squares"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.sumOfSquaresDescription",
                        "Calculates the sum of squares of numeric values in the column."
                    ),
                    selected: () => summaryFooterOperation === "sumOfSquares",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("sumOfSquares"),
                },
                {
                    operation: "emptyCount",
                    id: "dataGrid.actions.summaryFooter.emptyCount",
                    label: t("dataGrid.actions.summaryFooter.emptyCount", "Empty Count"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.emptyCountDescription",
                        "Counts the number of empty or null values in the column."
                    ),
                    selected: () => summaryFooterOperation === "emptyCount",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("emptyCount"),
                },
                {
                    operation: "variance",
                    id: "dataGrid.actions.summaryFooter.variance",
                    label: t("dataGrid.actions.summaryFooter.variance", "Variance"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.varianceDescription",
                        "Calculates the variance of numeric values in the column."
                    ),
                    selected: () => summaryFooterOperation === "variance",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("variance"),
                },
                {
                    operation: "skewness",
                    id: "dataGrid.actions.summaryFooter.skewness",
                    label: t("dataGrid.actions.summaryFooter.skewness", "Skewness"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.skewnessDescription",
                        "Calculates the skewness of numeric values in the column."
                    ),
                    selected: () => summaryFooterOperation === "skewness",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("skewness"),
                },
                {
                    operation: "kurtosis",
                    id: "dataGrid.actions.summaryFooter.kurtosis",
                    label: t("dataGrid.actions.summaryFooter.kurtosis", "Kurtosis"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.kurtosisDescription",
                        "Calculates the kurtosis of numeric values in the column."
                    ),
                    selected: () => summaryFooterOperation === "kurtosis",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("kurtosis"),
                },
                {
                    operation: "iqr",
                    id: "dataGrid.actions.summaryFooter.iqr",
                    label: t("dataGrid.actions.summaryFooter.iqr", "Interquartile Range"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.iqrDescription",
                        "Calculates the interquartile range (IQR) of numeric values in the column."
                    ),
                    selected: () => summaryFooterOperation === "iqr",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("iqr"),
                },
                {
                    operation: "sumOfAbsoluteDifferences",
                    id: "dataGrid.actions.summaryFooter.sumOfAbsoluteDifferences",
                    label: t("dataGrid.actions.summaryFooter.sumOfAbsoluteDifferences", "Sum of Absolute Differences"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.sumOfAbsoluteDifferencesDescription",
                        "Calculates the sum of absolute differences from the mean for numeric values in the column."
                    ),
                    selected: () => summaryFooterOperation === "sumOfAbsoluteDifferences",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("sumOfAbsoluteDifferences"),
                },
                {
                    operation: "geometricMean",
                    id: "dataGrid.actions.summaryFooter.geometricMean",
                    label: t("dataGrid.actions.summaryFooter.geometricMean", "Geometric Mean"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.geometricMeanDescription",
                        "Calculates the geometric mean of numeric values in the column."
                    ),
                    selected: () => summaryFooterOperation === "geometricMean",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("geometricMean"),
                },
                {
                    operation: "harmonicMean",
                    id: "dataGrid.actions.summaryFooter.harmonicMean",
                    label: t("dataGrid.actions.summaryFooter.harmonicMean", "Harmonic Mean"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.harmonicMeanDescription",
                        "Calculates the harmonic mean of numeric values in the column."
                    ),
                    selected: () => summaryFooterOperation === "harmonicMean",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("harmonicMean"),
                },
                {
                    operation: "mostFrequentCharacter",
                    id: "dataGrid.actions.summaryFooter.mostFrequentCharacter",
                    label: t("dataGrid.actions.summaryFooter.mostFrequentCharacter", "Most Frequent Character"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.mostFrequentCharacterDescription",
                        "Finds the most frequently occurring character in the column."
                    ),
                    selected: () => summaryFooterOperation === "mostFrequentCharacter",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("mostFrequentCharacter"),
                },
                {
                    operation: "mostFrequentWord",
                    id: "dataGrid.actions.summaryFooter.mostFrequentWord",
                    label: t("dataGrid.actions.summaryFooter.mostFrequentWord", "Most Frequent Word"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.mostFrequentWordDescription",
                        "Finds the most frequently occurring word in the column."
                    ),
                    selected: () => summaryFooterOperation === "mostFrequentWord",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("mostFrequentWord"),
                },
                {
                    operation: "avgWordLength",
                    id: "dataGrid.actions.summaryFooter.avgWordLength",
                    label: t("dataGrid.actions.summaryFooter.avgWordLength", "Average Word Length"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.avgWordLengthDescription",
                        "Calculates the average length of words in the column."
                    ),
                    selected: () => summaryFooterOperation === "avgWordLength",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("avgWordLength"),
                },
                {
                    operation: "longestCommonPrefix",
                    id: "dataGrid.actions.summaryFooter.longestCommonPrefix",
                    label: t("dataGrid.actions.summaryFooter.longestCommonPrefix", "Longest Common Prefix"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.longestCommonPrefixDescription",
                        "Finds the longest common prefix among strings in the column."
                    ),
                    selected: () => summaryFooterOperation === "longestCommonPrefix",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("longestCommonPrefix"),
                },
                {
                    operation: "agg",
                    id: "dataGrid.actions.summaryFooter.agg",
                    label: t("dataGrid.actions.summaryFooter.agg", "Aggregate"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.aggDescription",
                        "Performs an aggregate operation on the column, allowing for custom aggregation logic."
                    ),
                    selected: () => summaryFooterOperation === "agg",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("agg"),
                },
                {
                    operation: "uniqueAgg",
                    id: "dataGrid.actions.summaryFooter.uniqueAgg",
                    label: t("dataGrid.actions.summaryFooter.uniqueAgg", "Unique Aggregate"),
                    secondaryLabel: t(
                        "dataGrid.actions.summaryFooter.uniqueAggDescription",
                        "Performs an aggregate operation on unique values in the column."
                    ),
                    selected: () => summaryFooterOperation === "uniqueAgg",
                    run: (context: DataGridActionContext<any>) => context.setSummaryOperation("uniqueAgg"),
                }
            );

            actions = actions.filter((action) => isOperationSupported(action.operation));

            return actions;
        },
    };
};