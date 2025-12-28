import React from "react";
import { Navigate, Outlet } from "react-router-dom";

function PublicRoute() {
  const token = localStorage.getItem("authToken");
  const userType = localStorage.getItem("user_type");

  // If user already logged in → redirect them correctly
  if (token) {
    if (userType?.toLowerCase() === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/alljobs" replace />;
    }
  }

  // Otherwise → allow public route (login/signup/etc.)
  return <Outlet />;
}

export default PublicRoute;
