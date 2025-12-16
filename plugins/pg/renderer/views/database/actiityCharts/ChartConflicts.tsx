import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActivityRecord } from "../activityTab";
import { CustomTooltip } from "./CustomTooltip";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

export const ChartConflicts = ({ minimized, data }: { minimized: boolean, data: ActivityRecord[] }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={minimized ? { bottom: 0, top: 0, left: 0, right: 0 } : { bottom: 30, top: 5, left: 0, right: 0 }}>
                <defs>
                    <linearGradient id="colorConflicts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDeadlocks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {!minimized && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
                {!minimized && <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />}
                {!minimized && <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} />}
                {!minimized && <Tooltip content={<CustomTooltip />} />}
                {!minimized && <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />}
                <Area type="monotone" dataKey="conflicts" stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorConflicts)" name={t("conflicts", "Conflicts")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="deadlocks" stroke={theme.palette.error.main} fillOpacity={1} fill="url(#colorDeadlocks)" name={t("deadlocks", "Deadlocks")} isAnimationActive={false} connectNulls dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
};