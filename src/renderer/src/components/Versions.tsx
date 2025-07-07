import * as React from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import * as consts from '../../../api/consts';

// const Item = styled(Paper)(({ theme }) => ({
//     backgroundColor: '#fff',
//     ...theme.typography.body2,
//     padding: theme.spacing(2),
//     textAlign: 'center',
//     color: theme.palette.text.secondary,
//     ...theme.applyStyles('dark', {
//         backgroundColor: '#1A2027',
//     }),
// }));

function Item({ children } : {children : React.ReactNode}): React.ReactNode {
    return (
        <Paper variant='elevation' sx={{ px: 6, py: 2 }} >
            {children}
        </Paper>
    )
}

function Versions(): React.ReactNode {
    const [versions] = React.useState(window.electron.versions)

    return (
        <Stack 
            direction="row" 
            spacing={6} 
            //divider={<Divider orientation="vertical" flexItem />}
            justifyContent="center"
        >
            <Item>ORBADA v{consts.version.toString()}</Item>
            <Item>Electron v{versions.electron}</Item>
            <Item>Chromium v{versions.chrome}</Item>
            <Item>Node v{versions.node}</Item>
        </Stack>
    )
}

export default Versions
