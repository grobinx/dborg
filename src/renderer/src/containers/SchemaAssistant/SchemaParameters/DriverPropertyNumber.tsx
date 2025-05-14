import { Box, TextField, TextFieldProps } from '@mui/material';
import React from 'react';
import { PropertyInfo } from 'src/api/db';
import { textFieldWidth } from './Utils';

interface DriverPropertyNumberProps {
    property: PropertyInfo,
    value: any,
    onChange: (field: PropertyInfo, value: string) => void,
    slotProps: {
        textField?: TextFieldProps,
    },
}

const DriverPropertyNumber: React.FC<DriverPropertyNumberProps> = (props) => {
    const { property, value, slotProps, onChange } = props;
    const { slotProps: textFieldSlotProps, ...textFieldOther } = slotProps?.textField ?? {};
    const { input: textFieldSlotPropsInput, ...textFieldSlotPropsOther } = textFieldSlotProps ?? {};

    return (
        <Box>
            <TextField
                helperText={property.description}
                id={property.name}
                label={property.title}
                required={property.required}
                value={value ?? ''}
                type="number"
                slotProps={{
                    input: {
                        sx: { minWidth: textFieldWidth(property.type, property.title) },
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

export default DriverPropertyNumber;
