import React from "react";
import { Alert, AlertTitle, Box, useTheme } from "@mui/material";
import { IRichAlert, IRichContainerDefaults, RichSeverity } from "../types";
import { resolveIcon } from "@renderer/themes/icons";
import RichRenderer, { RichText } from "..";
import clsx from "@renderer/utils/clsx";

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

    return (
        <Alert
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-alert", node.className)}
            style={node.style}
            severity={getSeverityForAlert(node.severity)}
            icon={node.showIcon !== false && (resolveIcon(theme, node.icon))}
            slotProps={{
                root: {
                    style: {
                        borderRadius: defaults?.radius ?? 4,
                        padding: defaults?.padding ?? 4,
                        fontSize: "inherit",
                        fontFamily: "inherit",
                        fontWeight: "inherit",
                        gap: defaults?.gap ?? 4,
                    }
                },
                message: {
                    style: {
                        padding: defaults?.padding ?? 4,
                        fontSize: "inherit",
                        fontFamily: "inherit",
                        fontWeight: "inherit",
                        gap: defaults?.gap ?? 4,
                    }
                },
                icon: {
                    style: {
                        margin: 0,
                    }
                }
            }}
        >
            {node.title && (
                typeof node.title === "string" || typeof node.title === "number" ? (
                    <RichText node={{ text: node.title, variant: "title" }} />
                ) : (
                    <RichRenderer node={node.title} defaults={defaults} />
                )
            )}
            {node.items.map((item, index) => (
                <RichRenderer key={index} node={item} defaults={defaults} />
            ))}
        </Alert>
    );
};

export default RichAlert;
