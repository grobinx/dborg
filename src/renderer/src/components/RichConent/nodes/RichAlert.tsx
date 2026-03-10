import React from "react";
import { Alert, AlertTitle, Box, useTheme } from "@mui/material";
import { IRichAlert, RichSeverity } from "../types";
import { resolveIcon } from "@renderer/themes/icons";
import RichRenderer from "..";

interface RichAlertProps {
    node: IRichAlert;
}

const RichAlert: React.FC<RichAlertProps> = ({ node }) => {
    const theme = useTheme();
    const getSeverityForAlert = (severity?: RichSeverity): "error" | "warning" | "info" | "success" => {
        switch (severity) {
            case "error":
                return "error";
            case "warning":
                return "warning";
            case "success":
                return "success";
            default:
                return "info";
        }
    };

    const getIconFromSeverity = (severity?: RichSeverity) => {
        switch (severity) {
            case "error":
                return "error";
            case "warning":
                return "warning";
            case "success":
                return "checkCircle";
            default:
                return "info";
        }
    };

    return (
        <Alert
            severity={getSeverityForAlert(node.severity)}
            icon={node.showIcon !== false && (resolveIcon(theme, node.icon))}
        >
            {node.title && <AlertTitle>{node.title}</AlertTitle>}
            <Box sx={{ display: "flex", flexDirection: "column", gap: node.gap ?? 4 }}>
                <RichRenderer node={node.items} />
            </Box>
        </Alert>
    );
};

export default RichAlert;
