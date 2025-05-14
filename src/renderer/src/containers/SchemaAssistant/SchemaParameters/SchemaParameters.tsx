import { Box, CheckboxProps, MenuProps, Stack, StackProps, styled, TextFieldProps, Typography, TypographyProps, useThemeProps } from "@mui/material";
import { IconWrapperProps } from "@renderer/themes/icons";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import * as React from 'react';
import { Properties, PropertyInfo } from "src/api/db";
import DriverPropertyFile from "./DriverPropertyFile";
import DriverPropertyString from "./DriverPropertyString";
import { schemaPatternToName, setPropertyValue } from "./Utils";
import DriverPropertyNumber from "./DriverPropertyNumber";
import DriverPropertyPassword, { SchemaUsePasswordType } from "./DriverPropertyPassword";
import DriverPropertyBoolean from "./DriverPropertyBoolean";
import { useTranslation } from "react-i18next";
import SchemaPatternField from "./SchemaPatternField";
import SchemaGroupField from "./SchemaGroupField";
import { SchemaParametersType } from "./SchemaTypes";
import DriverSummary from "../DriverSelect/DriverSummary";
//import { useTranslation } from "react-i18next";

export interface SchemaParametersRef {
    getSchema: () => SchemaParametersType;
}

export interface SchemaParametersProps extends StackProps {
    schemaRef?: React.RefObject<SchemaParametersRef | null>,
    schema: SchemaParametersType,
    slotProps?: {
        driverIcon?: IconWrapperProps,
        driverName?: TypographyProps,
        driverDescription?: TypographyProps,
        schemaDriver?: StackProps,
        schemaParameters?: StackProps,
        schemaGroup?: StackProps,
        groupName?: TypographyProps,
        groupDescription?: TypographyProps,
        groupProperties?: StackProps,
        textField?: TextFieldProps,
        checkBoxField?: CheckboxProps,
        menu?: Omit<MenuProps, "open">,
    },
    search?: string,
}

interface SchemaParametersOwnProps extends SchemaParametersProps {
}

const SchemaParametersRoot = styled(Stack, {
    name: 'SchemaParameters', // The component name
    slot: 'root', // The slot name
})(() => ({
    width: "100%",
}));

const SchemaParametersDriver = styled(Stack, {
    name: 'SchemaParameters', // The component name
    slot: 'driver', // The slot name
})(() => ({
    flexDirection: "row",
    alignItems: "start",
}));

const SchemaParametersGroup = styled(Stack, {
    name: 'SchemaParameters', // The component name
    slot: 'group', // The slot name
})(() => ({
}));

const SchemaParametersProperties = styled(Stack, {
    name: 'SchemaParameters', // The component name
    slot: 'properties', // The slot name
})(() => ({
}));

