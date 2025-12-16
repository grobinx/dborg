import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActivityRecord } from "../activityTab";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { CustomTooltip } from "./CustomTooltip";

export const ChartNumBackends = ({ minimized, data, maxConnections = 0 }: { minimized: boolean, data: ActivityRecord[], maxConnections?: number }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={minimized ? { bottom: 20, top: 5, left: 0, right: 0 } : { bottom: 20, top: 5, left: 0, right: 0 }}>
                <defs>
                    <linearGradient id="colorNumBackends" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {!minimized && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
                {!minimized && <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />}
                {!minimized && <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} domain={[0, maxConnections > 0 ? maxConnections : 'auto']} />}
                {!minimized && <Tooltip content={<CustomTooltip />} />}
                {!minimized && <Legend wrapperStyle={{ fontSize: "0.7rem", marginBottom: 10 }} iconSize={10} />}
                <Area type="monotone" dataKey="numbackends" stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorNumBackends)" name={t("numbackends", "Active Connections")} isAnimationActive={false} connectNulls dot={false} />
                {maxConnections > 0 && <Area type="monotone" dataKey="max_connections" stroke={theme.palette.error.main} strokeDasharray="5 5" fill="none" strokeWidth={2} name={t("max-connections", "Max Connections")} isAnimationActive={false} connectNulls dot={false} />}
            </AreaChart>
        </ResponsiveContainer>
    );
}