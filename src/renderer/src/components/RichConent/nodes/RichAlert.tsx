import React from "react";
import { Alert, AlertTitle, Box, useTheme } from "@mui/material";
import { IRichAlert, IRichContainerDefaults, RichSeverity } from "../types";
import { resolveIcon } from "@renderer/themes/icons";
import RichRenderer from "..";

interface RichAlertProps {
    node: IRichAlert;
    defaults?: IRichContainerDefaults;
}

const RichAlert: React.FC<RichAlertProps> = ({ node, defaults }) => {
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
            slotProps={{
                root: {
                    style: {
                        borderRadius: defaults?.radius ?? 4,
                        padding: defaults?.padding ?? 4,
                        fontSize: defaults?.fontSize,
                        fontFamily: defaults?.fontFamily,
                        fontWeight: defaults?.fontWeight,
                        gap: defaults?.gap ?? 8,
                    }
                },
                icon: {
                    style: {
                        margin: 0,
                    }
                }
            }}
        >
            {node.title && <AlertTitle>{node.title}</AlertTitle>}
            {node.items.map((item, index) => (
                <RichRenderer key={index} node={item} defaults={defaults} />
            ))}
        </Alert>
    );
};

export default RichAlert;
