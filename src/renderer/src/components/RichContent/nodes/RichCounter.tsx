import React from "react";
import { useTheme } from "@mui/material";
import { IRichCounter, IRichEnvironment } from "../types";
import { Optional } from "@renderer/types/universal";
import Tooltip from "@renderer/components/Tooltip";
import { resolveRichValue, resolveRichValueFromFunction, RichProp, RichText } from "..";

interface RichCounterProps extends RichProp {
    node: Optional<IRichCounter, "type">;
    environment?: IRichEnvironment;
}

const formatNumber = (v: number) => {
    if (!Number.isFinite(v)) return String(v);
    // prosty format z grupowaniem tysięcy
    return v.toLocaleString(undefined);
};

const RichCounter: React.FC<RichCounterProps> = ({ node, environment: _, refreshId }) => {
    const theme = useTheme();
    const duration = node.duration ?? 1000;

    const [target, setTarget] = React.useState<number | null>(resolveRichValue(node.value));
    const [display, setDisplay] = React.useState<number>(target ?? 0);
    const rafRef = React.useRef<number | null>(null);
    const startRef = React.useRef<number | null>(null);
    const fromRef = React.useRef<number>(display);

    // support async value functions (if someone passed RichValue)
    React.useEffect(() => {
        resolveRichValueFromFunction<number>(node.value, setTarget, node);
    }, [node.value, refreshId]);

    React.useEffect(() => {
        if (target === null) {
            // show fallback as 0 (or keep current)
            fromRef.current = display;
            // animate to 0 optionally
            const to = 0;
            const start = performance.now();
            startRef.current = start;
            const step = (t: number) => {
                const elapsed = t - (startRef.current ?? start);
                const p = Math.min(1, duration > 0 ? elapsed / duration : 1);
                // easeOutQuad
                const eased = 1 - (1 - p) * (1 - p);
                const val = fromRef.current + (to - fromRef.current) * eased;
                setDisplay(val);
                if (p < 1) {
                    rafRef.current = requestAnimationFrame(step);
                } else {
                    fromRef.current = to;
                    rafRef.current = null;
                }
            };
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(step);
            return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
        }

        const to = target;
        fromRef.current = display;
        const start = performance.now();
        startRef.current = start;

        const step = (t: number) => {
            const elapsed = t - (startRef.current ?? start);
            const p = Math.min(1, duration > 0 ? elapsed / duration : 1);
            const eased = 1 - (1 - p) * (1 - p);
            const val = fromRef.current + (to - fromRef.current) * eased;
            setDisplay(val);
            if (p < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                fromRef.current = to;
                rafRef.current = null;
            }
        };

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(step);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, duration]);

    React.useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    if (node.excluded) return null;

    const content = (
        <span>{formatNumber(Math.round(display))}</span>
    );

    if (node.tooltip) {
        return <Tooltip title={node.tooltip as any}>{content}</Tooltip>;
    }

    return content;
};

export default RichCounter;