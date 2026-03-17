import React from "react";
import { Alert, useTheme } from "@mui/material";
import { IRichAlert, IRichEnvironment, RichNode, RichSeverity } from "../types";
import { resolveIcon } from "@renderer/themes/icons";
import RichRenderer, { getSeverityColor, resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import clsx from "@renderer/utils/clsx";
import { Optional } from "@renderer/types/universal";
import Tooltip from "@renderer/components/Tooltip";

interface RichAlertProps {
    node: Optional<IRichAlert, "type">;
    environment?: IRichEnvironment;
}

const RichAlert: React.FC<RichAlertProps> = ({ node, environment }) => {
    const theme = useTheme();
    const [message, setMessage] = React.useState<RichNode | null>(resolveRichValue(node.message));

    React.useEffect(() => {
        resolveRichValueFromFunction<RichNode>(node.message, setMessage);
    }, [node.message]);

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

    if (node.excluded) {
        return null;
    }

    const result = (
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
                        borderRadius: environment?.theme?.radius ?? 4,
                        padding: environment?.theme?.padding ?? 4,
                        fontSize: "inherit",
                        fontFamily: "inherit",
                        fontWeight: "inherit",
                        gap: environment?.theme?.gap ?? 4,
                        boxShadow: `0 2px 4px ${getSeverityColor(node.severity, theme)}55`,
                    }
                },
                message: {
                    style: {
                        padding: environment?.theme?.padding ?? 4,
                        fontSize: "inherit",
                        fontFamily: "inherit",
                        fontWeight: "inherit",
                        gap: environment?.theme?.gap ?? 4,
                    }
                },
                icon: {
                    style: {
                        margin: 0,
                    }
                }
            }}
        >
            {node.title && <RichRenderer node={node.title} environment={environment} textVariant="title" />}
            {message === null ?
                <RichIcon node={{ icon: "Loading" }} environment={environment} />
                : <RichRenderer node={message} environment={environment} />
            }
        </Alert>
    );

    if (node.tooltip) {
        return (
            <Tooltip title={<RichRenderer node={node.tooltip} environment={environment} />}>
                {result}
            </Tooltip>
        );
    }

    return result;

};

export default RichAlert;
