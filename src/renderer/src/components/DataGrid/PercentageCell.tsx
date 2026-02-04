import React, { useMemo } from 'react';
import Decimal from 'decimal.js';
import { resolveColor } from '@renderer/utils/colors';
import { useTheme } from '@mui/material';
import { ThemeColor } from '@renderer/types/colors';

type StatusMode = 'percentage' | 'threat-level';

interface StatusThreshold {
    start: number;
    color: string;
    label?: string;
}

interface PercentageCellProps {
    value: number | string | null;
    mode?: StatusMode | ThemeColor;
    thresholds?: StatusThreshold[];
    precision?: number;
    label?: string;
}

const DEFAULT_PERCENTAGE_THRESHOLDS = (theme: any): StatusThreshold[] => [
    { start: 0, color: resolveColor("success", theme).main },
    { start: 30, color: resolveColor("warning", theme).main },
    { start: 50, color: resolveColor("error", theme).main },
];

const DEFAULT_THREAT_LEVEL_THRESHOLDS = (theme: any): StatusThreshold[] => [
    { start: 0, color: resolveColor("success", theme).main, label: 'low' },
    { start: 30, color: resolveColor("primary", theme).main, label: 'medium' },
    { start: 70, color: resolveColor("warning", theme).main, label: 'high' },
    { start: 90, color: resolveColor("error", theme).main, label: 'critical' },
];

export const PercentageCell: React.FC<PercentageCellProps> = React.memo(({
    value,
    mode = 'percentage',
    thresholds,
    precision = 2,
    label,
}) => {
    const theme = useTheme();

    const { displayText, clampedValue, thresholdColor } = useMemo(() => {
        if (value === null) {
            return { displayText: `${label ?? ''} -`, clampedValue: 0, thresholdColor: undefined };
        }

        const numValue = new Decimal(value).toNumber();
        const clamped = Math.min(Math.max(numValue, 0), 100);

        // Determine thresholds
        const activeThresholds = thresholds && thresholds.length > 0
            ? thresholds
            : mode === 'threat-level'
                ? DEFAULT_THREAT_LEVEL_THRESHOLDS(theme)
                : DEFAULT_PERCENTAGE_THRESHOLDS(theme);

        // Find matching threshold
        const threshold = activeThresholds.reduce((prev, current) =>
            current.start <= clamped && current.start > (prev?.start ?? -1) ? current : prev,
            activeThresholds[0]
        );

        const text = `${label ?? ''} ${threshold?.label ?? ''} ${numValue.toFixed(precision)} %`.trim();
        return {
            displayText: text,
            clampedValue: clamped,
            thresholdColor: threshold?.color,
        };
    }, [value, mode, thresholds, precision, label, theme]);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
        }}>
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${clampedValue}%`,
                backgroundColor: thresholdColor,
                opacity: 0.2,
                borderRadius: 2,
            }} />
            <span style={{
                position: 'relative',
                marginLeft: 'auto',
                paddingRight: 2,
            }}>
                {displayText}
            </span>
        </div>
    );
});

PercentageCell.displayName = 'PercentageCell';