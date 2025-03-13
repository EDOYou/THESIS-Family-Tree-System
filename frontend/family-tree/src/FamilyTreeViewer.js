import React from "react";

const Node = ({ node, onNodeClick }) => {
  const nodeStyle = {
    display: "inline-block",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    backgroundColor: node.gender === "MALE" ? "#ADD8E6" : "#FFB6C1",
    cursor: "pointer",
    margin: "5px",
  };

  const spouseStyle = {
    marginLeft: "10px",
    fontSize: "12px",
    color: "gray",
  };

  const spouseName =
    node.spouses
      ?.map((spouseId) => node._treeData?.find((n) => n.id === spouseId)?.name)
      .filter(Boolean)
      .join(", ") || null;

  return (
    <div style={nodeStyle} onClick={() => onNodeClick(node)}>
      {node.name}
      {spouseName && <span style={spouseStyle}>(Spouse: {spouseName})</span>}
    </div>
  );
};

const FamilyTreeViewer = ({ tree, onNodeClick }) => {
  const buildTreeStructure = (flatTree) => {
    const nodeMap = new Map();
    flatTree.forEach((node) => nodeMap.set(node.id, { ...node, children: [] }));

    flatTree.forEach((node) => {
      if (node.parents && node.parents.length > 0) {
        node.parents.forEach((parentId) => {
          const parent = nodeMap.get(parentId);
          if (parent) parent.children.push(nodeMap.get(node.id));
        });
      }
    });

    return Array.from(nodeMap.values()).filter(
      (node) => node.parents.length === 0
    );
  };

  const sanitizedTree = tree.map((node) => ({
    ...node,
    parents: Array.isArray(node.parents) ? node.parents : [],
    spouses: Array.isArray(node.spouses) ? node.spouses : [],
    children: Array.isArray(node.children) ? node.children : [],
    _treeData: tree,
  }));

  const hierarchicalTree = buildTreeStructure(sanitizedTree);

  const renderNode = (node) => (
    <div key={node.id} style={{ marginBottom: "20px", textAlign: "center" }}>
      <Node node={node} onNodeClick={onNodeClick} />
      {node.children && node.children.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "10px",
            flexWrap: "wrap",
          }}
        >
          {node.children.map((child) => (
            <div key={child.id} style={{ margin: "0 10px" }}>
              {renderNode(child)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!hierarchicalTree || hierarchicalTree.length === 0) {
    return <div>No family tree data available.</div>;
  }

  return (
    <div style={{ width: "100%", height: "600px", overflow: "auto" }}>
      {hierarchicalTree.map((node) => renderNode(node))}
    </div>
  );
};

export default FamilyTreeViewer;
