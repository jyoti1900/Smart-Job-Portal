import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import "./Recruiter_Resetpassword.css";

export default function ResetPassword() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token"); // correctly extract from query param

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // added confirm password
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Frontend-only check
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `http://localhost:8080/api/v1/recruiter/reset_password?token=${token}`, 
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password }) // only sending password
                }
            );
            if (response.ok) {
                alert("Your password has been reset successfully!");
            } else {
                const data = await response.json();
                alert(`Error: ${data.message || "Something went wrong."}`);
            }
        } catch (error) {
            console.error("Reset Password Error:", error);
            alert("Server error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-container">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="reset-card"
            >
                <h2 className="reset-title">Reset Password</h2>
                <p className="reset-subtitle">
                    Enter your new password below to reset your account password.
                </p>

                <form className="reset-form" onSubmit={handleSubmit}>
                    <label className="reset-label">New Password</label>
                    <input
                        type="password"
                        placeholder="Enter new password"
                        className="reset-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <label className="reset-label">Confirm Password</label>
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        className="reset-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="reset-btn" disabled={loading}>
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <p className="reset-footer">
                    <Link to="/recruiterlogin" className="reset-link">
                        Back to Log in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
