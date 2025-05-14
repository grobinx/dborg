import { Box, InputAdornment, TextField, TextFieldProps, Tooltip, useTheme } from '@mui/material';
import React from 'react';
import { PropertyInfo } from 'src/api/db';
import { textFieldWidth } from './Utils';
import { useTranslation } from 'react-i18next';
import ToolButton from '@renderer/components/ToolButton';

interface DriverPropertyFileProps {
    property: PropertyInfo,
    value: any,
    onChange: (field: PropertyInfo, value: string) => void,
    slotProps: {
        textField?: TextFieldProps,
    },
}

const DriverPropertyFile: React.FC<DriverPropertyFileProps> = (props) => {
    const { property, value, slotProps, onChange } = props;
    const { slotProps: textFieldSlotProps, ...textFieldOther } = slotProps?.textField ?? {};
    const { input: textFieldSlotPropsInput, ...textFieldSlotPropsOther } = textFieldSlotProps ?? {};
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
        <Box>
            <TextField
                helperText={property.description}
                id={property.name}
                label={property.title}
                required={property.required}
                value={value ?? ''}
                slotProps={{
                    input: {
                        sx: { minWidth: textFieldWidth(property.type, property.title) },
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
                        ...textFieldSlotPropsInput
                    },
                    ...textFieldSlotPropsOther
                }}
                onChange={(event) => {
                    onChange(property, event.target.value);
                }}
                {...textFieldOther}
            />
        </Box>
    );
};

export default DriverPropertyFile;
