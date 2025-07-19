import { Box, FormControl, FormHelperText, InputLabel, styled, Typography, useTheme, useThemeProps } from "@mui/material";
import { SettingTypeBase, SettingTypeUnion } from "../SettingsTypes";
import { markdown } from "@renderer/components/useful/MarkdownTransform";
import { useTranslation } from "react-i18next";

interface StyledFormControlProps {
}

const StyledSettingInputControl = styled(Box, {
    name: "SettingInputControl", // The component name
    slot: "root", // The slot name
})<StyledFormControlProps>(({ theme }) => ({
    margin: theme.spacing(1),
    width: "100%",
    padding: 8,
}));

export const calculateWidth = (setting: SettingTypeUnion) => {
    switch (setting.type) {
        case "string":
            if (setting.maxLength) {
                // Każdy znak zajmuje około 11px, dodajemy margines
                return Math.min(setting.maxLength * 11 + 16, 600); // Maksymalna szerokość 600px
            }
            return 400;
    }
    return;
};

export const disabledControl = (
    setting: SettingTypeBase,
    values: Record<string, any> = {}
): boolean => {
    // Sprawdź, czy `administrated` jest ustawione i zwraca `true`
    if (typeof setting.administrated === "function") {
        if (setting.administrated()) {
            return true; // Wyłączone, jeśli administrated zwraca true
        }
    } else if (setting.administrated === true) {
        return true; // Wyłączone, jeśli administrated jest true
    }

    // Sprawdź, czy `disabled` jest ustawione i zwraca `true`
    if (typeof setting.disabled === "function") {
        if (setting.disabled(values)) {
            return true; // Wyłączone, jeśli disabled zwraca true
        }
    } else if (setting.disabled === true) {
        return true; // Wyłączone, jeśli disabled jest true
    }

    // Jeśli żaden warunek nie został spełniony, kontrolka nie jest wyłączona
    return false;
};

interface SettingInputProps extends React.ComponentProps<typeof StyledSettingInputControl> {
    path: string[];
    setting: SettingTypeBase;
    values: Record<string, any>;
    validity?: string
}

const SettingInputControl: React.FC<SettingInputProps> = (props) => {
    const { children, className, path, setting, values, validity, ...other } = useThemeProps({ name: 'SettingInputControl', props });
    const { t } = useTranslation();
    const theme = useTheme();
    const fullPath = [...path, setting.key].join('-');

    return (
        <StyledSettingInputControl
            className={`SettingInputControl-root ${setting.type}-setting ${className ?? ''}`}
            {...other}
        >
            <FormControl
                required={setting.required}
                sx={{ width: "100%" }}
            >
                <Typography className="label" component="div" variant="subtitle1" sx={{ display: "flex" }}>
                    {markdown(setting.title)}
                    {setting.required && (<span className="required" style={{ color: theme.palette.error.main }}>*</span>)}
                    <span className="flags">
                        {setting.advanced && (<em>{t('advanced', "Advanced")}</em>)}
                        {setting.experimental && (<em>{t('experimental', "Experimental")}</em>)}
                        {setting.administrated && (<em>{t('administrated', "Administrated")}</em>)}
                    </span>
                </Typography>
                {setting.description && setting.description.length > 0 && (
                    <Typography className="description" component="div" variant="body2" sx={{ display: "flex" }}>
                        {markdown(setting.description)}
                    </Typography>
                )}
                {children}
                {!!validity && (
                    <Typography className="validity" component="div" variant="caption" color="error" sx={{ display: "flex" }}>
                        {markdown(validity)}
                    </Typography>
                )}
                {setting.effect && (
                    <Typography className="effect" component="div" variant="body2" sx={{ display: "flex" }}>
                        {markdown(setting.effect(values))}
                    </Typography>
                )}
            </FormControl>
        </StyledSettingInputControl>
    );
};

export default SettingInputControl;
