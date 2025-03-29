import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import FamilyTreeViewer from "./FamilyTreeViewer";
import Login from "./Login";
import Register from "./Register";
import ProtectedRoute from "./ProtectedRoute";
import { buildTree } from "./utils/treeUtils";
import { fetchFamilyTree, createPerson } from "./nodeService";
import { DEFAULT_ME_NODE } from "./constants";
import { useAuth } from "./AuthContext";

const App = () => {
  const [tree, setTree] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);
  const debug = false;
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadTree = async () => {
    try {
      const persons = await fetchFamilyTree();
      // console.log(
      //   "Fetched persons from backend:",
      //   JSON.stringify(persons, null, 2)
      // );
      const treeData = buildTree(persons, debug) || [];
      setTree(treeData.length > 0 ? treeData : []);
      setError(null);
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
            "Fetched persons after creating default node:",
            JSON.stringify(persons, null, 2)
          );
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

  useEffect(() => {
    if (user) {
      loadTree();
    }
  }, [refreshKey, debug, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTreeUpdate = () => {
    setRefreshKey((prev) => prev + 1);
    setError(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const FamilyTreePage = () => (
    <div style={{ textAlign: "center", padding: "20px" }}>
      {user && (
        <div style={{ marginBottom: "10px" }}>
          <span>
            Welcome, {user.username} ({user.role})
          </span>
          <button onClick={handleLogout} style={{ marginLeft: "10px" }}>
            Logout
          </button>
        </div>
      )}
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
          <FamilyTreeViewer
            tree={tree}
            onTreeUpdate={handleTreeUpdate}
            isAdmin={user?.role === "ADMIN"}
          />
        ) : (
          <div>Loading family tree...</div>
        )}
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FamilyTreePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
