import {
    Box, BoxProps, ButtonProps, Stack,
    styled, Typography, TypographyProps, useThemeProps
} from "@mui/material";
import * as React from 'react';
import { useTranslation } from "react-i18next";
import DriverSelect from "./DriverSelect";
import SchemaParameters, { ProfileParametersRef } from "./SchemaParameters";
import { ProfileParametersType } from "./SchemaParameters/ProfileTypes";
import SchemaSummary from "./SchemaSummary/SchemaSummar";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import { useToast } from "@renderer/contexts/ToastContext";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { ContainerType, useContainers } from "@renderer/contexts/ApplicationContext";
import { SearchField } from "@renderer/components/inputs/SearchField";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { Button } from "@renderer/components/buttons/Button";
import { useProfiles } from "@renderer/contexts/ProfilesContext";
import { Properties } from "src/api/db";

export interface SchemaAssistantProps extends BoxProps {
    slotProps?: {
        assistantTitle?: BoxProps,
        assistantButtons?: BoxProps,
        assistantStepper?: BoxProps,
        assistantContent?: BoxProps,
        title?: TypographyProps,
        stepperTitle?: TypographyProps,
        button?: React.ComponentProps<typeof Button>,
    },
}

interface SchemaAssistantOwnProps extends SchemaAssistantProps {
}

const SchemaAssistantRoot = styled(Box, {
    name: 'SchemaAssistant', // The component name
    slot: 'root', // The slot name
})(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
}));

const SchemaAssistantTitle = styled(Box, {
    name: 'SchemaAssistant', // The component name
    slot: 'title', // The slot name
})();

const SchemaAssistantButtons = styled(Box, {
    name: 'SchemaAssistant', // The component name
    slot: 'buttons', // The slot name
})(() => ({
    // display: "flex",
    // flexDirection: "row",
    // justifyContent: "space-between",
    // alignItems: "center",
}));

const SchemaAssistantStepper = styled(Box, {
    name: 'SchemaAssistant', // The component name
    slot: 'stepper', // The slot name
})();

const SchemaAssistantContent = styled(Box, {
    name: 'SchemaAssistant', // The component name
    slot: 'content', // The slot name
})(() => ({
    overflow: "auto",
    height: "100%",
    display: "flex",
    alignItems: "flex-start",
}));

const steps: { key: string, label: string }[] = [
    { key: "select-db-driver", label: "Select driver" },
    { key: "schema-properties", label: "Connection settings" },
    { key: "summary", label: "Summary" }
]

