import { Box, FormHelperText, InputAdornment, InputLabel, TextField, TextFieldProps, useTheme } from '@mui/material';
import React from 'react';
import { PropertyInfo } from 'src/api/db';
import { textFieldWidth } from './Utils';
import { useTranslation } from 'react-i18next';
import ToolButton from '@renderer/components/ToolButton';
import Tooltip from '@renderer/components/Tooltip';

interface DriverPropertyFileProps {
    property: PropertyInfo,
    value: any,
    onChange: (field: PropertyInfo, value: string) => void,
}

const DriverPropertyFile: React.FC<DriverPropertyFileProps> = (props) => {
    const { property, value, onChange } = props;
    const theme = useTheme();
    const { t } = useTranslation();

    const handleClickInputFile = () => {
        window.electron.dialog.showOpenDialog({ properties: ['openFile'], defaultPath: value }).then((result) => {
            if (!result.canceled) {
                onChange(property, result.filePaths[0]);
            }
        });
    };

    return (
        <Box className="item">
            <InputLabel>{property.title}</InputLabel>
            <TextField
                id={property.name}
                required={property.required}
                value={value ?? ''}
                sx={{ minWidth: textFieldWidth(property.type, property.title) }}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment
                                position="end"
                                onClick={handleClickInputFile}
                                style={{ cursor: "pointer" }}
                            >
                                <Tooltip title={t("select-file-name", "Select file name")}>
                                    <ToolButton aria-label="open-file">
                                        <theme.icons.OpenFile />
                                    </ToolButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    },
                }}
                onChange={(event) => {
                    onChange(property, event.target.value);
                }}
            />
            {property.description && (<FormHelperText>{property.description}</FormHelperText>)}
        </Box>
    );
};

export default DriverPropertyFile;
