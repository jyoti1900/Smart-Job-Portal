import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Signup.module.css";
import Login_Signup_Navbar from "../Component/Login_Signup_Navbar";
import Footer from "../Component/Footer";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setProfileName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const isValidPassword = (pwd) => {
    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!agree) {
      setErrorMsg("You must agree to the Terms of Use and Privacy Policy.");
      return;
    }

    if (!isValidPassword(password)) {
      setErrorMsg(
        "Password must be at least 8 characters long and include letters, numbers, and symbols."
      );
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/customer/user_signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success !== false) {
        setSuccessMsg("Signup successful! Redirecting to login…");

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setErrorMsg(data.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <Login_Signup_Navbar />

      <div className={styles.signupContainer}>

        <div className={styles.signupCard}>
          <h2 className={styles.signupTitle}>Sign up</h2>

          {/*  SUCCESS / ERROR MESSAGE */}
          {successMsg && <p className={styles.success}>{successMsg}</p>}
          {errorMsg && <p className={styles.error}>{errorMsg}</p>}

          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label>Profile name</label>
              <input
                type="text"
                placeholder="Enter your profile name"
                value={name}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={18} />
                  ) : (
                    <AiOutlineEye size={18} />
                  )}
                </span>
              </div>
              <small className={styles.passwordHint}>
                Use 8 or more characters with letters, numbers & symbols
              </small>
            </div>

            <div className={styles.agree}>
              <label>
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                By creating an account, I agree to our{" "}
                <Link to="/termsofuse">Terms of use</Link> and{" "}
                <Link to="/privacypolicy">Privacy Policy</Link>
              </label>
            </div>

            <button type="submit" className={styles.signupBtn}>
              Sign up
            </button>
          </form>

          <p className={styles.loginText}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
