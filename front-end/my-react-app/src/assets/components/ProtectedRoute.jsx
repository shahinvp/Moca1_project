import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const loggedOut = localStorage.getItem("logged_out") === "true";

  if (loggedOut) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
