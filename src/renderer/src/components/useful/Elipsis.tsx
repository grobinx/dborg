import React from 'react';
import { styled } from '@mui/material/styles';

interface EllipsisProps {
    flex?: boolean;
}

export const Ellipsis: React.FC<EllipsisProps & React.HTMLAttributes<HTMLSpanElement>> =
    styled('span')<EllipsisProps>(({ flex }) =>
    ({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
        ...(flex ? { flex: 1 } : {}),
    }));

// użycie:
// <Ellipsis>{someText}</Ellipsis>