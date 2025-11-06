import { Stack, useTheme } from "@mui/material";
import { Action, ActionManager } from "./ActionManager";
import { resolveIcon } from "@renderer/themes/icons";
import Tooltip from "../Tooltip";
import { ToolButton, ToolButtonOwnProps } from "../buttons/ToolButton";
import { Shortcut } from "../Shortcut";
import { Size } from "@renderer/types/sizes";
import clsx from "@renderer/utils/clsx";
import { Button } from "../buttons/Button";
import { IconButton } from "../buttons/IconButton";
import { BaseButton } from "../buttons/BaseButton";

type ButtonVariant = 'standard' | 'tool' | 'icon';

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

export function prepareAction<T,>(context: T | undefined, action: Action<T> | undefined, shows: ActionShows, args: any[] = []) {
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

interface NewActionButtonProps<T> extends ToolButtonOwnProps, ActionProps<T> {}

const NewActionButton = <T,>(props: NewActionButtonProps<T>) => {
    const { componentName, action, actionManager, actionContext, children, disabled, loading, selected, actionShows, actionArgs, onClick, ...other } = props;

    const resolvedAction = typeof action === "string" && actionManager ? actionManager.getAction(action) : action;

    if (!resolvedAction) {
        return null;
    }

    const context = actionContext?.();

    const pa = prepareAction(context, resolvedAction, { label: true, icon: true, shortcut: true, tooltip: true, ...actionShows }, actionArgs);

    if (pa?.visible === false) {
        return null;
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (pa?.disabled || pa?.loading) return;
        if (typeof onClick === "function") {
            onClick(e);
        }
        else if (typeof pa?.handler === "function") {
            pa.handler(e);
        }
    };

    const content = children
        ?? (
            pa?.shortcut || pa?.label ? (
                <ShortcutLabel active={pa?.active} shortcut={pa?.shortcut || undefined}>
                    {pa?.icon}
                    {actionShows?.label && <FormattedText text={pa?.label} />}
                </ShortcutLabel>
            ) : pa?.icon || pa?.label
        );

    const button = (
        <BaseButton
            componentName={componentName}
            disabled={pa?.disabled || disabled}
            loading={pa?.loading || loading}
            selected={pa?.selected || selected}
            onClick={handleClick}
            {...other}
        >
            {content}
        </BaseButton>
    );

    return pa?.tooltip ? (
        <Tooltip title={
            pa?.tooltipShortcut ?
                <>{pa.tooltip || pa?.label}<br /><Shortcut keybindings={[pa?.tooltipShortcut]} /></>
                : (pa.tooltip || pa?.label)}>
            <span>{button}</span>
        </Tooltip>
    ) : (
        button
    );
}

interface ActionButtonProps<T> extends ToolButtonOwnProps {
    variant?: ButtonVariant; // Typ przycisku
    actionManager?: ActionManager<T>; // Menedżer akcji
    actionId?: string; // Identyfikator akcji
    action?: Action<T>; // Opis akcji
    getContext: () => T; // Funkcja zwracająca kontekst
    actionArgs?: any[]; // Argumenty do przekazania do akcji przy wywołaniu
    size?: Size; // Rozmiar przycisku
    showLabel?: boolean; // Czy pokazywać etykietę (domyślnie false)
    showShortcut?: boolean; // Czy pokazywać skrót klawiszowy w etykiecie (domyślnie true)
    showTooltip?: boolean; // Czy pokazywać podpowiedź (domyślnie true)
    shortcutActive?: boolean; // Czy skrót klawiszowy jest aktywny (domyślnie true)
}

/**
 * Komponent do wyświetlania przycisku akcji z palety poleceń.
 * Działa dla zarejestrowanych akcji w menedżerze akcji. Nie działa dla akcji z grup.
 */
const ActionButton = <T,>({
    variant = "tool",
    actionManager,
    actionId,
    getContext,
    action,
    actionArgs,
    size = "small",
    showLabel = false,
    showShortcut = false,
    showTooltip = true,
    shortcutActive = true,
    ...other
}: ActionButtonProps<T>) => {
    const theme = useTheme();
    const resolvedAction = actionId && actionManager ? actionManager.getAction(actionId) : action;

    if (!resolvedAction) {
        return null;
    }

    const context = getContext();

    const visible = typeof resolvedAction.visible === 'function' ? resolvedAction.visible(context, ...(actionArgs || [])) : (resolvedAction.visible ?? true);
    if (!visible) {
        return null;
    }

    const handleClick = () => {
        const context = getContext(); // Pobierz kontekst za pomocą funkcji
        if (resolvedAction.precondition && !resolvedAction.precondition(context)) {
            // console.warn(`Action "${action.id}" cannot be executed due to unmet precondition.`);
            return;
        }

        resolvedAction.run(context, ...(actionArgs || []));
    };

    const VariantedButton = variant === "tool" ? ToolButton : variant === "icon" ? IconButton : Button;
    const showLabelFinal = variant === "standard" ? true : showLabel;
    const showShortcutFinal = variant === "standard" ? true : showShortcut;
    const labelFinal = typeof resolvedAction.label === "function" ? resolvedAction.label(context, ...(actionArgs || [])) : resolvedAction.label;
    const disabled = typeof resolvedAction.disabled === 'function' ? resolvedAction.disabled(context, ...(actionArgs || [])) : (resolvedAction.disabled ?? false);
    const tooltip = typeof resolvedAction.tooltip === "function" ? resolvedAction.tooltip(context, ...(actionArgs || [])) : resolvedAction.tooltip;

    return (
        <Tooltip title={
            showTooltip && (
                resolvedAction.keybindings
                    ? <>{tooltip ?? labelFinal}<br /><Shortcut keybindings={resolvedAction.keybindings} /></>
                    : (tooltip ?? labelFinal)
            )
        }>
            <VariantedButton
                {...other}
                className={clsx(
                    'ActionButton-root',
                    `ActionButton-${resolvedAction.id}`,
                    other.className
                )}
                size={size}
                onClick={handleClick}
                disabled={disabled}
                selected={typeof resolvedAction.selected === "function" ? resolvedAction.selected(context) : resolvedAction.selected}
            >
                {showShortcutFinal && resolvedAction.keybindings && <Shortcut keybindings={resolvedAction.keybindings} active={shortcutActive} />}
                {resolveIcon(theme, resolvedAction.icon)}
                {showLabelFinal && labelFinal}
            </VariantedButton>
        </Tooltip>
    );
};

export default ActionButton;