import { Grid2, List, ListItem, ListItemText, ListProps, Stack, StackProps, styled, Typography, useThemeProps } from '@mui/material';
import React from 'react';
import { SchemaParametersType } from '../SchemaParameters/SchemaTypes';
import { useDatabase } from '@renderer/contexts/DatabaseContext';
import DriverSummary from '../DriverSelect/DriverSummary';
import { useTranslation } from 'react-i18next';

export interface SchemaSummaryProps extends StackProps {
    slotProps?: {
        schemaDriver?: StackProps,
        schema?: StackProps,
        list?: ListProps,
    }
}

interface SchemaSummaryOwnProps extends SchemaSummaryProps {
    ref?: React.RefObject<HTMLInputElement>,
    schema: SchemaParametersType
}

export interface SchemaSummaryRef extends HTMLDivElement {
    // Define methods or properties to expose via the ref
    someMethod: () => void;
}

const SchemaSummaryRoot = styled(Stack, {
    name: 'SchemaSummary',
    slot: 'root',
})(() => ({
    width: "100%",
}));

const SchemaSummaryDriver = styled(Stack, {
    name: 'SchemaSummary', // The component name
    slot: 'driver', // The slot name
})(() => ({
    flexDirection: "row",
    alignItems: "start",
}));

const SchemaSummarySchema = styled(Stack, {
    name: 'SchemaSummary',
    slot: 'schema',
})(() => ({
    flexDirection: "column",
}));

type PropertySummaryInfo = {
    name: string,
    title: string,
    value: any
}

const SchemaSummary: React.FC<SchemaSummaryOwnProps> = (props) => {
    const { ref, schema, slotProps, ...other } = useThemeProps({ name: 'SchemaSummary', props });;
    const { drivers } = useDatabase();
    const driver = drivers.list.find((value) => value.uniqueId === schema.driverUniqueId);
    const { t } = useTranslation();

    const properties = React.useMemo<PropertySummaryInfo[]>(() => {
        if (!driver?.properties) return [];
        return driver.properties.flatMap(group =>
            group.properties
                .filter(property => property.type !== "password" && schema.properties?.[property.name])
                .map(property => ({
                    name: property.name,
                    title: property.title,
                    value: schema.properties![property.name]
                }))
        );
    }, [driver, schema]);

    return (
        <SchemaSummaryRoot ref={ref} {...other}>
            <SchemaSummaryDriver key="driver" {...slotProps?.schemaDriver}>
                <DriverSummary driver={driver} />
            </SchemaSummaryDriver>
            <SchemaSummarySchema key="schema" {...slotProps?.schema}>
                <Grid2 container>
                    <Grid2 size="grow">
                        <List {...slotProps?.list}>
                            <ListItem key="schema-name">
                                <ListItemText
                                    primary={t("schema-name", "Schema name")}
                                    secondary={
                                        <Typography variant='h6' sx={{ color: schema.schemaColor }}>
                                            {schema.schemaName}
                                        </Typography>
                                    } />
                            </ListItem>
                            {schema.schemaGroup &&
                                <ListItem key="schema-group">
                                    <ListItemText
                                        primary={t("schema-group", "Schema group")}
                                        secondary={
                                            <Typography variant='h6'>
                                                {schema.schemaGroup}
                                            </Typography>
                                        } />
                                </ListItem>
                            }
                            {schema.usePassword &&
                                <ListItem key="schema-use-password">
                                    <ListItemText
                                        primary={t("schema-use-password", "Use password")}
                                        secondary={
                                            <Typography variant='h6'>
                                                {{
                                                    "ask": t("ask-password-when-connecting", "Ask for password when connecting"),
                                                    "save": t("save-password-as-plain-text", "Save password as plain text"),
                                                    "empy": t("use-empty-password", "Use empty password")
                                                }[schema.usePassword]}
                                            </Typography>
                                        } />
                                </ListItem>
                            }
                        </List>
                    </Grid2>
                    <Grid2 size="grow">
                        <List {...slotProps?.list}>
                            {properties.map(property => (
                                <ListItem key={property.name}>
                                    <ListItemText
                                        primary={property.title}
                                        secondary={<code>{property.name + ": "}<strong>{property.value.toString()}</strong></code>}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Grid2>
                </Grid2>
            </SchemaSummarySchema>
        </SchemaSummaryRoot>
    );
}

export default SchemaSummary;