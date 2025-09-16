import { Box, InputLabel, Typography } from '@mui/material';
import React from 'react';
import { PropertyInfo } from 'src/api/db';
import { textFieldWidth } from './Utils';
import { NumberField } from '@renderer/components/inputs/NumberField';

interface DriverPropertyNumberProps {
    property: PropertyInfo,
    value: any,
    onChange: (field: PropertyInfo, value: string) => void,
}

const DriverPropertyNumber: React.FC<DriverPropertyNumberProps> = (props) => {
    const { property, value, onChange } = props;

    return (
        <Box className="item">
            <InputLabel>{property.title}</InputLabel>
            <NumberField
                id={property.name}
                required={property.required}
                value={value ?? ''}
                width={textFieldWidth(property.type, property.title)}
                onChange={(value) => {
                    onChange(property, value !== undefined && value !== null ? value.toString() : '');
                }}
            />
            {property.description && (<Typography variant="description">{property.description}</Typography>)}
        </Box>
    );
};

export default DriverPropertyNumber;
