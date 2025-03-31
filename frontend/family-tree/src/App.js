import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import FamilyTreeViewer from "./FamilyTreeViewer";
import Login from "./Login";
import Register from "./Register";
import ChatPage from "./ChatPage";
import EventsPage from "./EventsPage";
import NotableRecordsPage from "./NotableRecordsPage";
import QuizComponent from "./QuizComponent";
import ProtectedRoute from "./ProtectedRoute";
import { buildTree } from "./utils/treeUtils";
import { fetchFamilyTree, createPerson } from "./nodeService";
import { DEFAULT_ME_NODE } from "./constants";
import { useAuth } from "./AuthContext";

const App = () => {
  const [tree, setTree] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);
  const [isQuizPassed, setIsQuizPassed] = useState(false);
  const debug = false;
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadTree = async () => {
    try {
      const persons = await fetchFamilyTree();
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
  }, [refreshKey, debug, user]);

  const handleTreeUpdate = () => {
    setRefreshKey((prev) => prev + 1);
    setError(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const calculateAge = (dateOfBirth) => {
    console.log("AGE: " + dateOfBirth);
    if (!dateOfBirth) return 0;
    const dob = new Date(dateOfBirth);
    const currentDate = new Date("2025-03-31");
    const age = currentDate.getFullYear() - dob.getFullYear();
    const monthDiff = currentDate.getMonth() - dob.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && currentDate.getDate() < dob.getDate())
    ) {
      console.log("AGE: " + (age - 1));
      return age - 1;
    }
    console.log("AGE: " + age);
    return age;
  };

  const userAge = user && user.dateOfBirth ? calculateAge(user.dateOfBirth) : 0;
  const isUnder18 = userAge > 0 && userAge < 18;

  const handleQuizSuccess = () => {
    setIsQuizPassed(true);
  };

  const FamilyTreePage = () => (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "200px",
          backgroundColor: "#333",
          color: "#fff",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Family Tree</h2>
        {user && (
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <p>
              Welcome, {user.username} ({user.role})
            </p>
          </div>
        )}
        <nav>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            <li style={{ marginBottom: "10px" }}>
              <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
                Family Tree
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link
                to="/chat"
                style={{ color: "#fff", textDecoration: "none" }}
              >
                Go to Chat
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link
                to="/events"
                style={{ color: "#fff", textDecoration: "none" }}
              >
                Manage Events
              </Link>
            </li>
            <li style={{ marginBottom: "10px" }}>
              <Link
                to="/notable-records"
                style={{ color: "#fff", textDecoration: "none" }}
              >
                Manage Notable Records
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "20px", textAlign: "center" }}>
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
          {isUnder18 && !isQuizPassed ? (
            <QuizComponent onQuizSuccess={handleQuizSuccess} />
          ) : tree.length > 0 ? (
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
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <EventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notable-records"
        element={
          <ProtectedRoute>
            <NotableRecordsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
