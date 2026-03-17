import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichContainerTheme, IRichEnvironment, IRichTime } from "../types";
import clsx from "@renderer/utils/clsx";
import { Optional } from "@renderer/types/universal";
import Tooltip from "@renderer/components/Tooltip";
import RichRenderer from "..";

interface RichTimeProps {
    node: Optional<IRichTime, "type">;
    environment?: IRichEnvironment;
}

type RelativeUnit = Intl.RelativeTimeFormatUnit;

const RELATIVE_UNITS: Array<{ unit: RelativeUnit; ms: number }> = [
    { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
    { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
    { unit: "week", ms: 1000 * 60 * 60 * 24 * 7 },
    { unit: "day", ms: 1000 * 60 * 60 * 24 },
    { unit: "hour", ms: 1000 * 60 * 60 },
    { unit: "minute", ms: 1000 * 60 },
    { unit: "second", ms: 1000 },
];

const TIME_ONLY_RE = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

const toDate = (value: string | number): Date | null => {
    if (typeof value === "number") {
        const d = new Date(value < 1e12 ? value * 1000 : value);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    const text = value.trim();

    // Obsługa wartości typu "HH:mm", "HH:mm:ss", "HH:mm:ss.SSS"
    const match = text.match(TIME_ONLY_RE);
    if (match) {
        const hours = Number(match[1]);
        const minutes = Number(match[2]);
        const seconds = Number(match[3] ?? 0);
        const millis = Number((match[4] ?? "0").padEnd(3, "0"));

        if (
            hours < 0 || hours > 23 ||
            minutes < 0 || minutes > 59 ||
            seconds < 0 || seconds > 59 ||
            millis < 0 || millis > 999
        ) {
            return null;
        }

        const now = new Date();
        now.setHours(hours, minutes, seconds, millis);
        return now;
    }

    // Standardowe parsowanie ISO / pełnej daty
    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : d;
};

const formatRelative = (date: Date, style: Intl.RelativeTimeFormatStyle = "short"): string => {
    const now = Date.now();
    const diffMs = date.getTime() - now;

    const rtf = new Intl.RelativeTimeFormat(undefined, {
        numeric: "auto",
        style,
    });

    for (const { unit, ms } of RELATIVE_UNITS) {
        if (Math.abs(diffMs) >= ms || unit === "second") {
            const value = Math.round(diffMs / ms);
            return rtf.format(value, unit);
        }
    }

    return "";
};

const formatAbsolute = (date: Date): string =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);

const formatFull = (date: Date): string =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "full",
        timeStyle: "medium",
    }).format(date);

const RichTime: React.FC<RichTimeProps> = ({ node, environment }) => {
    const theme = useTheme();
    const date = React.useMemo(() => toDate(node.value), [node.value]);

    const displayValue = React.useMemo(() => {
        if (!date) {
            return String(node.value);
        }

        switch (node.format ?? "absolute") {
            case "relative":
                return formatRelative(date, "short");
            case "full":
                return formatFull(date);
            case "absolute":
            default:
                return formatAbsolute(date);
        }
    }, [date, node.format, node.value]);

    if (node.excluded) {
        return null;
    }

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-time", node.className)}
            style={node.style}
            component="time"
            dateTime={date?.toISOString()}
            sx={{
                display: "inline",
                color: theme.palette.text.secondary,
                fontFamily: environment?.theme?.fontFamilyMonospace ?? theme.typography.fontFamily,
                fontSize: "0.89em",
                lineHeight: 1.35,
            }}
        >
            {displayValue}
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

export default RichTime;