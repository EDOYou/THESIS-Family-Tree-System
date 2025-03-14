import React, { useState, useEffect } from "react";
import FamilyTreeViewer from "./FamilyTreeViewer";
import NodeForm from "./nodeForm";
import { buildTree, logDebug } from "./treeUtils";
import {
  fetchFamilyTree,
  createPerson,
  saveOrUpdateNode,
  addChild,
  addSpouse,
} from "./nodeService";
import { DEFAULT_ME_NODE } from "./constants";

const App = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [tree, setTree] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);
  const debug = false;

  useEffect(() => {
    const loadTree = async () => {
      try {
        const persons = await fetchFamilyTree();
        //console.log("Fetched persons:", persons, "Type:", typeof persons);
        const treeData = buildTree(persons, debug) || [];
        setTree(treeData);
        setSelectedNode(treeData && treeData.length > 0 ? treeData[0] : null);
      } catch (error) {
        console.error("Error fetching family tree:", error);
        setError(
          "Failed to load family tree. Please try again or check the backend."
        );
        if (error.response && error.response.status === 404) {
          console.log('Database is empty, initializing with default "Me" node');
          try {
            const savedNode = await createPerson(DEFAULT_ME_NODE);
            const persons = await fetchFamilyTree();
            console.log(
              "Fetched persons after creating Me:",
              persons,
              "Type:",
              typeof persons
            );
            const treeData = buildTree(persons, debug) || [];
            setTree(treeData);
            setSelectedNode(
              treeData && treeData.length > 0 ? treeData[0] : null
            );
            console.log(
              'Default "Me" node saved to backend with ID:',
              savedNode.id
            );
          } catch (saveError) {
            console.error("Error saving default node:", saveError.message);
            setError(
              'Failed to save default "Me" node. Please edit and save manually.'
            );
            setTree([]);
          }
        }
      }
    };
    loadTree();
  }, [refreshKey, debug]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleNodeClick = (node) => {
    logDebug("Clicked node:", node, debug);
    if (node && node.id) {
      const fullNode = tree.find((n) => n.id === node.id);
      setSelectedNode(fullNode);
      setError(null);
    } else {
      console.error("Invalid node clicked:", node);
    }
  };

  const handleRefreshTree = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleAddMember = (type) => {
    if (type === "child" && !selectedNode?.spouses?.length) {
      setError("Cannot add a child without a spouse.");
      return;
    }
    setSelectedNode({ ...selectedNode, addingMemberType: type });
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}
      {tree && tree.length > 0 && (
        <FamilyTreeViewer tree={tree} onNodeClick={handleNodeClick} />
      )}
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
