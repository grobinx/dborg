import { FormattedContentItem, FormattedText } from '@renderer/components/useful/FormattedText';
import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import clsx from '@renderer/utils/clsx';
import Collapse from '@mui/material/Collapse';

/**
 * Tree node structure
 */
export interface TreeNode {
    /** Unique key for the node */
    key: string;
    /** Title of the node */
    title?: FormattedContentItem;
    /** Child nodes */
    children?: TreeNode[];
    /** Parent node - optional, useful for certain operations, not used in tree component. Null if root. */
    parent?: TreeNode | null;
}

interface TreeProps {
    autoExpand?: number | boolean; // Dodano obsługę autoExpand
    data: TreeNode[];
    selected?: string | null;
    onSelect: (key: string) => void;
    renderNode?: (node: TreeNode) => React.ReactNode;
    [key: `data-${string}`]: any;
}

// Styled components
const StyledTree = styled('div', { name: 'Tree', slot: 'root' })(({ }) => ({
    transition: "all 0.2s ease-in-out",
    outline: 'none',
    height: '100%',
    width: '100%',
    overflowY: 'auto',
}));

const StyledTreeNode = styled('div', { name: 'Tree', slot: 'node' })(({ theme }) => ({
    transition: "all 0.2s ease-in-out",
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    outline: `1px solid transparent`,
    border: 'none',
    outlineOffset: -1,
    '&.selected': {
        backgroundColor: theme.palette.action.selected,
        '&.focused': {
            outline: `1px solid ${theme.palette.action.focus}`,
        },
    },
}));

const TreeNode: React.FC<React.PropsWithChildren<{
    className?: string;
    level: number;
    selected?: boolean;
    onClick: () => void;
    toggle?: boolean;
    isOpen: boolean;
    focused?: boolean;
    [key: string]: any;
}>> = ({ className, level, onClick, selected, children, toggle, isOpen, focused, ...other }) => {
    const theme = useTheme();

    return (
        <StyledTreeNode
            className={clsx(
                "Tree-node",
                className,
                selected && 'selected',
                focused && 'focused'
            )}
            style={{
                paddingLeft: level * 8 + 8,
                paddingRight: 8,
            }}
            onClick={onClick}
            {...other}
        >
            <div style={{ width: '1.5em' }}>
                {toggle && (
                    isOpen ? <theme.icons.ExpandMore /> : <theme.icons.ChevronRight />
                )}
            </div>
            {children}
        </StyledTreeNode>
    );
};

