import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== "ADMIN") {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
