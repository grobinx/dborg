import React from 'react';
import { styled } from '@mui/material/styles';

interface EllipsisProps {
    flex?: boolean;
}

export const ellipsisStyles = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
}

/**
 * A component that truncates text with an ellipsis when it overflows its container.
 */
export const Ellipsis: React.FC<EllipsisProps & React.HTMLAttributes<HTMLSpanElement>> =
    styled('span')<EllipsisProps>(({ flex }) =>
    ({
        ...ellipsisStyles,
        ...(flex ? { flex: 1 } : {}),
    }));

// użycie:
// <Ellipsis>{someText}</Ellipsis>