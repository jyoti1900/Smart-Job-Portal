import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(location.search);
  const tokenFromUrl = urlParams.get("token");

  //  Save token from URL (e.g., Google login redirect)
  useEffect(() => {
    if (tokenFromUrl) {
      localStorage.setItem("authToken", tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const token = localStorage.getItem("authToken");

  //  Prevent back navigation after logout
  useEffect(() => {
    const handlePopState = () => {
      const stillLoggedIn = localStorage.getItem("authToken");
      if (!stillLoggedIn) {
        navigate("/alljobs", { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  //  Auto redirect if not logged in (without throwing render error)
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
