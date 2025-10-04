import { FormattedContentItem, FormattedText } from '@renderer/components/useful/FormattedText';
import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import clsx from '@renderer/utils/clsx';
import Collapse from '@mui/material/Collapse'; // Importuj Collapse

export interface TreeNode {
    key: string;
    title: FormattedContentItem;
    children?: TreeNode[];
}

interface TreeProps {
    data: TreeNode[];
    onSelect: (key: string) => void;
}

// Styled components
const StyledTree = styled('div', { name: 'Tree', slot: 'root' })({
});

const StyledTreeNode = styled('div', { name: 'Tree', slot: 'node' })(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    '&.selected': {
        backgroundColor: theme.palette.action.selected,
    },
}));

const TreeNode: React.FC<React.PropsWithChildren<{
    className?: string;
    level: number;
    selected?: boolean;
    onClick: () => void;
    toggle?: boolean;
    isOpen: boolean;
}>> = ({ className, level, onClick, selected, children, toggle, isOpen }) => {
    const theme = useTheme();

    return (
        <StyledTreeNode
            className={clsx(
                "Tree-node",
                className,
                selected && 'selected',
            )}
            style={{
                paddingLeft: level * 8 + 8,
                paddingRight: 8,
            }}
            onClick={onClick}
        >
            <div style={{ width: '1.5em' }}>
                {toggle && (
                    isOpen ?
                        <theme.icons.ExpandMore />
                        : <theme.icons.ChevronRight />
                )}
            </div>
            {children}
        </StyledTreeNode>
    );
};

const Tree: React.FC<TreeProps> = ({ data, onSelect }) => {
    const [selected, setSelected] = React.useState<string | null>(null);
    const [openNodes, setOpenNodes] = React.useState<string[]>([]);

    const toggleNode = (key: string) => {
        setOpenNodes(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const renderTreeNodes = (nodes: TreeNode[], level: number = 0) => {
        return nodes.map(node => {
            const isOpen = openNodes.includes(node.key);
            return (
                <React.Fragment key={node.key}>
                    <TreeNode
                        level={level}
                        onClick={() => {
                            onSelect(node.key);
                            setSelected(node.key);
                            if (node.children && node.children.length > 0) {
                                toggleNode(node.key);
                            }
                        }}
                        selected={selected === node.key}
                        isOpen={isOpen}
                        toggle={node.children && node.children.length > 0}
                    >
                        <FormattedText text={node.title} />
                    </TreeNode>
                    <Collapse in={isOpen} unmountOnExit>
                        {node.children && node.children.length > 0 && (
                            renderTreeNodes(node.children, level + 1)
                        )}
                    </Collapse>
                </React.Fragment>
            );
        });
    };

    return (
        <StyledTree className="Tree-root">
            {renderTreeNodes(data)}
        </StyledTree>
    );
};

export default Tree;