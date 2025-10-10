import { Stack, useTheme } from "@mui/material";
import { ActionDescriptor, ActionManager } from "./ActionManager";
import { resolveIcon } from "@renderer/themes/icons";
import Tooltip from "../Tooltip";
import { ToolButton, ToolButtonOwnProps } from "../buttons/ToolButton";
import { Shortcut } from "../Shortcut";
import { Size } from "@renderer/types/sizes";
import clsx from "@renderer/utils/clsx";

interface ActionButtonProps<T> extends Omit<ToolButtonOwnProps, "action"> {
    actionManager?: ActionManager<T>; // Menedżer akcji
    actionId?: string; // Identyfikator akcji
    action?: ActionDescriptor<T>; // Opis akcji
    getContext: () => T; // Funkcja zwracająca kontekst
    actionArgs?: any[]; // Argumenty do przekazania do akcji przy wywołaniu
    size?: Size; // Rozmiar przycisku
    showLabel?: boolean; // Czy pokazywać etykietę (domyślnie false)
    showShortcut?: boolean; // Czy pokazywać skrót klawiszowy w etykiecie (domyślnie true)
}

/**
 * Komponent do wyświetlania przycisku akcji z palety poleceń.
 * Działa dla zarejestrowanych akcji w menedżerze akcji. Nie działa dla akcji z grup.
 */
const ActionButton = <T,>({
    actionManager,
    actionId,
    getContext,
    action,
    actionArgs,
    size = "small",
    showLabel = false,
    showShortcut = false,
    ...other
}: ActionButtonProps<T>) => {
    const theme = useTheme();
    const resolvedAction = actionId && actionManager ? actionManager.getAction(actionId) : action;

    if (!resolvedAction) {
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

    return (
        <Tooltip title={
            resolvedAction.keybindings
                ? <>{resolvedAction.label}<br /><Shortcut keybindings={resolvedAction.keybindings} /></>
                : resolvedAction.label
        }>
            <ToolButton
                {...other}
                className={clsx(
                    'ActionButton-root',
                    `ActionButton-${resolvedAction.id}`,
                    other.className
                )}
                size={size}
                onClick={handleClick}
                disabled={resolvedAction.precondition ? !resolvedAction.precondition(getContext()) : false}
                selected={typeof resolvedAction.selected === "function" ? resolvedAction.selected(getContext()) : resolvedAction.selected}
            >
                {showShortcut && resolvedAction.keybindings && <Shortcut keybindings={resolvedAction.keybindings} />}
                {resolveIcon(theme, resolvedAction.icon)}
                {showLabel && resolvedAction.label}
            </ToolButton>
        </Tooltip>
    );
};

export default ActionButton;