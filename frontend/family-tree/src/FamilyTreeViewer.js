import React from 'react';

const FamilyTreeViewer = ({ tree, onNodeClick }) => {
  if (!tree) {
    return <div>Loading...</div>;
  }

  const renderNode = (node) => (
    <div
      key={node.id}
      style={{
        border: '1px solid #000',
        padding: '20px',
        margin: '10px auto',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#f0f0f0',
        width: '200px',
        position: 'relative',
        top: '50%',
        transform: 'translateY(-50%)',
      }}
      onClick={() => onNodeClick(node)}
    >
      <div>{node.name}</div>
      <div>{node.gender}</div>
      {node.spouse && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <div
            style={{
              border: '1px solid #000',
              padding: '5px',
              backgroundColor: '#e0e0e0',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick(node.spouse);
            }}
          >
            {node.spouse.name}
          </div>
        </div>
      )}
      {node.children && node.children.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          {node.children.map((child) => renderNode(child))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {renderNode(tree)}
    </div>
  );
};

export default FamilyTreeViewer;