import { useTheme } from "@mui/material";
import { ActivityRecord } from "../activityTab";
import { useTranslation } from "react-i18next";
import { AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Area } from "recharts";
import { CustomTooltip } from "./CustomTooltip";

export const ChartSessions = ({ minimized, data }: { minimized: boolean, data: ActivityRecord[] }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={minimized ? { bottom: 0, top: 0, left: 0, right: 0 } : { bottom: 30, top: 5, left: 0, right: 0 }}>
                <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorIdle" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.main.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.main.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorIdleInTransaction" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {!minimized && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
                {!minimized && <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />}
                {!minimized && <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} />}
                {!minimized && <Tooltip content={<CustomTooltip />} />}
                {!minimized && <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />}
                <Area type="monotone" dataKey="backends_active" stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorActive)" name={t("backends-active", "Active")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="backends_idle" stroke={theme.palette.main.main} fillOpacity={1} fill="url(#colorIdle)" name={t("backends-idle", "Idle")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="backends_idle_in_transaction" stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorIdleInTransaction)" name={t("backends-idle-in-transaction", "Idle in Transaction")} isAnimationActive={false} connectNulls dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
}