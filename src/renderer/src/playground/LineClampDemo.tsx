import React from 'react';
import { Box, Slider, Stack, Typography, useTheme, Paper } from '@mui/material';
import { LineClamp } from '../components/useful/LineClamp';
import Tooltip from '../components/Tooltip';

export const LineClampDemo: React.FC = () => {
    const theme = useTheme();
    const [width, setWidth] = React.useState(320);

    const sample =
        'To jest przykładowy bardzo długi tekst, który służy do prezentacji działania LineClamp. ' +
        'Zmieniaj szerokość poniżej, aby zobaczyć jak tekst jest ucinany po określonej liczbie linii. ' +
        'Możesz też przewinąć, aby porównać efekty dla 1, 2 i 3 linii.';

    return (
        <Stack spacing={2} sx={{ p: 2 }}>
            <Typography variant="h6">LineClamp – wizualizacja</Typography>

            <Box>
                <Typography variant="body2" gutterBottom>
                    Szerokość kontenera: {width}px
                </Typography>
                <Slider
                    min={180}
                    max={720}
                    step={10}
                    value={width}
                    onChange={(_, v) => setWidth(v as number)}
                    sx={{ maxWidth: 400 }}
                />
            </Box>

            <Stack direction="row" spacing={4} useFlexGap flexWrap="wrap">
                {[1, 2, 3, 4].map((lines) => (
                    <Paper
                        key={lines}
                        elevation={0}
                        sx={{
                            p: 2,
                            width,
                            border: `1px dashed ${theme.palette.divider}`,
                            background:
                                theme.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.02)'
                                    : 'rgba(0,0,0,0.02)',
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            lines = {lines}
                        </Typography>
                        <Box
                            sx={{
                                // tło pomaga zobaczyć, gdzie kończy się tekst
                                background:
                                    theme.palette.mode === 'dark'
                                        ? 'rgba(0,150,136,0.08)'
                                        : 'rgba(0,150,136,0.12)',
                                p: 1,
                                borderRadius: 1,
                                minWidth: 0,
                            }}
                        >
                            <Tooltip title={sample}>
                                <LineClamp lines={lines}>
                                    {sample}
                                </LineClamp>
                            </Tooltip>
                        </Box>
                    </Paper>
                ))}
            </Stack>
        </Stack>
    );
};

export default LineClampDemo;