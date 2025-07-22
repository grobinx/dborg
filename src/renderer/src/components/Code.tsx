import { styled, useThemeProps } from '@mui/material';
import React from 'react';

const StyledCode = styled('code', {
    name: "Code",
    slot: "root",
})({
});

export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
}

// Regular component wrapping the styled <code>
const Code: React.FC<CodeProps> = (props) => {
    const { children, ...other } = useThemeProps({ name: 'Code', props });

    return <StyledCode {...other}>{children}</StyledCode>;
};

export default Code;