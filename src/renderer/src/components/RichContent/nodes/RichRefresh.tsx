import React from "react";
import { IRichEnvironment, IRichRefresh } from "../types";
import RichRenderer, { RichProp } from "..";
import { Optional } from "@renderer/types/universal";

interface RichRefreshProps extends RichProp {
    node: Optional<IRichRefresh, "type">;
    environment?: IRichEnvironment;
}

const RichRefresh: React.FC<RichRefreshProps> = ({ node, environment }) => {
    const [refreshKey, setRefreshKey] = React.useState<bigint>(0n);

    React.useEffect(() => {
        const id = setInterval(() => {
            setRefreshKey((k) => k + 1n);
        }, node.interval ?? 1000);

        return () => clearInterval(id);
    }, [node.interval]);

    return <RichRenderer node={node.refresh} environment={environment} refreshId={refreshKey} />;
};

export default RichRefresh;