import { Box, BoxProps, SxProps, useTheme } from "@mui/material";
import { RichSeverity } from "../types";
import { getSeverityColor } from "..";

interface SeverityBoxProps extends BoxProps {
    severity?: RichSeverity;
    children?: React.ReactNode;
}

const SeverityBox: React.FC<SeverityBoxProps> = ({ severity, children, sx, ...other }) => {
    const theme = useTheme();
    const severityColor = getSeverityColor(severity, theme);
    const isHighlighted = severity !== "default";

    return (
        <Box
            sx={{
                border: isHighlighted ? `1px solid ${severityColor}` : `1px solid ${theme.palette.divider}`,
                borderLeft: isHighlighted ? `4px solid ${severityColor}` : `4px solid ${theme.palette.divider}`,
                borderRadius: 1,
                backgroundColor: isHighlighted
                    ? theme.palette.mode === "dark"
                        ? `${severityColor}18`
                        : `${severityColor}12`
                    : undefined,
                ...sx,
            }}
            {...other}
        >
            {children}
        </Box>
    );
}

export default SeverityBox;