import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import Tooltip from "../Tooltip";
import { ToolButton } from "../buttons/ToolButton";

export function TabPinButton(props: { onClick: () => void; active: boolean }) {
    const { onClick, active } = props;
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Tooltip title={t("pin-tab", "Pin tab")}>
            <ToolButton
                component="div"
                color="main"
                onClick={onClick}
                size="small"
                disabled={!active}
                dense
                style={{ padding: 0 }}
            >
                <theme.icons.Pin color={active ? "primary" : undefined} />  
            </ToolButton>
        </Tooltip>
    );
}