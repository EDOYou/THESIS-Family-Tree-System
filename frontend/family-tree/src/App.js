import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import FamilyTreeViewer from "./components/FamilyTreeViewer/FamilyTreeViewer";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ChatPage from "./pages/ChatPage/ChatPage";
import EventsPage from "./pages/EventsPage/EventsPage";
import NotableRecordsPage from "./pages/NotableRecordsPage/NotableRecordsPage";
import QuizComponent from "./components/QuizComponent/QuizComponent";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { buildTree } from "./utils/treeUtils";
import { fetchFamilyTree, createPerson } from "./services/nodeService";
import { DEFAULT_ME_NODE } from "./constants/constants";
import { useAuth } from "./context/AuthContext";
import "./styles/App.css";

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
    if (!dateOfBirth) return 0;
    const dob = new Date(dateOfBirth);
    const currentDate = new Date("2025-03-31");
    const age = currentDate.getFullYear() - dob.getFullYear();
    const monthDiff = currentDate.getMonth() - dob.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && currentDate.getDate() < dob.getDate())
    ) {
      return age - 1;
    }
    return age;
  };

  const userAge = user && user.dateOfBirth ? calculateAge(user.dateOfBirth) : 0;
  const isUnder18 = userAge > 0 && userAge < 18;

  const handleQuizSuccess = () => {
    setIsQuizPassed(true);
  };

  const FamilyTreePage = () => (
    <div className="app-page">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <h2 className="app-sidebar-title">Family Tree</h2>
        {user && (
          <div className="app-user-info">
            <p>
              Welcome, {user.username} ({user.role})
            </p>
          </div>
        )}
        <nav className="app-nav">
          <ul className="app-nav-list">
            <li className="app-nav-item">
              <Link to="/" className="app-nav-link">
                Family Tree
              </Link>
            </li>
            <li className="app-nav-item">
              <Link to="/chat" className="app-nav-link">
                Go to Chat
              </Link>
            </li>
            <li className="app-nav-item">
              <Link to="/events" className="app-nav-link">
                Manage Events
              </Link>
            </li>
            <li className="app-nav-item">
              <Link to="/notable-records" className="app-nav-link">
                Manage Notable Records
              </Link>
            </li>
            <li className="app-nav-item">
              <button onClick={handleLogout} className="app-logout-button">
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {error && <div className="app-error">{error}</div>}
        <div id="FamilyChart" className="f3 app-chart-container">
          {isUnder18 && !isQuizPassed ? (
            <QuizComponent onQuizSuccess={handleQuizSuccess} />
          ) : tree.length > 0 ? (
            <FamilyTreeViewer
              tree={tree}
              onTreeUpdate={handleTreeUpdate}
              isAdmin={user?.role === "ADMIN"}
            />
          ) : (
            <div className="app-loading">Loading family tree...</div>
          )}
        </div>
      </main>
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
