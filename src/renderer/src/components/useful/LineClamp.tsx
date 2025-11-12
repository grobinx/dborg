import React from 'react';
import { styled } from '@mui/material/styles';

interface LineClampProps {
    lines?: number;
}

export const LineClamp: React.FC<LineClampProps & React.HTMLAttributes<HTMLDivElement>> =
    styled('div')<LineClampProps>(({ lines = 2 }) =>
    ({
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minWidth: 0,
    }));

// użycie:
// <LineClamp lines={3}>{someLongText}</LineClamp>