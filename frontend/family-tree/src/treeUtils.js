export const updateNodeInTree = (tree, nodeId, updatedNode) => {
  if (!tree) return null;
  if (tree.id === nodeId) {
    return { ...tree, ...updatedNode };
  }
  if (tree.children && tree.children.length > 0) {
    return {
      ...tree,
      children: tree.children.map((child) =>
        updateNodeInTree(child, nodeId, updatedNode)
      ),
    };
  }
  return tree;
};
