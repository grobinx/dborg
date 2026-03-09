import React from "react";
import { Button, Box, Tooltip, useTheme, CircularProgress } from "@mui/material";
import { IRichAction } from "../types";
import RichBadge from "./RichBadge";

interface RichActionProps {
    node: IRichAction;
}

const RichAction: React.FC<RichActionProps> = ({ node }) => {
    const theme = useTheme();
    const [isLoading, setIsLoading] = React.useState(false);

    const emptyContext = {} as any;

    const handleClick = async () => {
        setIsLoading(true);
        try {
            await node.run(emptyContext);
        } finally {
            setIsLoading(false);
        }
    };

    const isDisabled = typeof node.disabled === "function" ? node.disabled(emptyContext) : node.disabled;
    const isSelected = typeof node.selected === "function" ? node.selected(emptyContext) : node.selected;
    const isLoading_ = typeof node.loading === "function" ? node.loading(emptyContext) : node.loading;
    const label = typeof node.label === "function" ? node.label(emptyContext) : node.label;
    const description = typeof node.description === "function" ? node.description(emptyContext) : node.description;
    const tooltip = typeof node.tooltip === "function" ? node.tooltip(emptyContext) : node.tooltip;
    const icon = typeof node.icon === "function" ? node.icon(emptyContext) : node.icon;

    const variant = (node.keySequence?.length ? "outlined" : "contained") as any;

    const buttonContent = (
        <Button
            onClick={handleClick}
            disabled={isDisabled || isLoading_ || isLoading}
            variant={variant}
            size="medium"
            startIcon={
                isLoading_ || isLoading ? (
                    <CircularProgress size={20} />
                ) : React.isValidElement(icon) ? (
                    icon
                ) : null
            }
            sx={{
                position: "relative",
                backgroundColor: isSelected ? theme.palette.action.selected : undefined,
                ...(node.keySequence && {
                    fontSize: "11px",
                    padding: "4px 8px",
                    minHeight: "unauto",
                }),
            }}
        >
            {label}
        </Button>
    );

    const content = (
        <Box sx={{ display: "inline-block", position: "relative" }}>
            {tooltip ? <Tooltip title={tooltip}>{buttonContent}</Tooltip> : buttonContent}
            {node.badge && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                    }}
                >
                    <RichBadge badge={node.badge} />
                </Box>
            )}
        </Box>
    );

    return content;
};

export default RichAction;
