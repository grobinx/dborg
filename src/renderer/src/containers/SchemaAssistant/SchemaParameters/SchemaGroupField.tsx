import { Box, InputLabel, ListItem, ListItemButton, ListItemText, ListSubheader, Menu, useTheme } from '@mui/material';
import React from 'react';
import { textFieldWidth } from './Utils';
import { useTranslation } from 'react-i18next';
import Tooltip from '@renderer/components/Tooltip';
import { ToolButton } from '@renderer/components/buttons/ToolButton';
import { TextField } from '@renderer/components/inputs/TextField';
import { Adornment } from '@renderer/components/inputs/base/BaseInputField';
import { useSchema } from '@renderer/contexts/SchemaContext';

interface SchemaGroupFieldProps {
    schemaGroup: string | undefined,
    onChange: (value: string) => void,
}

type GrupNameType = {
    value: string,
    description?: string,
}

const SchemaGroupField: React.FC<SchemaGroupFieldProps> = (props) => {
    const { schemaGroup, onChange } = props;
    const theme = useTheme();
    const { t } = useTranslation();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const openMenuGroups = Boolean(anchorEl);
    const { schemas } = useSchema();

    const i18n_schemaGroup = t("schema-group", "Schema group");

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const storedGroupList = React.useMemo(() => {
        return [
            ...new Set(
                schemas
                    .filter(schema => (schema.sch_group ?? "").trim().length > 0)
                    .map(schema => schema.sch_group as string)
            )]
            .sort((a, b) => a.localeCompare(b));
    }, [schemas]);

    const predefinedGroupList = React.useMemo<GrupNameType[]>(() => [
        { value: t("Development", "Development"), description: t("Development-description", "Development environments") },
        { value: t("Testing", "Testing"), description: t("Testing-description", "Testing environments") },
        { value: t("Staging", "Staging"), description: t("Staging-description", "Staging (pre-production) environments") },
        { value: t("Production", "Production"), description: t("Production-description", "Production environments") },
        { value: t("Analytics", "Analytics"), description: t("Analytics-description", "Databases used for data analysis") },
        { value: t("Reporting", "Reporting"), description: t("Reporting-description", "Databases used for reporting") },
        { value: t("Backup", "Backup"), description: t("Backup-description", "Databases storing backups") },
        { value: t("Archive", "Archive"), description: t("Archive-description", "Archived databases") },
        { value: t("Training", "Training"), description: t("Training-description", "Training environments") },
        { value: t("Sandbox", "Sandbox"), description: t("Sandbox-description", "Experimental environments") },
    ], [t]);

    const handleMenuItemClick = (value?: string): void => {
        setAnchorEl(null);
        if (value) {
            onChange(value);
            Promise.resolve().then(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            });
        }
    };

    return (
        <Box className="item">
            <InputLabel>{i18n_schemaGroup}</InputLabel>
            <TextField
                id="sch_group"
                value={schemaGroup ?? ''}
                onChange={event => onChange(event.target.value)}
                inputRef={inputRef}
                width={textFieldWidth("string", i18n_schemaGroup)}
                adornments={
                    < Adornment position="end">
                        <Tooltip title={t("select-schema-group", "Select schema group from list")}>
                            <ToolButton
                                onClick={handleMenuOpen}
                                dense
                            >
                                <theme.icons.SelectGroup />
                            </ToolButton>
                        </Tooltip>
                    </Adornment>
                }
            />
            <Menu
                anchorEl={anchorEl}
                open={openMenuGroups}
                onClose={handleMenuClose}
            >
                {storedGroupList.length > 0 && ([
                    <ListSubheader key="stored-groups">{t("stored-schema-groups", "Stored schema groups")}</ListSubheader>,
                    ...storedGroupList.map((group, index) => (
                        <ListItem key={index} disableGutters disablePadding>
                            <ListItemButton onClick={() => handleMenuItemClick(group)}>
                                <ListItemText primary={group} />
                            </ListItemButton>
                        </ListItem>
                    ))
                ])}
                {predefinedGroupList.length > 0 && ([
                    <ListSubheader key="predefined-groups">{t("predefined-schema-groups", "Predefined schema groups")}</ListSubheader>,
                    ...predefinedGroupList.map((group, index) => (
                        <ListItem key={index} disableGutters disablePadding>
                            <ListItemButton onClick={() => handleMenuItemClick(group.value)}>
                                <ListItemText
                                    primary={group.value}
                                    secondary={group.description ? t(`schema-group-descriptions.${group.value}`, group.description) : undefined}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))
                ])}
            </Menu>
        </Box>
    );
};

export default SchemaGroupField;
