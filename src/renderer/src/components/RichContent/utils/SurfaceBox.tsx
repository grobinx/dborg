import React from "react";
import { Box, BoxProps, useTheme, Paper } from "@mui/material";
import { RichSeverity } from "../types";
import { getSeverityColor } from "..";

export type SurfaceBoxVariantType = "none" | "callout" | "outlined" | "paper" | "flat" | "ghost";
export type SurfaceBoxAnimationType = "none" | "gradient" | "border-wave" | "pulse" | "glow-rotate" | "neon-scan";

interface SurfaceBoxProps extends BoxProps {
    variant?: SurfaceBoxVariantType;
    severity?: RichSeverity;
    animated?: SurfaceBoxAnimationType;
    children?: React.ReactNode;
}

const SurfaceBox: React.FC<SurfaceBoxProps> = ({
    variant = "none",
    severity = "default",
    animated = "none",
    children,
    sx,
    ...other
}) => {
    const theme = useTheme();
    const severityColor = getSeverityColor(severity, theme);
    const isHighlighted = severity !== "default";

    const baseVariants: Record<SurfaceBoxVariantType, React.CSSProperties> = {
        none: {},
        callout: {
            border: isHighlighted ? `1px solid ${severityColor}` : `1px solid ${theme.palette.divider}`,
            borderLeft: isHighlighted ? `4px solid ${severityColor}` : `4px solid ${theme.palette.divider}`,
            borderRadius: 1,
            backgroundColor: isHighlighted
                ? theme.palette.mode === "dark"
                    ? `${severityColor}18`
                    : `${severityColor}12`
                : undefined,
            boxShadow: isHighlighted ? `0 1px 4px ${severityColor}33` : undefined,
        },
        outlined: {
            border: `1px solid ${isHighlighted ? severityColor : theme.palette.divider}`,
            borderRadius: 1,
            backgroundColor: "transparent",
        },
        paper: {
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            backgroundColor: isHighlighted
                ? theme.palette.mode === "dark"
                    ? `${severityColor}18`
                    : `${severityColor}12`
                : (theme.palette.background?.paper ?? theme.palette.background.default),
            boxShadow: theme.shadows[2],
        },
        flat: {
            border: "none",
            backgroundColor: isHighlighted
                ? theme.palette.mode === "dark"
                    ? `${severityColor}18`
                    : `${severityColor}12`
                : "transparent",
        },
        ghost: {
            border: "none",
            borderRadius: 1,
            backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        },
    };

    const makeAnimations = (color: string): Record<SurfaceBoxAnimationType, any> => ({
        none: {},
        gradient: {
            background: `linear-gradient(90deg, ${color}30 0%, transparent 80%, ${color}20 100%)`,
            backgroundSize: '200% 100%',
            animation: 'surface-gradient 20s linear infinite',
            '@keyframes surface-gradient': {
                '0%': { backgroundPosition: '0% 50%', backgroundSize: '200% 100%', },
                '50%': { backgroundPosition: '100% 50%', backgroundSize: '200% 200%', },
                '100%': { backgroundPosition: '0% 50%', backgroundSize: '200% 100%', },
            },
        },
        'border-wave': {
            position: 'relative',
            animation: 'surface-border-wave 5.5s ease-in-out infinite',
            '@keyframes surface-border-wave': {
                '0%': { boxShadow: `0 0 0 0 ${color}40` },
                '60%': { boxShadow: `0 0 18px 4px ${color}30` },
                '100%': { boxShadow: `0 0 0 0 ${color}10` },
            },
        },
        pulse: {
            animation: 'surface-pulse 2.8s cubic-bezier(.4,0,.2,1) infinite',
            '@keyframes surface-pulse': {
                '0%': { transform: 'scale(1)', boxShadow: `0 0 0 0 ${color}22` },
                '50%': { transform: 'scale(1.02)', boxShadow: `0 8px 20px ${color}22` },
                '100%': { transform: 'scale(1)', boxShadow: `0 0 0 0 ${color}10` },
            },
            transformOrigin: 'center',
        },
        'glow-rotate': {
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: `conic-gradient(from 0deg, ${color}40 0deg, transparent 25%, ${color}30 60%, transparent 100%)`,
                filter: 'blur(24px)',
                transformOrigin: '50% 50%',
                animation: 'surface-glow-rotate 6s linear infinite',
                pointerEvents: 'none',
                willChange: 'transform',
                zIndex: 0,
            },
            '& > *': { position: 'relative', zIndex: 1 },
            '@keyframes surface-glow-rotate': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
            },
        },
        'neon-scan': {
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-40%',
                width: '40%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${color}55, transparent)`,
                transform: 'skewX(-18deg)',
                filter: 'blur(10px)',
                animation: 'surface-neon-scan 5s linear infinite',
                pointerEvents: 'none',
                zIndex: 0,
            },
            '& > *': { position: 'relative', zIndex: 1 },
            '@keyframes surface-neon-scan': {
                '0%': { left: '-40%' },
                '100%': { left: '140%' },
            },
        },
    });

    const variantSx = baseVariants[variant];
    const animSx = makeAnimations(severityColor)[animated];
    const Component: any = variant === "paper" ? Paper : Box;

    return (
        <Component
            sx={{
                ...variantSx,
                ...animSx,
                ...sx,
            }}
            {...other}
        >
            {children}
        </Component>
    );
};

export default SurfaceBox;