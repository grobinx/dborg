import { ActionDescriptor, ActionGroupDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";
import { convertToColumnsFilterOperator, convertToSimpleOperators, filterToString, SimpleOperators } from "../useColumnsFilterState";

export const FilterColumnDataGroup = (): ActionGroupDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.groups.filterColumn";
    const leaveResultOfId = "dataGrid.group.filterColumn.actions.leaveResultOf";
    const notId = "dataGrid.group.filterColumn.actions.Not";
    const equalsId = "dataGrid.group.filterColumn.actions.Equals";
    const lessId = "dataGrid.group.filterColumn.actions.Less";
    const greaterThanId = "dataGrid.group.filterColumn.actions.GreaterThan";
    const likeId = "dataGrid.group.filterColumn.actions.Like";
    const inId = "dataGrid.group.filterColumn.actions.In";
    const nullId = "dataGrid.group.filterColumn.actions.Null";

    let queryTimeout: NodeJS.Timeout | null = null;
    let oldSearchText: string | undefined = undefined;

    return {
        id: id,
        prefix: "?",
        label: t(id, "? Filter column data"),
        mode: "filter",
        position: "bottom",
        actions: (context, searchText) => {
            let filter = context.getFilter();
            let setFilter: boolean = false;
            if (!filter) {
                setFilter = true;
                filter = {
                    operator: 'equal',
                    not: false,
                    values: [],
                    active: false
                };
            }
            const operators: SimpleOperators = convertToSimpleOperators(filter.operator);

            if (searchText !== oldSearchText || setFilter) {
                // Resetuj poprzedni timeout przy każdej zmianie
                if (queryTimeout) {
                    clearTimeout(queryTimeout);
                }

                // Ustaw nowy timeout z opóźnieniem 300ms
                queryTimeout = setTimeout(() => {
                    const parts = (searchText ?? '').split(' ').filter(part => part.trim() !== '');
                    context.setFilter(filter?.operator, filter?.not, parts);
                    oldSearchText = searchText;
                }, 300);
            }

            const actions: ActionDescriptor<any>[] = [
                {
                    id: leaveResultOfId,
                    label: t(
                        leaveResultOfId,
                        "Leave a result of {{filter}}", {
                        filter: filterToString(filter.operator, filter.not, filter?.values)
                    }),
                    run: () => {
                        context.filterActive(true);
                    },
                },
            ];
            return actions;
        },
        onCancel: (context) => {
            context.filterActive(false);
        },
        options: [
            {
                id: notId,
                icon: 'Not',
                label: t(notId, "Not"),
                run: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return;
                    context.setFilter(
                        filter.operator ?? 'equal',
                        !filter.not,
                        filter.values ?? []
                    );
                },
                selected: (context) => context.getFilter()?.not ?? false,
            },
            {
                id: equalsId,
                icon: 'Equal',
                label: t(equalsId, "Equals"),
                run: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return;
                    const operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    operators.equals = !operators.equals;
                    if (operators.equals) {
                        operators.like = false;
                        operators.isNull = false;
                    }
                    context.setFilter(
                        convertToColumnsFilterOperator(operators) ?? 'equal',
                        filter.not ?? false,
                        filter.values ?? []
                    );
                },
                selected: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return false;
                    const operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    return operators.equals;
                },
            },
            {
                id: lessId,
                icon: 'LessThan',
                label: t(lessId, "Less than"),
                run: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return;
                    const operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    operators.lessThan = !operators.lessThan;
                    if (operators.lessThan) {
                        operators.like = false;
                        operators.isNull = false;
                        operators.greaterThan = operators.equals === false ? false : operators.greaterThan;
                    }
                    context.setFilter(
                        convertToColumnsFilterOperator(operators) ?? 'equal',
                        filter.not ?? false,
                        filter.values ?? []
                    );
                },
                selected: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return false;
                    const operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    return operators.lessThan;
                },
            },
            {
                id: greaterThanId,
                icon: 'GreaterThan',
                label: t(greaterThanId, "Greater than"),
                run: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return;
                    const operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    operators.greaterThan = !operators.greaterThan;
                    if (operators.greaterThan) {
                        operators.like = false;
                        operators.isNull = false;
                        operators.lessThan = operators.equals === false ? false : operators.lessThan;
                    }
                    context.setFilter(
                        convertToColumnsFilterOperator(operators) ?? 'equal',
                        filter.not ?? false,
                        filter.values ?? []
                    );
                },
                selected: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return false;
                    const operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    return operators.greaterThan;
                },
            },
            {
                id: likeId,
                icon: 'SuchLike',
                label: t(likeId, "Like"),
                run: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return;
                    const operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    operators.like = !operators.like;
                    if (operators.like) {
                        operators.equals = false;
                        operators.isNull = false;
                        operators.lessThan = false;
                        operators.greaterThan = false;
                    }
                    context.setFilter(
                        convertToColumnsFilterOperator(operators) ?? 'equal',
                        filter.not ?? false,
                        filter.values ?? []
                    );
                },
                selected: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return false;
                    const operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    return operators.like;
                },
            },
            {
                id: nullId,
                icon: 'Null',
                label: t(nullId, "Null"),
                run: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return;
                    const operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    operators.isNull = !operators.isNull;
                    if (operators.isNull) {
                        operators.like = false;
                        operators.equals = false;
                        operators.lessThan = false;
                        operators.greaterThan = false;
                    }
                    context.setFilter(
                        'isNull',
                        filter.not ?? false,
                        filter.values ?? []
                    );
                },
                selected: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return false;
                    const operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    return operators.isNull;
                },
            },
        ],
    };
};