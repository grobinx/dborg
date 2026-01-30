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
}

export const PercentageCell: React.FC<PercentageCellProps> = ({ 
    value,
    mode = 'percentage',
    thresholds,
    precision = 2,
}) => {
    const theme = useTheme();

    if (value === null) return null;

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
    const clampedValue = Math.min(Math.max(numValue, 0), 100);
    
    let color: string | undefined = undefined;
    let label: string | undefined = undefined;
    
    if (Array.isArray(thresholds)) {
        const threshold = thresholds.reduce((prev, current) => 
            current.start <= clampedValue && current.start > (prev?.start ?? -1) ? current : prev, 
            thresholds[0]
        );
        if (threshold) {
            color = threshold.color;
            label = threshold.label;
        }
    } else {
        color = resolveColor(mode as ThemeColor, theme).main;
    }
    
    const displayText = mode === 'percentage' 
        ? `${numValue.toFixed(precision)} %`
        : label || numValue.toFixed(precision);
    
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
                backgroundColor: color,
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