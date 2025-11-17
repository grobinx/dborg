import React from 'react';
import { styled } from '@mui/material/styles';

interface EllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {
    blured?: boolean;
    flex?: boolean;
    children?: React.ReactNode;
}

const StyledEllipsis = styled('span')<EllipsisProps>(({ flex, blured }) => ({
    overflow: 'hidden',
    textOverflow: blured ? 'clip' : 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
    position: 'relative',
    ...(flex ? { flex: 1 } : {}),
    ...(blured
        ? {
            WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
            maskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
        }
        : {}),
}));

export const Ellipsis: React.FC<EllipsisProps> = ({ blured = true, flex, children, ...rest }) => (
    <StyledEllipsis flex={flex} blured={blured} {...rest}>
        {children}
    </StyledEllipsis>
);

// użycie:
// <Ellipsis blured>Twój tekst <b>i inne elementy</b></Ellipsis>