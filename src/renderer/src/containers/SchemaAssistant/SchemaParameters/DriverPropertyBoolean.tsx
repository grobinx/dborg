import { Box, Checkbox, CheckboxProps, FormControl, FormControlLabel, FormHelperText } from '@mui/material';
import React from 'react';
import { PropertyInfo } from 'src/api/db';

interface DriverPropertyBooleanProps {
    property: PropertyInfo,
    value: any,
    onChange: (field: PropertyInfo, value: string) => void,
    slotProps: {
        checkBoxField?: CheckboxProps,
    },
}

const DriverPropertyBoolean: React.FC<DriverPropertyBooleanProps> = (props) => {
    const { property, value, slotProps, onChange } = props;

    return (
        <Box>
            <FormControl>
                <FormControlLabel
                    control={
                        <Checkbox size='small'
                            id={property.name}
                            required={property.required}
                            checked={value ?? false}
                            onChange={(event) => onChange(property, event.target.checked ? "true" : "false")}
                            {...slotProps?.checkBoxField}
                        />
                    }
                    label={property.title}
                />
                <FormHelperText>
                    {property.description}
                </FormHelperText>
            </FormControl>
        </Box>
    );
};

export default DriverPropertyBoolean;