const SchemaParameters: React.FC<SchemaParametersOwnProps> = (props) => {
    //const theme = useTheme();
    const { schemaRef, schema, slotProps, search, ...other } = useThemeProps({ name: 'SchemaParameters', props });
    const { drivers } = useDatabase();
    const [properties, setProperties] = React.useState<Properties>(schema.properties ?? {});
    const driver = drivers.list.find((value) => value.uniqueId === schema.driverUniqueId);
    const { t } = useTranslation();
    const [schemaPattern, setSchemaPattern] = React.useState(schema.schemaPattern ?? '');
    const [schemaName, setSchemaName] = React.useState(schema.schemaName ?? '');
    const [schemaColor, setSchemaColor] = React.useState<string | undefined>(schema.schemaColor);
    const [schemaGroup, setSchemaGroup] = React.useState(schema.schemaGroup);
    const [schemaUsePassword, setSchemaUsePassword] = React.useState<SchemaUsePasswordType>(schema.usePassword);
    const [searchProperties, setSearchProperties] = React.useState<string[]>([]);
    const passwordRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(schemaRef, () => ({
        getSchema: () => ({
            uniqueId: schema.uniqueId,
            driverUniqueId: schema.driverUniqueId,
            schemaPattern: schemaPattern,
            schemaName: schemaName,
            schemaGroup: schemaGroup,
            schemaColor: schemaColor,
            usePassword: schemaUsePassword,
            properties: Object.assign({}, properties),
            driver: driver,
        }),
    }), [properties, schemaPattern, schemaName, schemaColor, schemaGroup, schemaUsePassword]);

    React.useEffect(() => {
        if (!schema.uniqueId) {
            const defaultProperites: Properties = {};
            driver!.properties.flatMap(group => group.properties).forEach(property => {
                if ((property.default ?? '') !== '') {
                    setPropertyValue(defaultProperites, property, property.default ?? '');
                }
                if (property.type === "password") {
                    setSchemaUsePassword("ask");
                }
            });
            if (Object.keys(defaultProperites).length) {
                setProperties(defaultProperites);
            }
        }
    }, [schema.driverUniqueId]);

    const handlePropertyChange = (property: PropertyInfo, value: string): void => {
        setProperties((prev) => {
            const newp = { ...prev };
            setPropertyValue(newp, property, value);
            return newp;
        });
    }

    React.useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search && search !== '') {
                const parts = search.toLowerCase().split(" ").map(value => value.trim()).filter(value => (value ?? '') !== '');
                const result = driver?.properties
                    .flatMap(group => group.properties)
                    .filter(property =>
                        parts.every(value =>
                            property.name.toLowerCase().includes(value) ||
                            property.title.toLowerCase().includes(value) ||
                            (property.description ?? '').toLowerCase().includes(value)
                        )
                    )
                    .map(property => property.name);
                setSearchProperties(result ?? []);
            }
            else {
                setSearchProperties([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    React.useEffect(() => {
        setSchemaName(schemaPatternToName(schemaPattern, properties));
    }, [properties, schemaPattern])

    const propertyInputs: React.ReactElement =
        <>
            <SchemaParametersDriver key="driver" {...slotProps?.schemaDriver}>
                <DriverSummary driver={driver} />
                <Box flexGrow={1} />
            </SchemaParametersDriver>
            {(search === undefined || search === '') &&
                <SchemaParametersGroup key="schema" {...slotProps?.schemaGroup}>
                    <Typography variant="h5" {...slotProps?.groupName}>
                        {t("schema-fields", "Schema properties")}
                    </Typography>
                    <SchemaParametersProperties {...slotProps?.groupProperties}>
                        <SchemaPatternField
                            properties={driver?.properties ?? []}
                            schemaName={schemaName}
                            schemaPattern={schemaPattern}
                            schemaColor={schemaColor}
                            schemaDriverId={driver?.uniqueId}
                            onChangePattern={value => setSchemaPattern(value)}
                            onChangeColor={value => setSchemaColor(value)}
                            slotProps={{
                                textField: slotProps?.textField,
                                menu: slotProps?.menu,
                            }}
                        />
                        <SchemaGroupField
                            schemaGroup={schemaGroup}
                            onChange={value => setSchemaGroup(value === '' ? undefined : value)}
                            slotProps={{
                                textField: slotProps?.textField,
                                menu: slotProps?.menu,
                            }}
                        />
                    </SchemaParametersProperties>
                </SchemaParametersGroup>
            }
            {driver?.properties.map((group) => {
                const filtered = group.properties.filter(property => !searchProperties.length || searchProperties.includes(property.name));
                if (!filtered.length) {
                    return;
                }
                return (
                    <SchemaParametersGroup key={group.title} {...slotProps?.schemaGroup}>
                        <Typography variant="h5" {...slotProps?.groupName}>
                            {group.title}
                        </Typography>
                        {group.description &&
                            <Typography variant="subtitle1" {...slotProps?.groupDescription}>
                                {group.description}
                            </Typography>
                        }
                        <SchemaParametersProperties {...slotProps?.groupProperties}>
                            {filtered.map(property => {
                                if (property.type === "string") {
                                    return (
                                        <DriverPropertyString
                                            key={property.name}
                                            property={property}
                                            value={properties[property.name]}
                                            onChange={handlePropertyChange}
                                            slotProps={{
                                                textField: slotProps?.textField
                                            }}
                                        />
                                    )
                                }
                                if (property.type === "number") {
                                    return (
                                        <DriverPropertyNumber
                                            key={property.name}
                                            property={property}
                                            value={properties[property.name]}
                                            onChange={handlePropertyChange}
                                            slotProps={{
                                                textField: slotProps?.textField
                                            }}
                                        />
                                    )
                                }
                                if (property.type === "password") {
                                    return (
                                        <DriverPropertyPassword
                                            key={property.name}
                                            property={property}
                                            value={properties[property.name]}
                                            onChange={handlePropertyChange}
                                            usePassword={schemaUsePassword}
                                            onChangeUsePassword={value => {
                                                setSchemaUsePassword(value);
                                                if (value === "save") {
                                                    Promise.resolve().then(() => {
                                                        if (passwordRef.current) {
                                                            passwordRef.current.focus();
                                                        }
                                                    });
                                                }
                                            }}
                                            passwordRef={passwordRef}
                                            slotProps={{
                                                textField: slotProps?.textField
                                            }}
                                        />
                                    )
                                }
                                if (property.type === "file") {
                                    return (
                                        <DriverPropertyFile
                                            key={property.name}
                                            property={property}
                                            value={properties[property.name]}
                                            onChange={handlePropertyChange}
                                            slotProps={{
                                                textField: slotProps?.textField
                                            }}
                                        />
                                    )
                                }
                                if (property.type === "boolean") {
                                    return (
                                        <DriverPropertyBoolean
                                            key={property.name}
                                            property={property}
                                            value={properties[property.name]}
                                            onChange={handlePropertyChange}
                                            slotProps={{
                                                checkBoxField: slotProps?.checkBoxField
                                            }}
                                        />
                                    )
                                }
                                return (
                                    <Typography>
                                        {property.title}
                                    </Typography>
                                )
                            })}
                        </SchemaParametersProperties>
                    </SchemaParametersGroup>
                )
            })}
        </>

    return (
        <SchemaParametersRoot
            {...other}
            className={" SchemaParameters-root"}
            {...slotProps?.schemaParameters}
        >
            {propertyInputs}
        </SchemaParametersRoot>
    )
}

export default SchemaParameters;