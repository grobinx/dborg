import React from "react";
import { IRichContainerDefaults, IRichRefresh } from "../types";
import RichRenderer from "..";
import { Optional } from "@renderer/types/universal";

interface RichRefreshProps {
    node: Optional<IRichRefresh, "type">;
    defaults?: IRichContainerDefaults;
}

const RichRefresh: React.FC<RichRefreshProps> = ({ node, defaults }) => {
    const [refreshKey, setRefreshKey] = React.useState<bigint>(0n);

    React.useEffect(() => {
        const id = setInterval(() => {
            setRefreshKey((k) => k + 1n);
        }, node.interval);

        return () => clearInterval(id);
    }, [node.interval]);

    return <RichRenderer key={refreshKey} node={node.refresh} defaults={defaults} />;
};

export default RichRefresh;