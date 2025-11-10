import { Box, InputLabel, ListItem, ListItemButton, ListItemText, ListSubheader, Menu, Stack, useTheme } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { PropertiesInfo } from 'src/api/db';
import { textFieldWidth } from './Utils';
import ColorPicker from '@renderer/components/useful/ColorPicker';
import Tooltip from '@renderer/components/Tooltip';
import { ToolButton } from '@renderer/components/buttons/ToolButton';
import { TextField } from '@renderer/components/inputs/TextField';
import { Adornment } from '@renderer/components/inputs/base/BaseInputField';
import ButtonGroup from '@renderer/components/buttons/ButtonGroup';
import { useProfiles } from '@renderer/contexts/ProfilesContext';

interface ProfilePatternFieldProps {
    properties: PropertiesInfo,
    schemaPattern: string,
    schemaName: string,
    schemaColor: string | undefined,
    schemaDriverId: string | undefined,
    onChangePattern: (value: string) => void,
    onChangeColor: (value?: string) => void,
}

const ProfilePatternField: React.FC<ProfilePatternFieldProps> = (props) => {
    const { properties, schemaPattern, schemaName, schemaColor, schemaDriverId, onChangePattern, onChangeColor } = props;
    const theme = useTheme();
    const { t } = useTranslation();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const { profiles } = useProfiles();
    const [colorPickerAnchoreEl, setColorPickerAnchoreEl] = React.useState<null | HTMLElement>(null);

    const i18n_SchemaName = t("schema-name", "Schema name");
    const i18n_VisibleName = t("visible-schema-name", "Visible name");

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>): void => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleColorPickerOpen = (event: React.MouseEvent<HTMLElement>) => {
        if (event.shiftKey) {
            onChangeColor(undefined);
            return;
        }
        setColorPickerAnchoreEl(event.currentTarget);
    };

    const handleColorPickerClose = () => {
        setColorPickerAnchoreEl(null);
    };

    const handleAddPropertyToPattern = (value?: string, pattern?: boolean): void => {
        setAnchorEl(null);
        if (value) {
            if (pattern) {
                onChangePattern(value);
            } else {
                onChangePattern(schemaPattern + value);
            }
            Promise.resolve().then(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            });
        }
    };

    const existingPatterns = React.useMemo(() => {
        if (!schemaDriverId) return [];

        return [...new Set(
            profiles
                .filter(sch => sch.sch_drv_unique_id === schemaDriverId && sch.sch_pattern)
                .map(sch => sch.sch_pattern as string)
        )].sort((a, b) => a.localeCompare(b));
    }, [profiles, schemaDriverId]);

    const patterns = React.useMemo<string[]>(() => {
        const patterns: string[] = [];
        const propertyMap: Record<string, string | undefined> = {
            host: undefined,
            user: undefined,
            database: undefined,
            port: undefined,
        };

        const propertyMatchers: Record<string, string[]> = {
            host: ["host", "ip", "address"],
            user: ["user", "username", "user_name"],
            database: ["database", "db", "sid", "servicename", "service_name", "location"],
            port: ["port"],
        };

        properties.forEach(group => {
            group.properties.forEach(property => {
                for (const [key, matchers] of Object.entries(propertyMatchers)) {
                    if (!propertyMap[key] && matchers.some(matcher => property.name.includes(matcher))) {
                        propertyMap[key] = `{{${property.name}}}`;
                        break;
                    }
                }
            });
        });

        const { host, user, database, port } = propertyMap;

        if (user && host) patterns.push(`${user}@${host}`);
        if (user && database) patterns.push(`${user}@${database}`);
        if (user && database && host) {
            patterns.push(
                `${user}@${host}/${database}`,
                `${user}@${database} ${host}`
            );
        }
        if (user && database && host && port) {
            patterns.push(
                `${user}@${host}:${port}/${database}`,
                `${user}@${database} ${host}:${port}`
            );
        }

        return patterns;
    }, [properties]);

    return (
        <Stack className="item">
            <Stack direction={"row"} gap={8}>
                <Box>
                    <InputLabel>{i18n_SchemaName}</InputLabel>
                    <TextField
                        key={"pattern"}
                        id="sch_pattern"
                        required={true}
                        value={schemaPattern}
                        onChange={value => { onChangePattern(value); }}
                        inputRef={inputRef}
                        autoFocus
                        width={textFieldWidth("schema-pattern", i18n_SchemaName)}
                        adornments={
                            <Adornment position="end">
                                <ButtonGroup>
                                    <Tooltip title={t("add-property-as-pattern", "Add property as pattern")}>
                                        <ToolButton onClick={handleMenuOpen} dense>
                                            <theme.icons.AddPropertyTextField />
                                        </ToolButton>
                                    </Tooltip>
                                    <Tooltip title={t("pick-a-color-or-clear-shift", "Pick a color or clear with [Shift]")}>
                                        <ToolButton onClick={handleColorPickerOpen} dense>
                                            <div
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    backgroundColor: schemaColor ?? '#000000', // Ustawienie koloru
                                                    border: '1px solid #ccc', // Opcjonalna ramka
                                                    borderRadius: '4px', // Opcjonalne zaokrąglenie
                                                }}
                                            />
                                        </ToolButton>
                                    </Tooltip>
                                </ButtonGroup>
                                <ColorPicker
                                    value={schemaColor ?? "#000000"}
                                    onChange={onChangeColor}
                                    anchorEl={colorPickerAnchoreEl}
                                    onClose={handleColorPickerClose}
                                />
                            </Adornment>
                        }
                    />
                </Box>
                <Box>
                    <InputLabel>{i18n_VisibleName + " (r/o)"}</InputLabel>
                    <TextField
                        key={"name"}
                        value={schemaName}
                        width={textFieldWidth("string", i18n_VisibleName)}
                        inputProps={{
                            style: {
                                color: schemaColor
                            }
                        }}
                    />
                </Box>
            </Stack>
            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                sx={{ maxHeight: 400 }}
            >
                {(existingPatterns.length > 0) && [
                    <ListSubheader key="loaded-patterns-header">{t("stored-patterns", "Stored patterns")}</ListSubheader>,
                    ...existingPatterns.map((pattern) => (
                        <ListItem disablePadding key={pattern}>
                            <ListItemButton
                                onClick={() => handleAddPropertyToPattern(pattern, true)}
                            >
                                <ListItemText
                                    secondary={pattern}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))
                ]}
                {(patterns.length > 0) && [
                    <ListSubheader key="predefined-patterns-header">{t("predefined-patterns", "Predefined patterns")}</ListSubheader>,
                    ...patterns.map((pattern) => (
                        <ListItem disablePadding key={pattern}>
                            <ListItemButton
                                onClick={() => handleAddPropertyToPattern(pattern, true)}
                            >
                                <ListItemText
                                    secondary={pattern}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))
                ]}
                {properties.map(group => {
                    const selectableProperties = group.properties.filter(property => ["string", "number", "file"].includes(property.type as string));
                    if (!selectableProperties.length) {
                        return null;
                    }
                    return [
                        <ListSubheader key={group.title}>{group.title}</ListSubheader>,
                        ...selectableProperties.map(property => (
                            <ListItem disablePadding key={property.name}>
                                <ListItemButton
                                    onClick={() => handleAddPropertyToPattern("{{" + property.name + "}}")}
                                >
                                    <ListItemText
                                        primary={property.title}
                                        secondary={"{{" + property.name + "}}"}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))
                    ];
                })}
            </Menu>
        </Stack>
    );
};

export default ProfilePatternField;
