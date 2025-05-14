import { ActionDescriptor, ActionGroupDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const SearchDataGroup = (t: TFunction<"translation", undefined>): ActionGroupDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.groups.searchData";
    const leaveResultId = "dataGrid.group.searchData.actions.leaveResult";
    const wholeWordId = "dataGrid.group.searchData.actions.wholeWord";
    const caseSensitiveId = "dataGrid.group.searchData.actions.caseSensitive";
    const excludeTextId = "dataGrid.group.searchData.actions.excludeText";

    let queryTimeout: NodeJS.Timeout | null = null;
    let oldSearchText: string | undefined = undefined;

    return {
        id: id,
        prefix: "*",
        label: t(id, "* Search data"),
        mode: "filter",
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
                id: caseSensitiveId,
                icon: "CaseSensitive",
                label: t(caseSensitiveId, "Match case sensitive"),
                run: (context) => {
                    context.setSearchCaseSensitive(!context.isSearchCaseSensitive());
                },
                selected: (context) => context.isSearchCaseSensitive(),
            },
            {
                id: wholeWordId,
                icon: "WholeWord",
                label: t(wholeWordId, "Match whole word"),
                run: (context) => {
                    context.setSearchWholeWord(!context.isSearchWholeWord());
                },
                selected: (context) => context.isSearchWholeWord(),
            },
            {
                id: excludeTextId,
                icon: "ExcludeText",
                label: t(excludeTextId, "Exclude text"),
                run: (context) => {
                    context.setSearchExclude(!context.isSearchExclude());
                },
                selected: (context) => context.isSearchExclude(),
            },
        ],
    };
};