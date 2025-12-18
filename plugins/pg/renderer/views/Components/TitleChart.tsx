import React from "react";
import { Box, Typography, TypographyPropsVariantOverrides } from "@mui/material";
import { OverridableStringUnion } from "@mui/types";
import { Variant } from "@mui/material/styles/createTypography";

interface TitleChartProps {
    title?: React.ReactNode;
    children?: React.ReactNode;
    variant?: OverridableStringUnion<Variant | 'inherit', TypographyPropsVariantOverrides>;
}

const TitleChart: React.FC<TitleChartProps> = ({ title, children, variant = "body1" }) => {
    return (
        <Box sx={{ display: "flex", width: "100%", gap: 8, paddingX: 8 }}>
            {children}
            <Typography variant={variant} sx={{ flex: 1, textAlign: "center" }}>
                {title}
            </Typography>
        </Box>
    );
};

export default TitleChart;