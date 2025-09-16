import { Box, InputAdornment, InputLabel, Typography, useTheme } from '@mui/material';
import React from 'react';
import { PropertyInfo } from 'src/api/db';
import { textFieldWidth } from './Utils';
import { useTranslation } from 'react-i18next';
import Tooltip from '@renderer/components/Tooltip';
import { ToolButton } from '@renderer/components/buttons/ToolButton';
import { FileField } from '@renderer/components/inputs/FileField';

interface DriverPropertyFileProps {
    property: PropertyInfo,
    value: any,
    onChange: (field: PropertyInfo, value: string) => void,
}

const DriverPropertyFile: React.FC<DriverPropertyFileProps> = (props) => {
    const { property, value, onChange } = props;
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Box className="item">
            <InputLabel>{property.title}</InputLabel>
            <FileField
                id={property.name}
                required={property.required}
                value={value ?? ''}
                width={textFieldWidth(property.type, property.title)}
                onChange={(value) => {
                    onChange(property, value);
                }}
            />
            {property.description && (<Typography variant="description">{property.description}</Typography>)}
        </Box>
    );
};

export default DriverPropertyFile;
