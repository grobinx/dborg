import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

export const CustomTooltip = ({ active, payload }: any) => {
    const theme = useTheme();
    const { t } = useTranslation();

    if (active && payload && payload.length) {
        const data = payload[0].payload;
        let timeStr = "-";
        if (data.snapshot !== -1) {
            const elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
            timeStr = t("{{elapsed}}s ago", { elapsed });
        }
        return (
            <div style={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, padding: "8px", borderRadius: "4px", zIndex: 1400 }}>
                <p style={{ margin: "0 0 4px 0", color: theme.palette.text.primary }}>{timeStr}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ margin: "2px 0", color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};
