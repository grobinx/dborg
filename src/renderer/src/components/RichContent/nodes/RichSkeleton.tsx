import React from "react";
import { Box, Skeleton } from "@mui/material";
import { IRichContainerDefaults, IRichCustomSkeleton, IRichSkeleton, RichNode, RichSkeletonVariant } from "../types";
import { RichRenderer } from "..";
import clsx from "@renderer/utils/clsx";
import { Optional } from "@renderer/types/universal";

interface RichSkeletonProps {
    node: Optional<IRichSkeleton | IRichCustomSkeleton, "type">;
    defaults?: IRichContainerDefaults;
}

const isCustomSkeleton = (node: Optional<IRichSkeleton | IRichCustomSkeleton, "type">): node is IRichCustomSkeleton => node.variant === "custom";
const isStandardSkeleton = (node: Optional<IRichSkeleton | IRichCustomSkeleton, "type">): node is IRichSkeleton => !isCustomSkeleton(node);

const RichSkeleton: React.FC<RichSkeletonProps> = ({ node, defaults }) => {
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
            return <RichRenderer node={node.custom} defaults={defaults} />;
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
        <RichRenderer node={value} defaults={defaults} />
    );
};

export default RichSkeleton;
