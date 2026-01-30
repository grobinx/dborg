import React from 'react';
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

export const PercentageCell: React.FC<PercentageCellProps> = ({
    value,
    mode = 'percentage',
    thresholds,
    precision = 2,
    label,
}) => {
    const theme = useTheme();
    let displayText: string = '';
    let clampedValue: number = 0;
    let thresholdColor: string | undefined = undefined;

    if (value !== null) {
        // Default thresholds based on mode
        if (!thresholds || (Array.isArray(thresholds) && thresholds.length === 0)) {
            if (mode === 'threat-level') {
                thresholds = [
                    { start: 0, color: resolveColor("success", theme).main, label: 'low' },
                    { start: 30, color: resolveColor("primary", theme).main, label: 'medium' },
                    { start: 70, color: resolveColor("warning", theme).main, label: 'high' },
                    { start: 90, color: resolveColor("error", theme).main, label: 'critical' },
                ];
            } else if (mode === 'percentage') {
                thresholds = [
                    { start: 0, color: resolveColor("success", theme).main },
                    { start: 30, color: resolveColor("warning", theme).main },
                    { start: 50, color: resolveColor("error", theme).main },
                ];
            }
        }

        const numValue = new Decimal(value).toNumber();
        clampedValue = Math.min(Math.max(numValue, 0), 100);

        let thresholdLabel: string | undefined = undefined;

        if (Array.isArray(thresholds)) {
            const threshold = thresholds.reduce((prev, current) =>
                current.start <= clampedValue && current.start > (prev?.start ?? -1) ? current : prev,
                thresholds[0]
            );
            if (threshold) {
                thresholdColor = threshold.color;
                thresholdLabel = threshold.label;
            }
        } else {
            thresholdColor = resolveColor(mode as ThemeColor, theme).main;
        }
        displayText = `${label ?? ''} ${thresholdLabel ?? ''} ${numValue.toFixed(precision)} %`;
    } else {
        displayText = `${label ?? ''} -`;
    }

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
};