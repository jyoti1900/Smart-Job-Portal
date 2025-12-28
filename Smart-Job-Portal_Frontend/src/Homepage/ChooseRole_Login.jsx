import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ChooseRole_Login.module.css";
import Login_Signup_Navbar from "../Component/Login_Signup_Navbar";
import Footer from "../Component/Footer";

export default function ChooseRole() {
  const navigate = useNavigate();

  const handleNavigation = (role) => {
    if (role === "candidate") {
      navigate("/login");
    } else if (role === "recruiter") {
      navigate("/recruiterlogin");
    }
  };

  return (
    <>
      <Login_Signup_Navbar />

      <div className={styles["role-container"]}>
        {/* Candidate Card */}
        <div className={styles["role-card"]}>
          <div className={styles["role-content"]}>
            <h2 className={styles["role-title"]}>
              Become a <span>Candidate</span>
            </h2>
            <p>
              Apply to top opportunities and grow your career.
            </p>
            <button
              className={styles["register-btn"]}
              onClick={() => handleNavigation("candidate")}
            >
              Login Now
            </button>
          </div>

          <div className={styles["role-image"]}>
            <img src="/Images/Group2.svg" alt="Candidate illustration" />
          </div>
        </div>

        {/* Recruiter Card */}
        <div className={styles["role-card"]}>
          <div className={styles["role-content"]}>
            <h2 className={styles["role-title"]}>
              Become a <span>Recruiter</span>
            </h2>
            <p>
              Post jobs. Review candidates. Hire with confidence.
            </p>
            <button
              className={`${styles["register-btn"]} ${styles["recruiter"]}`}
              onClick={() => handleNavigation("recruiter")}
            >
              Login Now
            </button>
          </div>

          <div className={styles["role-image"]}>
            <img src="/Images/Group1.svg" alt="Recruiter illustration" />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
