import { Stack, useTheme } from "@mui/material";
import { ActionDescriptor, ActionManager } from "./ActionManager";
import { resolveIcon } from "@renderer/themes/icons";
import Tooltip from "../Tooltip";
import { ToolButton, ToolButtonOwnProps } from "../buttons/ToolButton";
import { Shortcut } from "../Shortcut";
import { Size } from "@renderer/types/sizes";
import clsx from "@renderer/utils/clsx";
import { Button } from "../buttons/Button";
import { IconButton } from "../buttons/IconButton";

type ButtonVariant = 'standard' | 'tool' | 'icon';

interface ActionButtonProps<T> extends ToolButtonOwnProps {
    variant?: ButtonVariant; // Typ przycisku
    actionManager?: ActionManager<T>; // Menedżer akcji
    actionId?: string; // Identyfikator akcji
    action?: ActionDescriptor<T>; // Opis akcji
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

    const visible = typeof resolvedAction.visible === 'function' ? resolvedAction.visible(context) : (resolvedAction.visible ?? true);
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