import React from "react";
import { styled } from "@mui/material/styles";
import Tooltip from "./Tooltip";

interface ToolLabelProps {
    label: string; // Tekst etykiety
    tooltip?: string; // Opcjonalny tekst tooltipa
    className?: string; // Opcjonalna klasa CSS
}

// Styled główny komponent
const StyledToolLabel = styled("span", {
    name: "ToolLabel",
    slot: "root",
})(() => ({
    display: "inline-flex",
    alignItems: "center",
    fontSize: "small",
}));

export const ToolLabel: React.FC<ToolLabelProps> = ({ label, tooltip, className }) => {
    return (
        <StyledToolLabel className={className}>
            {tooltip ? (
                <Tooltip title={tooltip} arrow>
                    <span>{label}</span>
                </Tooltip>
            ) : (
                <span>{label}</span>
            )}
        </StyledToolLabel>
    );
};