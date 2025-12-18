import { Tooltip as RechartsTooltip, TooltipProps } from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

export type ExtendedTooltipProps<TValue extends ValueType, TName extends NameType> = TooltipProps<TValue, TName> & {};

const Tooltip = <TValue extends ValueType, TName extends NameType>(props: ExtendedTooltipProps<TValue, TName>) => {
    return (
        <RechartsTooltip
            isAnimationActive={false}
            wrapperStyle={{ zIndex: 1000 }}
            {...(props as TooltipProps<TValue, TName>)}
        />
    );
};

export default Tooltip;