const SchemaAssistant: React.FC<SchemaAssistantOwnProps> = (props) => {
    const { hidden, className, slotProps, ...other } = useThemeProps({ name: 'SchemaAssistant', props });
    const { t } = useTranslation();
    const [activeStep, setActiveStep] = React.useState(0);
    const [schemaParams, setSchemaParams] = React.useState<ProfileParametersType>({ uniqueId: undefined });
    const [saveing, setSaving] = React.useState(false);
    const [testing, setTesting] = React.useState(false);
    const { drivers } = useDatabase();
    const addToast = useToast();
    const schemaRef = React.useRef<ProfileParametersRef>(null);
    const [search, setSearch] = React.useState('');
    const { queueMessage, subscribe, unsubscribe } = useMessages();
    const { selectedContainer } = useContainers();
    const [assistantMode, setAssistantMode] = React.useState<"new" | "edit" | "clone">("new");
    const { testConnection, connectToDatabase, getProfile: getSchema, createProfile: createSchema, updateProfile: updateSchema } = useProfiles();

    const handleOnSelectDriver = (driverUniqueId: string): void => {
        if (schemaParams.driverUniqueId !== driverUniqueId) {
            setSchemaParams({ driverUniqueId: driverUniqueId, driver: drivers.find(driverUniqueId) });
        }
        setActiveStep(activeStep + 1);
    };

    const handleBack = (): void => {
        setActiveStep(activeStep - 1);
    };

    const handleSwitchContainerMessage = React.useCallback((container: ContainerType) => {
        if (container === selectedContainer?.type && container === "new-profile") {
            queueMessage(Messages.SET_PROFILE_ID, undefined);
        }
    }, [selectedContainer]);

    const handleSetSchemaIdMessage = React.useCallback(async (schemaId: string) => {
        if (!schemaId) {
            setSchemaParams({ uniqueId: undefined });
            setActiveStep(0);
            setAssistantMode("new");
            return;
        }

        try {
            const schema = getSchema(schemaId)!;
            setSchemaParams({
                uniqueId: schemaId,
                driverUniqueId: schema.sch_drv_unique_id,
                schemaGroup: schema.sch_group,
                schemaPattern: schema.sch_pattern,
                schemaName: schema.sch_name,
                schemaColor: schema.sch_color,
                usePassword: schema.sch_use_password,
                properties: schema.sch_properties,
                driver: drivers.list.find((value) => value.uniqueId === schema.sch_drv_unique_id),
            });
            setActiveStep(1);
            setAssistantMode("edit");
        }
        catch (error) {
            addToast("error", t("schema-load-error", "An error occurred while loading the schema."), { source: t("schema-assistant", "Schema assistant"), reason: error });
        }
    }, []);

    const handleSetCloneSchemaIdMessage = React.useCallback(async (schemaId: string) => {
        try {
            const schema = getSchema(schemaId)!;
            setSchemaParams({
                driverUniqueId: schema.sch_drv_unique_id,
                schemaGroup: schema.sch_group,
                schemaPattern: schema.sch_pattern,
                schemaName: schema.sch_name,
                schemaColor: schema.sch_color,
                usePassword: schema.sch_use_password,
                properties: schema.sch_properties,
                driver: drivers.list.find((value) => value.uniqueId === schema.sch_drv_unique_id),
            });
            setActiveStep(1);
            setAssistantMode("clone");
        }
        catch (error) {
            addToast("error", t("schema-load-error", "An error occurred while loading the schema."), { source: t("schema-assistant", "Schema assistant"), reason: error });
        }
    }, []);

    const handleEndEditSchemaMessage = React.useCallback(() => {
        queueMessage(Messages.SWITCH_CONTAINER, "profile-list");
    }, []);

    // Register and unregister message handlers
    React.useEffect(() => {
        subscribe(Messages.SWITCH_CONTAINER, handleSwitchContainerMessage);
        subscribe(Messages.SET_PROFILE_ID, handleSetSchemaIdMessage);
        subscribe(Messages.SET_CLONE_PROFILE_ID, handleSetCloneSchemaIdMessage);
        subscribe(Messages.END_EDIT_PROFILE, handleEndEditSchemaMessage);

        return () => {
            unsubscribe(Messages.SWITCH_CONTAINER, handleSwitchContainerMessage);
            unsubscribe(Messages.SET_PROFILE_ID, handleSetSchemaIdMessage);
            unsubscribe(Messages.SET_CLONE_PROFILE_ID, handleSetCloneSchemaIdMessage);
            unsubscribe(Messages.END_EDIT_PROFILE, handleEndEditSchemaMessage);
        };
    }, [
        handleSwitchContainerMessage,
        handleSetSchemaIdMessage,
        handleEndEditSchemaMessage,
    ]);

    const saveSchema = (schema: ProfileParametersType) => {
        const save = async () => {
            if (!schema.schemaName) {
                addToast("warning", t("schema-name-required", "Schema name is required."), { source: t("schema-assistant", "Schema assistant") });
                return;
            }
            if (schema) {
                try {
                    if (!schema.uniqueId) {
                        const uniqueId = await createSchema({
                            sch_drv_unique_id: schema.driverUniqueId!,
                            sch_group: schema.schemaGroup,
                            sch_pattern: schema.schemaPattern,
                            sch_name: schema.schemaName,
                            sch_color: schema.schemaColor,
                            sch_use_password: schema.usePassword,
                            sch_properties: schema.properties as Properties,
                        }) as string;
                        if (!uniqueId) {
                            return;
                        }
                        schema.uniqueId = uniqueId;
                    }
                    else {
                        const result = await updateSchema({
                            sch_id: schema.uniqueId,
                            sch_drv_unique_id: schema.driverUniqueId!,
                            sch_group: schema.schemaGroup,
                            sch_pattern: schema.schemaPattern,
                            sch_name: schema.schemaName,
                            sch_color: schema.schemaColor,
                            sch_use_password: schema.usePassword,
                            sch_properties: schema.properties as Properties,
                        }) as boolean;
                        if (!result) {
                            return;
                        }
                    }
                    setSchemaParams(schema);
                    setActiveStep(activeStep + 1);
                }
                catch (error) {
                    addToast("error", t("schema-save-error", "An error occurred while saving the schema."), { source: t("schema-assistant", "Schema assistant"), reason: error });
                }
            }
        }
        setSaving(true);
        save().finally(() => {
            setSaving(false);
        })
    };

    const handleTestConnection = async (schema: ProfileParametersType) => {
        setTesting(true);
        try {
            if (!schema.driverUniqueId) {
                addToast("warning",
                    t("driver-unique-id-required", "Driver unique ID is required"),
                    { source: t("profile-assistant", "Profile assistant") }
                );
                return;
            }
            if (!schema.properties) {
                addToast("warning",
                    t("profile-properties-required", "Profile properties are required"),
                    { source: t("profile-assistant", "Profile assistant") }
                );
                return;
            }
            await testConnection(schema.driverUniqueId, schema.usePassword, schema.properties, schema.schemaName ?? "-");
        }
        catch (error) {
        }
        finally {
            setTesting(false);
        }
    };

    return (
        <SchemaAssistantRoot
            {...other}
            className={(className ?? "") + " SchemaAssistant-root"}
            style={{ display: hidden ? "none" : "flex" }}
        >
            <SchemaAssistantTitle className="SchemaAssistant-title" {...slotProps?.assistantTitle}>
                <Typography variant="h4" {...slotProps?.title}>
                    {(assistantMode === "new") && t("schema-assistant", "Profile assistant")}
                    {(assistantMode === "edit") && t("schema-assistant-edit", "Profile edit assistant")}
                    {(assistantMode === "clone") && t("schema-assistant-clone", "Profile clone assistant")}
                </Typography>
                <Stack flexGrow={1} />
                {activeStep === 1 &&
                    <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <InputDecorator indicator={false}>
                            <SearchField
                                placeholder={t("search---", "Search...")}
                                value={search}
                                onChange={(value) => setSearch(value)}
                                inputProps={{
                                    autoFocus: true,
                                }}
                                size="large"
                            />
                        </InputDecorator>
                    </Box>
                }
            </SchemaAssistantTitle>
            <SchemaAssistantStepper className="SchemaAssistant-stepper" {...slotProps?.assistantStepper}>
                <Typography variant="h6" {...slotProps?.stepperTitle}>
                    {(activeStep + 1) + "/" + steps.length + " - " + t(steps[activeStep].key, steps[activeStep].label)}
                </Typography>
            </SchemaAssistantStepper>
            <SchemaAssistantContent
                className="SchemaAssistant-content"
                {...slotProps?.assistantContent}
            >
                {activeStep === 0 && <DriverSelect onSelected={handleOnSelectDriver} />}
                {activeStep === 1 && schemaParams.driverUniqueId && <SchemaParameters schema={schemaParams} schemaRef={schemaRef} search={search} />}
                {activeStep === 2 && schemaParams.uniqueId && <SchemaSummary schema={schemaParams} />}
            </SchemaAssistantContent>
            <SchemaAssistantButtons className="SchemaAssistant-buttons" {...slotProps?.assistantButtons}>
                <Button disabled={activeStep === 0 || assistantMode !== "new"} onClick={handleBack} key="back">
                    {t("back", "Back")}
                </Button>
                <Box flexGrow={1} />
                {(activeStep === 1) &&
                    <Button
                        {...slotProps?.button}
                        onClick={() => {
                            if (schemaRef.current) {
                                handleTestConnection(schemaRef.current.getSchema());
                            }
                        }}
                        loading={testing}
                        key="test-connection"
                    >
                        {t("text-connection", "Test connection")}
                    </Button>
                }
                {(activeStep === 1) &&
                    <Button
                        {...slotProps?.button}
                        onClick={() => {
                            if (schemaRef.current) {
                                saveSchema(schemaRef.current.getSchema());
                            }
                        }}
                        loading={saveing}
                        key="save"
                    >
                        {t("save", "Save")}
                    </Button>
                }
                {(activeStep === 2) && ([
                    < Button
                        {...slotProps?.button}
                        onClick={() => connectToDatabase(schemaParams.uniqueId!)}
                        key="connect"
                        disabled={!schemaParams.uniqueId}
                    >
                        {t("connect", "Connect")}
                    </Button>,
                    < Button
                        {...slotProps?.button}
                        onClick={() => schemaParams.uniqueId && queueMessage(Messages.END_EDIT_PROFILE)}
                        key="finish"
                    >
                        {t("finish", "Finish")}
                    </Button>,
                ])}
            </SchemaAssistantButtons>
        </SchemaAssistantRoot >
    )
}

export default SchemaAssistant;