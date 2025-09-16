import { Box, Checkbox, CheckboxProps, FormControl, FormControlLabel, FormHelperText, Typography } from '@mui/material';
import { BooleanField } from '@renderer/components/inputs/BooleanField';
import React from 'react';
import { PropertyInfo } from 'src/api/db';

interface DriverPropertyBooleanProps {
    property: PropertyInfo,
    value: any,
    onChange: (field: PropertyInfo, value: string) => void,
}

const DriverPropertyBoolean: React.FC<DriverPropertyBooleanProps> = (props) => {
    const { property, value, onChange } = props;

    return (
        <Box className="item">
            <BooleanField
                label={property.title}
                id={property.name}
                required={property.required}
                value={value ?? false}
                onChange={(value) => onChange(property, value ? "true" : "false")}
            />
            <Typography variant="description">
                {property.description}
            </Typography>
        </Box>
    );
};

export default DriverPropertyBoolean;
