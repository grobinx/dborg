import { Tooltip, useTheme } from "@mui/material";
import ToolButton, { ToolButtonProps } from "../ToolButton"; // Zakładam, że ToolButton jest w katalogu nadrzędnym
import { ActionDescriptor, ActionManager } from "./ActionManager";
import { resolveIcon } from "@renderer/themes/icons";
import { renderKeybindings } from "./CommandPalette";

interface ActionButtonProps<T> extends Omit<ToolButtonProps, "action"> {
    actionManager?: ActionManager<T>; // Menedżer akcji
    actionId?: string; // Identyfikator akcji
    action?: ActionDescriptor<T>; // Opis akcji
    getContext: () => T; // Funkcja zwracająca kontekst
}

/**
 * Komponent do wyświetlania przycisku akcji z palety poleceń.
 * Działa dla zarejestrowanych akcji w menedżerze akcji. Nie działa dla akcji z grup.
 */
const ActionButton = <T,>({ actionManager, actionId, getContext, action, ...other }: ActionButtonProps<T>) => {
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

        resolvedAction.run(context);
    };

    return (
        <Tooltip title={
            resolvedAction.keybindings
                ? (
                    <span style={{ display: "inline", whiteSpace: "nowrap" }}>
                        <span>{resolvedAction.label}</span>
                        {renderKeybindings(resolvedAction.keybindings)}
                    </span>
                )
                : resolvedAction.label
        }>
            <span>
                <ToolButton
                    {...other}
                    className={`ActionButton-root ${other.className || ""}`}
                    onClick={handleClick}
                    disabled={resolvedAction.precondition ? !resolvedAction.precondition(getContext()) : false}
                    selected={typeof resolvedAction.selected === "function" ? resolvedAction.selected(getContext()) : resolvedAction.selected}
                >
                    {resolveIcon(theme, resolvedAction.icon)}
                </ToolButton>
            </span>
        </Tooltip>
    );
};

export default ActionButton;