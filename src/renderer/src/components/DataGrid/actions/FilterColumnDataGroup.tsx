import { ActionDescriptor, ActionGroupDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const FilterColumnDataGroup = (): ActionGroupDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.groups.filterColumn";
    const leaveResultId = "dataGrid.group.filterColumn.actions.leaveResult";
    const notId = "dataGrid.group.filterColumn.actions.not";
    const equalsId = "dataGrid.group.filterColumn.actions.equals";
    const lessId = "dataGrid.group.filterColumn.actions.less";
    const greaterThanId = "dataGrid.group.filterColumn.actions.greaterThan";
    const likeId = "dataGrid.group.filterColumn.actions.like";
    const inId = "dataGrid.group.filterColumn.actions.in";
    const nullId = "dataGrid.group.filterColumn.actions.null";

    let queryTimeout: NodeJS.Timeout | null = null;
    let oldSearchText: string | undefined = undefined;

    return {
        id: id,
        prefix: "?",
        label: t(id, "? Filter column data"),
        mode: "filter",
        position: "bottom",
        actions: (context, searchText) => {
            if (searchText !== oldSearchText) {
                // Resetuj poprzedni timeout przy każdej zmianie
                if (queryTimeout) {
                    clearTimeout(queryTimeout);
                }

                // Ustaw nowy timeout z opóźnieniem 300ms
                queryTimeout = setTimeout(() => {
                    context.setSearchText(searchText);
                    oldSearchText = searchText;
                }, 300);
            }

            const actions: ActionDescriptor<any>[] = [
                {
                    id: leaveResultId,
                    label: t(leaveResultId, "Leave a result"),
                    run: () => {
                        context.closeCommandPalette();
                    },
                },
            ];
            return actions;
        },
        options: [
            {
                id: notId,
                icon: 'Not',
                label: t(notId, "Not"),
                run: (context) => {
                },
                selected: (context) => false,
            },
            {
                id: equalsId,
                icon: <span>=</span>,
                label: t(equalsId, "Equals"),
                run: (context) => {
                },
                selected: (context) => false,
            },
            {
                id: lessId,
                icon: <span>&lt;</span>,
                label: t(lessId, "Less than"),
                run: (context) => {
                },
                selected: (context) => false,
            },
            {
                id: greaterThanId,
                icon: <span>&gt;</span>,
                label: t(greaterThanId, "Greater than"),
                run: (context) => {
                },
                selected: (context) => false,
            },
            {
                id: likeId,
                icon: <span>~</span>,
                label: t(likeId, "Like"),
                run: (context) => {
                },
                selected: (context) => false,
            },
            {
                id: inId,
                icon: <span>∈</span>,
                label: t(inId, "In"),
                run: (context) => {
                },
                selected: (context) => false,
            },
            {
                id: nullId,
                icon: <span>∅</span>,
                label: t(nullId, "Null"),
                run: (context) => {
                },
                selected: (context) => false,
            },
        ],
    };
};