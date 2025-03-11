import React, { useState, useEffect } from 'react';
import FamilyTreeViewer from './FamilyTreeViewer';
import NodeForm from './nodeForm';
import { fetchFamilyTree, saveOrUpdateNode } from './nodeService';

const MY_ID = 1;

const App = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [tree, setTree] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);

  const defaultMeNode = {
    id: MY_ID,
    name: "Me",
    gender: "MALE",
    occupation: "",
    age: null,
    birthDate: null,
    deathDate: null,
    birthPlace: null,
    deathPlace: null,
    hasSubTree: false,
    children: [],
    spouse: null,
    parent: null,
  };

  useEffect(() => {
    const loadTree = async () => {
      try {
        const data = await fetchFamilyTree();
        setTree(data);
        setSelectedNode(data);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('Database is empty, initializing with default "Me" node');
          setTree(defaultMeNode);
          setSelectedNode(defaultMeNode);
          try {
            const savedNode = await saveOrUpdateNode(defaultMeNode, setTree, MY_ID);
            setTree(savedNode);
            console.log('Default "Me" node saved to backend with ID:', savedNode.id);
          } catch (saveError) {
            console.error('Error saving default node:', saveError.message);
            setError('Failed to save default "Me" node. Please edit and save manually.');
          }
        } else {
          console.error('Error fetching family tree:', error.message);
          setError('Failed to load family tree. Please try again.');
        }
      }
    };
    loadTree();
  }, [refreshKey]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setError(null);
  };

  const handleRefreshTree = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      {tree && <FamilyTreeViewer tree={tree} onNodeClick={handleNodeClick} />}
      {selectedNode && (
        <NodeForm
          selectedNode={selectedNode}
          onSave={saveOrUpdateNode}
          onClose={() => setSelectedNode(null)}
          onRefresh={handleRefreshTree}
          error={error}
          setError={setError}
          setTree={setTree}
        />
      )}
    </div>
  );
};

export default App;