import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import styles from "./Forgotpassword.module.css"; // your import stays same as you wrote

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/v1/customer/forget_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert("If this email is registered, a password reset link has been sent!");
      } else {
        const data = await response.json();
        alert(`Error: ${data.message || "Something went wrong."}`);
      }
    } catch (error) {
      console.error("Forgot Password Error:", error);
      alert("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["forgot-container"]}>
      <div
        className={styles["forgot-card"]}
      >
        <h2 className={styles["forgot-title"]}>Forgot Password</h2>
        <p className={styles["forgot-subtitle"]}>
          Enter your email address and we’ll send you a link to reset your password.
        </p>

        <form className={styles["forgot-form"]} onSubmit={handleSubmit}>
          <label className={styles["forgot-label"]}>Email</label>
          <input
            type="email"
            placeholder="Enter your email address"
            className={styles["forgot-input"]}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" className={styles["forgot-btn"]} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className={styles["forgot-footer"]}>
          Remembered your password?{" "}
          <Link to="/login" className={styles["forgot-link"]}>
            Back to Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
