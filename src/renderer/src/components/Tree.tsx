import { FormattedContentItem, FormattedText } from '@renderer/components/useful/FormattedText';
import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import clsx from '@renderer/utils/clsx';
import Collapse from '@mui/material/Collapse';
import { useScrollIntoView } from '@renderer/hooks/useScrollIntoView';

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
}

interface TreeProps {
    id?: string;
    /** Auto expand the tree to a specific level or true to expand all */
    autoExpand?: number | boolean;
    /** Data for the tree */
    nodes: TreeNode[];
    /** Currently selected node key */
    selected?: string | null;
    /** Callback when a node is selected */
    onSelect: (key: string) => void;
    /** Custom render function for a node label */
    renderNode?: (node: TreeNode) => React.ReactNode;
    /** Custom expand icons for the node */
    expandIcons?: [React.ReactNode, React.ReactNode];
    ref?: React.Ref<HTMLDivElement | null>;
    treeRef?: React.Ref<HTMLDivElement | null>;
    [key: `data-${string}`]: any;
}

const StyledTree = styled('div', { name: 'Tree', slot: 'root', })(() => ({}));
const StyledTreeInner = styled('div', { name: 'Tree', slot: 'inner', })(() => ({}));
const StyledTreeTree = styled('div', { name: 'Tree', slot: 'tree' })(({ }) => ({}));
const StyledTreeNode = styled('div', { name: 'Tree', slot: 'node' })(({ }) => ({}));
const StyledTreeNodeToggleIcon = styled('div', { name: 'Tree', slot: 'toggleIcon' })(({ }) => ({}));
const StyledTreeNodeLabel = styled('div', { name: 'Tree', slot: 'label' })(({ }) => ({}));

const TreeNode: React.FC<React.PropsWithChildren<{
    id?: string;
    className?: string;
    level: number;
    selected?: boolean;
    onClick: () => void;
    toggle?: boolean;
    isOpen: boolean;
    focused?: boolean;
    expandIcons?: [React.ReactNode, React.ReactNode];
    [key: string]: any;
}>> = ({ id, className, level, onClick, selected, children, toggle, isOpen, focused, expandIcons, ...other }) => {
    const theme = useTheme();

    const classes = clsx(
        selected && 'selected',
        focused && 'focused',
        toggle ? (isOpen ? 'open' : 'closed') : 'none'
    );

    return (
        <StyledTreeNode
            id={id}
            className={clsx(
                "Tree-node",
                className,
                classes,
            )}
            sx={{
                ['--node-level' as any]: level,
            }}
            onMouseUp={onClick}
            {...other}
        >
            <StyledTreeNodeToggleIcon
                className={clsx(
                    "Tree-toggleIcon",
                    classes,
                )}
            >
                {toggle && (
                    isOpen ?
                        <>{expandIcons?.[0] ?? <theme.icons.ExpandMore />}</>
                        : <>{expandIcons?.[1] ?? <theme.icons.ChevronRight />}</>
                )}
            </StyledTreeNodeToggleIcon>
            <StyledTreeNodeLabel
                className={clsx(
                    "Tree-label",
                    classes,
                )}
            >
                {children}
            </StyledTreeNodeLabel>
        </StyledTreeNode>
    );
};

const TreeNodes: React.FC<{
    nodes: TreeNode[];
    level: number;
    openNodes: string[];
    selected: string | null;
    focused?: boolean;
    onClick: (node: TreeNode) => void;
    renderNode?: (node: TreeNode) => React.ReactNode;
    expandIcons?: [React.ReactNode, React.ReactNode];
}> = ({ nodes, level, openNodes, selected, focused, onClick: onClick, renderNode, expandIcons }) => {
    return (
        nodes.map((node, index) => {
            const isOpen = openNodes.includes(node.key);
            return (
                <React.Fragment key={index}>
                    <TreeNode
                        id={node.key}
                        level={level}
                        onClick={() => onClick(node)}
                        selected={selected === node.key}
                        isOpen={isOpen}
                        toggle={node.children && node.children.length > 0}
                        focused={focused && selected === node.key}
                        data-node-key={node.key}
                        expandIcons={expandIcons}
                    >
                        {renderNode ? renderNode(node) : <FormattedText text={node.title} />}
                    </TreeNode>

                    {node.children && node.children.length > 0 && (
                        <Collapse in={isOpen} timeout={100} unmountOnExit>
                            <TreeNodes
                                nodes={node.children}
                                level={level + 1}
                                openNodes={openNodes}
                                selected={selected}
                                onClick={onClick}
                                renderNode={renderNode}
                                focused={focused}
                                expandIcons={expandIcons}
                            />
                        </Collapse>
                    )}
                </React.Fragment>
            );
        })
    );
};

