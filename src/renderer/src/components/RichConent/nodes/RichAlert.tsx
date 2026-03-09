import React from "react";
import { Alert, Box, useTheme } from "@mui/material";
import { IRichAlert, RichSeverity } from "../types";

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
            icon={node.showIcon !== false && (React.isValidElement(node.icon) ? node.icon : false)}
            sx={{ mb: 2 }}
        >
            {node.title && <Box sx={{ fontWeight: 600, mb: 1 }}>{node.title}</Box>}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {/* Items will be rendered by parent RichRenderer */}
                {node.items && node.items.length > 0 && "(Items to be rendered)"}
            </Box>
        </Alert>
    );
};

export default RichAlert;
