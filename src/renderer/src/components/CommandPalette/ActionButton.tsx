import { Tooltip, useTheme } from "@mui/material";
import ToolButton, { ToolButtonProps } from "../ToolButton"; // Zakładam, że ToolButton jest w katalogu nadrzędnym
import { ActionDescriptor, ActionManager } from "./ActionManager";
import { resolveIcon } from "@renderer/themes/icons";
import { renderKeybindings } from "./CommandPalette";

interface ActionButtonProps<T> extends ToolButtonProps {
    actionManager: ActionManager<T>; // Menedżer akcji
    actionId: string; // Identyfikator akcji
    getContext: () => T; // Funkcja zwracająca kontekst
}

/**
 * Komponent do wyświetlania przycisku akcji z palety poleceń.
 * Działa dla zarejestrowanych akcji w menedżerze akcji. Nie działa dla akcji z grup.
 */
const ActionButton = <T,>({ actionManager, actionId, getContext, ...other }: ActionButtonProps<T>) => {
    const theme = useTheme();
    const action = actionManager.getAction(actionId);

    if (!action) {
        return null;
    }

    const handleClick = () => {
        const context = getContext(); // Pobierz kontekst za pomocą funkcji
        if (action.precondition && !action.precondition(context)) {
            // console.warn(`Action "${action.id}" cannot be executed due to unmet precondition.`);
            return;
        }

        action.run(context);
    };

    return (
        <Tooltip title={
            action.keybindings
                ? (
                    <span style={{ display: "inline", whiteSpace: "nowrap" }}>
                        <span>{action.label}</span>{renderKeybindings(action.keybindings)}
                    </span>
                )
                : action.label
        }>
            <span>
                <ToolButton
                    {...other}
                    className={`ActionButton-root ${other.className || ""}`}
                    onClick={handleClick}
                    disabled={action.precondition ? !action.precondition(getContext()) : false}
                    selected={typeof action.selected === "function" ? action.selected(getContext()) : action.selected}
                >
                    {resolveIcon(theme, action.icon)}
                </ToolButton>
            </span>
        </Tooltip>
    );
};

export default ActionButton;