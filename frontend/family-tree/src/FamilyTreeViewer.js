import React from "react";

const Node = ({ node, onNodeClick }) => {
  const nodeStyle = {
    display: "inline-block",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    backgroundColor: node.gender === "MALE" ? "#ADD8E6" : "#FFB6C1",
    cursor: "pointer",
  };

  return (
    <div style={nodeStyle} onClick={() => onNodeClick(node)}>
      {node.name}
      {node.spouse && (
        <span style={{ marginLeft: "10px" }}>&amp; {node.spouse.name}</span>
      )}
    </div>
  );
};

const FamilyTreeViewer = ({ tree, onNodeClick }) => {
  const renderNode = (node) => (
    <div key={node.id} style={{ marginBottom: "20px" }}>
      <Node node={node} onNodeClick={onNodeClick} />
      {node.children && node.children.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "10px",
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

  return <div>{tree.map((node) => renderNode(node))}</div>;
};

export default FamilyTreeViewer;
