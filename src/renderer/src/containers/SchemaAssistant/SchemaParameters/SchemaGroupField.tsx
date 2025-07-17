import { Box, Divider, InputAdornment, ListItem, ListItemButton, ListItemText, Menu, MenuProps, TextField, TextFieldProps, useTheme } from '@mui/material';
import React from 'react';
import { textFieldWidth } from './Utils';
import { useTranslation } from 'react-i18next';
import { useDatabase } from '@renderer/contexts/DatabaseContext';
import { useToast } from '@renderer/contexts/ToastContext';
import ToolButton from '@renderer/components/ToolButton';
import Tooltip from '@renderer/components/Tooltip';

interface SchemaGroupFieldProps {
    schemaGroup: string | undefined,
    onChange: (value: string) => void,
    slotProps: {
        textField?: TextFieldProps,
        menu?: Omit<MenuProps, "open">,
    },
}

type GrupNameType = {
    value: string,
    description?: string,
}

const SchemaGroupField: React.FC<SchemaGroupFieldProps> = (props) => {
    const { schemaGroup, slotProps, onChange } = props;
    const { slotProps: textFieldSlotProps, ...textFieldOther } = slotProps?.textField ?? {};
    const { input: textFieldSlotPropsInput, ...textFieldSlotPropsOther } = textFieldSlotProps ?? {};
    const theme = useTheme();
    const { t } = useTranslation();
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const openMenuGroups = Boolean(anchorEl);
    const { internal } = useDatabase();
    const [groupList, setGroupList] = React.useState<GrupNameType[]>([]);
    const [loadingGroups, setLoadingGroups] = React.useState(false);
    const { addToast } = useToast();

    const i18n_schemaGroup = t("schema-group", "Schema group");

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const loadGroupList = async () => {
        const result: GrupNameType[] = [];
        try {
            const qResult = await internal.query("select distinct sch_group from schemas where sch_group is not null order by 1");
            for (const row of qResult.rows) {
                result.push({ value: row.sch_group as string });
            }
        }
        catch (error) {
            addToast("error", (error as Error).message, { source: "SchemaAssistant", reason: error } )
        }
        if (result.length) {
            result.push({ value: "-" });
        }
        result.push(
            { value: "Development", description: "Środowiska deweloperskie" },
            { value: "Testing", description: "Środowiska testowe" },
            { value: "Staging", description: "Środowiska przygotowawcze przed produkcją" },
            { value: "Production", description: "Środowiska produkcyjne" },
            { value: "Analytics", description: "Bazy danych używane do analizy danych" },
            { value: "Reporting", description: "Bazy danych używane do raportowania" },
            { value: "Backup", description: "Bazy danych przechowujące kopie zapasowe" },
            { value: "Archive", description: "Archiwalne bazy danych" },
            { value: "Training", description: "Środowiska szkoleniowe" },
            { value: "Sandbox", description: "Środowiska eksperymentalne" },
        );

        return result;
    };

    React.useEffect(() => {
        setLoadingGroups(true);
        loadGroupList()
            .then(result => {
                setGroupList(result);
            })
            .finally(() => setLoadingGroups(false));
    }, []);

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
        <Box>
            <TextField
                id="sch_group"
                label={i18n_schemaGroup}
                value={schemaGroup ?? ''}
                onChange={event => onChange(event.target.value)}
                inputRef={inputRef}
                slotProps={{
                    input: {
                        sx: {
                            width: textFieldWidth("string", i18n_schemaGroup),
                        },
                        endAdornment: (
                            <InputAdornment
                                position="end"
                            >
                                <Tooltip title={t("select-schema-group", "Select schema group from list")}>
                                    <span>
                                        <ToolButton
                                            loading={loadingGroups}
                                            onClick={handleMenuOpen}
                                            >
                                            <theme.icons.SelectGroup />
                                        </ToolButton>
                                    </span>
                                </Tooltip>
                            </InputAdornment>
                        ),
                        ...textFieldSlotPropsInput,
                    },
                    ...textFieldSlotPropsOther
                }}
                {...textFieldOther}
            />
            <Menu
                anchorEl={anchorEl}
                open={openMenuGroups}
                onClose={handleMenuClose}
                {...slotProps?.menu}
            >
                {groupList.map((group, index) => {
                    if (group.value === "-") {
                        return <Divider key={index} />;
                    }
                    return (
                        <ListItem key={index} disableGutters disablePadding>
                            <ListItemButton onClick={() => handleMenuItemClick(group.value)}>
                                <ListItemText
                                    primary={group.value}
                                    secondary={group.description}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </Menu>
        </Box>
    );
};

export default SchemaGroupField;
