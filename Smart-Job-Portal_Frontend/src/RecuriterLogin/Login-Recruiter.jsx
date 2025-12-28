import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login-Recruiter.module.css";
import Login_Signup_Navbar from "../Component/Login_Signup_Navbar";
import Footer from "../Component/Footer";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function LoginRecruiter() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/recruiter/recruiter_login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user_type", "recruiter");

        if (data.data) {
          const user = data.data;
          if (user._id || user.id) {
            localStorage.setItem("userId", user._id || user.id);
          }
          if (user.email) {
            localStorage.setItem("userEmail", user.email);
          }
        }

        setSuccessMsg("Login successful! Redirecting…");
        setTimeout(() => navigate("/recruiterdashboard"), 1500);
      } else {
        setErrorMsg(data.message || "Invalid email or password");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <Login_Signup_Navbar />

      {/* Animated Background Container */}
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Recruiter Log in</h2>

          {successMsg && <p className={styles.success}>{successMsg}</p>}
          {errorMsg && <p className={styles.error}>{errorMsg}</p>}

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Recruiter email address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={`${styles.field} ${styles.passwordField}`}>
              <label>Password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className={styles.toggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible size={18} />
                ) : (
                  <AiOutlineEye size={18} />
                )}
              </span>
            </div>

            <button type="submit" className={styles.loginBtn}>
              Log in
            </button>
          </form>

          <div className={styles.forgot}>
            <a href="/recruiterforgotpassword">Forgot your password?</a>
          </div>

          <div className={styles.signup}>
            Don’t have an account? <a href="/recruitersignup">Sign up</a>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
