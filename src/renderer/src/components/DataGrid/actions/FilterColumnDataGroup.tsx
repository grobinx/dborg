import { ActionDescriptor, ActionGroupDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";
import { convertToColumnsFilterOperator, convertToSimpleOperators, filterToString, resetSimpleOperators, SimpleOperators, validateSimpleOperators } from "../useColumnsFilterState";

export const FilterColumnDataGroup = (): ActionGroupDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.groups.filterColumn";
    const leaveResultOfId = "dataGrid.group.filterColumn.actions.leaveResultOf";
    const notId = "dataGrid.group.filterColumn.actions.Not";
    const equalsId = "dataGrid.group.filterColumn.actions.Equals";
    const lessId = "dataGrid.group.filterColumn.actions.Less";
    const greaterThanId = "dataGrid.group.filterColumn.actions.GreaterThan";
    const likeId = "dataGrid.group.filterColumn.actions.Like";
    const nullId = "dataGrid.group.filterColumn.actions.Null";

    let queryTimeout: NodeJS.Timeout | null = null;
    let oldSearchText: string | undefined = undefined;

    return {
        id: id,
        prefix: "?",
        label: t(id, "? Filter column data"),
        mode: "filter",
        position: "bottom",
        getSearchText: (context) => {
            const filter = context.getFilter();
            if (!filter) return '';
            return (filter.values ?? []).join(' ');
        },
        onOpen: (context) => {
            oldSearchText = '';
        },
        actions: (context, searchText) => {
            let filter = context.getFilter();
            let setFilter: boolean = false;
            if (!filter) {
                setFilter = true;
                filter = {
                    operator: 'equals',
                    not: false,
                    values: [],
                    active: false
                };
            }
            else if (filter.active) {
                context.filterActive(false);
            }

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
                keybinding: 'Ctrl+1',
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
                label: t(equalsId, "Equals, [<] Less then or equals, [>] Greater then or equals, [<][>] Between"),
                keybinding: 'Ctrl+=',
                run: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return;
                    let operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    operators.equals = !operators.equals;
                    if (operators.equals && !validateSimpleOperators(operators)) {
                        operators = resetSimpleOperators({equals: true});
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
                label: t(lessId, "Less than, [=] Less then or Equals, [=][>] Between, [~] Ends with"),
                keybinding: 'Ctrl+,',
                run: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return;
                    let operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    operators.lessThan = !operators.lessThan;
                    if (operators.lessThan && !validateSimpleOperators(operators)) {
                        operators = resetSimpleOperators({lessThan: true});
                    }
                    context.setFilter(
                        convertToColumnsFilterOperator(operators),
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
                label: t(greaterThanId, "Greater than, [=] Greater than or Equals, [=][>] Between, [~] Starts with"),
                keybinding: 'Ctrl+.',
                run: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return;
                    let operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    operators.greaterThan = !operators.greaterThan;
                    if (operators.greaterThan && !validateSimpleOperators(operators)) {
                        operators = resetSimpleOperators({greaterThan: true});
                    }
                    context.setFilter(
                        convertToColumnsFilterOperator(operators),
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
                label: t(likeId, "Like, [>] Starts with, [<] Ends with"),
                keybinding: 'Ctrl+`',
                run: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return;
                    let operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    operators.like = !operators.like;
                    if (operators.like && !validateSimpleOperators(operators)) {
                        operators = resetSimpleOperators({like: true});
                    }
                    context.setFilter(
                        convertToColumnsFilterOperator(operators),
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
                keybinding: 'Ctrl+0',
                run: (context) => {
                    const filter = context.getFilter();
                    if (!filter) return;
                    let operators: SimpleOperators = convertToSimpleOperators(filter.operator);
                    operators.isNull = !operators.isNull;
                    if (operators.isNull && !validateSimpleOperators(operators)) {
                        operators = resetSimpleOperators({isNull: true});
                    }
                    context.setFilter(
                        convertToColumnsFilterOperator(operators),
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