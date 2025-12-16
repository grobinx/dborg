import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActivityRecord } from "../activityTab";
import { CustomTooltip } from "./CustomTooltip";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import prettySize from "@renderer/utils/prettySize";

export const ChartTuplesRead = ({ minimized, data }: { minimized: boolean, data: ActivityRecord[] }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={minimized ? { bottom: 20, top: 5, left: 0, right: 0 } : { bottom: 20, top: 5, left: 0, right: 0 }}>
                <defs>
                    <linearGradient id="colorReturned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFetched" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {!minimized && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
                {!minimized && <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />}
                {!minimized && <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={prettySize} />}
                {!minimized && <Tooltip content={<CustomTooltip />} />}
                {!minimized && <Legend wrapperStyle={{ fontSize: "0.7rem", marginBottom: 10 }} iconSize={10} />}
                <Area type="monotone" dataKey="tup_returned" stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorReturned)" name={t("tup-returned", "Returned")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="tup_fetched" stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorFetched)" name={t("tup-fetched", "Fetched")} isAnimationActive={false} connectNulls dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
};