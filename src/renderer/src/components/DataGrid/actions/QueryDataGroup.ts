import { ActionDescriptor, ActionGroupDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const QueryDataGroup = (t: TFunction<"translation", undefined>): ActionGroupDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.groups.queryData";
    const leaveResultId = "dataGrid.group.queryData.actions.leaveResult";
    const wholeWordId = "dataGrid.group.queryData.actions.wholeWord";
    const caseSensitiveId = "dataGrid.group.queryData.actions.caseSensitive";
    const excludeTextId = "dataGrid.group.queryData.actions.excludeText";
    
    let queryTimeout: NodeJS.Timeout | null = null; // Przechowywanie identyfikatora timeoutu

    return {
        id: id,
        prefix: "*",
        label: t(id, "* Search data"),
        mode: "filter",
        actions: (context, query) => {
            // Resetuj poprzedni timeout przy każdej zmianie
            if (queryTimeout) {
                clearTimeout(queryTimeout);
            }

            // Ustaw nowy timeout z opóźnieniem 300ms
            queryTimeout = setTimeout(() => {
                context.setQuery(query);
            }, 300);

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
                id: caseSensitiveId,
                icon: "CaseSensitive",
                label: t(caseSensitiveId, "Match case sensitive"),
                run: (context) => {
                    context.setQueryCaseSensitive(!context.isQueryCaseSensitive());
                },
                selected: (context) => context.isQueryCaseSensitive(),
            },
            {
                id: wholeWordId,
                icon: "WholeWord",
                label: t(wholeWordId, "Match whole word"),
                run: (context) => {
                    context.setQueryWholeWord(!context.isQueryWholeWord());
                },
                selected: (context) => context.isQueryWholeWord(),
            },
            {
                id: excludeTextId,
                icon: "ExcludeText",
                label: t(excludeTextId, "Exclude text"),
                run: (context) => {
                    context.setQueryExclude(!context.isQueryExclude());
                },
                selected: (context) => context.isQueryExclude(),
            },
        ],
    };
};