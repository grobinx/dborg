import { useTheme } from "@mui/material";
import { ToolButton } from "../buttons/ToolButton";
import Tooltip from "../Tooltip";
import { useTranslation } from "react-i18next";

export function TabCloseButton(props: { onClick: () => void; active: boolean }) {
    const { onClick, active } = props;
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Tooltip title={t("close-tab", "Close tab")}>
            <ToolButton
                component="div"
                color="main"
                onClick={onClick}
                size="small"
                disabled={!active}
                dense
                style={{ padding: 0 }}
            >
                <theme.icons.Close color={!active ? undefined : "error"} />
            </ToolButton>
        </Tooltip>
    );
}
