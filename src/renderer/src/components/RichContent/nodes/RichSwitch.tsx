import React from "react";
import { Box, FormControlLabel, Switch, SwitchProps, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichSwitch } from "../types";
import RichRenderer, { getSeverityColor, RichText } from "..";

interface RichSwitchProps {
    node: IRichSwitch;
    defaults?: IRichContainerDefaults;
}

const RichSwitch: React.FC<RichSwitchProps> = ({ node, defaults }) => {
    const theme = useTheme();
    const [checked, setChecked] = React.useState(node.checked ?? false);

    React.useEffect(() => {
        setChecked(node.checked ?? false);
    }, [node.checked]);

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

    return (
        <Box
            className="RichNode-switch"
            sx={{
                display: "inline-flex",
                alignSelf: "flex-start",
            }}
        >
            {node.label ? (
                <FormControlLabel
                    control={control}
                    label={typeof node.label === "string" || typeof node.label === "number" ?
                        <RichText node={{ text: node.label, variant: "label" }} />
                        : <RichRenderer node={node.label} defaults={defaults} />
                    }
                    //color={getSeverityColor(node.severity, theme)}
                    sx={{
                        m: 0,
                        gap: defaults?.gap ?? 4,
                    }}
                />
            ) : (
                control
            )}
        </Box>
    );
};

export default RichSwitch;