const Tree: React.FC<TreeProps> = ({
    id,
    nodes,
    onSelect,
    selected,
    autoExpand,
    renderNode,
    expandIcons,
    ref,
    treeRef: treeRefProp,
}) => {
    const [uncontrolledSelected, setUncontrolledSelected] = React.useState<string | null>(selected ?? null);
    const [focused, setFocused] = React.useState<boolean>(false);
    const treeRef = React.useRef<HTMLDivElement>(null);

    const parentMap = React.useMemo(() => {
        const buildParentMap = (nodes: TreeNode[], parentKey: string | null = null, map: Record<string, string | null> = {}): Record<string, string | null> => {
            nodes.forEach(node => {
                map[node.key] = parentKey;
                if (node.children) {
                    buildParentMap(node.children, node.key, map);
                }
            });
            return map;
        };
        return buildParentMap(nodes);
    }, [nodes]);

    const expandLevel = (level?: number | boolean) => {
        // Inicjalizuj openNodes na podstawie autoExpand
        if (level === true) {
            return nodes.map(node => node.key); // Rozwiń wszystkie węzły
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

            expandNodes(nodes, 1);
            return expandKeys; // Rozwiń węzły do określonego poziomu
        }
        return []; // Domyślnie nie rozwijaj żadnych węzłów
    };

    const [openNodes, setOpenNodes] = React.useState<string[]>(() => {
        return expandLevel(autoExpand);
    });

    React.useEffect(() => {
        setOpenNodes(expandLevel(autoExpand));
    }, [autoExpand, nodes]);

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
        traverse(nodes);
        return result;
    }, [nodes, openNodes]);

    React.useEffect(() => {
        if (selected !== undefined) {
            setUncontrolledSelected(selected ?? null);
            if (selected !== null) {
                // Automatyczne rozwijanie węzłów nadrzędnych dla zaznaczonego węzła
                const findAndExpandParents = (key: string): string[] => {
                    const parents: string[] = [];
                    let currentKey: string | null = key;

                    while (currentKey) {
                        const parentKey = parentMap[currentKey];
                        if (parentKey) {
                            parents.push(parentKey);
                        }
                        currentKey = parentKey;
                    }

                    return parents;
                };

                const parents = findAndExpandParents(selected);
                if (parents) {
                    setOpenNodes(prev => [...new Set([...prev, ...parents])]);
                }
            }
        }
    }, [selected, nodes]);

    useScrollIntoView({ containerRef: treeRef, containerId: id, targetId: uncontrolledSelected ?? undefined });

    const toggleNode = React.useCallback((key: string) => {
        setOpenNodes(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }, []);

    const handleClick = React.useCallback((node: TreeNode) => {
        onSelect(node.key);
        setUncontrolledSelected(node.key);
        if (node.children && node.children.length > 0) {
            toggleNode(node.key);
        }
    }, [onSelect, toggleNode]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        const key = uncontrolledSelected;
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
                    }
                    else {
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
                } else {
                    const parentKey = parentMap[currentNode.key] || null;
                    if (parentKey) {
                        onSelect(parentKey);
                        setUncontrolledSelected(parentKey);
                    }
                }
            }
        }
    };

    return (
        <StyledTree
            id={id}
            className="Tree-root"
            ref={ref}
        >
            <StyledTreeInner className="Tree-inner">
                <StyledTreeTree
                    ref={(ref) => {
                        treeRef.current = ref;
                        if (typeof treeRefProp === 'function') {
                            treeRefProp(ref);
                        } else if (treeRefProp) {
                            treeRefProp.current = ref;
                        }
                    }}
                    className={clsx(
                        "Tree-tree",
                        focused && 'focused'
                    )}
                    role="tree"
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                >
                    <TreeNodes
                        nodes={nodes}
                        level={0}
                        openNodes={openNodes}
                        selected={uncontrolledSelected}
                        focused={focused}
                        onClick={handleClick}
                        renderNode={renderNode}
                        expandIcons={expandIcons}
                    />
                </StyledTreeTree>
            </StyledTreeInner>
        </StyledTree>
    );
};

export default Tree;