import { Box, FormHelperText, InputLabel, TextField, TextFieldProps, Typography } from '@mui/material';
import React from 'react';
import { PropertyInfo } from 'src/api/db';
import { textFieldWidth } from './Utils';

interface DriverPropertyStringProps {
    property: PropertyInfo,
    value: any,
    onChange: (field: PropertyInfo, value: string) => void,
}

const DriverPropertyString: React.FC<DriverPropertyStringProps> = (props) => {
    const { property, value, onChange } = props;

    return (
        <Box className="item">
            <InputLabel>{property.title}</InputLabel>
            <TextField
                id={property.name}
                required={property.required}
                value={value ?? ''}
                sx={{ width: textFieldWidth(property.type, property.title) }}
                onChange={(event) => {
                    onChange(property, event.target.value);
                }}
            />
            {property.description && (<Typography variant="description">{property.description}</Typography>)}
        </Box>
    );
};

export default DriverPropertyString;
