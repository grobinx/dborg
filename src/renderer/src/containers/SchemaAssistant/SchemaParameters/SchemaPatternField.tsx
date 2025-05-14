import { Box, IconButton, InputAdornment, ListItem, ListItemButton, ListItemText, ListSubheader, Menu, MenuProps, TextField, TextFieldProps, Tooltip, useTheme } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { PropertiesInfo } from 'src/api/db';
import { useDatabase } from '@renderer/contexts/DatabaseContext';
import { textFieldWidth } from './Utils';
import { useNotification } from '@renderer/contexts/NotificationContext';
import ToolButton from '@renderer/components/ToolButton';

interface SchemaPatternFieldProps {
    properties: PropertiesInfo,
    schemaPattern: string,
    schemaName: string,
    schemaColor: string | undefined,
    schemaDriverId: string | undefined,
    onChangePattern: (value: string) => void,
    onChangeColor: (value?: string) => void,
    slotProps: {
        textField?: TextFieldProps,
        menu?: Omit<MenuProps, "open">,
    },
}

const SchemaPatternField: React.FC<SchemaPatternFieldProps> = (props) => {
    const { properties, schemaPattern, schemaName, schemaColor, schemaDriverId, slotProps, onChangePattern, onChangeColor } = props;
    const { slotProps: textFieldSlotProps, ...textFieldOther } = slotProps?.textField ?? {};
    const { input: textFieldSlotPropsInput, ...textFieldSlotPropsOther } = textFieldSlotProps ?? {};
    const theme = useTheme();
    const { t } = useTranslation();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const { addNotification } = useNotification();
    const { internal } = useDatabase();
    const [loadedPatterns, setLoadedPatterns] = React.useState<string[]>();

    const i18n_SchemaName = t("schema-name", "Schema name");
    const i18n_VisibleName = t("visible-schema-name", "Visible name");

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>): void => {
        setAnchorEl(event.currentTarget);
    }

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleAddPropertyToPattern = (value?: string, pattern?: boolean): void => {
        setAnchorEl(null);
        if (value) {
            if (pattern) {
                onChangePattern(value);
            }
            else {
                onChangePattern(schemaPattern + value);
            }
            Promise.resolve().then(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            })
        }
    }

    React.useEffect(() => {
        const load = async () => {
            const result: string[] = [];
            try {
                const qResult = await internal.query("select distinct sch_pattern from schemas where sch_drv_unique_id = ? order by 1", [schemaDriverId]);
                for (const row of qResult.rows) {
                    result.push(row.sch_pattern as string);
                }
            }
            catch (error) {
                addNotification("error", (error as Error).message, { source: "SchemaAssistant", reason: error });
            }
            setLoadedPatterns(result);
        }
        load();
    }, [schemaDriverId])

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
        <Box>
            <TextField
                key={"pattern"}
                id="sch_pattern"
                label={i18n_SchemaName}
                required={true}
                value={schemaPattern}
                onChange={event => { onChangePattern(event.target.value) }}
                inputRef={inputRef}
                autoFocus
                slotProps={{
                    input: {
                        sx: { width: textFieldWidth("schema-pattern", i18n_SchemaName) },
                        endAdornment: (
                            <InputAdornment
                                position="end"
                                style={{ cursor: "pointer" }}
                            >
                                <Tooltip title={t("add-property-as-pattern", "Add property as pattern")}>
                                    <ToolButton onClick={handleMenuOpen}>
                                        <theme.icons.AddPropertyTextField />
                                    </ToolButton>
                                </Tooltip>
                                <Tooltip title={t("pick-a-color-or-clear-shift", "Pick a color or clear with [Shift]")}>
                                    <input
                                        type="color"
                                        value={schemaColor ?? '#000000'}
                                        onChange={event => onChangeColor(event.target.value)}
                                        onClick={event => {
                                            if (event.shiftKey) {
                                                onChangeColor();
                                                event.preventDefault();
                                            }
                                        }}
                                    />
                                </Tooltip>
                            </InputAdornment>
                        ),
                        ...textFieldSlotPropsInput,
                    },
                    ...textFieldSlotPropsOther
                }}
                {...textFieldOther}
            />
            <TextField
                key={"name"}
                label={i18n_VisibleName + " (r/o)"}
                value={schemaName}
                slotProps={{
                    input: {
                        sx: {
                            width: textFieldWidth("string", i18n_VisibleName),
                            color: schemaColor
                        },
                        ...textFieldSlotPropsInput,
                    },
                    ...textFieldSlotPropsOther
                }}
                {...textFieldOther}
            />
            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                {...slotProps?.menu}
            >
                {(loadedPatterns && loadedPatterns.length > 0) && [
                    <ListSubheader key="loaded-patterns-header">{t("stored-patterns", "Stored patterns")}</ListSubheader>,
                    ...loadedPatterns.map((pattern) => (
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
                    ]

                })}
            </Menu>
        </Box>
    );
};

export default SchemaPatternField;
