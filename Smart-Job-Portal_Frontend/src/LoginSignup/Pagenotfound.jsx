import React from "react";
import { useNavigate } from "react-router-dom";
import "./Pagenotfound.css";

const Pagenotfound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    // Clear all auth/session data
    localStorage.clear();
    sessionStorage.clear();

    // (Optional) Clear cookies if any were set
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Redirect to Home
    navigate("/", { replace: true });
  };

  return (
    <div className="page-not-found">
      <div className="plug-wrapper">
        <img
          src="/Images/404bg.svg"
          alt="Background glow"
          className="plug-bg"
        />
        <img
          src="/Images/404.svg"
          alt="Plug broken"
          className="plug-img"
        />
      </div>

      <h1>
        404 <span>Not Found</span>
      </h1>

      <p>We’re sorry, something is not working here !!</p>

      <button onClick={handleGoBack}>Go Back</button>
    </div>
  );
};

export default Pagenotfound;
