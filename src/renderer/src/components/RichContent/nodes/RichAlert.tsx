import React from "react";
import { Alert, useTheme } from "@mui/material";
import { IRichAlert, IRichContainerDefaults, RichNode, RichSeverity } from "../types";
import { resolveIcon } from "@renderer/themes/icons";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import clsx from "@renderer/utils/clsx";
import { Optional } from "@renderer/types/universal";

interface RichAlertProps {
    node: Optional<IRichAlert, "type">;
    defaults?: IRichContainerDefaults;
}

const RichAlert: React.FC<RichAlertProps> = ({ node, defaults }) => {
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
            {node.title && <RichRenderer node={node.title} defaults={defaults} textVariant="title" />}
            {message === null ?
                <RichIcon node={{ icon: "Loading" }} defaults={defaults} />
                : <RichRenderer node={message} defaults={defaults} />
            }
        </Alert>
    );
};

export default RichAlert;
