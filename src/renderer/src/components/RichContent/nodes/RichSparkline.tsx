import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichSparkline } from "../types";
import { resolveRichValue, resolveRichValueFromFunction } from "..";
import { Optional } from "@renderer/types/universal";

interface Props {
    node: Optional<IRichSparkline, "type">;
    defaults?: IRichContainerDefaults;
}

const getStrokeColor = (severity: IRichSparkline["severity"], theme: any) => {
    switch (severity) {
        case "info": return theme.palette.info.main;
        case "warning": return theme.palette.warning.main;
        case "error": return theme.palette.error.main;
        case "success": return theme.palette.success.main;
        default: return theme.palette.primary.main;
    }
};

const buildSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1];
        const p1 = pts[i];
        const cx = (p0.x + p1.x) / 2;
        d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
};

const RichSparkline: React.FC<Props> = ({ node }) => {
    const theme = useTheme();
    const [values, setValues] = React.useState<number[] | null>(resolveRichValue(node.values));
    const lineRef = React.useRef<SVGPathElement | null>(null);
    const [pathLength, setPathLength] = React.useState<number | undefined>(undefined);

    React.useEffect(() => {
        resolveRichValueFromFunction(node.values, setValues);
    }, [node.values]);

    if (!values || values.length < 2) return null;

    const width = 100;
    const height = 28;
    const strokeWidth = node.strokeWidth ?? 2;
    const min = node.min ?? Math.min(...values);
    const max = node.max ?? Math.max(...values);
    const span = Math.max(1e-9, max - min);
    const stroke = getStrokeColor(node.severity, theme);

    const pts = values.map((v, i) => {
        const clamped = Math.min(max, Math.max(min, v));
        const x = (i / (values.length - 1)) * width;
        const y = height - ((clamped - min) / span) * height;
        return { x, y };
    });

    const linePath = node.curve === "smooth"
        ? buildSmoothPath(pts)
        : `M ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")}`;

    const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;
    const gradId = React.useId();

    React.useEffect(() => {
        if (!node.animated) {
            setPathLength(undefined);
            return;
        }

        const path = lineRef.current;
        if (!path) return;
        setPathLength(path.getTotalLength());
    }, [linePath, node.animated]);

    return (
        <Box sx={{ width: node.width ?? "100%", height: node.height ?? 28, display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
            <svg viewBox={`-2 -2 ${width + 4} ${height + 4}`} width="100%" height="100%" preserveAspectRatio="none">
                {node.fill === "gradient" && (
                    <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
                            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                )}

                {node.fill === "gradient" && <path d={areaPath} fill={`url(#${gradId})`} />}

                <path
                    ref={lineRef}
                    d={linePath}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={node.animated ? {
                        transition: "stroke 220ms ease",
                    } : undefined}
                    strokeDasharray={node.animated ? pathLength : undefined}
                    strokeDashoffset={node.animated ? pathLength : undefined}
                >
                    {node.animated && pathLength !== undefined && (
                        <animate
                            key={linePath}
                            attributeName="stroke-dashoffset"
                            from={pathLength}
                            to="0"
                            dur="420ms"
                            fill="freeze"
                            begin="0s"
                        />
                    )}
                </path>

                {node.showDots && pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={Math.max(1.5, strokeWidth)} fill={stroke} />
                ))}
            </svg>
        </Box>
    );
};

export default RichSparkline;
