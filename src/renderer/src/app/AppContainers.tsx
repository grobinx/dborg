import Container from "@renderer/containers/Container";
import { useContainers } from "@renderer/contexts/ApplicationContext";

const AppContainers: React.FC = () => {
    const { containers, selectedContainer, selectedView } = useContainers();

    return (
        containers?.map((container) => {
            if (["new-connection", "connection-list", "connections"].includes(container.type)) {
                return (
                    <Container key={container.type} hidden={container !== selectedContainer}>
                        {container.container !== undefined && <container.container key={container.id} />}
                    </Container>
                );
            }
            if (container !== selectedContainer) {
                return null; // Skip rendering if the container is not selected
            }
            return (
                <Container key={container.type}>
                    {container.container !== undefined &&
                        <container.container key={container.id} >
                            {
                                selectedView?.type === "rendered" &&
                                selectedView?.render &&
                                <selectedView.render key={selectedView.id} />
                            }
                        </container.container>
                    }
                </Container>
            );
        })
    );
};

export default AppContainers;