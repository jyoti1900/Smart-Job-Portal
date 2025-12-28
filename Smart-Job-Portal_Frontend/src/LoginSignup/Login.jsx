import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Login.module.css"; 
import Login_Signup_Navbar from "../Component/Login_Signup_Navbar";
import Footer from "../Component/Footer";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function Login() {
    const navigate = useNavigate();
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const response = await fetch("http://localhost:8080/api/v1/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log("Login response:", data);

            if (response.ok && data.success) {
                const { token, data: user } = data;

                if (token) {
                    localStorage.setItem("authToken", token);
                    localStorage.setItem("user_type", user.user_type);
                }

                if (user) {
                    if (user._id || user.id) {
                        localStorage.setItem("userId", user._id || user.id);
                    }
                    if (user.email) {
                        localStorage.setItem("userEmail", user.email);
                    }
                }

                //  SHOW SUCCESS MESSAGE
                setSuccessMsg("Login successful! Redirecting...");

                // Redirect after short delay
                setTimeout(() => {
                    if (user.user_type?.toLowerCase() === "admin") {
                        navigate("/admin/dashboard");
                    } else {
                        navigate("/alljobs");
                    }
                }, 1200);
            } else {
                setErrorMsg(data.message || "Invalid email or password");
            }
        } catch (error) {
            console.error("Login error:", error);
            setErrorMsg("Something went wrong. Please try again.");
        }
    };

    return (
        <>
            <Login_Signup_Navbar />

            <div className={styles.loginContainer}>
                <div className={styles.loginBox}>
                    <h2>Log in</h2>
                    <p>
                        Don’t have an account? <Link to="/signup">Sign up</Link>
                    </p>

                    {/*  SUCCESS / ERROR MESSAGE */}
                    {successMsg && <p className={styles.success}>{successMsg}</p>}
                    {errorMsg && <p className={styles.error}>{errorMsg}</p>}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <label>Email address or user name</label>
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

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
                                className={styles.toggle}
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Hide Password" : "Show Password"}
                            >
                                {showPassword ? (
                                    <AiOutlineEyeInvisible size={18} />
                                ) : (
                                    <AiOutlineEye size={18} />
                                )}
                            </span>
                        </div>

                        <p className={styles.forgot}>
                            <Link to="/forgotpassword">Forgot your password?</Link>
                        </p>

                        <label className={styles.remember}>
                            <input type="checkbox" /> Remember me
                        </label>

                        <button type="submit" className={styles.loginBtn}>
                            Log in
                        </button>
                    </form>
                </div>
            </div>

            <Footer />
        </>
    );
}
