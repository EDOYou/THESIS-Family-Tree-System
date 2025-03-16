import React, { useState, useEffect } from "react";
import FamilyTreeViewer from "./FamilyTreeViewer";
import { buildTree } from "./treeUtils";
import { fetchFamilyTree, createPerson } from "./nodeService";
import { DEFAULT_ME_NODE } from "./constants";

const App = () => {
  const [tree, setTree] = useState([]);
  const [refreshKey] = useState(0);
  const [error, setError] = useState(null);
  const debug = false;

  useEffect(() => {
    const loadTree = async () => {
      try {
        const persons = await fetchFamilyTree();
        const treeData = buildTree(persons, debug) || [];
        setTree(treeData.length > 0 ? treeData : []);
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
            const treeData = buildTree(persons, debug) || [];
            setTree(treeData.length > 0 ? treeData : []);
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
  }, [refreshKey, debug]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTreeUpdate = (updatedTree) => {
    if (JSON.stringify(tree) !== JSON.stringify(updatedTree)) {
      setTree(updatedTree);
    }
    setError(null);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}
      <div
        id="FamilyChart"
        className="f3"
        style={{
          width: "100%",
          height: "900px",
          margin: "auto",
          backgroundColor: "rgb(33, 33, 33)",
          color: "#fff",
        }}
      >
        {tree.length > 0 ? (
          <FamilyTreeViewer tree={tree} onTreeUpdate={handleTreeUpdate} />
        ) : (
          <div>Loading family tree...</div>
        )}
      </div>
    </div>
  );
};

export default App;
