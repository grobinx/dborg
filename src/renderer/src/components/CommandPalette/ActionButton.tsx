import { Tooltip, useTheme } from "@mui/material";
import ToolButton, { ToolButtonProps } from "../ToolButton"; // Zakładam, że ToolButton jest w katalogu nadrzędnym
import { ActionManager } from "./ActionManager";
import { resolveIcon } from "@renderer/themes/icons";
import { renderKeybindings } from "./CommandPalette";

interface ActionButtonProps<T> extends ToolButtonProps {
    actionManager: ActionManager<T>; // Menedżer akcji
    actionId: string; // Identyfikator akcji
    getContext: () => T; // Funkcja zwracająca kontekst
}

import React, { useEffect, useState } from "react";

const ActionButton = <T,>({ actionManager, actionId, getContext, ...other }: ActionButtonProps<T>) => {
    const theme = useTheme();
    const [action, setAction] = useState<ReturnType<ActionManager<T>["getRegisteredActions"]> extends Promise<(infer U)[]> ? U | undefined : undefined>(undefined);

    useEffect(() => {
        let isMounted = true;
        actionManager.getRegisteredActions().then(actions => {
            if (isMounted) {
                setAction(actions.find((a) => a.id === actionId));
            }
        });
        return () => { isMounted = false; };
    }, [actionManager, actionId]);

    if (!action) {
        // Optionally, you can render a loading indicator here
        return null; // Nie renderuj przycisku, jeśli akcja nie istnieje
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