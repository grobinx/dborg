import { Stack, useTheme } from "@mui/material";
import { Action, ActionManager } from "../CommandPalette/ActionManager";
import { resolveIcon } from "@renderer/themes/icons";
import Tooltip from "../Tooltip";
import { Shortcut } from "../Shortcut";
import { BaseButton } from "./BaseButton";
import { BaseButtonProps } from "./BaseButtonProps";

export interface ActionShows {
    icon?: boolean;
    label?: boolean;
    shortcut?: boolean;
    tooltip?: boolean;
}

export interface ActionProps<T> {
    actionManager?: ActionManager<T>; // Menedżer akcji
    /**
     * Identyfikator akcji lub opis akcji do powiązania z przyciskiem.
     * Jeśli podano menedżer akcji, można użyć identyfikatora akcji
     */
    action?: string | Action<T>;
    actionContext?: () => T; // Funkcja zwracająca kontekst
    actionArgs?: any[]; // Argumenty do przekazania do akcji przy wywołaniu
    actionShows?: ActionShows; // Co pokazywać z akcji
}

export function prepareAction<T,>(context: T, action: Action<T> | undefined, shows: ActionShows, args: any[] = []) {
    if (!action) {
        return null;
    }

    const shortcuts = action?.keybindings;
    const label = typeof action?.label === "function" ? action.label(context, ...args) : action?.label;

    return {
        disabled: typeof action?.disabled === "function" ? action.disabled(context, ...args) : action?.disabled,
        tooltip: shows.tooltip && ((typeof action?.tooltip === "function" ? action.tooltip(context, ...args) : action?.tooltip) || label),
        loading: typeof action?.loading === "function" ? action.loading(context, ...args) : action?.loading,
        active: typeof action?.active === "function" ? action.active(context, ...args) : action?.active,
        selected: typeof action?.selected === "function" ? action.selected(context, ...args) : action?.selected,
        visible: typeof action?.visible === "function" ? action.visible(context, ...args) : action?.visible,
        label: shows.label && label,
        icon: shows.icon && (typeof action?.icon === "function" ? action.icon(context, ...args) : action?.icon),
        shortcut: shows.shortcut && shortcuts,
        tooltipShortcut: shortcuts,
        run: action?.run,
    };
}

export interface ActionButtonProps<T> extends BaseButtonProps, ActionProps<T> { }

const ActionButton = <T,>(props: ActionButtonProps<T>) => {
    const { componentName, action, actionManager, actionContext, children, disabled, loading, selected, actionShows, actionArgs, onClick, ...other } = props;
    const theme = useTheme();

    const resolvedAction =
        typeof action === "string" ?
            actionManager ?
                actionManager.getAction(action)
                : undefined
            : action;

    let pa: Partial<ReturnType<typeof prepareAction<T>>> = {};
    const context = actionContext?.() ?? {} as T;

    if (resolvedAction) {
        pa = prepareAction(context, resolvedAction, { label: true, icon: true, shortcut: true, tooltip: true, ...actionShows }, actionArgs);
    }


    if (pa?.visible === false) {
        return null;
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (pa?.disabled || pa?.loading) return;
        if (typeof onClick === "function") {
            onClick(e);
        }
        else if (typeof pa?.run === "function") {
            pa.run(context, ...(actionArgs ?? []));
        }
    };

    let content = children;

    if (!content) {
        content = (
            <>
                {pa?.shortcut && <Shortcut keybindings={pa?.shortcut} />}
                {resolveIcon(theme, pa?.icon)}
                {pa?.label}
            </>
        );
    };

    const button = (
        <BaseButton
            componentName={componentName}
            disabled={pa?.disabled || disabled}
            loading={pa?.loading || loading}
            selected={pa?.selected || selected}
            onClick={handleClick}
            //aria-label={pa?.label}
            {...other}
        >
            {content}
        </BaseButton>
    );

    return pa?.tooltip ? (
        <Tooltip title={
            pa?.tooltipShortcut ?
                <>{pa.tooltip || pa?.label}<br /><Shortcut keybindings={pa?.tooltipShortcut} /></>
                : (pa.tooltip || pa?.label)}>
            {button}
        </Tooltip>
    ) : (
        button
    );
}

export default ActionButton;