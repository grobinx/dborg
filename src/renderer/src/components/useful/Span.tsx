import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { ThemeColor } from "@renderer/types/colors";
import { resolveColor } from "@renderer/utils/colors";

interface SpanProps extends React.ComponentProps<"span"> {
    color?: ThemeColor;
}

const StyledSpan = styled("span")<{ $color?: string }>(({ $color }) => ({
    color: $color || "inherit",
}));

const Span = ({ color, ...props }: SpanProps) => {
    const theme = useTheme();

    return <StyledSpan $color={resolveColor(color, theme)?.main} {...props} />;
};

Span.displayName = "Span";

export default Span;