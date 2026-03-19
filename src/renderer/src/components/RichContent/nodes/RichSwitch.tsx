import React from "react";
import { Box, FormControlLabel, Switch, SwitchProps, useTheme } from "@mui/material";
import { IRichEnvironment, IRichSwitch } from "../types";
import RichRenderer, { RichProp } from "..";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";

interface RichSwitchProps extends RichProp {
    node: IRichSwitch;
    environment?: IRichEnvironment;
}

const RichSwitch: React.FC<RichSwitchProps> = ({ node, environment }) => {
    const theme = useTheme();
    const [checked, setChecked] = React.useState(node.checked ?? false);

    React.useEffect(() => {
        setChecked(node.checked ?? false);
    }, [node.checked]);

    if (node.excluded) {
        return null;
    }

    const color: SwitchProps["color"] = node.severity !== "default" ? node.severity : "primary";

    const control = (
        <Switch
            size="small"
            checked={checked}
            disabled={node.disabled}
            color={color}
            onChange={(_, checked) => {
                setChecked(checked);
                node.onChange?.(checked);
            }}
        />
    );

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-switch", node.className)}
            style={node.style}
            sx={{
                display: "inline-flex",
                alignSelf: "flex-start",
            }}
        >
            {node.label ? (
                <FormControlLabel
                    control={control}
                    label={<RichRenderer node={node.label} environment={environment} textVariant="label" />}
                    //color={getSeverityColor(node.severity, theme)}
                    sx={{
                        m: 0,
                        gap: environment?.theme?.gap ?? 4,
                    }}
                />
            ) : (
                control
            )}
        </Box>
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

export default RichSwitch;