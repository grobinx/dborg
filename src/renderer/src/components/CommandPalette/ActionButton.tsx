import { Tooltip } from "@mui/material";
import ToolButton, { ToolButtonProps } from "../ToolButton"; // Zakładam, że ToolButton jest w katalogu nadrzędnym
import { ActionManager } from "./ActionManager";

interface ActionButtonProps<T> extends ToolButtonProps {
    actionManager: ActionManager<T>; // Menedżer akcji
    actionId: string; // Identyfikator akcji
    getContext: () => T; // Funkcja zwracająca kontekst
}

const ActionButton = <T,>({ actionManager, actionId, getContext, ...other }: ActionButtonProps<T>) => {
    const action = actionManager.getRegisteredActions(null).find((a) => a.id === actionId);

    if (!action) {
        console.error(`Action with id "${actionId}" not found.`);
        return null; // Nie renderuj przycisku, jeśli akcja nie istnieje
    }

    const handleClick = () => {
        const context = getContext(); // Pobierz kontekst za pomocą funkcji
        if (action.precondition && !action.precondition(context)) {
            console.warn(`Action "${action.id}" cannot be executed due to unmet precondition.`);
            return;
        }

        action.run(context);
    };

    return (
        <Tooltip title={action.label}>
            <span>
                <ToolButton
                    {...other}
                    className={`ActionButton-root ${other.className || ""}`}
                    onClick={handleClick}
                    disabled={action.precondition ? !action.precondition(getContext()) : false}
                    selected={typeof action.selected === "function" ? action.selected(getContext()) : action.selected}
                >
                    {action.icon}
                </ToolButton>
            </span>
        </Tooltip>
    );
};

export default ActionButton;