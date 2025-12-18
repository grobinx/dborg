import { Legend as RechartsLegend, LegendProps } from "recharts";

export type ExtendedLegendProps = LegendProps & {
};

const Legend = (props: ExtendedLegendProps) => {

    return (
        <RechartsLegend
            wrapperStyle={{ fontSize: "0.7rem", marginBottom: 10 }}
            iconSize={10}
            {...(props as LegendProps)}
        />
    );
};

export default Legend;