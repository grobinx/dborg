import React from "react";
import { Skeleton } from "@mui/material";
import { IRichCustomSkeleton, IRichEnvironment, IRichSkeleton, RichNode, RichSkeletonVariant } from "../types";
import { RichProp, RichRenderer } from "..";
import clsx from "@renderer/utils/clsx";
import { Optional } from "@renderer/types/universal";

interface RichSkeletonProps extends RichProp {
    node: Optional<IRichSkeleton | IRichCustomSkeleton, "type">;
    environment?: IRichEnvironment;
}

const isCustomSkeleton = (node: Optional<IRichSkeleton | IRichCustomSkeleton, "type">): node is IRichCustomSkeleton => node.variant === "custom";
const isStandardSkeleton = (node: Optional<IRichSkeleton | IRichCustomSkeleton, "type">): node is IRichSkeleton => !isCustomSkeleton(node);

const RichSkeleton: React.FC<RichSkeletonProps> = ({ node, environment }) => {
    const [value, setValue] = React.useState<RichNode | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setValue(null);

        node.value()
            .then((result) => {
                if (!cancelled) {
                    setValue(result);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [node.value]);

    if (node.excluded) {
        return null;
    }

    if (loading) {
        if (isCustomSkeleton(node)) {
            return <RichRenderer node={node.custom} environment={environment} />;
        } else if (isStandardSkeleton(node)) {
            const variant: RichSkeletonVariant = node.variant ?? "text";

            const times = node.times ?? 1;
            return (
                <>
                    {Array.from({ length: times }).map((_, index) => (
                        <Skeleton
                            id={node.id}
                            hidden={node.hidden}
                            key={node.key ?? `${node.id}-${index}`}
                            className={clsx("RichNode-skeleton", node.className)}
                            style={node.style}
                            variant={variant}
                            width={node.width}
                            height={node.height}
                            animation="wave"
                        />
                    ))}
                </>
            );
        }
    }

    if (value === null) {
        return null;
    }

    return (
        <RichRenderer node={value} environment={environment} />
    );
};

export default RichSkeleton;