const Tree: React.FC<TreeProps> = ({ data, onSelect, selected, autoExpand, renderNode }) => {
    const [uncontrolledSelected, setUncontrolledSelected] = React.useState<string | null>(selected ?? null);
    const [focused, setFocused] = React.useState<boolean>(false);
    const treeRef = React.useRef<HTMLDivElement>(null);

    const expandLevel = (level?: number | boolean) => {
        // Inicjalizuj openNodes na podstawie autoExpand
        if (level === true) {
            return data.map(node => node.key); // Rozwiń wszystkie węzły
        } else if (typeof level === 'number') {
            const expandKeys: string[] = [];
            const expandLevel = level;

            const expandNodes = (nodes: TreeNode[], level: number) => {
                if (level > expandLevel) return;
                nodes.forEach(node => {
                    expandKeys.push(node.key);
                    if (node.children && node.children.length > 0) {
                        expandNodes(node.children, level + 1);
                    }
                });
            };

            expandNodes(data, 1);
            return expandKeys; // Rozwiń węzły do określonego poziomu
        }
        return []; // Domyślnie nie rozwijaj żadnych węzłów
    };

    const [openNodes, setOpenNodes] = React.useState<string[]>(() => {
        return expandLevel(autoExpand);
    });

    const flatOpenTree = React.useMemo(() => {
        const result: TreeNode[] = [];
        const traverse = (nodes: TreeNode[]) => {
            nodes.forEach(node => {
                result.push(node);
                if (node.children && openNodes.includes(node.key)) {
                    traverse(node.children);
                }
            });
        };
        traverse(data);
        return result;
    }, [data, openNodes]);

    React.useEffect(() => {
        if (selected !== undefined) {
            setUncontrolledSelected(selected ?? null);
            if (selected !== null) {
                // Automatyczne rozwijanie węzłów nadrzędnych dla zaznaczonego węzła
                const findAndExpandParents = (nodes: TreeNode[], key: string, parents: string[] = []): string[] | null => {
                    for (const node of nodes) {
                        if (node.key === key) {
                            return parents;
                        }
                        if (node.children) {
                            const result = findAndExpandParents(node.children, key, [...parents, node.key]);
                            if (result) {
                                return result;
                            }
                        }
                    }
                    return null;
                };

                const parents = findAndExpandParents(data, selected);
                if (parents) {
                    setOpenNodes(prev => [...new Set([...prev, ...parents])]);
                }
            }
        }
    }, [selected, data]);

    const toggleNode = React.useCallback((key: string) => {
        setOpenNodes(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }, []);

    const handleClick = (node: TreeNode) => {
        onSelect(node.key);
        setUncontrolledSelected(node.key);
        if (node.children && node.children.length > 0) {
            toggleNode(node.key);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        const node = treeRef.current?.querySelector('[data-node-key].selected');
        if (!node) {
            return;
        }
        const key = node.getAttribute('data-node-key');
        if (!key) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            const nodeIndex = flatOpenTree.findIndex(n => n.key === key);
            if (nodeIndex !== -1) {
                if (nodeIndex < flatOpenTree.length - 1) {
                    const nextNode = flatOpenTree[nodeIndex + 1];
                    onSelect(nextNode.key);
                    setUncontrolledSelected(nextNode.key);
                }
                else if (nodeIndex === flatOpenTree.length - 1) {
                    const firstNode = flatOpenTree[0];
                    onSelect(firstNode.key);
                    setUncontrolledSelected(firstNode.key);
                }
            }
        }
        else if (event.key === 'ArrowUp') {
            event.preventDefault();
            const nodeIndex = flatOpenTree.findIndex(n => n.key === key);
            if (nodeIndex !== -1) {
                if (nodeIndex > 0) {
                    const prevNode = flatOpenTree[nodeIndex - 1];
                    onSelect(prevNode.key);
                    setUncontrolledSelected(prevNode.key);
                }
                else if (nodeIndex === 0) {
                    const lastNode = flatOpenTree[flatOpenTree.length - 1];
                    onSelect(lastNode.key);
                    setUncontrolledSelected(lastNode.key);
                }
            }
        }
        else if (event.key === 'ArrowRight') {
            event.preventDefault();
            const currentNode = flatOpenTree.find(n => n.key === key);
            if (currentNode) {
                if (currentNode.children && currentNode.children.length > 0) {
                    if (!openNodes.includes(currentNode.key)) {
                        // Rozwiń węzeł
                        toggleNode(currentNode.key);
                        const firstChild = currentNode.children[0];
                        if (firstChild) {
                            onSelect(firstChild.key);
                            setUncontrolledSelected(firstChild.key);
                        }
                    }
                }
            }
        }
        else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            const currentNode = flatOpenTree.find(n => n.key === key);
            if (currentNode) {
                if (currentNode.children && currentNode.children.length > 0 && openNodes.includes(currentNode.key)) {
                    // Zwiń węzeł
                    toggleNode(currentNode.key);
                } else if (currentNode.parent) {
                    // Przenieś zaznaczenie do rodzica
                    onSelect(currentNode.parent.key);
                    setUncontrolledSelected(currentNode.parent.key);
                }
            }
        }
    };

    const renderTreeNodes = (nodes: TreeNode[], level: number = 0) => {
        return nodes.map(node => {
            const isOpen = openNodes.includes(node.key);
            return (
                <React.Fragment key={node.key}>
                    <TreeNode
                        level={level}
                        onClick={() => handleClick(node)}
                        selected={uncontrolledSelected === node.key}
                        isOpen={isOpen}
                        toggle={node.children && node.children.length > 0}
                        focused={focused && uncontrolledSelected === node.key}
                        data-node-key={node.key}
                    >
                        {renderNode ? renderNode(node) : <FormattedText text={node.title} />}
                    </TreeNode>

                    {node.children && node.children.length > 0 && (
                        <Collapse in={isOpen} unmountOnExit>
                            {renderTreeNodes(node.children, level + 1)}
                        </Collapse>
                    )}
                </React.Fragment>
            );
        });
    };

    return (
        <StyledTree
            ref={treeRef}
            className={clsx(
                "Tree-root",
                focused && 'focused'
            )}
            role="tree"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
        >
            {renderTreeNodes(data)}
        </StyledTree>
    );
};

export default Tree;