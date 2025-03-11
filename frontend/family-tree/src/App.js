import React, { useState, useEffect } from 'react';
import FamilyTreeViewer from './FamilyTreeViewer';
import NodeForm from './nodeForm';
import { fetchFamilyTree, createPerson, saveOrUpdateNode, addChild, addSpouse } from './nodeService';

const buildTree = (persons) => {
  const personList = Array.isArray(persons) ? persons : [];
  const personMap = new Map(personList.map(p => [p.id, { ...p, children: [] }]));
  let roots = [];

  personMap.forEach((person, id) => {
    if (person.parent) {
      const parent = personMap.get(person.parent.id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(person);
      }
    } else if (!person.spouse || !personMap.get(person.spouse.id)) {
      roots.push(person);
    }
  });

  // Handle spouses as pairs
  roots = roots.map(root => {
    if (root.spouse) {
      const spouse = personMap.get(root.spouse.id);
      if (spouse) {
        return { ...root, spouse };
      }
    }
    return root;
  });

  return roots.length > 0 ? roots : null;
};

const App = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [tree, setTree] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);

  const defaultMeNode = {
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
        const persons = await fetchFamilyTree();
        console.log('Fetched persons:', persons, 'Type:', typeof persons);
        const treeData = buildTree(persons);
        setTree(treeData);
        setSelectedNode(treeData && treeData.length > 0 ? treeData[0] : null);
      } catch (error) {
        console.error('Error fetching family tree:', error);
        setError('Failed to load family tree. Please try again or check the backend.');
        if (error.response && error.response.status === 404) {
          console.log('Database is empty, initializing with default "Me" node');
          try {
            const savedNode = await createPerson(defaultMeNode);
            const persons = await fetchFamilyTree();
            console.log('Fetched persons after creating Me:', persons, 'Type:', typeof persons);
            const treeData = buildTree(persons);
            setTree(treeData);
            setSelectedNode(treeData && treeData.length > 0 ? treeData[0] : null);
            console.log('Default "Me" node saved to backend with ID:', savedNode.id);
          } catch (saveError) {
            console.error('Error saving default node:', saveError.message);
            setError('Failed to save default "Me" node. Please edit and save manually.');
          }
        }
      }
    };
    loadTree();
  }, [refreshKey]);

  const handleNodeClick = (node) => {
    console.log('Clicked node:', node);
    setSelectedNode(node);
    setError(null);
  };

  const handleRefreshTree = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleAddMember = (type) => {
    if (type === 'child' && selectedNode.spouse === null) {
      setError('Cannot add a child without a spouse.');
      return;
    }
    setSelectedNode({ ...selectedNode, addingMemberType: type });
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      {tree && <FamilyTreeViewer tree={tree} onNodeClick={handleNodeClick} />}
      {selectedNode && (
        <NodeForm
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          onSave={saveOrUpdateNode}
          onClose={() => setSelectedNode(null)}
          onRefresh={handleRefreshTree}
          onAddMember={handleAddMember}
          error={error}
          setError={setError}
          setTree={setTree}
          addChild={addChild}
          addSpouse={addSpouse}
        />
      )}
    </div>
  );
};

export default App;