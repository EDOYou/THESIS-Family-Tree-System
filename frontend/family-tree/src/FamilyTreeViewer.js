import React from 'react';

const Node = ({ node, onNodeClick }) => {
    const nodeStyle = {
      display: 'inline-block',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '5px',
      backgroundColor: node.gender === 'MALE' ? '#ADD8E6' : '#FFB6C1',
      cursor: 'pointer',
    };
  
    return (
      <div style={nodeStyle} onClick={() => onNodeClick(node)}>
        {node.name}
      </div>
    );
  };

const FamilyTreeViewer = ({ tree, onNodeClick }) => {
  if (!tree) return <div>No family tree data available.</div>;

  const renderTree = (node) => {
    return (
      <div style={{ margin: '10px', display: 'inline-block', verticalAlign: 'top' }}>
        <Node node={node} onNodeClick={onNodeClick} />
        {node.spouse && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
            <div style={{ width: '50px', height: '2px', background: '#000' }} />
            <Node node={node.spouse} onNodeClick={onNodeClick} />
          </div>
        )}
        {node.children && node.children.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            {node.children.map((child, index) => (
              <div key={index} style={{ marginLeft: '20px' }}>
                <div style={{ width: '2px', height: '20px', background: '#000', marginLeft: '25px' }} />
                {renderTree(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2>Family Tree</h2>
      <p>Welcome to the Shan family tree</p>
      <p>Click on any one of the family members to add a child or a spouse.</p>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        {Array.isArray(tree) ? tree.map((root, index) => (
          <div key={index} style={{ display: 'inline-block', verticalAlign: 'top' }}>
            {renderTree(root)}
          </div>
        )) : renderTree(tree)}
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <input type="text" placeholder="Search family members" />
      </div>
    </div>
  );
};

export default FamilyTreeViewer;