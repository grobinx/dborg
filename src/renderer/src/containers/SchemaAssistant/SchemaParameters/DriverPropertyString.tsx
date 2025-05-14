import { Box, TextField, TextFieldProps } from '@mui/material';
import React from 'react';
import { PropertyInfo } from 'src/api/db';
import { textFieldWidth } from './Utils';

interface DriverPropertyStringProps {
    property: PropertyInfo,
    value: any,
    onChange: (field: PropertyInfo, value: string) => void,
    slotProps: {
        textField?: TextFieldProps,
    },
}

const DriverPropertyString: React.FC<DriverPropertyStringProps> = (props) => {
    const { property, value, slotProps, onChange } = props;
    const { slotProps: textFieldSlotProps, ...textFieldOther } = slotProps?.textField ?? {};
    const { input: textFieldSlotPropsInput, ...textFieldSlotPropsOther } = textFieldSlotProps ?? {};

    return (
        <Box>
            <TextField
                id={property.name}
                helperText={property.description}
                label={property.title}
                required={property.required}
                value={value ?? ''}
                slotProps={{
                    input: {
                        sx: { minWidth: textFieldWidth(property.type, property.title) },
                        ...textFieldSlotPropsInput,
                    },
                    ...textFieldSlotPropsOther,
                }}
                onChange={(event) => {
                    onChange(property, event.target.value);
                }}
                {...textFieldOther}
            />
        </Box>
    );
};

export default DriverPropertyString;
